// clarity-bot/src/index.ts
import { Bot } from "grammy";
import { config } from "dotenv";

// Load environment variables
config();

import { briefCommand } from "./commands/brief";
import { topicsCommand, addTopicCommand, removeTopicCommand } from "./commands/topics";

// Check if BOT_TOKEN is available
if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN is not set in environment variables!");
  console.error("Please create a .env file with BOT_TOKEN=your_bot_token_here");
  process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);

// Register core commands
bot.command("start", (ctx) => ctx.reply("Welcome to Clarity 👋 Type /brief to see today's top content."));
bot.command("brief", briefCommand);
bot.command("topics", topicsCommand);
bot.command("add_topic", addTopicCommand);
bot.command("remove_topic", removeTopicCommand);

console.log("🤖 Clarity Bot is starting...");
bot.start();
