import { KeyValuePairs } from '@cuadue/mpd/dist/index.js';
import {Resolvers, Station} from './generated/schema.js'
import {State, Status} from './generated/schema.js'
import {RadioClient, RadioState} from './radioclient.js'
import {StationList} from './stationlist.js'
import { PubSub } from 'graphql-subscriptions';

export interface ResolverContext {
  radioClient: RadioClient;
  stationList: StationList;
  pubSub: PubSub;
}

const getState = (radioClient: RadioClient): State => {
    switch (radioClient.getState()) {
      case 'connecting': return State.Connecting;
      case 'stopped': return State.Stopped;
      case 'playing': return State.Playing;
      case 'error': return State.Error;
    }
}

const getStatus = async (radioClient: RadioClient, stationList: StationList): Promise<Status> => {
  console.log('getStatus');
  const streamUrl = await radioClient.nowPlayingUrl();
  console.log('stream url ', streamUrl);
  const station = stationList.getStationByUrl(streamUrl);
  console.log('station', station);
  const title = radioClient.nowPlayingTitle();
  console.log('title', title);
  return {
    state: getState(radioClient),
    nowPlaying: {station, title},
  }
}

export const statusChangedPublisher =
  (pubSub: PubSub, radioClient: RadioClient, stationList: StationList) =>
    (state: RadioState, data: KeyValuePairs) => {
      console.log('Doing publish', state);
      pubSub.publish('STATUS_CHANGED', {
        statusChanged: getStatus(radioClient, stationList)
      });
    }


export const resolvers: Resolvers = {
  Status: {
    state: (parent, args, {radioClient}) => getState(radioClient),
    nowPlaying: async (parent, args, {stationList, radioClient}) => {
      const streamUrl = await radioClient.nowPlayingUrl();
      const station = stationList.getStationByUrl(streamUrl);
      const title = radioClient.nowPlayingTitle();
      return {station, title};   
    },
  },
  Query: {
    status: async (parent, args, {radioClient, stationList}) =>
      getStatus(radioClient, stationList),
    stations: (parent, args, {stationList}) => stationList.getStations(),
  },
  Mutation: {
    play: (parent, {stationId}, {stationList, radioClient}) => {
      const station = stationList.getStationById(stationId);
      if (!station) {
        return State.Error;
      }
      radioClient.sendPlayStation(station.streamUrl);
      return getState(radioClient);
    },
    stop: async (parent, args, {radioClient}) => {
      await radioClient.sendPause();
      return getState(radioClient);
    },
    addStation: (parent, {input}, {stationList}) => 
      stationList.createStation(input),
  },
  Subscription: {
    statusChanged: {
      subscribe: async function* (parent, args, {pubSub} : {pubSub: PubSub}) {
          return pubSub.asyncIterator<Status>('STATUS_CHANGED');
      }
    },
  },
};