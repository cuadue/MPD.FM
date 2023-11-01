'use client';

import { useMutation, useSubscription } from '@apollo/client';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from '@/lib/graphql/queries';
import { FullStatusFragment, State } from './generated/graphql';
import { useEffect, useRef, useState } from 'react';

export const usePlayControls = (stationId?: string) => {
  const [play, {loading: playLoading, error: playError}] = useMutation(playMutation,
    {variables: {input: stationId || ''}});

  const [stop, {loading: stopLoading, error: stopError}] = useMutation(stopMutation);

  return {
    play: () => play(),
    stop: () => stop(),
    loading: playLoading || stopLoading,
    error: playError || stopError };
}

export const useStatusSubscription = (initialStatus: FullStatusFragment) => {
  const [status, setStatus] = useState(initialStatus);
  const {loading, error, data} = useSubscription(statusSubscription);
  useEffect(() => {
    if (error) {
      setStatus({state: State.Error, errorMessage: error.message});
    }
    else if (!loading && data) {
      setStatus(data.statusChanged);
    }
  }, [data, error]);

  return {status, loading, error};
}

export const useCurrentStation = (initialStatus: FullStatusFragment) => {
  const [status, setStatus] = useState(initialStatus);
  const {loading, error, data} = useSubscription(statusSubscription);
  useEffect(() => {
    if (error) {
      setStatus({state: State.Error, errorMessage: error.message});
    }
    else if (!loading && data) {
      setStatus(data.statusChanged);
    }
  }, [data, error]);

  return {status, loading, error};
}

export const useVolumeControl = (volume: number) => {
  const [state, setState] = useState(volume ?? 100);
  const [mutate, {loading, error}] = useMutation(setVolumeMutation);

  useEffect(() => setState(volume), [volume]);

  const setVolume = async (newVolume: number) => {
    newVolume = Math.round(newVolume);
    try {
      setState(newVolume);
      const {data} = await mutate({
        variables: {input: newVolume}
      });
      setState(data.setVolume ?? 100);
    } catch (err) {
      console.log('failed setting volume', err);
    }
  }

  return {volume: state, setVolume, loading, error};
};

export const useClickOutside = <
  E extends HTMLElement, C extends HTMLElement, 
>(
  containerRef: React.MutableRefObject<C>,
  callback: (e: Event) => void
): React.RefObject<E> => {
  const elementRef = useRef<E>();
  const callbackRef = useRef((e: Event) => null);
  callbackRef.current = callback;

  useEffect(() => {
    const listener = (event: Event) => {
      if (elementRef.current &&
          callbackRef.current &&
          !elementRef.current.contains(event.target as HTMLElement)) {
        callbackRef.current(event);
      }
    }
    containerRef.current.addEventListener('click', listener);
    return () => {
      containerRef.current.removeEventListener('click', listener);
    }
  }, [containerRef, callbackRef, elementRef]);

  return elementRef;
};