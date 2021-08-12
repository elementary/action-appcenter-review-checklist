const test = require('ava')
const nock = require('nock')
const { resolve } = require('path')

const PULL_REQUEST_MOCK = require('./pull-request.json')
const PULL_REQUEST_CHECKLIST_MOCK = {
  ...PULL_REQUEST_MOCK,
  body: 'Please pull these awesome changes in!\n\n<!-- appcenter-review-checklist -->\n\ntesting!'
}

let run = null

test.beforeEach(() => {
  process.env.INPUT_TOKEN = 'testing'
  process.env.INPUT_BODY = 'testing!'

  process.env.GITHUB_REPOSITORY = 'github/testing'
  process.env.GITHUB_EVENT_PATH = resolve(__dirname, 'webhook.json')

  nock.disableNetConnect()

  // We need to load it after setting the process values
  run = require('../src').run
})

test('adds checklist to PR body without it', async (t) => {
  nock('https://api.github.com')
    .get('/repos/github/testing/pulls/2')
    .reply(200, () => PULL_REQUEST_MOCK)
    .patch('/repos/github/testing/pulls/2')
    .reply(200, () => PULL_REQUEST_CHECKLIST_MOCK)

  const result = await run()
  t.true(result)
})

test('does not add checklist to PR body with it already included', async (t) => {
  nock('https://api.github.com')
    .get('/repos/github/testing/pulls/2')
    .reply(200, () => PULL_REQUEST_CHECKLIST_MOCK)

  const result = await run()
  t.false(result)
})
