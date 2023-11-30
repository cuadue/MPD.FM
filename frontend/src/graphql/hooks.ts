import { useMutation, useSubscription } from 'urql';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from './queries';
import { FullStatusFragment, MyError } from '../generated/graphql';
import { useEffect, useState, useContext } from 'react';
import { GlobalContext } from './providers';

export const usePlayControls = (stationId?: string) => {
  const [{fetching: playLoading, error: playError}, play] = useMutation(playMutation);
  const [{fetching: stopLoading, error: stopError}, stop] = useMutation(stopMutation);

  const ctx = useContext(GlobalContext);
  
  const setError = (e: Error | null) => {
    ctx.setError(e?.message ?? null);
  };
  const clearError = () => ctx.setError(null);

  if (playError) setError(playError);
  if (stopError) setError(stopError);

  return {
    play: () => play( {
      instance: {id: ctx.instanceId},
      input: stationId || ''
    }).catch(setError).then(clearError),
    stop: () => stop({
      instance: {id: ctx.instanceId},
    }).catch(setError).then(clearError),
    loading: playLoading || stopLoading
  };
}

export const useStatusSubscription = () => {
  const [status, setStatus] = useState<FullStatusFragment | null>(null);
  const ctx = useContext(GlobalContext);
  const [result, ]= useSubscription({
    query: statusSubscription,
    variables: {instance: {id: ctx.instanceId}}
  });

  const {fetching, error: subError, data} = result;

  useEffect(() => {
    if (fetching) {
      return;
    }
    if (subError?.message) {
      setStatus(null);
      ctx.setError(subError.message);
    } else if (data) {
      if (data.statusChanged.error) {
        setStatus(null);
        ctx.setError(data.statusChanged.error.message);
      } else if (data.statusChanged.status) {
        ctx.setError(null);
        setStatus(data.statusChanged.status);
      } else {
        console.log('what do with', data);
      }
    }
  }, [fetching, subError, data]);

  return {status, fetching};
}

export const useVolumeControl = (volume: number) => {
  const [state, setState] = useState(volume);
  const [{fetching: loading, error}, mutate] = useMutation(setVolumeMutation);
  const ctx = useContext(GlobalContext);
  useEffect(() => setState(volume), [volume]);

  if (error) ctx.setError(error.message);

  const setVolume = async (newVolume: number) => {
    newVolume = Math.round(newVolume);
    setState(newVolume);
    const ret = await mutate({
      instance: {id: ctx.instanceId},
      input: newVolume
    });
  }

  return {volume: state, setVolume, loading};
};