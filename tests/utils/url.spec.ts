import { describe, expect, it } from 'vitest';
import { parseUrl } from 'src/utils/url.js';

describe('utils/url', () => {
  it('trims a trailing slash', () => {
    expect(parseUrl('https://api.example.com/')).toBe(
      'https://api.example.com'
    );
  });

  it('keeps url unchanged without trailing slash', () => {
    expect(parseUrl('https://api.example.com')).toBe('https://api.example.com');
  });
});
