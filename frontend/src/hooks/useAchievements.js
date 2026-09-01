import { useEffect, useMemo, useRef, useState } from 'react';
import useProgress from './useProgress';

export const ACHIEVEMENTS = [
  {
    id: 'first-lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🚀',
    threshold: { type: 'lessonsCompleted', value: 1 },
    tier: 'bronze',
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Complete 5 lessons',
    icon: '📚',
    threshold: { type: 'lessonsCompleted', value: 5 },
    tier: 'bronze',
  },
  {
    id: 'knowledge-seeker',
    title: 'Knowledge Seeker',
    description: 'Complete 10 lessons',
    icon: '🎓',
    threshold: { type: 'lessonsCompleted', value: 10 },
    tier: 'silver',
  },
  {
    id: 'master-learner',
    title: 'Master Learner',
    description: 'Complete 25 lessons',
    icon: '🏆',
    threshold: { type: 'lessonsCompleted', value: 25 },
    tier: 'gold',
  },
  {
    id: 'xp-100',
    title: 'Rising Star',
    description: 'Earn 100 XP',
    icon: '⭐',
    threshold: { type: 'xp', value: 100 },
    tier: 'bronze',
  },
  {
    id: 'xp-500',
    title: 'Expert',
    description: 'Earn 500 XP',
    icon: '💎',
    threshold: { type: 'xp', value: 500 },
    tier: 'silver',
  },
  {
    id: 'xp-1000',
    title: 'Legend',
    description: 'Earn 1000 XP',
    icon: '👑',
    threshold: { type: 'xp', value: 1000 },
    tier: 'gold',
  },
  {
    id: 'streak-3',
    title: 'Streak Builder',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    threshold: { type: 'streak', value: 3 },
    tier: 'bronze',
  },
  {
    id: 'streak-7',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    threshold: { type: 'streak', value: 7 },
    tier: 'silver',
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🌟',
    threshold: { type: 'streak', value: 30 },
    tier: 'gold',
  },
  {
    id: 'study-15min',
    title: 'Focused Session',
    description: 'Study for 15 minutes total',
    icon: '⏱️',
    threshold: { type: 'studySeconds', value: 900 },
    tier: 'bronze',
  },
  {
    id: 'study-1hr',
    title: 'Deep Learner',
    description: 'Study for 1 hour total',
    icon: '🧠',
    threshold: { type: 'studySeconds', value: 3600 },
    tier: 'silver',
  },
];

const STORAGE_KEY = 'ia_achievements_seen_v1';

const getProgressValue = (state, type) => {
  switch (type) {
    case 'lessonsCompleted':
      return Number(state.completedLessons || 0);
    case 'xp':
      return Number(state.xp || 0);
    case 'streak':
      if (typeof state.streak === 'object' && state.streak !== null) {
        return Number(state.streak.current || 0);
      }
      return Number(state.streak || 0);
    case 'studySeconds':
      return Number(state.totalStudySeconds || 0);
    default:
      return 0;
  }
};

const getProgressPercent = (state, threshold) => {
  const current = getProgressValue(state, threshold.type);
  return Math.min(current / threshold.value, 1);
};

export const useAchievements = () => {
  const { state } = useProgress();
  const seenIdsRef = useRef(new Set());
  const [newlyEarned, setNewlyEarned] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      seenIdsRef.current = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      seenIdsRef.current = new Set();
    }
  }, []);

  const { earned, inProgress, locked } = useMemo(() => {
    const earnedBadges = ACHIEVEMENTS.filter((a) => {
      const val = getProgressValue(state, a.threshold.type);
      return val >= a.threshold.value;
    });
    const remaining = ACHIEVEMENTS.filter((a) => {
      const val = getProgressValue(state, a.threshold.type);
      return val < a.threshold.value;
    });
    return {
      earned: earnedBadges,
      inProgress: remaining.filter((a) => {
        const val = getProgressValue(state, a.threshold.type);
        return val > 0;
      }),
      locked: remaining.filter((a) => {
        const val = getProgressValue(state, a.threshold.type);
        return val === 0;
      }),
    };
  }, [state]);

  useEffect(() => {
    const unlocked = ACHIEVEMENTS.filter((a) => {
      const val = getProgressValue(state, a.threshold.type);
      return val >= a.threshold.value && !seenIdsRef.current.has(a.id);
    });

    if (unlocked.length > 0) {
      unlocked.forEach((a) => seenIdsRef.current.add(a.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...seenIdsRef.current]));

      setNewlyEarned(unlocked[unlocked.length - 1]);
      const timer = setTimeout(() => setNewlyEarned(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'gold': return '#f59e0b';
      case 'silver': return '#94a3b8';
      case 'bronze': return '#cd7f32';
      default: return '#6366f1';
    }
  };

  const resetAchievements = () => {
    seenIdsRef.current = new Set();
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    earned,
    inProgress: inProgress.map((a) => ({
      ...a,
      progress: getProgressPercent(state, a.threshold),
      currentValue: getProgressValue(state, a.threshold.type),
    })),
    locked: locked.map((a) => ({
      ...a,
      progress: getProgressPercent(state, a.threshold),
      currentValue: getProgressValue(state, a.threshold.type),
    })),
    newlyEarned,
    getTierColor,
    resetAchievements,
  };
};

export default useAchievements;
