
# Install

```bash
npm install -g slack-webhook-trello
```

# CLI

```bash
slack-webhook-trello \
  --env development|staging|production \
  --config path/to/config.json \
  --db path/to/db.json \
  --filter path/to/filter.json
```

# config.json

```js
{
  "development": {
    "trello": {
      "id": "[Organization Screen Name]",
      "app": {
        "key": "[OAuth Consumer Key]",
        "secret": "[OAuth Consumer Secret]"
      },
      "user": {
        "token": "[OAuth Access Token]",
        "secret": "[OAuth Access Secret]"
      }
    },
    "slack": {
      "hook": "[Hook URL]", // or ["[Hook URL 1]", "[Hook URL N]"]
      "username": "[Bot Name]",
      "icon_url": "[Bot Avatar]",
      "channel": "[Target Channel or User]"
    }
  }
}
```

# db.json

```js
{
  "development": {
    "timestamp": 0
  }
}
```

# filter.json

```js
{
  "filter": "open",
  "actions": [
    "list",
    "all",
    "action",
    "types",
    "here"
  ],
  "actions_since": 0
}
```

# Crontab


```bash
# Run on every 15 min:
*/15 * * * * node slack-webhook-trello [params] >> trello.log
```

# API

```js
var hook = require('slack-webhook-trello')
hook.init({
  env: 'development',
  config: require('config.json'),
  db: require('db.json'),
  filter: require('filter.json')
})
// Run on every 15 min:
setTimeout(() => hook.check, 1000 * 60 * 15)
```
