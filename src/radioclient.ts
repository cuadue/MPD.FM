import {MpdClient, ConnectOptions, KeyValuePairs, parseKeyValueMessage} from '@cuadue/mpd';
import { parse } from 'graphql';
import {TypedEmitter} from 'tiny-typed-emitter';

var debug = require('debug')('mpd.fm:mpdclient');

export type RadioState = 'connecting' | 'stopped' | 'playing' | 'error';

interface RadioClientEvents {
    state: (kind: RadioState, data: KeyValuePairs) => void
}

export class RadioClient extends TypedEmitter<RadioClientEvents> {
    mpdClient: MpdClient = new MpdClient;
    state: RadioState = 'connecting';
    connectOptions?: ConnectOptions

    constructor(options?: ConnectOptions) {
        super();
        this.connectOptions = options;
    }

    async connect() {
        debug('Connecting');
        this.setState('connecting');
        this.mpdClient.on('state', (state) => {
        });

        this.mpdClient.on('ready', () => {
            this.setState('stopped');
        });

        this.mpdClient.on('system', async (name: string) => {
            debug('System update received: ' + name);
            if (['playlist', 'player', 'mixer'].indexOf(name) >= 0) {
                const status = await this.mpdClient.getStatus();
                //this.emit('state', status);
            }
        });

        await this.mpdClient.connect(this.connectOptions);
    }

    private onEnd() {
        this.setState('connecting');
    }

    private onError(err: Error) {
        console.error('MPD client socket error: ' + err);
    }

    private retryConnect() {
        if (this.setState('connecting')) {
            setTimeout(() => {
                this.connect();
            }, 3000);
        }
    }

    getState() {
        return this.state;
    }

    // Returns true if the state changed
    private setState(newState: RadioState): boolean {
        const changed = newState !== this.state
        if (changed) {
            this.state = newState;
            //this.emit('state', this.state);
        }
        return changed;
    }

    async getPlayingState() {
        const data = await this.mpdClient.sendCommands(["currentsong", "status"]);
        return parseKeyValueMessage(data);
    }

    getReadyState() {
        return this.state;
    }

    async sendPlayStation(stream: string) {
        await this.mpdClient.sendCommands([
            "clear",
            ["repeat", '1'],
            ["add", stream],
            "play",
        ]);
    }

    async sendVolume(volume: number) {
        const data = await this.mpdClient.sendCommands([
            ["volume", volume.toString()],
        ]);
    }

    async sendPlay() {
        return this.mpdClient.sendCommand('play');
    }

    async sendPause() {
        return this.mpdClient.sendCommand(['pause', '1']);
    }

    async nowPlayingUrl() {
        const msg = await this.mpdClient.sendCommand("currentsong");
        const data = parseKeyValueMessage(msg);
        return data.file;
    }

    nowPlayingTitle() {
        return 'foo';
    }
};