import {
    MpdClient,
    ConnectOptions,
    parseKeyValueMessage,
    State,
    KeyValuePairs,
} from './mpdclient.js';
import {TypedEmitter} from 'tiny-typed-emitter';
import {StationList, StationEntity, StationMetadata} from './stationlist.js'
import equal from 'fast-deep-equal';
import Debug from 'debug'

var debug = Debug('mpd.fm:mpdclient');

export const playStates = ['play', 'stop', 'pause'] as const;
export type PlayState = typeof playStates[number];
const playStateFromString = (s: string): PlayState => {
    const i = playStates.findIndex(p => p === s);
    return i >= 0 ? playStates[i] : 'stop';
}

export type RadioStatus = {
  radioState: State,
  playState: PlayState | Error,
  volume?: number,
  title?: string
  station?: StationEntity
};

export type RadioState = State;
interface RadioClientEvents {
    stateChanged: (state: RadioState) => void
    statusUpdated: (status: RadioStatus) => void
}

export class RadioClient extends TypedEmitter<RadioClientEvents> {
    mpdClient: MpdClient = new MpdClient;
    state: State = new Error('uninitialized');
    connectOptions?: ConnectOptions
    stationList: StationList;
    status?: RadioStatus;

    constructor(stationList: StationList, options?: ConnectOptions) {
        super();
        this.stationList = stationList;
        this.connectOptions = options;
    }

    async connect() {
        debug('Connecting');
        this.setRadioState('connecting');

        this.mpdClient.on('stateChanged', state => {
            this.setRadioState(state);
        });

        this.mpdClient.on('subsystemsChanged', async (systems: Array<string>) => {
            const systemOfInterest = ['playlist', 'player', 'mixer'].reduce(
                (acc, name) => acc || systems.indexOf(name) >= 0,
                false);

            if (systemOfInterest) {
                const data = await this.getStatusRaw();
                if (data instanceof Error) {
                    this.setRadioState(data);
                } else {
                    this.setStatus(this.parseStatus(data));
                }
            }
        });

        return this.mpdClient.connect(this.connectOptions);
    }

    private async setRadioState(newState: RadioState) {
        const changed = newState !== this.state
        if (changed) {
            this.state = newState;
            if (this.state == 'ready') {
                const response = await this.getStatus();
                if (response instanceof Error) {
                    console.log('Overwriting error', this.state, 'with', response);
                    this.state = response;
                } else {
                    this.emit('statusUpdated', response);
                }
            }

            this.emit('stateChanged', this.state);
        }
        return changed;
    }

    private setStatus(newStatus: RadioStatus) {
        if (!equal(this.status, newStatus)) {
            this.status = newStatus;
            this.emit('statusUpdated', this.status);
        }
    }

    createStation(metadata: StationMetadata): StationEntity {
        return this.stationList.createStation(metadata);
    }

    getStations(): Array<StationEntity> {
        return this.stationList.getStations();
    }

    async sendPlayStation(stationId: string): Promise<null | Error>{
        const station = this.stationList.getStationById(stationId);
        if (!station) {
            throw new Error(`No such station with id ${stationId}`);
        }
        const result = await this.mpdClient.sendCommands([
            "clear",
            ["repeat", '1'],
            ["add", station.streamUrl],
            "play",
        ]);
        if (result instanceof Error) return result;
        else return null;
    }

    async sendVolume(volume: number) {
        return this.mpdClient.sendCommands([
            ["volume", volume.toString()],
        ]);
    }

    async sendPlay() {
        return this.mpdClient.sendCommand('play');
    }

    async sendPause() {
        return this.mpdClient.sendCommand(['pause', '1']);
    }

    private async getStatusRaw(): Promise<KeyValuePairs | Error> {
        const msg = await this.mpdClient.sendCommands(['status', 'currentsong']);
        if (msg instanceof Error) return msg;
        return parseKeyValueMessage(msg);
    }

    private parseStatus(data: KeyValuePairs): RadioStatus {
        const playState = data.error ?
            new Error(data.error) :
            playStateFromString(data.state);
        return {
            radioState: this.state,
            playState,
            volume: Number.parseInt(data.volume) || undefined,
            station: this.stationList.getStationByUrl(data.file) || {
                streamUrl: data.file
            },
            title: data.Title || data.title,
        };
    }

    async getStatus(): Promise<RadioStatus | Error> {
        const data = await this.getStatusRaw();
        if (data instanceof Error) return data;
        return this.parseStatus(data);
    }

    radioStatusAsyncIterable(): AsyncIterable<RadioStatus> {
        var loop = true;
        var resolve: null | ((status: RadioStatus) => void);

        const listener = (status: RadioStatus) => {
            if (resolve) {
                resolve(status);
                resolve = null;
            }
        };

        this.on('statusUpdated', listener);
        const cleanup = () => this.off('statusUpdated', listener);

        async function* it() {
            try {
                while (loop) {
                    yield await new Promise<RadioStatus>(res => resolve = res);
                }
            } finally {
                console.log('cleaning up');
                cleanup();
            }
        } 
        return {[Symbol.asyncIterator]: it}
    }
};