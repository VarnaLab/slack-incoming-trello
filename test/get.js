
var t = require('assert')
var http = require('http')
var hook = require('../')


describe('get', () => {
  var server

  before((done) => {
    hook.init({
      purest: {
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
    hook.get()
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
