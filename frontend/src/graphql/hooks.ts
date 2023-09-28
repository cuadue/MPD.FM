import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { fullStatusQuery, playMutation, setVolumeMutation, statusSubscription, stopMutation } from './queries.js';
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
  const {loading, error, data} = useSubscription(statusSubscription);

  return {
    loading,
    error,
    status: data?.statusChanged ?? {state: State.Connecting}
  };
}

export const useSetVolume = () => {
  const [mutate, {loading, error}] = useMutation(setVolumeMutation);
  const setVolume = async (volume: number) => {
    try {
      const {data: setVolume} = await mutate({
        variables: {input: volume}
      });
      return setVolume;
    } catch (err) {
      return err;
    }
  }
  return {setVolume, loading, error};
};