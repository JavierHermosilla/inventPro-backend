import { useEffect, useRef } from 'react';

export const usePolling = (callback: () => void | Promise<void>, delay: number, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delay <= 0) return;

    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      await savedCallback.current?.();
      if (mounted) {
        timer = setTimeout(tick, delay);
      }
    };

    let timer = setTimeout(tick, delay);
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [delay, enabled]);
};

export default usePolling;
