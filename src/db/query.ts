import { supabase } from "../lib/supabase";
import { generateEmbedding } from "../lib/openai";

export interface UserData {
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
}

export interface UpsertUserResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TopicResult {
  success: boolean;
  data?: any;
  error?: string;
  isNew?: boolean;
}

/**
 * Upsert a user to the database
 * @param userData - User data from Telegram context
 * @returns Promise<UpsertUserResult>
 */
export const upsertUser = async (userData: UserData): Promise<UpsertUserResult> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: userData.telegram_id,
          username: userData.username || null,
          first_name: userData.first_name || null,
        },
        {
          onConflict: "telegram_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error upserting user:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in upsertUser:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Get user by telegram ID
 * @param telegramId - Telegram user ID
 * @returns Promise<UpsertUserResult>
 */
export const getUserByTelegramId = async (telegramId: number): Promise<UpsertUserResult> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (error) {
      console.error("Error getting user:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in getUserByTelegramId:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Add a topic for a user (upsert)
 * @param telegramId - Telegram user ID
 * @param topic - Topic to add (will be lowercased)
 * @returns Promise<TopicResult>
 */
export const addTopic = async (telegramId: number, topic: string): Promise<TopicResult> => {
  try {
    // First get the user
    const userResult = await getUserByTelegramId(telegramId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const normalizedTopic = topic.toLowerCase().trim();
    
    // Check if topic already exists
    const { data: existingTopic, error: checkError } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", userResult.data.id)
      .eq("topic", normalizedTopic)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error checking existing topic:", checkError);
      return {
        success: false,
        error: checkError.message,
      };
    }

    // If topic already exists, return success but indicate it's not new
    if (existingTopic) {
      return {
        success: true,
        data: existingTopic,
        isNew: false,
      };
    }

    // Generate embedding for the topic
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(normalizedTopic);
    } catch (embeddingError) {
      console.error("Error generating embedding for topic:", embeddingError);
      // Continue without embedding - topic will still be saved
    }

    // Add new topic with embedding
    const { data, error } = await supabase
      .from("topics")
      .insert({
        user_id: userResult.data.id,
        topic: normalizedTopic,
        embedding: embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding topic:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // If we have an embedding, try to match this topic to content sources
    if (embedding && data) {
      try {
        const matchResult = await matchTopicToSources(data.id, embedding);
        if (matchResult.success && matchResult.data) {
          if (matchResult.data.count > 0) {
            console.log(`Matched topic "${normalizedTopic}" to ${matchResult.data.count} content sources (threshold: ${(matchResult.data.thresholdUsed * 100).toFixed(0)}%)`);
          } else if (matchResult.data.noMatchesFound) {
            console.log(`No content sources matched for topic "${normalizedTopic}" even with lowest threshold`);
          } else {
            console.log(`No content sources matched for topic "${normalizedTopic}"`);
          }
        } else {
          console.error(`Error matching topic "${normalizedTopic}" to sources:`, matchResult.error);
        }
      } catch (matchError) {
        console.error(`Error in similarity search for topic "${normalizedTopic}":`, matchError);
        // Don't fail the topic creation if similarity search fails
      }
    }

    return {
      success: true,
      data,
      isNew: true,
    };
  } catch (error) {
    console.error("Unexpected error in addTopic:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Get all topics for a user
 * @param telegramId - Telegram user ID
 * @returns Promise<TopicResult>
 */
export const getUserTopics = async (telegramId: number): Promise<TopicResult> => {
  try {
    // First get the user
    const userResult = await getUserByTelegramId(telegramId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", userResult.data.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting user topics:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in getUserTopics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Remove a topic for a user
 * @param telegramId - Telegram user ID
 * @param topic - Topic to remove (will be lowercased)
 * @returns Promise<TopicResult>
 */
export const removeTopic = async (telegramId: number, topic: string): Promise<TopicResult> => {
  try {
    // First get the user
    const userResult = await getUserByTelegramId(telegramId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const normalizedTopic = topic.toLowerCase().trim();
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", userResult.data.id)
      .eq("topic", normalizedTopic)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // PGRST116 is "not found"
        return {
          success: false,
          error: "Topic not found",
        };
      }
      console.error("Error checking existing topic:", checkError);
      return {
        success: false,
        error: checkError.message,
      };
    }

    // Remove the topic
    const { error: deleteError } = await supabase
      .from("topics")
      .delete()
      .eq("user_id", userResult.data.id)
      .eq("topic", normalizedTopic);

    if (deleteError) {
      console.error("Error removing topic:", deleteError);
      return {
        success: false,
        error: deleteError.message,
      };
    }

    return {
      success: true,
      data: existingTopic,
    };
  } catch (error) {
    console.error("Unexpected error in removeTopic:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Update embeddings for topics that don't have them
 * @param telegramId - Telegram user ID (optional, if not provided updates all users)
 * @returns Promise<TopicResult>
 */
export const updateTopicEmbeddings = async (telegramId?: number): Promise<TopicResult> => {
  try {
    let query = supabase
      .from("topics")
      .select("id, topic, user_id")
      .is("embedding", null);

    // If telegramId is provided, filter by user
    if (telegramId) {
      const userResult = await getUserByTelegramId(telegramId);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: "User not found",
        };
      }
      query = query.eq("user_id", userResult.data.id);
    }

    const { data: topicsWithoutEmbeddings, error } = await query;

    if (error) {
      console.error("Error fetching topics without embeddings:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!topicsWithoutEmbeddings || topicsWithoutEmbeddings.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Generate embeddings for all topics
    const updatePromises = topicsWithoutEmbeddings.map(async (topic) => {
      try {
        const embedding = await generateEmbedding(topic.topic);
        
        const { error: updateError } = await supabase
          .from("topics")
          .update({ embedding })
          .eq("id", topic.id);

        if (updateError) {
          console.error(`Error updating embedding for topic ${topic.id}:`, updateError);
          return { success: false, topicId: topic.id, error: updateError.message };
        }

        return { success: true, topicId: topic.id };
      } catch (embeddingError) {
        console.error(`Error generating embedding for topic ${topic.id}:`, embeddingError);
        return { success: false, topicId: topic.id, error: "Failed to generate embedding" };
      }
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: true,
      data: {
        total: topicsWithoutEmbeddings.length,
        successful: successful.length,
        failed: failed.length,
        failedTopics: failed,
      },
    };
  } catch (error) {
    console.error("Unexpected error in updateTopicEmbeddings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Match a topic to content sources using similarity search and create topic_sources records
 * @param topicId - Topic ID
 * @param topicEmbedding - Topic embedding vector
 * @param matchThreshold - Similarity threshold (default: 0.7)
 * @param matchCount - Maximum number of matches (default: 5)
 * @returns Promise<TopicResult>
 */
export const matchTopicToSources = async (
  topicId: string,
  topicEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<TopicResult> => {
  try {
    // Define thresholds to try, starting with the provided threshold
    const thresholds = [matchThreshold, 0.6, 0.5, 0.3, 0.2];
    
    for (const threshold of thresholds) {
      console.log(`🔍 Trying similarity threshold: ${threshold} (${(threshold * 100).toFixed(0)}%)`);
      
      // Use the match_sources function to find similar content sources
      const { data: matches, error } = await supabase
        .rpc('match_sources', {
          query_embedding: topicEmbedding,
          match_threshold: 1 - threshold, // Convert threshold (match_sources uses distance, we want similarity)
          match_count: matchCount
        });

      if (error) {
        console.error("Error matching topic to sources:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (matches && matches.length > 0) {
        console.log(`✅ Found ${matches.length} matches with threshold ${threshold}`);
        
        // Create topic_sources records for each match
        const topicSourceRecords = matches.map((match: any) => ({
          topic_id: topicId,
          source_id: match.id,
        }));

        const { data: insertedRecords, error: insertError } = await supabase
          .from("topic_sources")
          .insert(topicSourceRecords)
          .select("*, content_sources(*)");

        if (insertError) {
          console.error("Error creating topic_sources records:", insertError);
          return {
            success: false,
            error: insertError.message,
          };
        }

        return {
          success: true,
          data: {
            matches: insertedRecords,
            count: insertedRecords.length,
            thresholdUsed: threshold,
          },
        };
      }
      
      console.log(`ℹ️ No matches found with threshold ${threshold}`);
    }

    // If we get here, no matches were found with any threshold
    console.log(`❌ No content sources matched even with the lowest threshold (0.2)`);
    return {
      success: true,
      data: {
        matches: [],
        count: 0,
        thresholdUsed: 0.2,
        noMatchesFound: true,
      },
    };
  } catch (error) {
    console.error("Unexpected error in matchTopicToSources:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Get content sources matched to a specific topic
 * @param topicId - Topic ID
 * @returns Promise<TopicResult>
 */
export const getTopicSources = async (topicId: string): Promise<TopicResult> => {
  try {
    const { data, error } = await supabase
      .from("topic_sources")
      .select(`
        *,
        content_sources (
          id,
          name,
          description,
          url
        )
      `)
      .eq("topic_id", topicId);

    if (error) {
      console.error("Error getting topic sources:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in getTopicSources:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Add a new content source to the database
 * @param sourceData - Content source data
 * @returns Promise<TopicResult>
 */
export const addContentSource = async (sourceData: {
  name: string;
  url: string;
  description: string;
  type: 'rss' | 'youtube' | 'podcast' | 'web';
}): Promise<TopicResult> => {
  try {
    // Generate embedding for the content source
    const embeddingText = `${sourceData.name}. ${sourceData.description || ''} (${sourceData.url})`;
    let embedding: number[] | null = null;
    
    try {
      embedding = await generateEmbedding(embeddingText);
    } catch (embeddingError) {
      console.error("Error generating embedding for content source:", embeddingError);
      // Continue without embedding - source will still be saved
    }

    // Insert the content source
    const { data, error } = await supabase
      .from("content_sources")
      .insert({
        name: sourceData.name,
        description: sourceData.description,
        url: sourceData.url,
        type: sourceData.type,
        embedding: embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding content source:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in addContentSource:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}; 