import { ApolloClient, InMemoryCache } from '@apollo/client';
import { graphql } from '../generated';

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:8080/graphql',
});

export const fullStatusQuery = graphql(`
  query FullStatus {
    status {
      state
      station {
        name
        logoUrl
        description
      }
      title
      volume
    }
  }
`);

export const allStationsQuery = graphql(`
  query AllStations {
    stations {
      id
      streamUrl
      sortOrder
      name
      description
      logoUrl
    }
  }
`);

export const playMutation = graphql(`
  mutation Play($input: ID!) {
    play(stationId: $input) {
      state
    }
  }
`);

export const stopMutation = graphql(`
  mutation Stop {
    stop {
      state
    }
  }
`);
