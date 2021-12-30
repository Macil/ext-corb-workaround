import type { Config } from '@jest/types';

const config: Partial<Config.ProjectConfig> = {
  testEnvironment: 'jsdom',
};

export default config;
