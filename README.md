# GBox Android Automation with Mastra

This project demonstrates how to use Mastra with the gbox SDK to automate Android devices.

## Features

The GBox Android tool provides the following capabilities:

- **Create Android Sandbox**: Initialize a cloud-based Android device
- **Click Operations**: Click on specific screen coordinates  
- **Text Input**: Type text into the Android device
- **Key Presses**: Press device keys (enter, delete, back, home, space, arrow keys, menu)
- **Swipe Gestures**: Perform swipe operations across the screen
- **Screen Info**: Get device screen dimensions
- **Timing Controls**: Add delays between operations
- **Instance Management**: List and manage active Android instances

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Get your gbox API key from [gbox.run](https://gbox.run)

## Usage

### Using the Agent

The project includes a pre-configured agent that can handle natural language instructions for Android automation:

```typescript
import { mastra } from './src/mastra/index.js';

const gboxAgent = mastra.getAgent('gboxAgent');

const response = await gboxAgent.generate(`
  Please create an Android sandbox with API key "your-api-key-here" and then:
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
  action: 'create',
  apiKey: 'your-gbox-api-key'
});

const instanceId = createResult.instanceId;

// Click on screen
await gboxAndroidTool.execute({
  action: 'click',
  instanceId,
  x: 230,
  y: 1201
});

// Type text
await gboxAndroidTool.execute({
  action: 'type',
  instanceId,
  text: 'Hello Android!'
});

// Press keys
await gboxAndroidTool.execute({
  action: 'press',
  instanceId,
  keys: ['enter']
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

### swipe
Performs swipe gestures.
- `instanceId` (required): The Android instance ID
- `startX` (required): Starting X coordinate
- `startY` (required): Starting Y coordinate  
- `endX` (required): Ending X coordinate
- `endY` (required): Ending Y coordinate
- `duration` (optional): Swipe duration in milliseconds (default: 1000)

### getScreenSize
Gets the device screen dimensions.
- `instanceId` (required): The Android instance ID

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

## Running the Example

```bash
# Run the example
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

Make sure to replace `"gbox-yrt59uQslL8XUTJ679uzaAOd9L1EUIxiRlFVFWHLvxwPwnadjz"` with your actual gbox API key from [gbox.run](https://gbox.run).

## Notes

- Android instances have a default lifecycle of 5 minutes and are automatically released
- Only English text input is supported
- Screen coordinates are device-specific and may need adjustment
- The tool maintains a registry of active instances for easier management 