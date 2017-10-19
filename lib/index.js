
var modules = {
  trello: require('./trello'),
  slack: require('./slack'),
  fs: require('./fs'),
}


module.exports = (config) => ((
  trello = modules.trello(config),
  slack = modules.slack(config),
  fs = modules.fs(config),
) =>
  trello.boards()
    .then((boards) => Promise.all(
      boards.map((board) =>
        trello.actions(board)
          .then(trello.actions.updated)
          .then(slack.attachments)
          .then(slack.attachments.sort)
      )
    ))
    .then(slack.attachments.flatten)
    .then((attachments) => attachments.length
      ? Promise.resolve(attachments)
          .then(slack.hooks)
          .then(fs.write)
      : 'noop'
    )
)()
