
var https = require('https')
var request = require('@request/client')
var Purest = require('purest')({request, promise: Promise})
var log = require('./log')()


module.exports = ({auth, fields, target, purest, trello}) => {

  if (!trello) {
    var trello = Purest({
      provider: 'trello',
      config: purest,
      defaults: {
        qs: {
          key: auth.trello.app.key,
          token: auth.trello.user.token,
        },
        agent: new https.Agent({keepAlive: true, maxSockets: 2})
      }
    })
  }

  var boards = () =>
    trello
      .get('organizations/' + target.org.id + '/boards')
      .qs({
        filter: fields.board.filter
      })
      .request()
      .then(status)

  var actions = (board) =>
    trello
      .get('boards/' + board.id + '/actions')
      .qs({
        filter: fields.action.filter.join(),
        since: fields.action.since
      })
      .request()
      .then(status)

  var status = ([res, body]) =>
    res.statusCode !== 200
      ? Promise.reject(new Error(log.error(res, body)))
      : body

  actions.updated = (actions) => actions
    .filter((action) =>
      action.type !== 'updateCard' ||
      action.data.old.desc === ''
    )

  return {boards, actions}
}
