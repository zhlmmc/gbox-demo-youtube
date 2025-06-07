import { mastra } from './src/mastra/index.js';

async function main() {
  try {
    const gboxAgent = mastra.getAgent('gboxAgent');
    
    // Example conversation with the agent
    const response = await gboxAgent.generate(`
      I want you to help me automate an Android device.
      
      First, create an Android sandbox instance, then:
      1. Wait for 2 seconds
      2. Click on coordinates (230, 1201) to open message app
      3. Wait for 2 seconds  
      4. Click on coordinates (364, 1464) to click Start Chat button
      5. Wait for 3 seconds
      6. Click on coordinates (554, 1418) to click Without login
      7. Wait for 2 seconds
      8. Press the back key twice
      9. Press the home key
      10. Click on coordinates (346, 1379) to open search
      11. Type "gru%sai" in the search bar
      12. Press enter
      
      Please execute this automation step by step and let me know the results.
    `);

    console.log('Agent Response:', response.text);
    console.log('\nTool Results:');
    response.toolResults?.forEach((result: any, index: number) => {
      console.log(`${index + 1}. Tool: ${result.toolName}`);
      console.log(`   Result:`, result.result);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 