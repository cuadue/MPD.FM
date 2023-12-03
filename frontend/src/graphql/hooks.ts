import { SubscriptionHandler, useMutation, useSubscription } from 'urql';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from './queries';
import { FullStatusFragment, MyError, StatusSubscriptionSubscription } from '../generated/graphql';
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

export const useStatusSubscription = (id: string): {
  status?: FullStatusFragment | null
  fetching: boolean
} => {
  const [status, setStatus] = useState<FullStatusFragment | null>(null);
  const ctx = useContext(GlobalContext);
  type StatusMap = Record<string, {status?: FullStatusFragment, error?: string}>;
  const [result, ] = useSubscription<StatusSubscriptionSubscription, StatusMap>({
    query: statusSubscription,
  }, (prev = {}, {statusChanged}) => ({
    ...prev,
    [statusChanged.mpdInstance]: {
      status: statusChanged.status,
      error: statusChanged.error?.message,
    }
  }));

  const {fetching, error: subError, data} = result;

  useEffect(() => {
    if (fetching || !data) {
      return;
    }
    const instanceData = data[id];
    if (subError?.message) {
      setStatus(null);
      ctx.setError(subError.message);
    } else if (instanceData) {
      if (instanceData.error) {
        setStatus(null);
        ctx.setError(instanceData.error);
      } else if (instanceData.status) {
        ctx.setError(null);
        setStatus(instanceData.status);
      } else {
        console.log('what do with', instanceData);
      }
    }
  }, [fetching, subError, data, id]);

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