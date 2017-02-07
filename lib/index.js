
var fs = require('fs')
var path = require('path')
var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})
var argv = require('minimist')(process.argv.slice(2))

var env, config, db, trello, filter

var init = (args) => (
  env = args.env || process.env.NODE_ENV || argv.env || 'development',

  config = (args.config || require(
    argv.config ? path.resolve(process.cwd(), argv.config) : '../config/'))[env],

  db = args.db || require(
    argv.db ? path.resolve(process.cwd(), argv.db) : '../config/db'),

  trello = args.trello || purest({
    provider: 'trello',
    config: require(
      argv.purest ? path.resolve(process.cwd(), argv.purest) : '../config/purest'),
    defaults: {qs: {key: config.app.key, token: config.user.token}}
  }),

  filter = args.filter || require(
    argv.filter ? path.resolve(process.cwd(), argv.filter) : '../config/trello'),
  filter.actions_since = db[env].action.timestamp,

  {env, config, db, trello, filter}
)

var text = (action) =>
  /createCard/.test(action.type)
  ? action.data.card.desc

  : /updateCard/.test(action.type)
  ? action.data.card[Object.keys(action.data.old)[0]]

  : /commentCard/.test(action.type)
  ? action.data.text

  : /addChecklistToCard/.test(action.type)
  ? action.data.checklist.name

  : /updateChecklist/.test(action.type)
  ? 'from ' + action.data.old.name + ' to ' + action.data.checklist.name

  : /updateCheckItemStateOnCard/.test(action.type)
  ? [
      action.data.checklist.name,
      action.data.checkItem.name,
      action.data.checkItem.state
    ].join(' - ')

  : /addAttachmentToCard/.test(action.type)
  ? ''

  : /addMemberTo(Board|Card)/.test(action.type)
  ? '<https://trello.com/' + action.member.username + '|' +
      action.member.fullName + '>'

  : /updateBoard/.test(action.type)
  ? action.data.board[Object.keys(action.data.old)[0]]

  : ':wow: *' + action.type + '* is not implemented! :phone: @simo'

var attachment = (action) => ((
  board = action.data.board || {},
  list = action.data.list || {},
  card = action.data.card || {}) => ({

  fallback: 'Incoming WebHook Error!',
  color: '#0089d9',

  pretext: '* ➤ ' + [
    board.name
      ? ('<https://trello.com/b/' + board.shortLink + '|' + board.name + '>')
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

  image_url: action.type === 'addAttachmentToCard' &&
    /\.(png|jpg)$/.test(action.data.attachment.previewUrl2x) &&
    action.data.attachment.previewUrl2x,

  footer: action.type,
  footer_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/' +
    '2016-05-18/44042585718_0e6a837d5b63fd1cfc07_96.png',
  ts: new Date(action.date).getTime() / 1000,

  mrkdwn_in: ['pretext', 'text']
}))()

var get = (org, filter) => trello
  .get('organizations/' + org + '/boards')
  .qs(filter)
  .request()
  .then(([res, boards]) => boards
    .map((board) => board.actions
      .filter((action) =>
        (action.type !== 'updateCard') ||
        (action.data.old.desc === ''))
      .map(attachment)
      .sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0)))
    .reduce((all, attachments) => all.concat(attachments), []))

var post = (config, attachments) => new Promise((resolve, reject) =>
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
  }))

var store = (timestamp, db, env) => (
  db[env].action.timestamp = timestamp,

  fs.writeFileSync(path.join(__dirname, '../config/db.json'),
    JSON.stringify(db, null, 2), 'utf8')
)

var check = () =>
  get(config.id, filter).then((attachments) => (
    (attachments.length) &&

    ((timestamp = new Date().getTime()) =>
      post(config, attachments).then(([res, body]) => (
        store(timestamp, db, env),
        [res, body]
      ))
    )()
  ))

module.exports = {init, text, attachment, get, post, store, check}
