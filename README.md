# semantic-release-discord-notifier

A [semantic-release](https://github.com/semantic-release/semantic-release) plugin to send release notifications to Discord.

> :note: 
> This plugin is still in development and may not work as expected. Please report any issues and feature requests you encounter.

## Installation

```bash
npm install semantic-release-discord-notifier
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

Below is an example of a `.releaserc` file that configures `semantic-release-discord-notifier`:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["semantic-release-discord-notifier", {
      "webhookUrl": "https://discord.com/api/webhooks/your-webhook-url",
      "embedJson": {
        "username": "My app",
        "avatar_url": "https://avatars.githubusercontent.com/u/211977?s=400&u=c9d3d971f2adcf6ab6045bc698c7dc70eebf04fe&v=4",
        "content": "# :rocket: ${nextRelease.version} just dropped",
        "embeds": [
          {
            "title": "What changed?",
            "description": "${nextRelease.notes}",
            "color": 7377919,
            "footer": {
              "text": "Some additional information"
            }
          }
        ],
        "components": [
          {
            "type": 1,
            "components": [
              {
                "type": 2,
                "style": 5,
                "label": "Follow on twitter",
                "url": "https://twitter.com/vsbmeza"
              },
              {
                "type": 2,
                "style": 5,
                "label": "Sponsor the project",
                "url": "https://github.com/sponsors/meza"
              }
            ]
          }
        ]
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

| Option       | Description                                                                                                                                                                  | Default     |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `webhookUrl` | The Discord webhook URL                                                                                                                                                      | `undefined` |
| `embedJson`  | A custom Discord webhook JSON object                                                                                                                                         | See below   |
| `branches`   | List of branch names or [semantic-release branch globs](https://semantic-release.gitbook.io/semantic-release/usage/configuration#branches) that should trigger notifications | `undefined` |

You can use https://message.style/app/editor or similar to generate the `embedJson` object.

The `embedJson` object is the JSON object that will be sent to Discord. Aside from the (Variable Substitution)[#variable-substitution] mentioned below,
what you speficy here will go directly to Discord unchanged.

When `branches` is provided, notifications are sent only when the current Git branch matches one of the configured names or patterns (the same extglob syntax semantic-release supports for its own `branches` configuration). This allows you to restrict notifications to `main`, release branches like `release/*`, or versioned branches such as `v+([0-9])?(.{+([0-9]),x}).x`.

If `embedJson` is not provided, the default embed will be:

```json
{
  "content": "New Release: ${nextRelease.version}",
  "embeds": [
        {
          "title": "What changed?",
          "description": "${nextRelease.notes}",
          "color": 7377919
        }
    ]
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
