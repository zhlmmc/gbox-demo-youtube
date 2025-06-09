# GBox Computer Use Agent

This project now includes an advanced AI agent that combines **OpenAI's Computer Use Model** with **GBox Android SDK** to create a powerful visual automation system for Android devices.

## Overview

The GBox Computer Use Agent can take high-level instructions like *"Open YouTube app, search for 'gru ai' and click the first video"* and execute them by:

1. **Visual Analysis**: Uses OpenAI's computer-use-preview model to analyze Android screenshots
2. **Action Planning**: Plans multi-step interactions based on visual understanding  
3. **Precise Execution**: Translates visual actions into GBox SDK commands
4. **Adaptive Behavior**: Responds to UI changes and app flows dynamically

## Architecture

```
User Instruction
       ↓
GBox Computer Use Agent (Mastra)
       ↓
OpenAI Computer Use Model → Visual Analysis & Action Planning
       ↓
GBox Screenshot Tool → Take screenshots
       ↓  
GBox Android Tool → Execute actions (click, type, swipe, etc.)
       ↓
Android Device (GBox Sandbox)
```

## Key Components

### 1. GBox Computer Use Agent (`src/mastra/agents/gboxAndroidAgent.ts`)
- Main orchestrator that coordinates the entire process
- Handles conversation flow and task completion
- Provides user-friendly interface for complex automation

### 2. GBox Computer Use Tool
- Bridge between OpenAI computer use model and GBox SDK
- Manages the action loop: screenshot → analyze → act → repeat
- Translates OpenAI actions to GBox operations

### 3. GBox Screenshot Tool (integrated in `src/mastra/tools/gboxAndroid.ts`)
- Captures Android device screenshots for visual analysis
- Converts images to base64 format for OpenAI API
- Handles different screenshot formats and error cases

### 4. Enhanced GBox Android Tool (`src/mastra/tools/gboxAndroid.ts`)
- Extended to support computer use action mapping
- Handles click, type, swipe, press, and other Android interactions
- Manages Android sandbox instances

## Prerequisites

### 1. OpenAI API Access
You need:
- OpenAI API key with computer-use-preview model access
- Tier 3-5 account (required for computer use features)
- Set `OPENAI_API_KEY` environment variable

### 2. GBox SDK Access  
You need:
- GBox API key for Android sandbox access
- Set `GBOX_API_KEY` environment variable

### 3. Environment Setup
```bash
# Install dependencies
pnpm install

# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
export GBOX_API_KEY="your-gbox-api-key"
```

## Usage Examples

### Basic Usage

```typescript
import { gboxAgent } from './src/mastra/agents';

const result = await gboxAgent.generate([
  {
    role: 'user',
    content: "Open YouTube app, search for 'gru ai' and click the first video"
  }
]);
```

### Advanced Usage with Custom Parameters

```typescript
// Use the computer use tool directly for more control
const result = await gboxAgent.generate([
  {
    role: 'user', 
    content: `Use the gbox computer use tool with these parameters:
    - instruction: "Navigate to Android settings and enable developer options"
    - maxIterations: 15
    - displayWidth: 1080
    - displayHeight: 1920`
  }
]);
```

## Supported Actions

The agent can perform any action that OpenAI's computer use model supports:

- **Click**: Tap specific coordinates on screen
- **Type**: Enter text in input fields  
- **Scroll**: Scroll up/down or left/right
- **Swipe**: Swipe gestures for navigation
- **Press Keys**: Hardware keys (back, home, menu, etc.)
- **Wait**: Pause execution for app loading
- **Visual Analysis**: Understand UI elements and layout

## Example Tasks

### YouTube Automation
```typescript
"Open YouTube app, search for 'gru ai', click the first video, and like it"
```

### Browser Navigation  
```typescript
"Open Chrome browser, go to google.com, search for 'OpenAI computer use', and click the first result"
```

### Settings Configuration
```typescript
"Go to Android Settings, navigate to Wi-Fi settings, and show available networks"
```

### App Installation
```typescript
"Open Google Play Store, search for 'Twitter', and install the app"
```

## How It Works

### 1. Visual Understanding
- Takes screenshot of current Android screen
- OpenAI computer-use-preview model analyzes the image
- Identifies UI elements, buttons, text fields, etc.

### 2. Action Planning  
- Model determines next action needed to complete task
- Plans multi-step workflows (e.g., tap search → type query → tap result)
- Adapts to different app interfaces and layouts

### 3. Execution Loop
```
Screenshot → Visual Analysis → Plan Action → Execute → Screenshot → ...
```

### 4. Error Handling
- Retries on failed actions
- Adapts to unexpected UI changes  
- Provides detailed error messages and debugging info

## Configuration

### Display Settings
```typescript
{
  displayWidth: 1080,    // Android screen width
  displayHeight: 1920,   // Android screen height  
  maxIterations: 10      // Max action steps before timeout
}
```

### Model Settings
- Uses `computer-use-preview` model for visual analysis
- Android environment optimized for mobile interfaces
- Automatic screenshot management between actions

## Error Handling

Common issues and solutions:

### Authentication Errors
```
Error: OpenAI API authentication failed
```
**Solution**: Check OPENAI_API_KEY and computer-use-preview model access

### GBox Connection Issues
```  
Error: Failed to create Android instance
```
**Solution**: Verify GBOX_API_KEY and network connectivity

### Screenshot Failures
```
Error: Screenshot method not available  
```
**Solution**: Ensure Android instance is running and accessible

## Limitations

1. **Model Access**: Requires OpenAI Tier 3-5 for computer-use-preview
2. **GBox Dependency**: Needs active GBox subscription for Android sandboxes
3. **Action Complexity**: Very complex multi-app workflows may need breaking down
4. **Screenshot Quality**: Relies on clear, readable Android interface screenshots

## Advanced Usage

### Custom Action Mapping
Extend the `executeGboxAction` function to support additional action types:

```typescript
case 'custom_action':
  await gboxAndroidTool.execute({
    context: {
      action: 'custom',
      instanceId,
      customParam: action.customParam
    }
  });
  break;
```

### Integration with Other Tools
Combine with other Mastra tools for enhanced workflows:

```typescript
export const enhancedAgent = new Agent({
  tools: {
    gboxAndroid: gboxAndroidTool,
    computerUsePredict: computerUsePredictTool,
    // ... other tools
  }
});
```

## Running Examples

```bash
# Run the example demonstrations
npx tsx example-computer-use.ts
```

This will run several example tasks showing different capabilities of the computer use agent.

## Troubleshooting

### Debug Mode
Enable verbose logging:
```typescript
console.log('Debugging computer use agent...');
// The agent logs each step automatically
```

### Manual Testing
Test individual components:
```typescript
// Test screenshot functionality  
const screenshot = await gboxAndroidTool.execute({
  context: { action: 'screenshot', instanceId: 'your-instance-id' }
});

// Test basic gbox operations  
const clickResult = await gboxAndroidTool.execute({
  context: { action: 'click', instanceId: 'your-instance-id', x: 500, y: 800 }
});
```

## Contributing

When extending this system:

1. **Action Mapping**: Add new action types in `executeGboxAction()`
2. **Error Handling**: Enhance error recovery for specific app scenarios  
3. **Screenshots**: Improve screenshot quality and timing
4. **Model Integration**: Experiment with different OpenAI model parameters

## Future Enhancements

- Support for other mobile platforms (iOS via different simulators)
- Integration with computer vision models for enhanced UI understanding
- Workflow recording and playback capabilities
- Integration with testing frameworks for automated app testing

This system represents a significant advancement in mobile automation, combining the visual understanding of AI with precise device control. 