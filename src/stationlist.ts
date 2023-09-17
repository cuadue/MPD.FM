export type StationEntity = {
    id: string
    streamUrl: string
    name?: string
    description?: string
    logoUrl?: string
};

export class StationList {
    byId: {[K: string]: StationEntity} = {};
    byUrl: {[K: string]: StationEntity} = {};

    addStation(s: StationEntity) {
        this.byId[s.id] = s;
        this.byUrl[s.streamUrl] = s;
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