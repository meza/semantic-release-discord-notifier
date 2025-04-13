import * as semantic from 'semantic-release';

const ALLOWED_BODY_LENGTH = 4096;

interface PluginConfig {
  webhookUrl?: string;
  embedJson?: object;
}

interface EnvVariables {
  DISCORD_WEBHOOK?: string;
  // Add other environment variables here
}

// Extend the NodeJS.ProcessEnv interface
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvVariables {}
  }
}

// Verify that the plugin is configured correctly
export async function verifyConditions(pluginConfig: PluginConfig): Promise<void> {
  const { webhookUrl } = pluginConfig;

  if (!webhookUrl && !process.env.DISCORD_WEBHOOK) {
    throw new Error(
      'No Discord webhook URL provided. Set it in the plugin config or as DISCORD_WEBHOOK environment variable.'
    );
  }
}

// Send a success notification
export async function success(pluginConfig: PluginConfig, context: semantic.SuccessContext): Promise<void> {
  const { webhookUrl, embedJson } = pluginConfig;
  const { nextRelease } = context;

  const discordWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK;

  if (!discordWebhookUrl) {
    throw new Error('Discord webhook URL is not set.');
  }

  if (!nextRelease) {
    throw new Error('No release information available.');
  }

  const embed = embedJson ? replaceVariables(embedJson, context) : defaultEmbedJson(nextRelease);

  const trimmed = trimEmbed(embed);

  context.logger.log(`Sending Discord notification with json: "${JSON.stringify(trimmed)}"`);
  await sendDiscordWebhook(discordWebhookUrl, JSON.stringify(trimmed));
}

function trimEmbed(embed: { description?: string }): object {
  if (!embed.description) {
    return embed;
  }

  const suffix = '\n\n... and more!';
  const maxLength = ALLOWED_BODY_LENGTH - suffix.length;

  if (embed.description.length <= maxLength) {
    return embed;
  }

  const lines = embed.description.split('\n');

  while (lines.join('\n').length > maxLength) {
    lines.pop();
  }

  embed.description = lines.join('\n') + suffix;

  return embed;
}

// Send a failure notification
export async function fail(pluginConfig: PluginConfig, context: semantic.FailContext): Promise<void> {
  const { webhookUrl } = pluginConfig;
  const { errors } = context;

  const discordWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK;

  if (!discordWebhookUrl) {
    throw new Error('Discord webhook URL is not set.');
  }

  const embed = failureEmbedJson(errors.errors);

  await sendDiscordWebhook(discordWebhookUrl, embed);
}

// Function to send Discord webhook
async function sendDiscordWebhook(webhookUrl: string, message: string): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: message
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Discord notification sent successfully');
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    throw error;
  }
}

// Default embed JSON function for success
function defaultEmbedJson(nextRelease: semantic.NextRelease): object {
  return {
    content: `New Release: ${nextRelease.version}`,
    embeds: [
      {
        title: 'What changed?',
        description: `${nextRelease.notes}`,
        color: 7377919
      }
    ]
  };
}

// Default embed JSON function for failure
function failureEmbedJson(errors: Error[]): string {
  const message: { content: string; embeds: { title: string; description: string; color: number }[] } = {
    content: 'Release Failed',
    embeds: []
  };

  errors.forEach((error) => {
    message.embeds.push({
      title: 'Error',
      description: error.message,
      color: 15158332 // Red color
    });
  });

  return JSON.stringify(message);
}

// Function to replace variables in the embed JSON
function replaceVariables(embed: object, context: semantic.SuccessContext): object {
  const stringified = JSON.stringify(embed);
  const replaced = stringified.replace(/\${(.*?)}/g, (match, p1) => {
    const value = p1.split('.').reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, context);
    return value !== undefined ? JSON.stringify(value).slice(1, -1) : match;
  });
  return JSON.parse(replaced);
}
