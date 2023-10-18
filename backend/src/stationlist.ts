import {nanoid} from 'nanoid';
import { defaultStations } from './defaultstations.js';

export type StationMetadata = {
    streamUrl: string
    sortOrder?: number, // Reversed: 0 is at the bottom
    name?: string | null
    description?: string | null
    logoUrl?: string | null
};
export type StationEntity = { id?: string } & StationMetadata;

export class StationList {
    byId: {[K: string]: StationEntity} = {};
    byUrl: {[K: string]: StationEntity} = {};

    constructor() {
        const s = defaultStations.slice();
        s.reverse();
        s.map((s, i) => {
            this.insertStation({
                id: s.id.toString(),
                sortOrder: i,
                streamUrl: s.stream,
                name: s.station,
                description: s.desc,
                logoUrl: s.logo,
            });
        });
    }

    createStation(metadata: StationMetadata): StationEntity {
        return this.insertStation({
            id: nanoid(),
            sortOrder: Object.values(this.byId).reduce((acc, s, index) =>
                Math.max(acc, s.sortOrder || index), 0),
            ...metadata});
    }

    insertStation(s: StationEntity) {
        if (s.id) {
            this.byId[s.id] = s;
        }
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
        const values = Object.values(this.byId);
        values.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return values;
    }
};