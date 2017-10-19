#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))

if (argv.help) {
  console.log(`
    --auth /path/to/auth.json
    --slack /path/to/slack.json
    --fields /path/to/fields.json
    --target /path/to/target.json
    --purest /path/to/purest.json
    --env environment
  `)
  process.exit()
}

;['auth', 'slack', 'fields', 'target'].forEach((file) => {
  if (!argv[file]) {
    console.error(`Specify --${file} /path/to/${file}.json`)
    process.exit()
  }
})

var env = process.env.NODE_ENV || argv.env || 'development'

var path = require('path')

var fpath = {
  auth: path.resolve(process.cwd(), argv.auth),
  slack: path.resolve(process.cwd(), argv.slack),
  fields: path.resolve(process.cwd(), argv.fields),
  target: path.resolve(process.cwd(), argv.target),
  purest: argv.purest
    ? path.resolve(process.cwd(), argv.purest)
    : path.resolve(__dirname, '../config/purest.json')
}

var config = {
  fpath,
  env,
  auth: require(fpath.auth)[env],
  slack: require(fpath.slack)[env],
  fields: require(fpath.fields)[env],
  target: require(fpath.target)[env],
  purest: require(fpath.purest),
}

var log = require('../lib/log')()

require('../')(config)
  .then((result) => result !== 'noop' && console.log(log.success('OK')))
  .catch((err) => console.error(err))
