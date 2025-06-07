import { Mastra } from '@mastra/core';
import { gboxAgent } from './agents';

export const mastra = new Mastra({
  agents: { gboxAgent },
});
        