import { useAppWebSocket } from '@/contexts/useAppWebSocket';
import React, { useCallback, useState } from 'react';

export const CoachingControlPanel: React.FC = () => {
  const { coachingEnabled, setCoachingEnabled, streaks } = useAppWebSocket();
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="backdrop-blur w-72 space-y-3 animate-fade-in rounded-lg bg-gray-900/90 p-4 text-sm text-white shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Coaching & Streaks</h3>
            <button
              className="text-gray-300 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close coaching panel"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span>Micro Coaching</span>
            <button
              onClick={() => setCoachingEnabled(!coachingEnabled)}
              className={`text-xs rounded border px-2 py-1 font-medium transition-colors ${coachingEnabled ? 'bg-teal-600 border-teal-500' : 'bg-gray-700 border-gray-600'}`}
              aria-label={
                coachingEnabled
                  ? 'Disable micro coaching'
                  : 'Enable micro coaching'
              }
            >
              {coachingEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Posture streak</span>
              <span>{streaks.postureUprightDays} days</span>
            </div>
            <div className="flex justify-between">
              <span>Stability streak</span>
              <span>{streaks.lowInstabilityDays} days</span>
            </div>
          </div>
          {streaks.badges.length > 0 && (
            <div className="border-t border-white/10 pt-1">
              <div className="text-xs mb-1 font-semibold">Badges</div>
              <div className="flex flex-wrap gap-1">
                {streaks.badges.map((b: string) => (
                  <span
                    key={b}
                    className="bg-amber-600/80 py-0.5 rounded-full px-2 text-[10px]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] leading-snug opacity-70">
            Daily streak updates occur automatically based on posture &
            instability thresholds.
          </p>
        </div>
      )}
      <button
        onClick={toggle}
        className="h-10 w-10 bg-teal-600 hover:bg-teal-700 focus:ring-teal-400 rounded-full text-white shadow-lg focus:outline-none focus:ring-2"
        aria-label="Toggle coaching panel"
      >
        {open ? '−' : '☰'}
      </button>
    </div>
  );
};
