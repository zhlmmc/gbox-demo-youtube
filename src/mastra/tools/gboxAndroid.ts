import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import GboxSDK from 'gbox-sdk';
import { AndroidBoxOperator } from 'gbox-sdk/wrapper/box/android.mjs';
import { activeInstances } from './shared/gboxInstances';

export const gboxAndroidTool = createTool({
  id: 'gbox-android',
  description: 'Tool for operating Android devices using gbox SDK. Can create sandboxes, click, type, press keys, and perform various Android operations.',
  inputSchema: z.object({
    action: z.enum([
      'create',
      'click', 
      'type',
      'press',
      'screenshot',
      'wait',
      'listInstances'
    ]),
    instanceId: z.string().optional().describe('Instance ID for operations (auto-assigned after create)'),
    x: z.number().optional().describe('X coordinate for click actions'),
    y: z.number().optional().describe('Y coordinate for click actions'),
    text: z.string().optional().describe('Text to type'),
    keys: z.array(z.string()).optional().describe('Keys to press (enter, delete, back, home, space, up, down, left, right, menu)'),
    waitTime: z.number().optional().describe('Wait time in milliseconds'),
    // Screenshot specific parameters
    clip: z.object({
      x: z.number().describe('X coordinate of the clip'),
      y: z.number().describe('Y coordinate of the clip'),
      width: z.number().describe('Width of the clip'),
      height: z.number().describe('Height of the clip')
    }).optional().describe('Clip area for screenshot'),
    outputFormat: z.enum(['base64', 'storageKey']).optional().describe('Output format for screenshot')
  }),
  execute: async ({ context }) => {
    const { action, instanceId, x, y, text, keys, waitTime, clip, outputFormat } = context;
    if(instanceId){
      const instance = activeInstances.get(instanceId);
      if(!instance){
        console.log("No active instance found with ID: ", instanceId);
        console.log("Retrieve instance from remote: ", instanceId);
        const gbox = new GboxSDK({ apiKey: process.env.GBOX_API_KEY });
        const androidBox = await gbox.get(instanceId) as AndroidBoxOperator;
        activeInstances.set(androidBox.id, androidBox);
      }
    }
    
    try {
      switch (action) {
        case 'create':
          const gbox = new GboxSDK({ apiKey: process.env.GBOX_API_KEY });
          console.log("Initializing android sandbox...");
          
          const androidBox = await gbox.create({ type: 'android' });
          activeInstances.set(androidBox.id, androidBox);
          
          console.log("gbox id: ", androidBox.id);
          return {
            success: true,
            instanceId: androidBox.id,
            message: `Android sandbox created successfully with ID: ${androidBox.id}`
          };

        case 'click':
          if (!instanceId) {
            throw new Error('Instance ID is required for click action');
          }
          if (x === undefined || y === undefined) {
            throw new Error('X and Y coordinates are required for click action');
          }
          
          const clickInstance = activeInstances.get(instanceId);
          if (!clickInstance) {
            throw new Error(`No active instance found with ID: ${instanceId}`);
          }
          
          await clickInstance.action.click({ x, y });
          return {
            success: true,
            message: `Clicked at coordinates (${x}, ${y})`
          };

        case 'type':
          if (!instanceId) {
            throw new Error('Instance ID is required for type action');
          }
          if (!text) {
            throw new Error('Text is required for type action');
          }
          
          const typeInstance = activeInstances.get(instanceId);
          if (!typeInstance) {
            throw new Error(`No active instance found with ID: ${instanceId}`);
          }
          
          // Type method might not be available in current SDK version
          if (typeof typeInstance.action.type === 'function') {
            await typeInstance.action.type({ text });
            return {
              success: true,
              message: `Typed text: "${text}"`
            };
          } else {
            return {
              success: false,
              message: 'Type method not available in this SDK version'
            };
          }

        case 'press':
          if (!instanceId) {
            throw new Error('Instance ID is required for press action');
          }
          if (!keys || keys.length === 0) {
            throw new Error('Keys array is required for press action');
          }
          
          const pressInstance = activeInstances.get(instanceId);
          if (!pressInstance) {
            throw new Error(`No active instance found with ID: ${instanceId}`);
          }
          
          // Press method might not be available in current SDK version
          if (typeof pressInstance.action.press === 'function') {
            await pressInstance.action.press({ keys });
            return {
              success: true,
              message: `Pressed keys: ${keys.join(', ')}`
            };
          } else {
            return {
              success: false,
              message: 'Press method not available in this SDK version'
            };
          }

        case 'screenshot':
          if (!instanceId) {
            throw new Error('Instance ID is required for screenshot action');
          }
          
          const screenshotInstance = activeInstances.get(instanceId);
          if (!screenshotInstance) {
            throw new Error(`No active instance found with ID: ${instanceId}`);
          }
          
          // Build screenshot parameters
          const screenshotParams: any = {};
          if (clip) {
            screenshotParams.clip = clip;
          }
          if (outputFormat) {
            screenshotParams.outputFormat = outputFormat;
          }
          
          // Take screenshot using gbox SDK
          if (typeof (screenshotInstance.action as any).screenshot === 'function') {
            const result = await (screenshotInstance.action as any).screenshot(screenshotParams);
            return {
              success: true,
              screenshot: result,
              message: 'Screenshot taken successfully'
            };
          } else {
            return {
              success: false,
              message: 'Screenshot method not available in this SDK version'
            };
          }

        case 'wait':
          const time = waitTime || 2000;
          await new Promise(resolve => setTimeout(resolve, time));
          return {
            success: true,
            message: `Waited for ${time}ms`
          };

        case 'listInstances':
          const instances = Array.from(activeInstances.keys());
          return {
            success: true,
            instances,
            message: `Active instances: ${instances.length > 0 ? instances.join(', ') : 'None'}`
          };

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('Gbox Android Tool Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },
}); 