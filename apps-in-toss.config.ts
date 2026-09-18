import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'asadal',
  brand: {
    primaryColor: '#0E3731',
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: 'dark',
  },
  webView: {
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',
});