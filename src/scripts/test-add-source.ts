import { addContentSource } from "../db/query";

async function testAddSource() {
  console.log("🧪 Testing add content source functionality...\n");

  const testSource = {
    name: "Test Tech Blog",
    url: "https://example.com/feed",
    description: "A test technology blog for testing purposes",
    type: 'rss' as const
  };

  try {
    console.log("Adding test source:", testSource);
    
    const result = await addContentSource(testSource);
    
    if (result.success) {
      console.log("✅ Successfully added content source!");
      console.log("Source data:", result.data);
    } else {
      console.error("❌ Failed to add content source:", result.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAddSource().catch(console.error); 