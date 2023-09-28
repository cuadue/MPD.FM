import { graphql } from '../generated';

const fullStatusFragment = graphql(`
  fragment FullStatus on Status{
    state
    errorMessage
    station {
      id
      name
      logoUrl
      description
    }
    title
    volume
  }
`)

export const fullStatusQuery = graphql(`
  query FullStatusQuery {
    status {
      ...FullStatus
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
      ...FullStatus
    }
  }
`);

export const stopMutation = graphql(`
  mutation Stop {
    stop {
      ...FullStatus
    }
  }
`);

export const setVolumeMutation = graphql(`
  mutation SetVolume($input: Int) {
    setVolume(input: $input)
  }
`);

export const statusSubscription = graphql(`
  subscription StatusSubscription {
    statusChanged {
      ...FullStatus
    }
  }
`);
