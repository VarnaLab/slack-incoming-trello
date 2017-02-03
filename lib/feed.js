
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


var text = (activity) => {
  if (activity.type === 'createCard') {
    return activity.data.card.desc
  }
  else if (activity.type === 'updateCard') {
    var key = Object.keys(activity.data.old)[0]
    return activity.data.card[key]
  }
  else if (activity.type === 'commentCard') {
    return activity.data.text
  }
  else if (activity.type === 'addChecklistToCard') {
    return activity.data.checklist.name
  }
  else if (activity.type === 'updateCheckItemStateOnCard') {
    return [
      activity.data.checklist.name,
      activity.data.checkItem.name,
      activity.data.checkItem.state
    ].join(' - ')
  }
  else if (activity.type === 'addMemberToCard') {
    return '<https://trello.com/' + activity.member.username + '|' +
      activity.member.fullName + '>'
  }
  else if (activity.type === 'updateBoard') {
    var key = Object.keys(activity.data.old)[0]
    return activity.data.board[key]
  }
  else if (activity.type === 'addMemberToBoard') {
    return '<https://trello.com/' + activity.member.username + '|' +
      activity.member.fullName + '>'
  }
  else {
    return ':wow: *' + activity.type + '* is not implemented! :phone: @simo'
  }
}


var attachment = (activity) => {
  var board = activity.data.board || {}
  var list = activity.data.list || {}
  var card = activity.data.card || {}
  return {
    fallback: 'Incoming WebHook Error!',
    color: '#026aa7',

    pretext: '* ➤ ' + [
      board.name ?
        ('<https://trello.com/b/' + board.shortLink + '|' + board.name + '>')
        : '',
      (list.name || ''),
      card.name
        ? ('<https://trello.com/c/' + card.shortLink + '|' + card.name + '>')
        : ''
    ].filter(Boolean).join(' ➤ ') + '*',

    author_name: activity.memberCreator.fullName,
    author_link: 'https://trello.com/' + activity.memberCreator.username,
    author_icon: 'https://trello-avatars.s3.amazonaws.com/' +
      activity.memberCreator.avatarHash + '/170.png',

    text: text(activity),

    footer: activity.type,
    footer_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/' +
      '2016-05-18/44042585718_0e6a837d5b63fd1cfc07_96.png',
    ts: new Date(activity.date).getTime() / 1000,

    mrkdwn_in: ['pretext', 'text']
  }
}


var attachments = (boards) => boards
  .map(([res, activities]) => activities
    .filter((activity) =>
      new Date(activity.date).getTime() > db[env].boards[activity.data.board.id])
    .map(attachment))
  .reduce((all, attachments) => all.concat(attachments), [])


var get = () => new Promise((resolve, reject) =>
  trello.get('organizations/' + config.id + '/boards').request()
  .then(([res, boards]) =>
    Promise.all(boards
      .filter((board) => !board.closed)
      .map((board) => trello.get('boards/' + board.id + '/actions').request()))
    .then(resolve)
    .catch(reject)
  )
  .catch(reject)
)


var post = (boards, attachments) => {
  request({
    method: 'POST',
    url: config.hook,
    json: {
      username: config.attachment.username,
      icon_url: config.attachment.icon_url,
      channel: config.attachment.channel,
      attachments
      // test single attachment
      // attachments: [attachment(require('../config/fixture'))]
    },
    callback: (err, res, body) => {
      if (err) {
        console.error(new Date().toString(), err)
        process.exit()
      }

      console.log(new Date().toString(), res.statusCode, body)

      store(boards)
    }
  })
}


var store = (boards) => {
  boards
    .filter((board) => !board.closed)
    .forEach((board) => {
      if (board && board[1] && board[1][0]) {
        var activity = board[1][0]
        db[env].boards[activity.data.board.id] = new Date(activity.date).getTime()
      }
    })

  fs.writeFileSync(path.join(__dirname, '../config/db.json'),
    JSON.stringify(db, null, 2), 'utf8')
}


function check () {
  get().then((boards) => {
    debugger
    var att = attachments(boards)

    if (!att.length) {
      process.exit()
    }

    post(boards, att)
  })
  .catch((err) => console.error(new Date().toString(), err))
}


check()
// post()
