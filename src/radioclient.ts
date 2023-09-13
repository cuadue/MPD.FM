import {MpdClient, ConnectOptions, KeyValuePairs, parseKeyValueMessage} from '@cuadue/mpd';
import {TypedEmitter} from 'tiny-typed-emitter';

var debug = require('debug')('mpd.fm:mpdclient');

type State = 'disconnected' | 'connecting' | 'reconnecting' | 'ready';

interface RadioClientEvents {
    readyState: (state: State) => void
    radioState: (state: KeyValuePairs) => void
}

export class RadioClient extends TypedEmitter<RadioClientEvents> {
    mpdClient: MpdClient = new MpdClient;
    state: State = 'disconnected';
    connectOptions?: ConnectOptions

    constructor(options?: ConnectOptions) {
        super();
        this.connectOptions = options;
    }

    connect() {
        debug('Connecting');
        this.mpdClient.connect(this.connectOptions);
        this.mpdClient.on('end', () => this.onEnd());
        this.mpdClient.on('error', (err) => this.onError(err));
        this.mpdClient.on('ready', () => this.onReady());
    }

    onReady() {
        this.setReadyState('ready');
        this.mpdClient.on('system', async (name: String) => {
            debug('System update received: ' + name);
            if(name === "playlist" || name === "player") {
                const lastState = this.state;
                try {
                    const status = await this.mpdClient.getStatus();
                    this.emit('radioState', status);
                } catch {
                    this.retryConnect();
                }
            }
        });
    }

    onEnd() {
        debug('Connection ended');
        this.setReadyState('disconnected');
   }

    onError(err: Error) {
        console.error('MPD client socket error: ' + err);
    }

    retryConnect() {
        if (this.setReadyState('reconnecting')) {
            setTimeout(() => {
                this.connect();
            }, 3000);
        }
    }

    // Returns true if the state changed
    private setReadyState(newState: State): boolean {
        const changed = newState !== this.state
        if (changed) {
            this.state = newState;
            this.emit('readyState', this.state);
        }
        return changed;
    }

    async sendStatusRequest() {
        const data = await this.mpdClient.sendCommands(["currentsong", "status"]);
        return parseKeyValueMessage(data);
    }

    async sendPlayStation(stream: string) {
        await this.mpdClient.sendCommands([
            "clear",
            ["repeat", '1'],
            ["add", stream],
            "play",
        ]);
        return this.sendStatusRequest();
    }

    async sendVolume(volume: number) {
        const data = await this.mpdClient.sendCommands([
            ["volume", volume.toString()],
        ]);
        return this.sendStatusRequest();
    }

    async sendElapsedRequest() {
        const data = await this.sendStatusRequest();
        return data.elapsed;
    }

    async sendPlay() {
        return this.mpdClient.sendCommand('play');
    }

    async sendPause() {
        return this.mpdClient.sendCommand(['pause', '1']);
    }
};