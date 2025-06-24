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