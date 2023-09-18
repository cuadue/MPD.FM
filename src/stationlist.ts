import {nanoid} from 'nanoid';

export type StationMetadata = {
    streamUrl: string
    name: string
    description?: string | null
    logoUrl?: string | null
};
export type StationEntity = { id: string } & StationMetadata;

export class StationList {
    byId: {[K: string]: StationEntity} = {};
    byUrl: {[K: string]: StationEntity} = {};

    createStation(metadata: StationMetadata): StationEntity {
        return this.insertStation({id: nanoid(), ...metadata});
    }

    insertStation(s: StationEntity) {
        this.byId[s.id] = s;
        this.byUrl[s.streamUrl] = s;
        return s;
    }

    getStationById(id: string): StationEntity | null {
        return this.byId[id];
    }
    
    getStationByUrl(url: string): StationEntity | null {
        return this.byUrl[url];
    }

    getStations(): Array<StationEntity> {
        return Object.values(this.byId);
    }
};