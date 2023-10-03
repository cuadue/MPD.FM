import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { playMutation, setVolumeMutation, statusSubscription, stopMutation } from './queries.js';
import { State } from '../generated/graphql';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';

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

export const useIsNarrow = () => useMediaQuery({maxWidth: 600});

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