import {Resolvers, Station} from './generated/schema.js'
import {State} from './generated/schema.js'
import {
  RadioClient,
  RadioStatus,
  RadioState,
  PlayState
} from './radioclient.js'
import {StationList} from './stationlist.js'
import { PubSub } from 'graphql-subscriptions';

export interface ResolverContext {
  radioClient: RadioClient;
  stationList: StationList;
}

const statusChangedTopic = 'STATUS_CHANGED';
export const pubSub = new PubSub();

export const statusChangedPublisher =
  (pubSub: PubSub, radioClient: RadioClient, stationList: StationList) =>
    async (status: RadioStatus) => {
      console.log('status changed to', status);
      pubSub.publish(statusChangedTopic, status);
    }

export const resolvers: Resolvers = {
  Status: {
    state: (parent) => {
      if (parent.radioState instanceof Error) {
        throw parent.radioState;
      }
      switch (parent.radioState) {
        case 'connecting': return State.Connecting;
        case 'ready':
          switch (parent.playState) {
            case 'pause': return State.Paused;
            case 'stop': return State.Stopped;
            case 'play': return State.Playing;
            default:
              console.log(`Internal error: Invalid play state '${parent.playState}'`);
              throw new Error('Internal error');
          }
        default:
          console.log(`Internal error: Invalid radio state '${parent.radioState}'`);
          throw new Error('Internal error');
      }
    },
  },
  Query: {
    status: async (root, args, {radioClient}) => radioClient.getStatus(),
    stations: (root, args, {radioClient}) => radioClient.getStations(),
  },
  Mutation: {
    play: (root, {stationId}, {radioClient}) => {
      radioClient.sendPlayStation(stationId);
      return radioClient.getStatus();
    },
    stop: async (root, args, {radioClient}) => {
      await radioClient.sendPause();
      return radioClient.getStatus();
    },
    addStation: (parent, {input}, {radioClient}) => 
      radioClient.createStation(input),
  },
  Subscription: {
    statusChanged: {
      resolve: (payload: any, args, context, info) => {
        console.log('Resolve status changed payload', payload);
        return payload;
      },
      subscribe: () => pubSub.asyncIterator(statusChangedTopic) as any,
    },
  },
};