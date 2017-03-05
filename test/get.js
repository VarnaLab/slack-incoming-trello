
var t = require('assert')
var http = require('http')
var request = require('@request/client')
var purest = require('purest')({request, promise: Promise})
var hook = require('../')


describe('get', () => {
  var server, trello

  before((done) => {
    trello = purest({
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

    server = http.createServer()
    server.on('request', (req, res) => {
      res.end(JSON.stringify(require('./fixtures/boards.json')))
    })
    server.listen(3000, done)
  })

  it('get', (done) => {
    hook.get(trello, 'id')
      .then((attachments) => {
        t.deepEqual(attachments, require('./fixtures/attachments'))
        done()
      })
      .catch(done)
  })

  after((done) => {
    server.close(done)
  })
})
