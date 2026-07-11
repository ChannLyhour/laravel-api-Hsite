import { useState, useEffect } from 'react';
import type { CountdownTime } from '../types';

/** Compute remaining time from now until a target ISO date string. */
function calcTimeLeft(endDate: string): CountdownTime {
  const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  return {
    days:    Math.floor(totalSecs / 86400),
    hours:   Math.floor((totalSecs % 86400) / 3600),
    minutes: Math.floor((totalSecs % 3600) / 60),
    seconds: totalSecs % 60,
  };
}

/**
 * A custom hook to handle the deal countdown timer.
 * Pass `endDate` (ISO string from flash deal) to count down to a real deadline,
 * or omit it to use the static fallback initial time.
 */
export const useCountdown = (
  endDateOrFallback?: string | CountdownTime
) => {
  const isDateString = typeof endDateOrFallback === 'string';

  const initialTime: CountdownTime = isDateString
    ? calcTimeLeft(endDateOrFallback as string)
    : (endDateOrFallback as CountdownTime) ?? { days: 3, hours: 14, minutes: 45, seconds: 12 };

  const [timeLeft, setTimeLeft] = useState<CountdownTime>(initialTime);

  // Re-seed when the endDate changes (e.g. a different flash deal is active)
  useEffect(() => {
    if (isDateString) {
      setTimeLeft(calcTimeLeft(endDateOrFallback as string));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDateOrFallback]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDateString) {
        // Always recompute from the real end date to stay accurate
        setTimeLeft(calcTimeLeft(endDateOrFallback as string));
      } else {
        setTimeLeft(prev => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          if (prev.hours   > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          if (prev.days    > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
          return { days: 7, hours: 0, minutes: 0, seconds: 0 };
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDateOrFallback]);

  return timeLeft;
};
