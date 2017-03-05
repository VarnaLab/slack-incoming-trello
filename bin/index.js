#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))

if (argv.help) {
  console.log('--env development|staging|production')
  console.log('--config path/to/config.json')
  console.log('--db path/to/db.json')
  console.log('--filter path/to/filter.json')
  process.exit()
}

;['config', 'db', 'filter'].forEach((key) => {
  if (!argv[key]) {
    console.error(`Specify --${key} file`)
    process.exit()
  }
})


var path = require('path')
var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})

var env = process.env.NODE_ENV || argv.env || 'development'

var config = require(path.resolve(process.cwd(), argv.config))[env]

var dbpath = path.resolve(process.cwd(), argv.db)
var db = require(dbpath)

var trello = purest({
  provider: 'trello',
  config: require('../config/purest'),
  defaults: {
    qs: Object.assign(
      {key: config.trello.app.key, token: config.trello.user.token},
      ((filter = require(path.resolve(process.cwd(), argv.filter))) => (
        filter.actions_since = db[env].timestamp,
        filter
      ))()
    )
  }
})


var hook = require('../')

hook({env, config, trello, db, dbpath})
  .then((responses) => {
    responses.forEach(([res, body]) => {
      console.log(new Date().toString(), res.statusCode, body)
    })
  })
  .catch((err) => console.error(new Date().toString(), err))

// test single attachment
// hook.post(
//   hook.hooks(config.slack),
//   [hook.attachment(require('/home/s/slack/_config/incoming-trello/fixture'))]
// )
