import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Import gbox-sdk (CommonJS module)
const Gbox = require('gbox-sdk');

// Types for gbox operations
interface GboxInstance {
  id: string;
  action: {
    click: (params: { x: number; y: number }) => Promise<void>;
    type: (params: { text: string }) => Promise<void>;
    press: (params: { keys: string[] }) => Promise<void>;
    swipe: (params: { startX: number; startY: number; endX: number; endY: number; duration?: number }) => Promise<void>;
    getDeviceScreenSize?: () => Promise<{ width: number; height: number }>;
  };
}

interface GboxClient {
  create: (params: { type: 'android' }) => Promise<GboxInstance>;
}

// Store active gbox instances
const activeInstances = new Map<string, GboxInstance>();

export const gboxAndroidTool = createTool({
  id: 'gbox-android',
  description: 'Tool for operating Android devices using gbox SDK. Can create sandboxes, click, type, press keys, and perform various Android operations.',
  inputSchema: z.object({
    action: z.enum([
      'create',
      'click', 
      'type',
      'press',
      'swipe',
      'getScreenSize',
      'wait',
      'listInstances'
    ]),
    instanceId: z.string().optional().describe('Instance ID for operations (auto-assigned after create)'),
    x: z.number().optional().describe('X coordinate for click/swipe actions'),
    y: z.number().optional().describe('Y coordinate for click/swipe actions'),
    text: z.string().optional().describe('Text to type'),
    keys: z.array(z.string()).optional().describe('Keys to press (enter, delete, back, home, space, up, down, left, right, menu)'),
    startX: z.number().optional().describe('Start X coordinate for swipe'),
    startY: z.number().optional().describe('Start Y coordinate for swipe'),
    endX: z.number().optional().describe('End X coordinate for swipe'),
    endY: z.number().optional().describe('End Y coordinate for swipe'),
    duration: z.number().optional().describe('Duration for swipe in milliseconds'),
    waitTime: z.number().optional().describe('Wait time in milliseconds')
  }),
  execute: async ({ context }) => {
    const { action, instanceId, x, y, text, keys, startX, startY, endX, endY, duration, waitTime } = context;
    try {
      switch (action) {
        case 'create':
          const gbox: GboxClient = new Gbox({ apiKey: process.env.GBOX_API_KEY });
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
          
          await typeInstance.action.type({ text });
          return {
            success: true,
            message: `Typed text: "${text}"`
          };

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
          
          await pressInstance.action.press({ keys });
          return {
            success: true,
            message: `Pressed keys: ${keys.join(', ')}`
          };

        case 'swipe':
          if (!instanceId) {
            throw new Error('Instance ID is required for swipe action');
          }
          if (startX === undefined || startY === undefined || endX === undefined || endY === undefined) {
            throw new Error('Start and end coordinates are required for swipe action');
          }
          
          const swipeInstance = activeInstances.get(instanceId);
          if (!swipeInstance) {
            throw new Error(`No active instance found with ID: ${instanceId}`);
          }
          
          await swipeInstance.action.swipe({ 
            startX, 
            startY, 
            endX, 
            endY, 
            duration: duration || 1000 
          });
          return {
            success: true,
            message: `Swiped from (${startX}, ${startY}) to (${endX}, ${endY})`
          };

        case 'getScreenSize':
          if (!instanceId) {
            throw new Error('Instance ID is required for getScreenSize action');
          }
          
          const screenInstance = activeInstances.get(instanceId);
          if (!screenInstance) {
            throw new Error(`No active instance found with ID: ${instanceId}`);
          }
          
          if (screenInstance.action.getDeviceScreenSize) {
            const screenSize = await screenInstance.action.getDeviceScreenSize();
            return {
              success: true,
              screenSize,
              message: `Screen size: ${screenSize.width}x${screenSize.height}`
            };
          } else {
            return {
              success: false,
              message: 'getDeviceScreenSize method not available in this SDK version'
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