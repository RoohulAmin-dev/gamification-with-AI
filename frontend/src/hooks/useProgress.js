import { useCallback, useEffect, useState } from 'react';
import * as progress from '../utils/progress';

export default function useProgress() {
  const [state, setState] = useState(() => progress.getProgress());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === progress.KEY) {
        setState(progress.getProgress());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const reload = useCallback(() => setState(progress.getProgress()), []);

  const addXP = useCallback((amount) => {
    const xp = progress.addXP(amount);
    setState(progress.getProgress());
    return xp;
  }, []);

  const addStudyTime = useCallback((seconds) => {
    const total = progress.addStudyTime(seconds);
    setState(progress.getProgress());
    return total;
  }, []);

  const completeLesson = useCallback(() => {
    const p = progress.completeLesson();
    setState(p);
    return p;
  }, []);

  const reset = useCallback(() => {
    const p = progress.resetProgress();
    setState(p);
    return p;
  }, []);

  return {
    state,
    reload,
    addXP,
    addStudyTime,
    completeLesson,
    reset,
  };
}




``