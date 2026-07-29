import { describe, it, expect } from 'vitest';

/**
 * Mirror der calculateExponentialBackoff-Funktion aus app/new/page.tsx
 * (in echtem Projekt würde man das in eine shared lib/utils auslagern)
 */
function calculateExponentialBackoff(attempt: number): number {
  const INITIAL_DELAY_MS = 1000;
  return INITIAL_DELAY_MS * Math.pow(2, attempt);
}

describe('calculateExponentialBackoff', () => {
  it('should return 1000ms for attempt 0', () => {
    expect(calculateExponentialBackoff(0)).toBe(1000);
  });

  it('should return 2000ms for attempt 1', () => {
    expect(calculateExponentialBackoff(1)).toBe(2000);
  });

  it('should return 4000ms for attempt 2', () => {
    expect(calculateExponentialBackoff(2)).toBe(4000);
  });

  it('should return 8000ms for attempt 3', () => {
    expect(calculateExponentialBackoff(3)).toBe(8000);
  });

  it('should follow exponential sequence 1000 * 2^n', () => {
    for (let i = 0; i < 5; i++) {
      expect(calculateExponentialBackoff(i)).toBe(1000 * Math.pow(2, i));
    }
  });
});
