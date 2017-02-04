
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


var text = (action) => {
  if (/createCard/.test(action.type)) {
    return action.data.card.desc
  }
  else if (/updateCard/.test(action.type)) {
    var key = Object.keys(action.data.old)[0]
    return action.data.card[key]
  }
  else if (/commentCard/.test(action.type)) {
    return action.data.text
  }
  else if (/addChecklistToCard/.test(action.type)) {
    return action.data.checklist.name
  }
  else if (/updateCheckItemStateOnCard/.test(action.type)) {
    return [
      action.data.checklist.name,
      action.data.checkItem.name,
      action.data.checkItem.state
    ].join(' - ')
  }
  else if (/addMemberTo(Board|Card)/.test(action.type)) {
    return '<https://trello.com/' + action.member.username + '|' +
      action.member.fullName + '>'
  }
  else if (/updateBoard/.test(action.type)) {
    var key = Object.keys(action.data.old)[0]
    return action.data.board[key]
  }
  else {
    return ':wow: *' + action.type + '* is not implemented! :phone: @simo'
  }
}

var attachment = (action) => {
  var board = action.data.board || {}
  var list = action.data.list || {}
  var card = action.data.card || {}
  return {
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
  }
}

var get = (org, filter, attachment) => new Promise((resolve, reject) =>
  trello
    .get('organizations/' + org + '/boards')
    .qs(filter)
    .request()
    .then(([res, boards]) => resolve(boards
      .map((board) => board.actions.map(attachment))
      .reduce((all, attachments) => all.concat(attachments), [])))
    .catch(reject))

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

var store = (timestamp) => {
  db[env].action.timestamp = timestamp

  fs.writeFileSync(path.join(__dirname, '../config/db.json'),
    JSON.stringify(db, null, 2), 'utf8')
}

var error = (err) => console.error(new Date().toString(), err)

var check = () => {
  get(config.id, filter, attachment)
  .then((attachments) => {
    if (!attachments.length) {
      process.exit()
    }

    var timestamp = new Date().getTime()

    post(config, attachments)
    .then(([res, body]) => {
      console.log(new Date().toString(), res.statusCode, body)
      store(timestamp)
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
