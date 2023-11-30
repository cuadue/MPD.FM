import {nanoid} from 'nanoid';
import { defaultStations } from './defaultstations.js';
import { ImageCache } from './imagecache.js';
import {createHash} from 'crypto'

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
    imageCache: ImageCache

    constructor(imageCache: ImageCache) {
        this.imageCache = imageCache;
    }

    async init() {
        const s = defaultStations.slice();
        s.reverse();
        const promises = s.map((s, i) =>
            this.insertStation({
                id: s.id.toString(),
                sortOrder: i,
                streamUrl: s.stream,
                name: s.station,
                description: s.desc,
                logoUrl: s.logo,
            })
        );

        if (process.env.NODE_ENV !== 'production') {
            promises.push(this.insertStation({
                id: '9990',
                name: "INVALID_URL",
                description: "Intentionally invalid URL for testing",
                logoUrl: "",
                streamUrl: "invalid://url",
                sortOrder: -1,
            }));

            promises.push(this.insertStation({
                id: '9991',
                name: "INVALID_STREAM",
                description: "Intentionally invalid stream for testing",
                logoUrl: "",
                streamUrl: "https://invalid.stream",
                sortOrder: -2,
            }));
        }

        await Promise.all(promises);
    }

    async createStation(metadata: StationMetadata): Promise<StationEntity> {
        return this.insertStation({
            id: nanoid(),
            sortOrder: Object.values(this.byId).reduce((acc, s, index) =>
                Math.max(acc, s.sortOrder || index), 0),
            ...metadata});
    }

    private logoFilename(s: StationEntity): string {
        if (s.name) {
            return s.name
        }
        return createHash('md5').update(s.streamUrl).digest('base64');
    }

    async insertStation(s: StationEntity) {
        if (s.id) {
            this.byId[s.id] = s;
        }
        this.byUrl[s.streamUrl] = s;
        if (s.logoUrl) {
            await this.imageCache.insert(this.logoFilename(s), s.logoUrl);
        }
        return s;
    }

    private cachedLogo(s: StationEntity): StationEntity {
        const logoUrl = s.logoUrl ?
            this.imageCache.getUrl(this.logoFilename(s)) :
            null;
        return { ...s, logoUrl };
    }

    getStationById(id: string): StationEntity | null {
        const s = this.byId[id];
        return s ? this.cachedLogo(s) : null;
    }
    
    getStationByUrl(url: string): StationEntity | null {
        const s = this.byUrl[url];
        return s ? this.cachedLogo(s) : null;
    }

    getStations(): Array<StationEntity> {
        const values = Object.values(this.byId);
        values.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return values.map(s => this.cachedLogo(s));
    }
};