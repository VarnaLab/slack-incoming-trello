
var fs = require('fs')
var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})


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
  ? '_' + action.data.checkItem.state + '_ - ' + [
      action.data.checklist.name,
      action.data.checkItem.name
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

  fallback: 'Trello Board Activity!',
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

var get = (trello, id) => trello
  .get('organizations/' + id + '/boards')
  .request()
  .then(([res, boards]) => boards
    .map((board) => board.actions
      .filter((action) =>
        (action.type !== 'updateCard') ||
        (action.data.old.desc === ''))
      .map(attachment)
      .sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0)))
    .reduce((all, attachments) => all.concat(attachments), []))

var hooks = (config) =>
  [].concat(config)
    .map(({hook, username, icon_url, channel}) => [].concat(hook)
      .map((hook) => ({hook, username, icon_url, channel}))
      .reduce((all, hook) => all.concat(hook) || all, []))
    .reduce((all, hook) => all.concat(hook) || all, [])

var post = (hooks, attachments) => Promise.all(
  hooks.map((hook) => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: hook.hook,
      json: {
        username: hook.username,
        icon_url: hook.icon_url,
        channel: hook.channel,
        attachments
      },
      callback: (err, res, body) => (err ? reject(err) : resolve([res, body]))
    })
  }))
)

var store = (env, db, dbpath) => {
  db[env].timestamp = new Date().getTime()
  fs.writeFileSync(dbpath, JSON.stringify(db, null, 2), 'utf8')
}

var hook = ({env, config, db, dbpath, _purest, filter}) => ((
  trello = purest({
    provider: 'trello',
    config: _purest || require('../config/purest'),
    defaults: {
      qs: Object.assign(
        {key: config.trello.app.key, token: config.trello.user.token},
        (filter.actions_since = db[env].timestamp, filter)
      )
    }
  })) =>
    get(trello, config.trello.id).then((attachments) =>
      attachments.length
      ? post(hooks(config.slack), attachments).then((responses) => (
          store(env, db, dbpath),
          responses
        ))
      : []
    )
  )()

module.exports = Object.assign(hook, {
  text, attachment, get, hooks, post, store
})
