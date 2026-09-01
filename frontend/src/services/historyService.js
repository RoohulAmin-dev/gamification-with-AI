import { supabase } from "../lib/supabase";

export const saveLearningHistory = async ({
  userId,
  prompt,
  result,
}) => {
  if (!userId || !prompt || !result) {
    return { data: null, error: new Error("Missing history data.") };
  }

  const lesson = result?.data || result;

  const { data, error } = await supabase
    .from("learning_history")
    .insert({
      user_id: userId,
      prompt,
      title: lesson?.title || null,
      learning_type: lesson?.learning_type || null,
      difficulty: lesson?.difficulty || null,
      lesson_data: lesson,
    })
    .select()
    .single();

  return { data, error };
};
export const getLearningHistory = async (userId) => {
  if (!userId) {
    return { data: [], error: new Error("User ID is required.") };
  }

  const { data, error } = await supabase
    .from("learning_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    data: data || [],
    error,
  };
};

export const deleteLearningHistory = async (userId) => {
  if (!userId) {
    return { error: new Error("User ID is required.") };
  }

  const { error } = await supabase
    .from("learning_history")
    .delete()
    .eq("user_id", userId);

  return { error };
};