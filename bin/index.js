#!/usr/bin/env node

var hook = require('../')

hook.init({})
hook.check()
  .then(([res, body]) => res && body &&
    console.log(new Date().toString(), res.statusCode, body))
  .catch((err) =>
    console.error(new Date().toString(), err))

// test single attachment
// hook.post(config, [attachment(require('../config/fixture'))])
