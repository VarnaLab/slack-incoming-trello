
const env = process.env.NODE_ENV || 'development'

var config = require('../config/')[env]
config.id = process.env.ID || config.id
config.hook = process.env.HOOK || config.hook

var fs = require('fs')
var path = require('path')
var db = require('../config/db')

var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})
var trello = purest({provider: 'trello', config: require('../config/purest'),
  defaults: {qs: {key: config.app.key, token: config.user.token}}})

var filter = require('../config/trello')
filter.actions_since = db[env].action.timestamp


var text = (action) =>
  /createCard/.test(action.type)
  ? action.data.card.desc

  : /updateCard/.test(action.type)
  ? action.data.card[Object.keys(action.data.old)[0]]

  : /commentCard/.test(action.type)
  ? action.data.text

  : /addChecklistToCard/.test(action.type)
  ? action.data.checklist.name

  : /addChecklistToCard/.test(action.type)
  ? action.data.checklist.name

  : /updateCheckItemStateOnCard/.test(action.type)
  ? [
      action.data.checklist.name,
      action.data.checkItem.name,
      action.data.checkItem.state
    ].join(' - ')

  : /addMemberTo(Board|Card)/.test(action.type)
  ? '<https://trello.com/' + action.member.username + '|' +
      action.member.fullName + '>'

  : /updateBoard/.test(action.type)
  ? action.data.board[Object.keys(action.data.old)[0]]

  : ':wow: *' + action.type + '* is not implemented! :phone: @simo'

var attachment = (action, i, a,
  board = action.data.board || {},
  list = action.data.list || {},
  card = action.data.card || {}) => ({

  fallback: 'Incoming WebHook Error!',
  color: '#0089d9',

  pretext: '* ➤ ' + [
    board.name ?
      ('<https://trello.com/b/' + board.shortLink + '|' + board.name + '>')
      : '',
    (list.name || ''),
    card.name
      ? ('<https://trello.com/c/' + card.shortLink + '|' + card.name + '>')
      : ''
  ].filter(Boolean).join(' ➤ ') + '*',

  author_name: action.memberCreator.fullName,
  author_link: 'https://trello.com/' + action.memberCreator.username,
  author_icon: 'https://trello-avatars.s3.amazonaws.com/' +
    action.memberCreator.avatarHash + '/170.png',

  text: text(action),

  footer: action.type,
  footer_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/' +
    '2016-05-18/44042585718_0e6a837d5b63fd1cfc07_96.png',
  ts: new Date(action.date).getTime() / 1000,

  mrkdwn_in: ['pretext', 'text']
})

var get = (org, filter) => trello
  .get('organizations/' + org + '/boards')
  .qs(filter)
  .request()
  .then(([res, boards]) => boards
    .map((board) => board.actions.map(attachment))
    .reduce((all, attachments) => all.concat(attachments), []))

var post = (config, attachments) => new Promise((resolve, reject) => {
  request({
    method: 'POST',
    url: config.hook,
    json: {
      username: config.attachment.username,
      icon_url: config.attachment.icon_url,
      channel: config.attachment.channel,
      attachments
    },
    callback: (err, res, body) => (err ? reject(err) : resolve([res, body]))
  })
})

var store = (timestamp, db, env) => {
  db[env].action.timestamp = timestamp

  fs.writeFileSync(path.join(__dirname, '../config/db.json'),
    JSON.stringify(db, null, 2), 'utf8')
}

var error = (err) => console.error(new Date().toString(), err)

var check = () => {
  get(config.id, filter)
  .then((attachments) => {
    if (!attachments.length) {
      process.exit()
    }

    var timestamp = new Date().getTime()

    post(config, attachments)
    .then(([res, body]) => {
      console.log(new Date().toString(), res.statusCode, body)
      store(timestamp, db, env)
    })
    .catch(error)
  })
  .catch(error)
}

module.exports = {text, attachment, get, post, store, error, check}

if (!module.parent) {
  check()

  // test single attachment
  // post(config, [attachment(require('../config/fixture'))])
}
