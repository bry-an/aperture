// clarity-bot/src/index.ts
import { Bot } from "grammy";
import { config } from "dotenv";
import { supabase } from "./lib/supabase";

// Load environment variables
config();

import { briefCommand } from "./commands/brief";
import { topicsCommand, addTopicCommand, removeTopicCommand } from "./commands/topics";
import { startCommand } from "./commands/start";

// Check if BOT_TOKEN is available
if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN is not set in environment variables!");
  console.error("Please create a .env file with BOT_TOKEN=your_bot_token_here");
  process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);

// Register core commands
bot.command("start", startCommand);
bot.command("brief", briefCommand);
bot.command("topics", topicsCommand);
bot.command("add_topic", addTopicCommand);
bot.command("remove_topic", removeTopicCommand);

// Sample query: fetch all users from the users table

console.log("🤖 Aperture Bot is starting...");
bot.start();
