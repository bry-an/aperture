import { Context } from "grammy";

export const topicsCommand = async (ctx: Context) => {
  await ctx.reply("📋 Your current topics:\n\n• Technology\n• Business\n• Science\n\nThis is a stub - real topics coming soon!");
};

export const addTopicCommand = async (ctx: Context) => {
  const topic = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!topic) {
    await ctx.reply("Please provide a topic to add. Usage: /add_topic <topic>");
    return;
  }
  await ctx.reply(`✅ Added topic: ${topic}\n\nThis is a stub - real topic management coming soon!`);
};

export const removeTopicCommand = async (ctx: Context) => {
  const topic = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!topic) {
    await ctx.reply("Please provide a topic to remove. Usage: /remove_topic <topic>");
    return;
  }
  await ctx.reply(`❌ Removed topic: ${topic}\n\nThis is a stub - real topic management coming soon!`);
}; 