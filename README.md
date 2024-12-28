# semantic-release-discord-notifier

A [semantic-release](https://github.com/semantic-release/semantic-release) plugin to send release notifications to Discord.

## Installation

```bash
npm install semantic-release-discord-notifier
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["semantic-release-discord-notifier", {
      "webhookUrl": "https://discord.com/api/webhooks/your-webhook-url",
      "embedJson": {
        "title": "New Release: ${nextRelease.version}",
        "description": "${nextRelease.notes}",
        "color": 5814783
      }
    }]
  ]
}
```

## Configuration

### Environment Variables

| Variable             | Description                               |
|----------------------|-------------------------------------------|
| `DISCORD_WEBHOOK`| The Discord webhook URL (if not in config)|

### Options

| Option      | Description                                      | Default |
|-------------|--------------------------------------------------|---------|
| `webhookUrl`| The Discord webhook URL                          | `undefined` |
| `embedJson` | A custom Discord embed JSON object               | See below |

If `embedJson` is not provided, the default embed will be:

```json
{
  "title": "New Release: ${nextRelease.version}",
  "description": "${nextRelease.notes}",
  "fields": [
    { "name": "Branch", "value": "${branch.name}" },
    { "name": "Commits", "value": "${commits}" }
  ],
  "color": 5814783
}
```

## Variable Substitution

The plugin supports variable substitution in the `embedJson`. You can use `${variable}` syntax to insert values from the semantic-release context. For example, `${nextRelease.version}` will be replaced with the version of the new release.

Available context variables include:

- `nextRelease.version`
- `nextRelease.notes`
- `branch.name`
- `commits` (array of commit objects)
- `lastRelease.version`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

