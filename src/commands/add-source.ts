import { Context, InlineKeyboard } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";
import { addContentSource } from "../db/query";

// Define the source types available
const SOURCE_TYPES = [
  { value: 'rss', label: '📰 RSS Feed' },
  { value: 'youtube', label: '📺 YouTube Channel' },
  { value: 'podcast', label: '🎧 Podcast' },
  { value: 'web', label: '🌐 Website' }
] as const;

type SourceType = typeof SOURCE_TYPES[number]['value'];

// Interface for the conversation data
interface AddSourceData {
  type: SourceType;
  url: string;
  name: string;
  description: string;
}

/**
 * Add source command handler
 */
export const addSourceCommand = async (ctx: Context) => {
  await ctx.reply(
    "🔗 Let's add a new content source!\n\n" +
    "I'll help you add a new source to our database. " +
    "This will allow us to track content from this source for relevant topics.\n\n" +
    "What type of source would you like to add?",
    {
      reply_markup: new InlineKeyboard()
        .text(SOURCE_TYPES[0].label, "source_type_rss")
        .text(SOURCE_TYPES[1].label, "source_type_youtube")
        .row()
        .text(SOURCE_TYPES[2].label, "source_type_podcast")
        .text(SOURCE_TYPES[3].label, "source_type_web")
    }
  );
};

/**
 * Conversation for adding a content source
 */
export const addSourceConversation = async (conversation: any, ctx: Context & ConversationFlavor<Context>) => {
  const data: AddSourceData = {
    type: 'rss',
    url: '',
    name: '',
    description: ''
  };

  // Step 1: Get source type via callback query
  await ctx.reply("What type of source is this?", {
    reply_markup: new InlineKeyboard()
      .text(SOURCE_TYPES[0].label, "source_type_rss")
      .text(SOURCE_TYPES[1].label, "source_type_youtube")
      .row()
      .text(SOURCE_TYPES[2].label, "source_type_podcast")
      .text(SOURCE_TYPES[3].label, "source_type_web")
  });

  // Wait for callback query
  const typeResponse = await conversation.waitFor("callback_query:data");
  const callbackData = typeResponse.callbackQuery?.data;

  // Respond to the callback to remove the loading spinner
  await typeResponse.answerCallbackQuery();

  // Map callback data to source type
  if (callbackData === "source_type_rss") {
    data.type = "rss";
  } else if (callbackData === "source_type_youtube") {
    data.type = "youtube";
  } else if (callbackData === "source_type_podcast") {
    data.type = "podcast";
  } else if (callbackData === "source_type_web") {
    data.type = "web";
  } else {
    await ctx.reply("❌ I didn't understand that source type. Please try again with /add_source");
    return;
  }

  await ctx.reply(`✅ Got it! This is a ${data.type} source.\n\nNow, please provide the URL of the source:`);

  // Step 2: Get URL
  const urlResponse = await conversation.waitFor(":text");
  data.url = urlResponse.message?.text?.trim() || '';
  
  if (!data.url || !isValidUrl(data.url)) {
    await ctx.reply("❌ That doesn't look like a valid URL. Please try again with /add_source");
    return;
  }

  await ctx.reply("✅ URL received!\n\nNow, what should we call this source? (e.g., 'TechCrunch', 'The Verge'):");

  // Step 3: Get name
  const nameResponse = await conversation.waitFor(":text");
  data.name = nameResponse.message?.text?.trim() || '';
  
  if (!data.name) {
    await ctx.reply("❌ Please provide a name for the source. Try again with /add_source");
    return;
  }

  await ctx.reply("✅ Name received!\n\nFinally, please provide a brief description of what this source covers (e.g., 'Technology news and startup coverage'):");

  // Step 4: Get description
  const descriptionResponse = await conversation.waitFor(":text");
  data.description = descriptionResponse.message?.text?.trim() || '';

  // Step 5: Confirm and save
  await ctx.reply(
    `📋 Here's what you've provided:\n\n` +
    `**Type:** ${data.type}\n` +
    `**Name:** ${data.name}\n` +
    `**URL:** ${data.url}\n` +
    `**Description:** ${data.description || 'No description provided'}\n\n` +
    `Does this look correct? Reply with 'yes' to save or 'no' to start over.`
  );

  const confirmResponse = await conversation.waitFor(":text");
  const confirmText = confirmResponse.message?.text?.toLowerCase();

  if (confirmText === 'yes' || confirmText === 'y' || confirmText === 'correct') {
    // Save the source
    const result = await addContentSource(data);
    
    if (result.success) {
      await ctx.reply(
        `✅ Successfully added "${data.name}" to our content sources!\n\n` +
        `We'll now track content from this source and match it to relevant topics.`
      );
    } else {
      await ctx.reply(`❌ Error adding source: ${result.error}`);
    }
  } else {
    await ctx.reply("❌ Source not saved. You can try again with /add_source");
  }
};

/**
 * Helper function to validate URLs
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
} 