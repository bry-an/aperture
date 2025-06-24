import { supabase } from "../lib/supabase";

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

    // Add new topic
    const { data, error } = await supabase
      .from("topics")
      .insert({
        user_id: userResult.data.id,
        topic: normalizedTopic,
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