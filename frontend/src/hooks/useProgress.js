import { useCallback, useEffect, useState } from "react";
import * as progress from "../utils/progress";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function useProgress() {
  const { user } = useAuth();

  const [state, setState] = useState(() => progress.getProgress());

  // Load progress from Supabase when the user signs in
  useEffect(() => {
    if (!user?.id) return;

    const loadUserProgress = async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("xp, completed_lessons, streak, total_study_seconds")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load user progress:", error);
        return;
      }

      if (data) {
        const streakValue = data.streak || 0;
        const restoredProgress = {
          ...progress.getProgress(),
          xp: data.xp ?? 0,
          completedLessons: data.completed_lessons ?? 0,
          streak: {
            lastActive: null,
            current: Number(streakValue) || 0,
          },
          totalStudySeconds: data.total_study_seconds ?? 0,
        };

        setState(restoredProgress);
      } else {
        const initialProgress = {
          ...progress.getProgress(),
          xp: 0,
          completedLessons: 0,
          streak: { lastActive: null, current: 0 },
          totalStudySeconds: 0,
        };

        const { error: insertError } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            xp: 0,
            completed_lessons: 0,
            streak: 0,
            total_study_seconds: 0,
          });

        if (insertError) {
          console.error("Failed to create user progress:", insertError);
        }

        setState(initialProgress);
      }
    };

    loadUserProgress();
  }, [user?.id]);

  // Save one complete progress state to Supabase
  const syncProgress = useCallback(
    async (nextState) => {
      if (!user?.id) return;

      const payload = {
        user_id: user.id,
        xp: nextState.xp ?? 0,
        completed_lessons: nextState.completedLessons ?? 0,
        streak: Number(nextState.streak?.current ?? nextState.streak ?? 0),
        total_study_seconds: nextState.totalStudySeconds ?? 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_progress")
        .upsert(payload, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Failed to sync progress:", error);
      }
    },
    [user?.id]
  );

  const reload = useCallback(() => {
    setState(progress.getProgress());
  }, []);

  const addXP = useCallback(
    (amount) => {
      progress.addXP(amount);

      const nextState = progress.getProgress();

      setState(nextState);
      syncProgress(nextState);

      return nextState.xp;
    },
    [syncProgress]
  );

  const addStudyTime = useCallback(
    (seconds) => {
      progress.addStudyTime(seconds);

      const nextState = progress.getProgress();

      setState(nextState);
      syncProgress(nextState);

      return nextState.totalStudySeconds;
    },
    [syncProgress]
  );

  const completeLesson = useCallback(() => {
    const nextState = progress.completeLesson();

    setState(nextState);
    syncProgress(nextState);

    return nextState;
  }, [syncProgress]);

  const reset = useCallback(() => {
    const nextState = progress.resetProgress();

    setState(nextState);
    syncProgress(nextState);

    return nextState;
  }, [syncProgress]);

  return {
    state,
    reload,
    addXP,
    addStudyTime,
    completeLesson,
    reset,
  };
}