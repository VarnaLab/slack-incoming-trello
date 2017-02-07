#!/usr/bin/env node

var hook = require('../')

hook.init({})
hook.check()

// test single attachment
// hook.post(config, [attachment(require('../config/fixture'))])
