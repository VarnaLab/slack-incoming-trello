
var request = require('@request/client')
var Attachment = require('./attachment')
var Log = require('./log')


module.exports = (config) => {

  var attachment = Attachment()
  var log = Log()

  var post = (hook, attachments) => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: hook.url,
      json: {
        username: hook.username,
        icon_url: hook.icon_url,
        channel: hook.channel,
        attachments
      },
      callback: (err, res, body) => (
        err ? reject(err) :
        res.statusCode !== 200 ? reject(new Error(log.error(res, body))) :
        resolve(body)
      )
    })
  })

  var hooks = (attachments) => Promise.all(
    config.slack.map((hook) => post(hook, attachments))
  )

  var attachments = (actions) => actions.map(attachment)

  attachments.sort = (attachments) => attachments
    .sort((a, b) => a.ts - b.ts)

  attachments.flatten = (boards) => boards
    .reduce((all, attachments) => all.concat(attachments), [])

  return {post, hooks, attachments}
}
