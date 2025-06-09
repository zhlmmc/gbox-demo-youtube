import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { OpenAI as OpenAISDK } from 'openai';

// Initialize OpenAI client for computer use
const openaiSDK = new OpenAISDK({
  apiKey: process.env.OPENAI_API_KEY,
});

export const computerUsePredictTool = createTool({
  id: 'computer-use-predict',
  description: 'Use OpenAI computer-use-preview model to predict the next action based on a screenshot',
  inputSchema: z.object({
    instruction: z.string().describe('The task instruction for the AI'),
    screenshot: z.string().describe('Base64 screenshot or image URL'),
    displayWidth: z.number().default(720).describe('Display width in pixels'),
    displayHeight: z.number().default(1520).describe('Display height in pixels'),
    previousResponseId: z.string().optional().describe('Previous response ID for continuation'),
    callId: z.string().optional().describe('Call ID for computer call output'),
    isInitialRequest: z.boolean().default(true).describe('Whether this is the initial request or a continuation')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    response: z.any().describe('The full OpenAI response'),
    computerCalls: z.array(z.object({
      type: z.literal('computer_call'),
      call_id: z.string(),
      action: z.object({
        type: z.enum(['click', 'scroll', 'keypress', 'type', 'wait', 'screenshot', 'drag']),
        x: z.number().optional(),
        y: z.number().optional(),
        scroll_x: z.number().optional(),
        scroll_y: z.number().optional(),
        button: z.string().optional(),
        keys: z.array(z.string()).optional(),
        text: z.string().optional(),
        ms: z.number().optional(),
        path: z.array(z.object({
          x: z.number(),
          y: z.number()
        })).optional()
      })
    })).describe('Extracted computer calls from the response'),
    messages: z.array(z.string()).describe('Text messages from the AI response'),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { 
      instruction, 
      screenshot, 
      displayWidth, 
      displayHeight, 
      previousResponseId, 
      callId, 
      isInitialRequest 
    } = context;

    try {
      let response;

      if (isInitialRequest) {
        // Initial request
        response = await openaiSDK.responses.create({
          model: 'computer-use-preview',
          tools: [{
            type: 'computer_use_preview' as any,
            display_width: displayWidth,
            display_height: displayHeight,
            environment: 'browser' as any
          }],
          input: [{
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `You are controlling an Android device through a browser interface. Please complete this task: "${instruction}". 
                
                You can see the current screen in the image. Analyze what you see and determine the next action needed to complete the task.
                
                Available actions:
                - click(x, y) - Click at coordinates
                - type(text) - Type text
                - scroll(x, y, scroll_x, scroll_y) - Scroll from point
                - keypress(keys) - Press keys like "back", "home", "enter"
                - wait(ms) - Wait for specified time
                
                Take your time to analyze the screen and plan your actions carefully.`
              },
              {
                type: 'input_image',
                image_url: `${screenshot}`,
                detail: 'high' as any
              }
            ]
          }],
          truncation: 'auto'
        });
      } else {
        // Continuation request
        if (!previousResponseId || !callId) {
          throw new Error('previousResponseId and callId are required for continuation requests');
        }

        response = await openaiSDK.responses.create({
          model: 'computer-use-preview',
          previous_response_id: previousResponseId,
          tools: [{
            type: 'computer_use_preview' as any,
            display_width: displayWidth,
            display_height: displayHeight,
            environment: 'browser' as any
          }],
          input: [{
            call_id: callId,
            type: 'computer_call_output',
            output: {
              type: 'computer_screenshot' as any,
              image_url: `${screenshot}`
            }
          }],
          truncation: 'auto'
        });
      }

      // Extract computer calls from the response
      const computerCalls = response.output.filter((item: any) => item.type === 'computer_call') as any[];
      
      // Extract messages from the response
      const messages = response.output
        .filter((item: any) => item.type === 'message')
        .map((msg: any) => 
          msg.content?.map((c: any) => c.text).join(' ')
        )
        .filter(Boolean) as string[];

      return {
        success: true,
        response: response,
        computerCalls: computerCalls as any,
        messages: messages
      };

    } catch (error) {
      console.error('Computer use predict error:', error);
      return {
        success: false,
        response: null,
        computerCalls: [],
        messages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}); 