// clarity-bot/src/index.ts
import { Bot, Context } from "grammy";
import { config } from "dotenv";
import { supabase } from "./lib/supabase";
import { conversations, createConversation, ConversationFlavor } from "@grammyjs/conversations";

// Load environment variables
config();

import { briefCommand } from "./commands/brief";
import { topicsCommand, addTopicCommand, removeTopicCommand } from "./commands/topics";
import { startCommand } from "./commands/start";
import { addSourceConversation } from "./commands/add-source";

// Check if BOT_TOKEN is available
if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN is not set in environment variables!");
  console.error("Please create a .env file with BOT_TOKEN=your_bot_token_here");
  process.exit(1);
}

// Create bot with conversation flavor
const bot = new Bot<Context & ConversationFlavor<Context>>(process.env.BOT_TOKEN);

// Install conversations plugin
bot.use(conversations());

// Register conversation
bot.use(createConversation(addSourceConversation));

// Register core commands
bot.command("start", startCommand);
bot.command("brief", briefCommand);
bot.command("topics", topicsCommand);
bot.command("add_topic", addTopicCommand);
bot.command("remove_topic", removeTopicCommand);
bot.command("add_source", async (ctx) => {
  await ctx.conversation.enter("addSourceConversation");
});

// Sample query: fetch all users from the users table

console.log("🤖 Aperture Bot is starting...");
bot.start();
