import { Context } from "grammy";
import { addTopic, upsertUser, getUserTopics, removeTopic } from "../db/query";

export const topicsCommand = async (ctx: Context) => {
  // Ensure user exists in database
  if (ctx.from) {
    const userResult = await upsertUser({
      telegram_id: ctx.from.id,
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || null,
    });

    if (!userResult.success) {
      await ctx.reply("❌ Error: Unable to process your request. Please try again later.");
      return;
    }
  }

  // Get user's topics
  const result = await getUserTopics(ctx.from!.id);
  
  if (!result.success) {
    await ctx.reply(`❌ Error: ${result.error}`);
    return;
  }

  const topics = result.data;
  
  if (!topics || topics.length === 0) {
    await ctx.reply("📋 You don't have any topics yet!\n\nUse /add_topic <topic> to add your first interest.");
    return;
  }

  // Format topics list
  const topicsList = topics.map((topic: any) => `• ${topic.topic}`).join('\n');
  await ctx.reply(`📋 Your current topics:\n\n${topicsList}\n\nUse /add_topic <topic> to add more interests!\nUse /remove_topic <topic> if you're no longer interested in something.`);
};

export const addTopicCommand = async (ctx: Context) => {
  const topic = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!topic) {
    await ctx.reply("Please provide a topic to add. Usage: /add_topic <topic>");
    return;
  }

  // Ensure user exists in database
  if (ctx.from) {
    const userResult = await upsertUser({
      telegram_id: ctx.from.id,
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || null,
    });

    if (!userResult.success) {
      await ctx.reply("❌ Error: Unable to process your request. Please try again later.");
      return;
    }
  }

  // Add the topic
  const result = await addTopic(ctx.from!.id, topic);
  
  if (!result.success) {
    await ctx.reply(`❌ Error: ${result.error}`);
    return;
  }

  if (result.isNew) {
    await ctx.reply(`Alright, we're now interested in ${topic} for you! We'll keep tabs on it going forward.`);
  } else {
    await ctx.reply(`We're already keeping tabs on ${topic} for you. Type /topics to see your current topics.`);
  }
};

export const removeTopicCommand = async (ctx: Context) => {
  const topic = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!topic) {
    await ctx.reply("Please provide a topic to remove. Usage: /remove_topic <topic>");
    return;
  }

  // Ensure user exists in database
  if (ctx.from) {
    const userResult = await upsertUser({
      telegram_id: ctx.from.id,
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || null,
    });

    if (!userResult.success) {
      await ctx.reply("❌ Error: Unable to process your request. Please try again later.");
      return;
    }
  }

  // Remove the topic
  const result = await removeTopic(ctx.from!.id, topic);
  
  if (!result.success) {
    if (result.error === "Topic not found") {
      await ctx.reply(`We weren't tracking ${topic} for you. Type /topics to see your current topics.`);
    } else {
      await ctx.reply(`❌ Error: ${result.error}`);
    }
    return;
  }

  await ctx.reply(`No longer tracking ${topic} for you.`);
}; 