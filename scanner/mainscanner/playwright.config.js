export default {
  testDir: './',
  testMatch: 'mobile-optimization-test.js',
  timeout: 30000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-tests',
      testMatch: 'mobile-optimization-test.js',
    },
  ],
};