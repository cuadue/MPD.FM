import {
    MpdClient,
    ConnectOptions,
    parseKeyValueMessage,
    State,
    KeyValuePairs,
} from '@cuadue/mpd';
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
                this.setStatus(this.parseStatus(data));
            }
        });

        return this.mpdClient.connect(this.connectOptions);
    }

    private setRadioState(newState: RadioState): boolean {
        const changed = newState !== this.state
        if (changed) {
            this.state = newState;
            console.log(`Radio client state ${this.state}`);
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

    getState() { return this.state; }

    async getPlayingState() {
        const data = await this.mpdClient.sendCommands(["currentsong", "status"]);
        return parseKeyValueMessage(data);
    }

    createStation(metadata: StationMetadata): StationEntity {
        return this.stationList.createStation(metadata);
    }

    getStations(): Array<StationEntity> {
        return this.stationList.getStations();
    }

    async sendPlayStation(stationId: string): Promise<void>{
        const station = this.stationList.getStationById(stationId);
        if (!station) {
            throw new Error(`No such station with id ${stationId}`);
        }
        this.mpdClient.sendCommands([
            "clear",
            ["repeat", '1'],
            ["add", station.streamUrl],
            "play",
        ]);
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

    private async getStatusRaw(): Promise<KeyValuePairs> {
        const msg = await this.mpdClient.sendCommands(['status', 'currentsong']);
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

    async getStatus(): Promise<RadioStatus> {
        const data = await this.getStatusRaw();
        return this.parseStatus(data);
    }
};