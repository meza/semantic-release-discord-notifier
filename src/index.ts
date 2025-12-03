import micromatch from 'micromatch';
import * as semantic from 'semantic-release';

interface PluginConfig {
  webhookUrl?: string;
  embedJson?: object;
  branches?: string[];
}

interface BranchInfo {
  branch?: {
    name?: string;
  };
}

type SuccessContext = semantic.SuccessContext & BranchInfo;
type FailContext = semantic.FailContext & BranchInfo;

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

type Logger = Pick<typeof console, 'log'>;

function getLogger(provided?: Logger): Logger {
  if (provided) {
    return provided;
  }
  return console;
}

function getBranchName(info?: BranchInfo): string | undefined {
  if (!info) {
    return undefined;
  }

  const branch = info.branch;

  if (!branch) {
    return undefined;
  }

  return branch.name;
}

// Verify that the plugin is configured correctly
export async function verifyConditions(
  pluginConfig: PluginConfig,
  context?: Pick<SuccessContext, 'branch' | 'logger'>
): Promise<void> {
  const logger = getLogger(context ? context.logger : undefined);
  const branchName = getBranchName(context);

  if (shouldSkipBranch(pluginConfig.branches, branchName, logger)) {
    return;
  }

  const { webhookUrl } = pluginConfig;

  if (!webhookUrl && !process.env.DISCORD_WEBHOOK) {
    throw new Error(
      'No Discord webhook URL provided. Set it in the plugin config or as DISCORD_WEBHOOK environment variable.'
    );
  }
}

// Send a success notification
export async function success(pluginConfig: PluginConfig, context: SuccessContext): Promise<void> {
  const logger = getLogger(context.logger);
  const branchName = getBranchName(context);

  if (shouldSkipBranch(pluginConfig.branches, branchName, logger)) {
    return;
  }
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
  context.logger.log(`Sending Discord notification with json: "${embed}"`);
  await sendDiscordWebhook(discordWebhookUrl, embed);
}

// Send a failure notification
export async function fail(pluginConfig: PluginConfig, context: FailContext): Promise<void> {
  const logger = getLogger(context.logger);
  const branchName = getBranchName(context);

  if (shouldSkipBranch(pluginConfig.branches, branchName, logger)) {
    return;
  }
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
function defaultEmbedJson(nextRelease: semantic.NextRelease): string {
  return JSON.stringify({
    content: `New Release: ${nextRelease.version}`,
    embeds: [
      {
        title: 'What changed?',
        description: `${nextRelease.notes}`,
        color: 7377919
      }
    ]
  });
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
function replaceVariables(embed: object, context: SuccessContext): string {
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
  return replaced;
}

function shouldSkipBranch(branches: string[] | undefined, branchName: string | undefined, logger: Logger): boolean {
  if (!branches || branches.length === 0) {
    return false;
  }

  if (!branchName) {
    logger.log('Skipping Discord notification because the current branch name is not available.');
    return true;
  }

  const matches = branches.some((pattern) => micromatch.isMatch(branchName, pattern));

  if (!matches) {
    logger.log(
      `Skipping Discord notification because branch "${branchName}" does not match allowed branches: ${branches.join(', ')}`
    );
  }

  return !matches;
}
