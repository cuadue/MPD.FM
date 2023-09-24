import { GraphQLError } from 'graphql';
import {Resolvers} from './generated/schema.js'
import {State} from './generated/schema.js'
import { RadioClient, RadioStatus, } from './radioclient.js'
import {StationList} from './stationlist.js'

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
  Query: {
    status: async (root, args, {radioClient}) => throwError(await radioClient.getStatus()),
    stations: (root, args, {radioClient}) => radioClient.getStations(),
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
  },
  Subscription: {
    statusChanged: {
      resolve: (payload: RadioStatus) => payload,
      subscribe: (root, args, {radioClient}): AsyncIterable<RadioStatus> => 
        radioClient.radioStatusAsyncIterable(),
    },
  },
};