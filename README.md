
# slack-incoming-trello

Slack Incoming WebHook for Trello


# CLI

```bash
node slack-incoming-trello/bin/ \
  --auth auth.json \
  --slack slack.json \
  --fields fields.json \
  --target target.json \
  --env development
```


# auth.json

```json
{
  "development": {
    "trello": {
      "app": {
        "key": "",
        "secret": ""
      },
      "user": {
        "token": "",
        "secret": ""
      }
    }
  }
}
```


# slack.json

```json
{
  "development": [
    {
      "url": "https://hooks.slack.com/...",
      "username": "",
      "icon_url": "",
      "channel": "#general"
    },
    {
      "url": "https://hooks.slack.com/...",
      "username": "",
      "icon_url": "",
      "channel": "@slackbot"
    }
  ]
}
```

The `username`, `icon_url` and `channel` keys are optional and take effect only if the hook is a *Custom Integration*. These 3 keys have no effect for bundled *OAuth Apps*.


# fields.json

```json
{
  "development": {
    "board": {
      "filter": "open"
    },
    "action": {
      "filter": [
        "addAttachmentToCard",
        "commentCard",
        "updateBoard",
        "updateCard",
        "updateCheckItemStateOnCard",
        "updateList"
      ],
      "since": 0
    }
  }
}
```


# target.json

```json
{
  "development": {
    "org": {
      "id": "[ID]"
    }
  }
}
```
