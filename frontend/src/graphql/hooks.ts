import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from './queries.js';
import { State } from '../generated/graphql';

export const usePlayControls = (stationId?: string) => {
  const [play, {loading: playLoading, error: playError}] = useMutation(playMutation,
    {variables: {input: stationId}});

  const [stop, {loading: stopLoading, error: stopError}] = useMutation(stopMutation);

  return {
    play: () => play(),
    stop: () => stop(),
    loading: playLoading || stopLoading,
    error: playError || stopError };
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