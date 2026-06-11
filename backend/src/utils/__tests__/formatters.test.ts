import { describe, it, expect } from '@jest/globals';
import {
  formatDuration,
  formatStorageSize,
  calculateProgress,
  normalizeQuery,
  truncateQuery,
} from '../formatters.js';

describe('formatDuration', () => {
  it('formats 0 seconds as "00:00"', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats 75 seconds as "01:15"', () => {
    expect(formatDuration(75)).toBe('01:15');
  });

  it('formats 3600 seconds as "60:00"', () => {
    expect(formatDuration(3600)).toBe('60:00');
  });
});

describe('formatStorageSize', () => {
  it('includes "MB" for 1 MiB', () => {
    expect(formatStorageSize(1024 * 1024)).toContain('MB');
  });

  it('includes "GB" for 2 GiB', () => {
    expect(formatStorageSize(2 * 1024 * 1024 * 1024)).toContain('GB');
  });
});

describe('calculateProgress', () => {
  it('returns 50 when 50 of 100 bytes downloaded', () => {
    expect(calculateProgress(50, 100)).toBe(50);
  });

  it('returns 0 when total is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });
});

describe('normalizeQuery', () => {
  it('converts Turkish "şarkı" to "sarki"', () => {
    expect(normalizeQuery('şarkı')).toBe('sarki');
  });
});

describe('truncateQuery', () => {
  it('truncates a 250-character string to 200 characters', () => {
    expect(truncateQuery('a'.repeat(250))).toHaveLength(200);
  });
});
