import type { CapacitorConfig } from '@capacitor/cli';

// Hosted SSR and account services are required; this app is not a static SPA.
const config: CapacitorConfig = {
  appId: 'app.saccommunity.mobile',
  appName: 'SAC Community',
  webDir: 'mobile-web',
  server: {
    url: 'https://flow-post-sparkle.lovable.app',
    cleartext: false,
    errorPath: 'offline.html',
  },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' },
};

export default config;