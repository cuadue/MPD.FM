import { GraphQLError } from 'graphql';
import {Resolvers} from './generated/schema.js'
import {State} from './generated/schema.js'
import { RadioClient, RadioStatus, } from './radioclient.js'
import {StationList} from './stationlist.js'
import {exec} from 'child_process';

export interface ResolverContext {
  radioClient: RadioClient;
  stationList: StationList;
}

const throwError = <T>(x: T | Error): T => {
  if (x instanceof Error) throw new GraphQLError(x.message);
  else return x;
}

export const resolvers: Resolvers = {
  Status: {
    state: (parent) => {
      if (parent.radioState instanceof Error) {
        return State.Error;
      }
      switch (parent.radioState) {
        case 'connecting': return State.Connecting;
        case 'ready':
          if (parent.playState instanceof Error) {
            return State.Error;
          }
          switch (parent.playState) {
            case 'pause': return State.Paused;
            case 'stop': return State.Stopped;
            case 'play': return State.Playing;
            default:
              throw new GraphQLError(`Internal error: Invalid play state '${parent.playState}'`);
          }
        default:
          throw new GraphQLError(`Internal error: Invalid radio state '${parent.radioState}'`);
      }
    },
    errorMessage: ({radioState, playState}) => {
      return radioState instanceof Error ? radioState.message :
             playState instanceof Error ? playState.message :
             null;
    }
  },
  MpdBackend: {
    hostname: (root, args, {radioClient}) => {
      const host = radioClient.getConnectOptions().host;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
      return new Promise((resolve, reject) =>
        exec('hostname',
          (err, stdout) => err ? reject(err) : resolve(stdout.trim())))
    },
    version: (root, args, {radioClient}) => radioClient.getVersion(),
    port: (root, args, {radioClient}) => radioClient.getConnectOptions().port,
  },
  Query: {
    status: async (root, args, {radioClient}) => throwError(await radioClient.getStatus()),
    stations: (root, args, {radioClient}) => radioClient.getStations(),
    mpdBackend: () => ({}),
  },
  Mutation: {
    play: async (root, {stationId}, {radioClient}) => {
      throwError(await radioClient.sendPlayStation(stationId));
      return throwError(await radioClient.getStatus());
    },
    stop: async (root, args, {radioClient}) => {
      throwError(await radioClient.sendPause());
      return throwError(await radioClient.getStatus());
    },
    addStation: (parent, {input}, {radioClient}) => 
      radioClient.createStation(input),
    setVolume: async (parent, {input}, {radioClient}) => {
      await throwError(radioClient.sendVolume(input));
      return input;
    },
  },
  Subscription: {
    statusChanged: {
      resolve: (payload: RadioStatus) => payload,
      subscribe: async (root, args, {radioClient}): Promise<AsyncIterable<RadioStatus>> =>
        radioClient.radioStatusAsyncIterable(),
    },
  },
};