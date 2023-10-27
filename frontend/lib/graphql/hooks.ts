'use client';

import { useMutation, useSubscription } from '@apollo/client';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from '@/lib/graphql/queries';
import { FullStatusFragment, State } from './generated/graphql';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  console.log('useStatusSubscription loading', loading, 'error', 'status', status); 
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

export const useSetVolume = () => {
  const [mutate, {loading, error}] = useMutation(setVolumeMutation);
  const setVolume = async (volume: number) => {
    volume = Math.round(volume);
    try {
      const {data: newVolume} = await mutate({
        variables: {input: volume}
      });
      return newVolume?.setVolume;
    } catch (err) {
      console.log('failed setting volume', err);
      return err;
    }
  }
  return {setVolume, loading, error};
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

export const useNotchStyle = (style: {
  notchTop: any
  notchRight: any
  notchBottom: any
  notchLeft: any
}) => {
  const mapping = useCallback(() => {
    switch (screen.orientation.type) {
      case 'landscape-primary': return style.notchRight;
      case 'landscape-secondary': return style.notchLeft;
      case 'portrait-primary': return style.notchTop;
      case 'portrait-secondary': return style.notchBottom;
      default: return 'unknown??';
    }
  }, []);
  const [state, setState] = useState(mapping());
  screen.orientation.addEventListener('change', () => {
    const newval = mapping();
    setState(newval)
  });
  return state;
};