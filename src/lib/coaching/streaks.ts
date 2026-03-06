/**
 * Simple streak + badge tracker (client-side, localStorage-backed initially)
 */
export interface StreakState {
  postureUprightDays: number;
  lowInstabilityDays: number;
  lastUpdated: string | null;
  badges: string[];
}

const KEY = 'vitalsense_streaks_v1';

export function loadStreakState(): StreakState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore load error */
  }
  return {
    postureUprightDays: 0,
    lowInstabilityDays: 0,
    lastUpdated: null,
    badges: [],
  };
}

export function saveStreakState(s: StreakState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore save error */
  }
}

export function updateDailyMetrics(opts: {
  postureOk: boolean;
  instabilityOk: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const s = loadStreakState();
  if (s.lastUpdated !== today) {
    if (opts.postureOk) s.postureUprightDays += 1;
    else s.postureUprightDays = 0;
    if (opts.instabilityOk) s.lowInstabilityDays += 1;
    else s.lowInstabilityDays = 0;
    s.lastUpdated = today;
    // Badge granting examples
    if (s.postureUprightDays === 5 && !s.badges.includes('upright-5'))
      s.badges.push('upright-5');
    if (s.lowInstabilityDays === 7 && !s.badges.includes('steady-week'))
      s.badges.push('steady-week');
    saveStreakState(s);
  }
  return s;
}
