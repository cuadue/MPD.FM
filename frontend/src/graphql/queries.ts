import { graphql } from '../generated';

const fullStatusFragment = graphql(`
  fragment FullStatus on Status {
    state
    station {
      id
      name
      logoUrl
      description
    }
    title
    volume
    errorMessage
  }
`)

export const fullStatusQuery = graphql(`
  query FullStatusQuery($instance: MpdInstance!) {
    status(mpdInstance: $instance) {
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
  mutation Play($instance: MpdInstance!, $input: ID!) {
    play(mpdInstance: $instance, stationId: $input) {
      ...FullStatus
    }
  }
`);

export const stopMutation = graphql(`
  mutation Stop($instance: MpdInstance!) {
    stop(mpdInstance: $instance) {
      ...FullStatus
    }
  }
`);

export const setVolumeMutation = graphql(`
  mutation SetVolume($instance: MpdInstance!, $input: Int!) {
    setVolume(mpdInstance: $instance, input: $input) {
      volume
    }
  }
`);

export const statusSubscription = graphql(`
  subscription StatusSubscription($instance: MpdInstance!) {
    statusChanged(mpdInstance: $instance) {
      status {
        ...FullStatus
      }
      error {
        message
      }
    }
  }
`);

export const mpdBackendQuery = graphql(`
  query MpdBackendQuery($instance: MpdInstance!) {
    mpdBackend(mpdInstance: $instance) {
      hostname
      port
      version
    }
  }
`)

export const instancesQuery = graphql(`
  query InstancesQuery {
    instanceIds
  }
`)