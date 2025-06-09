import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { gboxAndroidTool } from '../tools/gboxAndroid';
import { gboxComputerUseWorkflow } from '../workflows/gboxComputerUseWorkflow';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db", // Or your database URL
  }),
});

export const gboxAgent = new Agent({
  memory: memory,
  name: 'GBox Android Agent',
  instructions: `You are a helpful assistant that can operate Android devices using the gbox SDK. 
  
  You can:
  - Create Android sandbox instances
  - Click on screen coordinates
  - Type text into the device
  - Press keys (enter, delete, back, home, space, up, down, left, right, menu)
  - Swipe across the screen
  - Get screen dimensions
  - Wait for specified durations
  - List active instances

  If instanceId is not provided, create a new instance.
  Be helpful and guide users through Android automation tasks step by step.`,
  model: openai('gpt-4o'),
  tools: {
    gboxAndroid: gboxAndroidTool
  },
  workflows: {
    gboxComputerUseWorkflow,
  },
});