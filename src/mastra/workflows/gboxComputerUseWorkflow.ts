import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { gboxAndroidTool } from '../tools/gboxAndroid';
import { computerUsePredictTool } from '../tools/computerUsePredict';



// Define types for computer use responses
interface ComputerCallAction {
  type: 'click' | 'scroll' | 'keypress' | 'type' | 'wait' | 'screenshot' | 'drag';
  x?: number;
  y?: number;
  scroll_x?: number;
  scroll_y?: number;
  button?: string;
  keys?: string[];
  text?: string;
  ms?: number;
  path?: Array<{ x: number; y: number }>;
}

interface ComputerCall {
  type: 'computer_call';
  call_id: string;
  action: ComputerCallAction;
}

// Helper function to translate OpenAI computer use actions to gbox actions
async function executeGboxAction(instanceId: string, action: ComputerCallAction, runtimeContext: any) {
  if (!gboxAndroidTool.execute) {
    console.error('gboxAndroidTool.execute is not available');
    return;
  }

  switch (action.type) {
    case 'click':
      if (action.x !== undefined && action.y !== undefined) {
        await gboxAndroidTool.execute({
          context: {
            action: 'click',
            instanceId,
            x: action.x,
            y: action.y
          },
          runtimeContext
        });
      }
      break;
      
    case 'type':
      if (action.text) {
        await gboxAndroidTool.execute({
          context: {
            action: 'type',
            instanceId,
            text: action.text
          },
          runtimeContext
        });
      }
      break;
      
    case 'scroll':
      // Convert scroll to swipe-like action
      console.warn('Scroll action detected - this may need custom implementation');
      break;
      
    case 'keypress':
      if (action.keys && action.keys.length > 0) {
        await gboxAndroidTool.execute({
          context: {
            action: 'press',
            instanceId,
            keys: action.keys
          },
          runtimeContext
        });
      }
      break;
      
    case 'wait':
      await gboxAndroidTool.execute({
        context: {
          action: 'wait',
          instanceId,
          waitTime: action.ms || 1000
        },
        runtimeContext
      });
      break;
      
    case 'drag':
      // Handle drag action if path is provided
      if (action.path && action.path.length >= 2) {
        const start = action.path[0];
        const end = action.path[1];
        console.log(`Drag action from (${start.x}, ${start.y}) to (${end.x}, ${end.y}) - not implemented yet`);
      }
      break;
      
    case 'screenshot':
      // Screenshot is handled automatically between iterations
      break;
      
    default:
      console.warn(`Unsupported action type: ${action.type}`);
  }
}

// Step 1: Setup instance step
const setupInstanceStep = createStep({
  id: 'setup-instance',
  description: 'Create or validate Android instance for computer use',
  inputSchema: z.object({
    instruction: z.string().describe('High-level instruction like "Open YouTube app, search for gru ai, and click the first video"'),
    instanceId: z.string().optional().describe('Android instance ID - will create one if not provided'),
    maxIterations: z.number().optional().default(10).describe('Maximum number of action iterations to perform')
  }),
  outputSchema: z.object({
    instanceId: z.string(),
    instruction: z.string(),
    maxIterations: z.number()
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { instruction, instanceId: providedInstanceId, maxIterations } = inputData;
    
    if (!gboxAndroidTool.execute) {
      throw new Error('gboxAndroidTool.execute is not available');
    }
    
    // Step 1: Ensure we have an active instance
    let instanceId = providedInstanceId;
    if (!instanceId) {
      console.log('Creating new Android instance...');
      const createResult = await gboxAndroidTool.execute({ 
        context: { action: 'create' },
        runtimeContext 
      }) as any;
      
      if (!createResult.success) {
        throw new Error(`Failed to create Android instance: ${createResult.error}`);
      }
      instanceId = createResult.instanceId;
      console.log(`Created instance: ${instanceId}`);
      
      // Wait for instance to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!instanceId) {
      throw new Error('Failed to get or create instance ID');
    }

    // Step 2: Take initial screenshot
    console.log('Taking initial screenshot...');
    const screenshotResult = await gboxAndroidTool.execute({ 
      context: { action: 'screenshot', instanceId, outputFormat: 'base64' },
      runtimeContext
    }) as any;
    
    if (!screenshotResult.success) {
      throw new Error(`Failed to take screenshot: ${screenshotResult.error}`);
    }

    const currentScreenshot = screenshotResult.screenshot?.uri || '';
    if (!currentScreenshot) {
      throw new Error('No screenshot data received');
    }

    // Store screenshot in runtime context for access by other steps
    if (runtimeContext && runtimeContext.set) {
      runtimeContext.set('currentScreenshot', currentScreenshot);
    }

    return {
      instanceId,
      instruction,
      maxIterations: maxIterations || 10
    };
  },
});

// Create a simple step that runs the computer use loop
const computerUseLoopStep = createStep({
  id: 'computer-use-loop',
  description: 'Run the computer use iteration loop until complete',
  inputSchema: z.object({
    instanceId: z.string(),
    instruction: z.string(),
    maxIterations: z.number()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    instanceId: z.string(),
    message: z.string(),
    iterations: z.number()
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { instanceId, instruction, maxIterations } = inputData;
    const displayWidth = 720;
    const displayHeight = 1520;
    
    // Get screenshot from runtime context or take a new one
    let currentScreenshot = runtimeContext && runtimeContext.get ? runtimeContext.get('currentScreenshot') as string : null;
    
    // If no screenshot in context, take a new one
    if (!currentScreenshot && gboxAndroidTool.execute) {
      console.log('No screenshot in context, taking new screenshot...');
      const screenshotResult = await gboxAndroidTool.execute({ 
        context: { action: 'screenshot', instanceId, outputFormat: 'base64' },
        runtimeContext
      }) as any;
      
      if (screenshotResult.success) {
        currentScreenshot = screenshotResult.screenshot?.uri || '';
      }
    }

    // If still no screenshot, throw error
    if (!currentScreenshot) {
      throw new Error('No screenshot available and unable to take new screenshot');
    }
    
    let iteration = 0;
    let responseId: string | undefined;
    
    // Initial OpenAI computer use request
    console.log('Sending initial request to OpenAI computer use model...');
    
    if (!computerUsePredictTool.execute) {
      throw new Error('computerUsePredictTool.execute is not available');
    }
    
    let predictResult = await computerUsePredictTool.execute({
      context: {
        instruction,
        screenshot: currentScreenshot as string,
        displayWidth,
        displayHeight,
        isInitialRequest: true
      },
      runtimeContext
    }) as any;
    
    if (!predictResult.success) {
      throw new Error(`Computer use prediction failed: ${predictResult.error}`);
    }
    
    let response = predictResult.response;

    // Computer use loop - continue until no more actions
    while (iteration < maxIterations) {
      console.log(`Computer use iteration ${iteration + 1}/${maxIterations}`);
      
      // Find computer calls in the response
      const computerCalls = predictResult.computerCalls as ComputerCall[];
      
      if (computerCalls.length === 0) {
        console.log('No more computer actions to execute. Task may be complete.');
        break;
      }

      const computerCall = computerCalls[0];
      const action = computerCall.action;
      
      console.log(`Executing action: ${action.type}`);
      
      // Execute the action via gbox
      await executeGboxAction(instanceId, action, runtimeContext);
      
      // Wait a moment for the action to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take new screenshot for next iteration
      const newScreenshotResult = gboxAndroidTool.execute ? await gboxAndroidTool.execute({ 
        context: { action: 'screenshot', instanceId, outputFormat: 'base64' },
        runtimeContext
      }) as any : { success: false };
     
      if (newScreenshotResult.success) {
        currentScreenshot = newScreenshotResult.screenshot?.uri || currentScreenshot;
        // Update runtime context with new screenshot
        if (runtimeContext && runtimeContext.set) {
          runtimeContext.set('currentScreenshot', currentScreenshot);
        }
      } else {
        console.warn('Failed to take new screenshot, using previous one');
      }

      // Continue the conversation with OpenAI
      predictResult = await computerUsePredictTool.execute({
        context: {
          instruction,
          screenshot: currentScreenshot as string,
          displayWidth,
          displayHeight,
          previousResponseId: response.id,
          callId: computerCall.call_id,
          isInitialRequest: false
        },
        runtimeContext
      }) as any;
      
      if (!predictResult.success) {
        console.error(`Computer use prediction failed: ${predictResult.error}`);
        break;
      }
      
      response = predictResult.response;
      
      iteration++;
    }

    // Check final response for any messages
    const finalMessage = predictResult.messages.length > 0 ? 
      predictResult.messages.join(' ') : 
      `Completed ${iteration} iterations`;

    console.log("Final message: ", finalMessage);

    // Store final screenshot in runtime context
    if (runtimeContext && runtimeContext.set) {
      runtimeContext.set('finalScreenshot', currentScreenshot);
    }

    return {
      success: true,
      instanceId,
      message: finalMessage,
      iterations: iteration
    };
  },
});

// Step 3: Evaluate workflow success
const evaluateSuccessStep = createStep({
  id: 'evaluate-success',
  description: 'Evaluate if the computer use workflow completed successfully based on the results',
  inputSchema: z.object({
    success: z.boolean(),
    instanceId: z.string(),
    message: z.string(),
    iterations: z.number()
  }),
  outputSchema: z.object({
    workflowSuccess: z.boolean(),
    instanceId: z.string(),
    completionMessage: z.string(),
    iterations: z.number(),
    reason: z.string()
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { success, instanceId, message, iterations } = inputData;
    
    // Get final screenshot from runtime context (optional - just for logging)
    const finalScreenshot = runtimeContext && runtimeContext.get ? runtimeContext.get('finalScreenshot') : null;
    if (finalScreenshot) {
      console.log('Final screenshot available in context');
    }
    
    // Analyze various factors to determine overall workflow success
    let workflowSuccess = false;
    let reason = '';
    
    if (!success) {
      workflowSuccess = false;
      reason = 'Computer use loop encountered an error';
    } else if (iterations === 0) {
      workflowSuccess = false;
      reason = 'No actions were executed - task may not have been understood';
    } else {
      // Check message content for success/failure indicators
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('complete') || 
          lowerMessage.includes('success') || 
          lowerMessage.includes('done') ||
          lowerMessage.includes('finished')) {
        workflowSuccess = true;
        reason = 'Task appears to have completed successfully based on final message';
      } else if (lowerMessage.includes('error') || 
                 lowerMessage.includes('failed') || 
                 lowerMessage.includes('unable')) {
        workflowSuccess = false;
        reason = 'Task failed based on error indicators in final message';
      } else if (iterations >= 8) {
        // If we used most of our iterations, it might indicate the task was complex but completed
        workflowSuccess = true;
        reason = `Task used ${iterations} iterations and completed without errors`;
      } else {
        // Default case - if we completed without errors, consider it successful
        workflowSuccess = true;
        reason = `Task completed ${iterations} action(s) successfully`;
      }
    }
    
    const completionMessage = workflowSuccess 
      ? `Workflow completed successfully: ${message}`
      : `Workflow failed: ${message}`;
    
    console.log(`Workflow evaluation: ${workflowSuccess ? 'SUCCESS' : 'FAILURE'} - ${reason}`);
    
    return {
      workflowSuccess,
      instanceId,
      completionMessage,
      iterations,
      reason
    };
  },
});

// Create the gbox computer use workflow
export const gboxComputerUseWorkflow = createWorkflow({
  id: 'gbox-computer-use-workflow',
  description: 'Execute computer use actions on Android devices via gbox. Translates high-level visual instructions into specific Android interactions.',
  inputSchema: z.object({
    instruction: z.string().describe('High-level instruction like "Open YouTube app, search for gru ai, and click the first video"'),
    instanceId: z.string().optional().describe('Android instance ID - will create one if not provided'),
    maxIterations: z.number().optional().default(10).describe('Maximum number of action iterations to perform')
  }),
  outputSchema: z.object({
    workflowSuccess: z.boolean(),
    instanceId: z.string(),
    completionMessage: z.string(),
    iterations: z.number(),
    reason: z.string()
  }),
  steps: [setupInstanceStep, computerUseLoopStep, evaluateSuccessStep],
})
.then(setupInstanceStep)
.then(computerUseLoopStep)
.then(evaluateSuccessStep)
.commit(); 