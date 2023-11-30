import * as path from 'node:path';
import {MpdBackend, MpdInstance, Resolvers, Status, StatusChangedEvent} from './generated/schema.js'
import {State} from './generated/schema.js'
import { RadioClient, RadioStatus, } from './radioclient.js'
import {StationList} from './stationlist.js'
import {promisify} from 'node:util';
import {exec as execCallback} from 'child_process';
import { radioClients, clientIds } from './server.js';
import { GraphQLError } from 'graphql';
const exec = promisify(execCallback);

export interface ResolverContext {
  stationList: StationList;
}

const getRadioClient = ({id}: MpdInstance): RadioClient => {
  const ret = radioClients[id];
  if (!ret) {
    throw new GraphQLError(`No such instance ${id}`);
  }
  return ret;
}

export const resolvers: Resolvers = {
  Status: {
    state(obj) {
      switch (obj.state) {
        case 'connecting': return State.Connecting;
        case 'pause': return State.Paused;
        case 'stop': return State.Stopped;
        case 'play': return State.Playing;
        default: console.log('Unknown state', obj.state); return State.Connecting;
      }
    },
    station: (obj, args, {stationList}) =>
      stationList.getStationByUrl(obj.station?.streamUrl),
  },
  Query: {
    status: async (root, {mpdInstance}) => getRadioClient(mpdInstance).getStatus(),
    stations: (root, args, {stationList}) => stationList.getStations(),
    mpdBackend: async (root, {mpdInstance}): Promise<MpdBackend> => {
      const radioClient = getRadioClient(mpdInstance);
      const version = radioClient.getVersion() || '(unknown version)';
      const port = radioClient.getConnectOptions()?.port || -1;
      const host = radioClient.getConnectOptions()?.host || '(unknown host)';
      const hostname = (host !== 'localhost' && host !== '127.0.0.1')
        ? host
        : await exec('hostname')
          .then(({stdout}) => stdout.trim())
          .catch(error => error);
      return {hostname, version, port};
    },
    instanceIds: () => clientIds,
  },
  Mutation: {
    play: async (root, {mpdInstance, stationId}, {stationList}) => {
      const radioClient = getRadioClient(mpdInstance);
      return radioClient.sendPlayStation(stationList.getStationById(stationId))
        //.catch(error => error)
        .then(() => radioClient.getStatus())
    },

    stop: async (root, {mpdInstance}) => {
      const radioClient = getRadioClient(mpdInstance);
      return radioClient.sendPause()
        //.catch(error => error)
        .then(() => radioClient.getStatus())
    },

    setVolume: async (parent, {mpdInstance, input}) => {
      const radioClient = getRadioClient(mpdInstance);
      return radioClient.sendVolume(input)
        //.catch(error => error)
        .then(() => ({volume: input}))
    },
  },
  Subscription: {
    statusChanged: {
      resolve: obj => obj,
      subscribe: async (root, {mpdInstance}): Promise<AsyncIterable<StatusChangedEvent>> => {
        console.log('New sub');
        const radioClient = getRadioClient(mpdInstance);
        async function* it(): AsyncGenerator<StatusChangedEvent> {
          // Seems like if any field contains an Error object, Apollo
          // sends an error response.
          for await (const i of await radioClient.radioStatusAsyncIterable()) {
            yield {
              error: i instanceof Error ? {message: i.message} : undefined,
              status: i instanceof Error ? undefined : i as /*
                  Graphql-codegen thinks that this needs to be a fully resolved type,
                  but in actuality Apollo Server runs the RadioStatus through the
                  Status resolver.
                */ any as Status,
            };
          }
        }
        return {[Symbol.asyncIterator]: it}
      }
    },
  },
};