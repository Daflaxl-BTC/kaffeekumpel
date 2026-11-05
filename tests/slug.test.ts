import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateSlug, decodeSlug } from '@/lib/slug';

describe('Slug Generation', () => {
  it('should generate a valid 6-character Crockford Base32 slug', () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
    expect(slug.length).toBe(6);
  });

  it('should generate unique slugs across multiple calls', () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const slug = generateSlug();
      slugs.add(slug);
    }
    // Mit hoher Wahrscheinlichkeit sollten alle 100 unterschiedlich sein
    expect(slugs.size).toBeGreaterThan(99);
  });

  it('should throw an error with descriptive message on generation failure', () => {
    // Mocke crypto.getRandomValues um einen Fehler zu werfen
    const originalGetRandomValues = global.crypto.getRandomValues;
    vi.spyOn(global.crypto, 'getRandomValues').mockImplementation(() => {
      throw new Error('Random source unavailable');
    });

    expect(() => generateSlug()).toThrow('Slug generation failed');

    // Cleanup
    vi.spyOn(global.crypto, 'getRandomValues').mockRestore();
  });
});

describe('Slug Decoding', () => {
  it('should decode a valid slug to a number', () => {
    const slug = 'ABCDEF';
    const num = decodeSlug(slug);
    expect(typeof num).toBe('number');
    expect(num).toBeGreaterThanOrEqual(0);
  });

  it('should throw an error for invalid slug format', () => {
    expect(() => decodeSlug('INVALID!')).toThrow('Invalid character in slug');
    expect(() => decodeSlug('AB')).toThrow('Invalid slug format');
    expect(() => decodeSlug('')).toThrow('Invalid slug format');
  });

  it('should handle all valid Crockford characters', () => {
    const validChars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    for (const char of validChars) {
      const slug = char.repeat(6);
      expect(() => decodeSlug(slug)).not.toThrow();
    }
  });
});
