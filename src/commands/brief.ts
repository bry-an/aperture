import { Context } from "grammy";

export const briefCommand = async (ctx: Context) => {
  await ctx.reply("📰 Here's your daily brief:\n\n• Top story: AI breakthrough in healthcare\n• Tech: New smartphone releases\n• Business: Market trends analysis\n\nThis is a stub - real content coming soon!");
}; 