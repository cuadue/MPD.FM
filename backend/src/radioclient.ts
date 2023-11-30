import {
    MpdClient,
    ConnectOptions,
    parseKeyValueMessage,
    State as MpdState,
} from './mpdclient.js';
import {TypedEmitter} from 'tiny-typed-emitter';
import {StationEntity} from './stationlist.js'
import equal from 'fast-deep-equal';

export const playStates = ['connecting', 'play', 'stop', 'pause'] as const;
export type PlayState = typeof playStates[number];
const playStateFromString = (s: string): PlayState => {
    const i = playStates.findIndex(p => p === s);
    return i >= 0 ? playStates[i] : 'stop';
}

export type RadioStatus = {
  state: PlayState,
  volume?: number,
  title?: string
  station?: StationEntity
  errorMessage?: string
};

interface RadioClientEvents {
    statusUpdated: (status: RadioStatus | Error) => void
}

const arraysIntersect = <T>(needles: T[], haystack: T[]): boolean => {
    return needles.reduce((acc, needle) => acc || haystack.indexOf(needle) >= 0, false);
};

export class RadioClient extends TypedEmitter<RadioClientEvents> {
    mpdClient: MpdClient = new MpdClient;
    connectOptions?: ConnectOptions
    status?: RadioStatus | Error;

    constructor(options?: ConnectOptions) {
        super();
        console.log('New radio client', options);
        this.connectOptions = options;
    }

    async connect() {
        console.log('Connecting', this.connectOptions);
        this.emit('statusUpdated', { state: 'connecting' });

        this.mpdClient.on('stateChanged', (state: MpdState) => {
            if (state === 'connecting') {
                this.emit('statusUpdated', { state });
            } else {
                this.updateState();
            }
        });

        this.mpdClient.on('subsystemsChanged', async (subsystems: Array<string>) => {
            if (arraysIntersect(['playlist', 'player', 'mixer'], subsystems)) {
                this.updateState();
            }
        });

        return this.mpdClient.connect(this.connectOptions);
    }

    private async updateState() {
        const data: RadioStatus | Error = await this.getStatus()
            .catch(error => error);

        if (!equal(data, this.status)) {
            this.status = data;
            this.emit('statusUpdated', data);
        }
    }

    async sendPlayStation(station: StationEntity): Promise<null>{
        return this.mpdClient.sendCommands([
            "clear",
            ["repeat", '1'],
            ["add", station.streamUrl],
            "play",
        ]).then(() => null);
    }

    async sendVolume(volume: number) {
        return this.mpdClient.sendCommand(['setvol', volume.toString()]);
    }

    async sendPlay() {
        return this.mpdClient.sendCommand('play');
    }

    async sendPause() {
        return this.mpdClient.sendCommand(['pause', '1']);
    }

    async getStatus(): Promise<RadioStatus> {
        const msg = await this.mpdClient.sendCommands(['status', 'currentsong']);
        const data = parseKeyValueMessage(msg);
        if (data instanceof Error) {
            console.log('getStatus parsing not good', data);
            return Promise.reject(data);
        }
        const volume = Number.parseInt(data.volume);
        return {
            state: playStateFromString(data.state),
            volume: isFinite(volume) ? volume : undefined,
            station: {
                streamUrl: data.file
            },
            title: data.Title || data.title,
            errorMessage: data.error,
        };
    }

    async radioStatusAsyncIterable(): Promise<AsyncIterable<RadioStatus | Error>> {
        var resolve: null | ((status: RadioStatus | Error) => void);

        const listener = (status: RadioStatus | Error) => {
            resolve && resolve(status);
        };

        this.on('statusUpdated', listener);
        const cleanup = () => this.off('statusUpdated', listener);

        const initial = await this.getStatus()
            .catch(error => error);

        async function* it() {
            try {
                yield initial;
                while (true) {
                    yield await new Promise<RadioStatus | Error>(
                            res => resolve = res
                        ).catch(error => error);
                }
            } finally {
                cleanup();
            }
        } 
        return {[Symbol.asyncIterator]: it}
    }

    getVersion(): string | undefined {
        return this.mpdClient.getVersion();
    }

    getConnectOptions(): ConnectOptions | undefined {
        return this.connectOptions;
    }
};