// Local progress helpers using localStorage
const KEY = 'ia_progress_v1';

const defaultProgress = {
  xp: 0,
  lessonsCompleted: 0,
  streak: {
    lastActive: null, // ISO date string
    current: 0,
  },
  totalStudySeconds: 0,
  createdAt: new Date().toISOString(),
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('progress: failed to parse stored value', e);
    return null;
  }
}

export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultProgress };
    const parsed = safeParse(raw);
    return parsed ? { ...defaultProgress, ...parsed } : { ...defaultProgress };
  } catch (e) {
    console.error('progress: getProgress error', e);
    return { ...defaultProgress };
  }
}

export function saveProgress(obj) {
  try {
    const merged = { ...getProgress(), ...obj };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('progress: saveProgress error', e);
    return null;
  }
}

export function resetProgress() {
  try {
    const p = { ...defaultProgress, createdAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(p));
    return p;
  } catch (e) {
    console.error('progress: resetProgress error', e);
    return null;
  }
}

export function addXP(amount = 0) {
  const prog = getProgress();
  const xp = Math.max(0, Number(prog.xp || 0) + Number(amount || 0));
  prog.xp = xp;
  saveProgress(prog);
  return xp;
}

export function addStudyTime(seconds = 0) {
  const prog = getProgress();
  prog.totalStudySeconds = Number(prog.totalStudySeconds || 0) + Number(seconds || 0);
  saveProgress(prog);
  return prog.totalStudySeconds;
}

function sameDayISO(aIso, bIso) {
  if (!aIso || !bIso) return false;
  return aIso.slice(0, 10) === bIso.slice(0, 10);
}

export function completeLesson() {
  const prog = getProgress();
  prog.lessonsCompleted = (Number(prog.lessonsCompleted || 0) + 1);

  const now = new Date().toISOString();
  const last = prog.streak?.lastActive || null;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (sameDayISO(last, now)) {
    // already counted today
  } else if (sameDayISO(last, yesterday)) {
    prog.streak.current = (Number(prog.streak.current || 0) + 1);
    prog.streak.lastActive = now;
  } else {
    prog.streak.current = 1;
    prog.streak.lastActive = now;
  }

  saveProgress(prog);
  return prog;
}

export function getXP() {
  return Number(getProgress().xp || 0);
}

export function getLessonsCompleted() {
  return Number(getProgress().lessonsCompleted || 0);
}

export function getStreak() {
  const s = getProgress().streak || { lastActive: null, current: 0 };
  return { lastActive: s.lastActive, current: Number(s.current || 0) };
}

export function getTotalStudyTimeSeconds() {
  return Number(getProgress().totalStudySeconds || 0);
}

export { KEY };
