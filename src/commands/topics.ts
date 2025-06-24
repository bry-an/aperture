import { Context } from "grammy";
import { addTopic, upsertUser, getUserTopics, removeTopic, getTopicSources } from "../db/query";

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

  // Get matched sources for each topic
  const topicsWithSources = await Promise.all(
    topics.map(async (topic: any) => {
      const sourcesResult = await getTopicSources(topic.id);
      const sources = sourcesResult.success ? sourcesResult.data : [];
      return {
        ...topic,
        sources: sources || []
      };
    })
  );

  // Format topics list with sources
  const topicsList = topicsWithSources.map((topic: any) => {
    const sourceCount = topic.sources.length;
    const sourceText = sourceCount > 0 
      ? ` (${sourceCount} source${sourceCount !== 1 ? 's' : ''})`
      : ' (no sources yet)';
    return `• ${topic.topic}${sourceText}`;
  }).join('\n');

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
    // Get the matched sources for this new topic
    let sourceInfo = "";
    if (result.data && result.data.id) {
      const sourcesResult = await getTopicSources(result.data.id);
      if (sourcesResult.success && sourcesResult.data && sourcesResult.data.length > 0) {
        const sourceCount = sourcesResult.data.length;
        sourceInfo = `\n\n🔍 I've found ${sourceCount} content source${sourceCount !== 1 ? 's' : ''} that match your interest in "${topic}". We'll start tracking relevant content from these sources for you!`;
      } else {
        sourceInfo = `\n\n🔍 I searched through our content sources but couldn't find any that closely match "${topic}". We'll keep an eye out for relevant content as we add more sources to our database.`;
      }
    }
    
    await ctx.reply(`✅ Alright, we're now interested in "${topic}" for you! We'll keep tabs on it going forward.${sourceInfo}`);
  } else {
    await ctx.reply(`ℹ️ We're already keeping tabs on "${topic}" for you. Type /topics to see your current topics.`);
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