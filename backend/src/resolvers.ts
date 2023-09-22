import { GraphQLError } from 'graphql';
import {Resolvers} from './generated/schema.js'
import {State} from './generated/schema.js'
import {
  RadioClient,
  RadioStatus,
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
        throw new GraphQLError('radio state' + parent.radioState.toString());;
      }
      switch (parent.radioState) {
        case 'connecting': return State.Connecting;
        case 'ready':
          if (parent.playState instanceof Error) {
            console.log('play state is error ', parent.playState); 
            throw new GraphQLError('Internal error 1');
          }
          switch (parent.playState) {
            case 'pause': return State.Paused;
            case 'stop': return State.Stopped;
            case 'play': return State.Playing;
            default:
              console.log(`Internal error: Invalid play state '${parent.playState}'`);
              throw new GraphQLError('Internal error 2');
          }
        default:
          console.log(`Internal error: Invalid radio state '${parent.radioState}'`);
          throw new GraphQLError('Internal error 3');
      }
    },
  },
  Query: {
    status: async (root, args, {radioClient}) => radioClient.getStatus(),
    stations: (root, args, {radioClient}) => radioClient.getStations(),
  },
  Mutation: {
    play: async (root, {stationId}, {radioClient}) => {
      await radioClient.sendPlayStation(stationId);
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