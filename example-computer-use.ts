import { gboxAgent } from './src/mastra/agents';

async function main() {
  try {
    console.log('🚀 Starting GBox Computer Use Agent Demo');
    console.log('=====================================');

    // Example 1: Simple YouTube task
    console.log('\n📱 Example 1: Opening YouTube and searching for a video');
    const result1 = await gboxAgent.generate([
      {
        role: 'user',
        content: "Please use the gbox computer use tool to open the YouTube app, search for 'gru ai', and click on the first video. Take your time to analyze each screen and perform the actions step by step."
      }
    ]);

    console.log('Result 1:', result1);

    // Example 2: Browser navigation
    console.log('\n🌐 Example 2: Opening browser and navigating to a website');
    const result2 = await gboxAgent.generate([
      {
        role: 'user',
        content: "Please use the gbox computer use tool to open the browser app, navigate to google.com, and search for 'OpenAI computer use'. Show me the search results."
      }
    ]);

    console.log('Result 2:', result2);

    // Example 3: Settings navigation  
    console.log('\n⚙️ Example 3: Navigating to Android settings');
    const result3 = await gboxAgent.generate([
      {
        role: 'user', 
        content: "Please use the gbox computer use tool to open the Android Settings app and navigate to the Wi-Fi settings. Take screenshots to show the navigation path."
      }
    ]);

    console.log('Result 3:', result3);

  } catch (error) {
    console.error('❌ Error running examples:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('authentication')) {
        console.log('\n💡 Make sure you have:');
        console.log('   1. Set your OPENAI_API_KEY environment variable');
        console.log('   2. Access to the computer-use-preview model (Tier 3-5 required)');
        console.log('   3. Set your GBOX_API_KEY environment variable');
      }
    }
  }
}

// Run the examples
console.log('🎯 GBox Computer Use Agent Examples');
console.log('===================================');
console.log('This demonstrates how to use OpenAI computer use model with GBox Android automation');
console.log('');
console.log('Prerequisites:');
console.log('- OPENAI_API_KEY with computer-use-preview model access');
console.log('- GBOX_API_KEY for Android sandbox access');
console.log('');

main().catch(console.error); 