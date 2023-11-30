import { useMutation, useSubscription } from 'urql';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from './queries';
import { FullStatusFragment, MyError } from '../generated/graphql';
import { useEffect, useState, useContext } from 'react';
import { GlobalContext } from './providers';
import { INSTANCE } from '../index';

export const usePlayControls = (stationId?: string) => {
  const [{fetching: playLoading, error: playError}, play] = useMutation(playMutation);
  const [{fetching: stopLoading, error: stopError}, stop] = useMutation(stopMutation);

  const [error, setErrorState] = useState<Error | null>(null);
  const ctx = useContext(GlobalContext);
  
  const setError = (e: Error | null) => {
    setErrorState(e);
    ctx.setError(e?.message ?? null);
  };
  const clearError = () => setError(null);

  useEffect(() => {
    setError(playError ?? null);
  }, [playError]);

  useEffect(() => {
    setError(stopError ?? null);
  }, [stopError]);

  return {
    play: () => play( {
      instance: INSTANCE,
      input: stationId || ''
    }).catch(setError).then(clearError),
    stop: () => stop({
      instance: INSTANCE,
    }).catch(setError).then(clearError),
    loading: playLoading || stopLoading,
    error
  };
}

export const useStatusSubscription = () => {
  const [status, setStatus] = useState<FullStatusFragment | null>(null);
  const [error, setError] = useState<MyError | null>(null);
  const [result, ]= useSubscription({
    query: statusSubscription,
    variables: {instance: INSTANCE}
  }, (acc, x) => {
    console.log({acc, x});
    return x
  });

  const {fetching, error: subError, data} = result;
  console.log(result);

  useEffect(() => {
    if (fetching) {
      console.log('fetching');
      return;
    }
    if (subError?.message) {
      setStatus(null);
      setError({message: subError.message});
    } else if (data) {
      if (data.statusChanged.error) {
        setStatus(null);
        setError({message: data.statusChanged.error.message});
      } else if (data.statusChanged.status) {
        setError(null);
        setStatus(data.statusChanged.status);
      } else {
        console.log('what do with', data);
      }
    }
  }, [fetching, subError, data]);

  return {status, fetching, error};
}

export const useVolumeControl = (volume: number) => {
  const [state, setState] = useState(volume);
  const [{fetching: loading, error}, mutate] = useMutation(setVolumeMutation);
  useEffect(() => setState(volume), [volume]);

  const setVolume = async (newVolume: number) => {
    newVolume = Math.round(newVolume);
    setState(newVolume);
    const ret = await mutate({
      instance: INSTANCE,
      input: newVolume
    });
    console.log('volume mutation', ret);
  }

  return {volume: state, setVolume, loading, error};
};