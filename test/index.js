import test from 'ava'
import nock from 'nock'
import { resolve } from 'path'
import PULL_REQUEST_MOCK from './pull-request.json' with { type: 'json' }
import pullRequestWithoutBodyMock from './pull-request-without-body.json' with { type: 'json' }

const EXPECTED_UPDATE = {
  body: 'Please pull these awesome changes in!\n\n<!-- appcenter-review-checklist -->\n\ntesting!'
}
const PULL_REQUEST_CHECKLIST_MOCK = {
  ...PULL_REQUEST_MOCK,
  ...EXPECTED_UPDATE
}

let run = null

test.beforeEach(async () => {
  process.env.INPUT_TOKEN = 'testing'
  process.env.INPUT_BODY = 'testing!'

  process.env.GITHUB_REPOSITORY = 'github/testing'
  process.env.GITHUB_EVENT_PATH = resolve(import.meta.dirname, 'webhook.json')

  nock.disableNetConnect()

  // We need to load it after setting the process values
  const module = await import('../src/index.js')
  run = module.run
})

test('adds checklist to PR body without it', async (t) => {
  nock('https://api.github.com')
    .get('/repos/github/testing/pulls/2')
    .reply(200, () => PULL_REQUEST_MOCK)
    .patch('/repos/github/testing/pulls/2', EXPECTED_UPDATE)
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

test('adds checklist to PR with null body', async (t) => {
  const expectedUpdate = {
    body: '<!-- appcenter-review-checklist -->\n\ntesting!'
  }
  const pullRequestWithChecklistMock = {
    ...pullRequestWithoutBodyMock,
    ...expectedUpdate
  }

  nock('https://api.github.com')
    .get('/repos/github/testing/pulls/2')
    .reply(200, () => pullRequestWithoutBodyMock)
    .patch('/repos/github/testing/pulls/2', expectedUpdate)
    .reply(200, () => pullRequestWithChecklistMock)

  const result = await run()
  t.true(result)
})
