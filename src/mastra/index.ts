import { Mastra } from '@mastra/core';
import { LogLevel, PinoLogger } from '@mastra/loggers';
import { gboxAgent } from './agents';
import { gboxComputerUseWorkflow } from './workflows';
import { AISDKExporter } from "langsmith/vercel";

export const mastra = new Mastra({
  agents: { gboxAgent },
  workflows: { gboxComputerUseWorkflow },
  logger: new PinoLogger({
    name: "Mastra-GBox",
    level: process.env.LOG_LEVEL as LogLevel || "info",
  }),
  telemetry: {
    serviceName: "gbox-demo-youtube",
    enabled: true,
    export: {
      type: "custom",
      exporter: new AISDKExporter(),
    },
  },
});
        