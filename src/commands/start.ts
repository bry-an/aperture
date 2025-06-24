import { Context } from "grammy";
import { upsertUser } from "../db/query";

export const startCommand = async (ctx: Context) => {
  try {
    // Extract user information from the Telegram context
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || null;
    const firstName = ctx.from?.first_name || null;

    if (!telegramId) {
      await ctx.reply("❌ Unable to get your Telegram ID. Please try again.");
      return;
    }

    // Upsert user to the database using the abstraction layer
    const result = await upsertUser({
      telegram_id: telegramId,
      username,
      first_name: firstName,
    });

    if (!result.success) {
      console.error("Error upserting user:", result.error);
      await ctx.reply("❌ There was an error saving your information. Please try again later.");
      return;
    }

    // Welcome message
    const welcomeMessage = `Welcome to Aperture 👋\n\nI'm your AI-powered news assistant. Here's what I can do:\n\n📰 /brief - Get your daily news brief based on your interests\n📋 /topics - View your saved topics\n➕ /add_topic <topic> - Add a new topic\n➖ /remove_topic <topic> - Remove a topic\n\nYour preferences have been saved! Type /brief to see today's top content.`;

    await ctx.reply(welcomeMessage);

    console.log(`User upserted successfully: ${result.data.id} (Telegram ID: ${telegramId})`);

  } catch (error) {
    console.error("Unexpected error in start command:", error);
    await ctx.reply("❌ An unexpected error occurred. Please try again later.");
  }
}; 