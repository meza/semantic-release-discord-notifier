import * as semantic from 'semantic-release';

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

  await sendDiscordWebhook(discordWebhookUrl, embed);
}

// Send a failure notification
export async function fail(pluginConfig: PluginConfig, context: semantic.FailContext): Promise<void> {
  const { webhookUrl, embedJson } = pluginConfig;
  const { errors } = context;

  const discordWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK;

  if (!discordWebhookUrl) {
    throw new Error('Discord webhook URL is not set.');
  }

  const embed = embedJson || failureEmbedJson(errors.errors);

  await sendDiscordWebhook(discordWebhookUrl, embed);
}

// Function to send Discord webhook
async function sendDiscordWebhook(webhookUrl: string, embedJson: object): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeds: [embedJson] })
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
function defaultEmbedJson(release: semantic.NextRelease): object {
  return {
    title: `New Release: ${release.version}`,
    description: release.notes,
    color: 5814783 // Green color
  };
}

// Default embed JSON function for failure
function failureEmbedJson(errors: Error[]): object {
  return {
    title: 'Release Failed',
    description: errors.map((error) => error.message).join('\n'),
    color: 15158332 // Red color
  };
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
    return value !== undefined ? String(value) : match;
  });
  return JSON.parse(replaced);
}
