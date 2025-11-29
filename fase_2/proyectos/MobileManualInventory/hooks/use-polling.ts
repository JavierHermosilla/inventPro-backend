import { AppState, type AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';

export const usePolling = (callback: () => void | Promise<void>, delay: number, enabled = true) => {
  const savedCallback = useRef(callback);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delay <= 0) return;

    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const tick = async () => {
      if (!mounted || appState.current !== 'active') return;
      await savedCallback.current?.();
      if (mounted && appState.current === 'active') {
        timer = setTimeout(tick, delay);
      }
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      appState.current = nextState;
      if (!mounted) return;
      if (nextState === 'active') {
        clearTimer();
        timer = setTimeout(tick, delay);
      } else {
        clearTimer();
      }
    };

    timer = setTimeout(tick, delay);
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      mounted = false;
      clearTimer();
      subscription.remove();
    };
  }, [delay, enabled]);
};

export default usePolling;
