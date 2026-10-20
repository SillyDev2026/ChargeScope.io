import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html',{open:'never'}]] : 'list',
  timeout: 30000,
  use: {baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  projects: [
    {name:'Desktop Chromium',use:{...devices['Desktop Chrome'],viewport:{width:1366,height:768}}},
    {name:'Android Chrome',use:{...devices['Pixel 7']}},
    {name:'Mobile Safari',use:{...devices['iPhone 13']}},
    {name:'Tablet Safari',use:{...devices['iPad (gen 7)']}}
  ],
  webServer: {
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/',
    reuseExistingServer:!process.env.CI,
    timeout:30000
  }
});
