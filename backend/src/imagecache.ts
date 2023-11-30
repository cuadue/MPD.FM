import fetch from 'node-fetch';
import {join as pathJoin, extname} from 'node:path'
import {existsSync, createWriteStream, mkdirSync, promises}  from 'node:fs'

export class ImageCache {
  storagePath: string
  urlPrefix: string
  filenames = {}

  constructor({storagePath, urlPrefix}: {storagePath: string, urlPrefix: string}) {
    mkdirSync(storagePath, {recursive: true});
    this.storagePath = storagePath;
    this.urlPrefix = urlPrefix;
  }

  private filename(basename: string, url: string): string {
    const ext = extname(url);
    return basename + ext;
  }

  private path(basename: string): string | null {
    const filename = this.filenames[basename];
    return filename ? pathJoin(this.storagePath, filename) : null;
  }

  private cacheHit(basename: string, url: string): boolean {
    const filename = this.filename(basename, url);
    return existsSync(pathJoin(this.storagePath, filename));
  }

  private url(basename: string): string | null {
    const filename = this.filenames[basename];
    return filename ? pathJoin(this.urlPrefix, filename) : null;
  }

  getUrl(basename: string): string | null {
    const path = this.path(basename);
    return path && existsSync(path) ?
      this.url(basename) :
      null;
  }

  async insert(basename: string, url: string): Promise<string | Error> {
    this.filenames[basename] = this.filename(basename, url);

    if (this.cacheHit(basename, url)) {
      const ret = this.getUrl(basename);
      return ret;
    }


    const path = this.path(basename);
    if (url.startsWith('.')) {
      await promises.copyFile(url, path);     
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        return new Error(`Failed to fetch ${url} because ${response.statusText}`);
      }
      const stream = createWriteStream(path);
      await promises.writeFile(path, new Uint8Array(await response.arrayBuffer()));
    }

    const ret = this.getUrl(basename);
    console.log('Wrote', path, '->', ret);
    return ret;
  }
};