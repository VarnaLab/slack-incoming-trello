
var t = require('assert')
var http = require('http')
var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})
var hook = require('../')

var fixtures = {
  boards: require('./fixtures/boards.json'),
  attachments: require('./fixtures/attachments')
}

var trello = purest({
  provider: 'trello',
  config: {
    trello: {
      'http://localhost:3000': {
        '{endpoint}': {
          __path: {
            alias: '__default'
          }
        }
      }
    }
  }
})

describe('get', () => {
  var server

  before((done) => {
    server = http.createServer()
    server.on('request', (req, res) => {
      res.end(JSON.stringify(fixtures.boards))
    })
    server.listen(3000, done)
  })

  it('get', (done) => {
    hook.get(trello, 'id')
      .then((attachments) => {
        t.deepEqual(attachments, fixtures.attachments)
        done()
      })
      .catch(done)
  })

  after((done) => {
    server.close(done)
  })
})
