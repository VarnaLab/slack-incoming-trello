
var t = require('assert')
var config = require('./fixtures/hooks')

var hook = require('../')


describe('hooks config', () => {
  it('one', () => {
    t.deepEqual(
      hook.hooks(config.one), [
        {
          hook: 'hook1',
          username: 'user1',
          icon_url: 'icon1',
          channel: '#channel1'
        }
      ]
    )
  })

  it('two', () => {
    // undefined will be stripped in JSON.stringify before POST
    t.deepEqual(
      hook.hooks(config.two), [
        {
          hook: 'hook1',
          username: undefined,
          icon_url: undefined,
          channel: undefined
        }, {
          hook: 'hook2',
          username: undefined,
          icon_url: undefined,
          channel: undefined
        }
      ]
    )
  })

  it('three', () => {
    t.deepEqual(
      hook.hooks(config.three), [
        {
          hook: 'hook1',
          username: 'user1',
          icon_url: 'icon1',
          channel: '#channel1'
        }, {
          hook: 'hook2',
          username: 'user1',
          icon_url: 'icon1',
          channel: '#channel1'
        }
      ]
    )
  })

  it('four', () => {
    t.deepEqual(
      hook.hooks(config.four), [
      {
          hook: 'hook1',
          username: 'user1',
          icon_url: 'icon1',
          channel: '#channel1'
        }, {
          hook: 'hook2',
          username: 'user2',
          icon_url: 'icon2',
          channel: '#channel2'
        }, {
          hook: 'hook3',
          username: 'user2',
          icon_url: 'icon2',
          channel: '#channel2'
        }
      ]
    )
  })
})
