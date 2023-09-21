import { useMutation } from '@apollo/client';
import { playMutation, stopMutation } from './queries';

export const usePlay = () => {
  const [mutate, { loading }] = useMutation(playMutation);

  const play = async (stationId: string) => {
    const {data: {play: {state}}} = await mutate({
      variables: { input: stationId },
    });
    return state;
  };

  return {
    play,
    loading,
  };
}

export const useStop = () => {
  const [mutate, { loading }] = useMutation(stopMutation);

  const stop = async () => {
    const {data: {stop: {state}}} = await mutate();
    return state;
  };

  return {
    stop,
    loading,
  };
}
