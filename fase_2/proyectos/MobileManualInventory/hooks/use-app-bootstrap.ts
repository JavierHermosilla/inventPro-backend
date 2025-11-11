import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth';

export const useAppBootstrap = () => {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrate, hydrated]);

  return hydrated;
};

export default useAppBootstrap;
