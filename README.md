# GBox Android Automation with Mastra

This project demonstrates how to use Mastra with the gbox SDK to automate Android devices. It includes both traditional programmatic automation and **advanced AI-powered visual automation** using OpenAI's computer use model.

## Features

### Traditional Android Automation
The GBox Android tool provides the following capabilities:

- **Create Android Sandbox**: Initialize a cloud-based Android device
- **Click Operations**: Click on specific screen coordinates  
- **Text Input**: Type text into the Android device
- **Key Presses**: Press device keys (enter, delete, back, home, space, arrow keys, menu)
- **Screenshot Capture**: Take screenshots with optional clipping and format options
- **Timing Controls**: Add delays between operations
- **Instance Management**: List and manage active Android instances

### 🚀 NEW: AI-Powered Computer Use Agent
The project now includes an advanced **GBox Computer Use Agent** that combines OpenAI's computer use model with GBox Android automation:

- **Visual Understanding**: Analyzes Android screenshots using AI
- **Natural Language Instructions**: Takes high-level commands like "Open YouTube, search for 'gru ai', click first video"
- **Smart Action Planning**: Plans multi-step workflows based on visual analysis
- **Adaptive Behavior**: Responds to UI changes and app flows dynamically
- **Complex Task Automation**: Handles sophisticated multi-app workflows

[📖 **Read the Computer Use Documentation**](./README-computer-use.md)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Get your gbox API key from [gbox.run](https://gbox.run)

3. **For Computer Use Agent**: Set up additional environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
export GBOX_API_KEY="your-gbox-api-key"
```

**Note**: The Computer Use Agent requires:
- OpenAI API key with `computer-use-preview` model access (Tier 3-5 required)
- GBox API key for Android sandbox access

## Usage

### Using the Computer Use Agent (Recommended)

The project includes an advanced AI agent that can handle complex visual automation tasks:

```typescript
import { gboxAgent } from './src/mastra/agents';

const result = await gboxAgent.generate([
  {
    role: 'user',
    content: "Open YouTube app, search for 'gru ai' and click the first video"
  }
]);
```

### Using the Traditional Agent

For programmatic automation, use the traditional agent:

```typescript
import { mastra } from './src/mastra/index.js';

const gboxAgent = mastra.getAgent('gboxAgent');

const response = await gboxAgent.generate(`
  Please create an Android sandbox and then:
  1. Click on coordinates (100, 200)
  2. Type "hello world"  
  3. Press the enter key
`);
```

### Direct Tool Usage

You can also use the tool directly:

```typescript
import { gboxAndroidTool } from './src/mastra/tools/gboxAndroid';

// Create Android instance
const createResult = await gboxAndroidTool.execute({
  context: {
    action: 'create'
  }
});

const instanceId = createResult.instanceId;

// Click on screen
await gboxAndroidTool.execute({
  context: {
    action: 'click',
    instanceId,
    x: 230,
    y: 1201
  }
});

// Type text
await gboxAndroidTool.execute({
  context: {
    action: 'type',
    instanceId,
    text: 'Hello Android!'
  }
});

// Press keys
await gboxAndroidTool.execute({
  context: {
    action: 'press',
    instanceId,
    keys: ['enter']
  }
});

// Take screenshot
await gboxAndroidTool.execute({
  context: {
    action: 'screenshot',
    instanceId,
    outputFormat: 'base64'
  }
});
```

## Available Actions

### create
Creates a new Android sandbox instance.
- `apiKey` (required): Your gbox API key

### click  
Clicks at specific screen coordinates.
- `instanceId` (required): The Android instance ID
- `x` (required): X coordinate
- `y` (required): Y coordinate

### type
Types text into the device.
- `instanceId` (required): The Android instance ID  
- `text` (required): Text to type

### press
Presses device keys.
- `instanceId` (required): The Android instance ID
- `keys` (required): Array of keys to press
  - Supported keys: `enter`, `delete`, `back`, `home`, `space`, `up`, `down`, `left`, `right`, `menu`

### screenshot
Takes a screenshot of the device screen.
- `instanceId` (required): The Android instance ID
- `outputFormat` (optional): Output format - 'base64' or 'storageKey' (default: 'base64')
- `clip` (optional): Clip area for partial screenshots
  - `x` (required): X coordinate of the clip
  - `y` (required): Y coordinate of the clip
  - `width` (required): Width of the clip
  - `height` (required): Height of the clip

### wait
Adds a delay.
- `waitTime` (optional): Wait time in milliseconds (default: 2000)

### listInstances  
Lists all active Android instances.

## Example Automation

See `example.ts` for a complete automation example that:
1. Creates an Android sandbox
2. Opens a messaging app
3. Navigates through the interface
4. Performs a search operation

## Running the Examples

### Computer Use Agent Examples
```bash
# Run the computer use agent examples
npx tsx example-computer-use.ts
```

### Traditional Automation Example
```bash
# Run the traditional automation example
node example.ts

# Or run with the Mastra dev server
pnpm run dev
```

## Development

```bash
# Start development server
pnpm run dev

# Build the project  
pnpm run build

# Start production server
pnpm run start
```

## API Key

Make sure to replace `"gbox-api-key"` with your actual gbox API key from [gbox.run](https://gbox.run).

## Notes

- Android instances have a default lifecycle of 5 minutes and are automatically released
- Only English text input is supported
- Screen coordinates are device-specific and may need adjustment
- The tool maintains a registry of active instances for easier management 