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