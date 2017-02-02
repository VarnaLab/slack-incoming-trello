
const env = process.env.NODE_ENV || 'development'

var config = require('../config/')[env]
config.id = process.env.ID || config.id
config.hook = process.env.HOOK || config.hook
var providers = require('../config/purest')

var fs = require('fs')
var path = require('path')
var db = require('../config/db')

var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})
var trello = purest({provider: 'trello', config: providers})


var attachment = (activity) => {
  var board = activity.data.board || {}
  var list = activity.data.list || {}
  var card = activity.data.card || {}
  return {
    fallback: 'Incoming WebHook Error!',
    color: '#026aa7',

    author_name: activity.memberCreator.fullName,
    author_link: 'https://trello.com/' + activity.memberCreator.username,
    author_icon: 'https://trello-avatars.s3.amazonaws.com/' +
      activity.memberCreator.avatarHash + '/170.png',

    title: card.name,
    text: card.desc,

    footer: [
      activity.type,
      board.name ? ('<https://trello.com/b/' + board.shortLink + '|' + board.name + '>') : '',
      (list.name || ''),
      card.name ? ('<https://trello.com/c/' + card.shortLink + '|' + card.name + '>') : ''
    ].filter(Boolean).join(' | '),

    footer_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-05-18/44042585718_0e6a837d5b63fd1cfc07_96.png',
    ts: new Date(activity.date).getTime() / 1000,

    mrkdwn_in: ['pretext']
  }
}


var attachments = (config, db, trello, attachment) => new Promise((resolve, reject) => trello
  .get('organizations/' + config.id + '/boards')
  .auth(config.app.key, config.user.token)
  .request().then(([res, boards]) => Promise.all(boards
    .filter((board) => !board.closed)
    .map((board) =>
      trello.get('boards/' + board.id + '/actions')
        .auth(config.app.key, config.user.token)
        .request()))
    .then((boards) => resolve({boards, attachments: (boards || [])
      .map((board) => board[1]
        .filter((activity) =>
          new Date(activity.date).getTime() > db[env].boards[activity.data.board.id])
        .map(attachment))
      .reduce((all, attachments) => all.concat(attachments), [])
    }))
    .catch(reject)
  )
  .catch(reject)
)


function check () {
  attachments(config, db, trello, attachment)
    .then(({boards, attachments}) => {
      if (attachments.length) {
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
          callback: (err, res, _body) => {
            if (err) {
              console.error(new Date().toString(), err)
              return
            }

            console.log(new Date().toString(), res.statusCode, _body)

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
        })
      }
    })
    .catch((err) => console.error(new Date().toString(), err))
}


check()