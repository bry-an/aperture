import { supabase } from "../lib/supabase";
import { generateEmbedding } from "../lib/openai";
import { matchTopicToSources } from "../db/query";

async function testSimilaritySearch() {
  console.log("🧪 Testing similarity search functionality...\n");

  try {
    // Test 1: Check if content sources exist
    console.log("1. Checking content sources...");
    const { data: sources, error: sourcesError } = await supabase
      .from("content_sources")
      .select("*");

    if (sourcesError) {
      console.error("❌ Error fetching content sources:", sourcesError);
      return;
    }

    console.log(`✅ Found ${sources?.length || 0} content sources`);
    
    if (sources && sources.length > 0) {
      console.log("Sample sources:");
      sources.slice(0, 3).forEach((source: any) => {
        console.log(`  - ${source.name}: ${source.description}`);
      });
    }

    // Test 2: Generate embedding for a test topic
    console.log("\n2. Testing topic embedding...");
    const testTopic = "artificial intelligence in healthcare";
    const embedding = await generateEmbedding(testTopic);
    console.log(`✅ Generated embedding for "${testTopic}"`);

    // Test 3: Test the new progressive threshold functionality
    console.log("\n3. Testing progressive threshold similarity search...");
    
    // Create a temporary topic ID for testing (this won't actually be inserted)
    const testTopicId = "00000000-0000-0000-0000-000000000000";
    
    const matchResult = await matchTopicToSources(
      testTopicId,
      embedding,
      0.7, // Start with 70% threshold
      5    // Max 5 matches
    );

    if (matchResult.success) {
      if (matchResult.data && matchResult.data.count > 0) {
        console.log(`✅ Found ${matchResult.data.count} matches with threshold ${matchResult.data.thresholdUsed}`);
        matchResult.data.matches.forEach((match: any, index: number) => {
          const source = match.content_sources;
          console.log(`  ${index + 1}. ${source.name} (similarity: ${(match.similarity * 100).toFixed(1)}%)`);
        });
      } else if (matchResult.data && matchResult.data.noMatchesFound) {
        console.log("❌ No sources matched even with the lowest threshold (0.2)");
      } else {
        console.log("ℹ️ No sources matched with any threshold");
      }
    } else {
      console.error("❌ Similarity search failed:", matchResult.error);
    }

    // Test 4: Test with different topics
    console.log("\n4. Testing with different topics...");
    const testTopics = [
      "digital health",
      "medical technology", 
      "healthcare innovation"
    ];

    for (const topic of testTopics) {
      console.log(`\nTesting topic: "${topic}"`);
      const topicEmbedding = await generateEmbedding(topic);
      
      const topicMatchResult = await matchTopicToSources(
        testTopicId,
        topicEmbedding,
        0.7, // Start with 70% threshold
        3    // Max 3 matches
      );

      if (topicMatchResult.success) {
        if (topicMatchResult.data && topicMatchResult.data.count > 0) {
          console.log(`  ✅ Found ${topicMatchResult.data.count} matches with threshold ${topicMatchResult.data.thresholdUsed}`);
          topicMatchResult.data.matches.forEach((match: any, index: number) => {
            const source = match.content_sources;
            console.log(`    ${index + 1}. ${source.name} (${(match.similarity * 100).toFixed(1)}%)`);
          });
        } else if (topicMatchResult.data && topicMatchResult.data.noMatchesFound) {
          console.log(`  ❌ No matches found for "${topic}" even with lowest threshold`);
        } else {
          console.log(`  ℹ️ No matches found for "${topic}"`);
        }
      } else {
        console.error(`  ❌ Search failed for "${topic}":`, topicMatchResult.error);
      }
    }

    console.log("\n🎉 Progressive threshold similarity search test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testSimilaritySearch().catch(console.error); 