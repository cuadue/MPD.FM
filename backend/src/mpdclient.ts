import * as  net from 'node:net';
import {TypedEmitter} from 'tiny-typed-emitter';

export type ConnectOptions = {host: string, port: number};
const defaultConnectOpts: ConnectOptions = {
  host: 'localhost',
  port: 6600
};

export type State = 'connecting' | 'ready';

interface MpdClientEvents {
  ready: () => void;
  stateChanged: (state: State | Error) => void;
  subsystemsChanged: (names: Array<string>) => void;
}

type MessageHandler = {
  debugInfo: string
  // Used in order to tell if the *previous* command was an idle command,
  // in which case, a noidle command will need to be sent.
  isIdle: boolean
  resolve: (response: string) => any
  reject: (error: Error) => any
};

export type Command = string | [string, ...string[]];
export type KeyValuePairs = {[key: string]: string};

type MpdResponse = {kind: 'error' | 'version' | 'data', payload: string};

export const parseResponse = (data: string): {responses: Array<MpdResponse>, remain: string} => {
  const responses: Array<MpdResponse> = [];
  const lines = data.split('\n');
  var beginLine = 0;

  for (var i = 0; i < lines.length; i++) {
    const line = lines[i];

    const version = line.match(/^OK MPD (.+)/);
    const error = line.match(/^ACK \[.*] {.*} (.+)/);

    if (version) {
      responses.push({kind: 'version', payload: version[1]});
      beginLine = i + 1;
    } else if (error) {
      responses.push({kind: 'error', payload: error[1]});
      beginLine = i + 1;
    } else if (line === 'OK') {
      responses.push({kind: 'data', payload: lines.slice(beginLine, i).join('\n')});
      beginLine = i + 1;
    }
  }

  return {responses, remain: lines.slice(beginLine).join('\n')};
}

export class MpdClient extends TypedEmitter<MpdClientEvents> {
  private buffer: string = '';
  private msgHandlerQueue: Array<MessageHandler> = [];
  private socket?: net.Socket | null = null;
  private reconnecting = false;
  private version?: string;

  async connect(options: ConnectOptions = defaultConnectOpts) {
    if (this.socket) {
      return;
    }
    this.reconnecting = false;
    console.log('starting connection');
    this.emit('stateChanged', 'connecting');
    this.socket = net.connect(options, () => {
      console.log('MPD client connected to ' + options.host + ':' + options.port);
    });

    this.socket.setEncoding('utf8');
    this.socket.on('data', (data) => this.receive(data.toString()));
    this.socket.on('close', () => {
      this.reconnect(options, new Error('Socket unexpectedly closed'));
    });
    this.socket.on('error', (err) => {
      this.reconnect(options, err);
    });
  }

  private async reconnect(options: ConnectOptions, err: Error) {
    if (this.reconnecting) {
      return;
    }
    console.log('socket error', err);
    this.msgHandlerQueue.map(h => {
      console.log('rejecting', h.debugInfo);
      h.reject(err);
    });
    this.msgHandlerQueue = [];
    this.reconnecting = true;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    setTimeout(() => this.connect(options), 5000);

    this.emit('stateChanged', err);
    console.log('Reconnecting because', err);
  }

  private receive(data: string) {
    const {responses, remain} = parseResponse(this.buffer + data);
    this.buffer = remain;

    const dispatch = {
      version: (payload: string) => {
        this.version = payload;
        console.log(`MPD Server Version ${payload}`)
        this.emit('stateChanged', 'ready');
        this.emit('ready');
      },
      error: (payload: string) => this.handleMessage(new Error(payload)),
      data: (payload: string) => this.handleMessage(payload),
    };
    responses.forEach(response => dispatch[response.kind](response.payload));
  }

  private handleMessage(response: string | Error) {
    const handler = this.msgHandlerQueue.shift();
    if (response instanceof Error) {
      handler.reject(response);
    } else {
      handler.resolve(response);
    }

    if (this.msgHandlerQueue.length === 0) {
      this.idle();
    }
  };

  private async idle() {
    const response: string | Error = await this.send('idle')
      .catch<Error>(error => error);

    if (response instanceof Error) {
        console.log('Idle errored out', response);
        this.emit('stateChanged', response)
        return;
    }

    const subsystems = response.split("\n")
      .map(line => {
        const m = /changed: (\w+)/.exec(line);
        return m ? m[1] : null;
      })
      .filter(system => system != null);
    if (subsystems.length > 0) {
      this.emit('subsystemsChanged', subsystems);
    }
  }

  async sendCommand(command: Command): Promise<string> {
    return this.send(serializeCommand(command));
  };

  async sendCommands(commandList: Array<Command>): Promise<string> {
    return this.sendCommand(
      ["command_list_begin",
      ...commandList.map(serializeCommand),
      "command_list_end"].join('\n'));
  };

  private async send(data: string): Promise<string> {
    data = data.trim() + '\n';
    const logData = data.replace(/\n/g, '\\n');

    var that = this;
    return new Promise(function mpdClientSendPromise(resolve, reject) {
      data = data.trim();
      const isIdle = data === 'idle';

      if (that.reconnecting || !that.socket) {
        return reject(new Error('Not connected'));
      }

      if (that.msgHandlerQueue[0]?.isIdle) {
        that.socket.write('noidle\n');
      }
      that.socket.write(data + '\n');

      that.msgHandlerQueue.push({ isIdle, resolve, reject, debugInfo: logData });

      if (!isIdle) {
        setTimeout(
          () => reject(new Error('Timed out: command ' + logData))
        , 10000);
      }
    });
  };

  async getPlaylistInfo(): Promise<KeyValuePairs> {
    const msg = await this.sendCommand('playlistinfo');
    return parseKeyValueMessage(msg);
  }

  getVersion(): string | undefined {
    return this.version
  }
}

function argEscape(arg: string){
  // replace all " with \"
  return '"' + arg.replace(/"/g, '\\"') + '"';
}

function serializeCommand(command: Command): string {
  if (Array.isArray(command)) {
    const [name, ...args] = command;
    return [name, args.map(argEscape).join(" ")].join(' ');
  }
  return command;
}

export function parseKeyValueMessage(msg: string): KeyValuePairs {
  var result = {};

  msg.split('\n').forEach(function(p){
    if(p.length === 0) {
      return;
    }
    var keyValue = p.match(/([^ ]+): (.*)/);
    if (keyValue == null) {
      console.log('Could not parse entry "' + p + '"')
      return;
    }
    result[keyValue[1]] = keyValue[2];
  });
  return result;
}

export function parseArrayMessage(msg: string): Array<KeyValuePairs> {
  var results: Array<KeyValuePairs> = [];
  var obj = {};

  msg.split('\n').forEach(function(p) {
    if(p.length === 0) {
      return;
    }
    var keyValue = p.match(/([^ ]+): (.*)/);
    if (keyValue == null) {
      throw new Error('Could not parse entry "' + p + '"')
    }

    if (obj[keyValue[1]] !== undefined) {
      results.push(obj);
      obj = {};
      obj[keyValue[1]] = keyValue[2];
    }
    else {
      obj[keyValue[1]] = keyValue[2];
    }
  });
  results.push(obj);
  return results;
}
