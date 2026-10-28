import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';

describe('native mobile configuration', () => {
  it('uses the published community rather than the preview', () => {
    expect(config.server?.url).toBe('https://flow-post-sparkle.lovable.app');
  });
  it('does not allow insecure or arbitrary in-app navigation', () => {
    expect(config.server?.cleartext).toBe(false);
    expect(config.android?.allowMixedContent).toBe(false);
    expect(config.server?.allowNavigation).toBeUndefined();
  });
  it('bundles a connection failure page', () => {
    expect(config.webDir).toBe('mobile-web');
    expect(config.server?.errorPath).toBe('offline.html');
  });
});