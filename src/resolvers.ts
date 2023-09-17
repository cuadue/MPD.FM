import {Resolvers} from './generated/schema.js'
import {State} from './generated/schema.js'
import {RadioClient} from './radioclient.js'
import {StationList} from './stationlist.js'

export interface ResolverContext {
  radioClient: RadioClient;
  stationList: StationList;
}

export const resolvers: Resolvers = {
  Query: {
    state: (parent, args, {radioClient}) => {
      switch (radioClient.getState()) {
        case 'connecting': return State.Connecting;
        case 'stopped': return State.Stopped;
        case 'playing': return State.Playing;
        case 'error': return State.Error;
      }
    },
    nowPlaying: async (parent, args, {stationList, radioClient}) => {
      const streamUrl = await radioClient.nowPlayingUrl();
      const station = stationList.getStationByUrl(streamUrl);
      const title = radioClient.nowPlayingTitle();
      return {station, title};   
    },
    stations: (parent, args, {stationList}) => {
      return stationList.getStations();
    },
  },
//  Mutation: {
//  },
//  Subscription: {
//  },
};