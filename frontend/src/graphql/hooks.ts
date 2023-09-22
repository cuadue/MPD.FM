import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { fullStatusQuery, playMutation, statusSubscription, stopMutation } from './queries';
import { State } from '../generated/graphql';

export const usePlay = () => {
  const [mutate, { loading, error }] = useMutation(playMutation);

  const play = async (stationId: string) => {
    const {data: {play: {state}}} = await mutate({
      variables: { input: stationId },
    });
    return state;
  };

  return { play, loading, error};
}

export const useStop = () => {
  const [mutate, { loading, error }] = useMutation(stopMutation);

  const stop = async () => {
    try {
      const {data: {stop: {state}}} = await mutate();
      return state;
    } catch (err) {
      console.log('useStop', err);
      return err;
    }
  };

  return { stop, loading, error };
}


export const useStatusSubscription = () => {
  const {loading, error, data} = useQuery(fullStatusQuery);
  useSubscription(statusSubscription, {
    onData: ({client, data}) => {
      const newStatus = data.data.statusChanged;
      console.log('new status', newStatus);
      client.cache.updateQuery(
        {query: fullStatusQuery},
        () => ({status: newStatus}));
    },
  });

  return {
    loading,
    error,
    status: data?.status ?? {state: State.Connecting}
  };
}