const core = require('@actions/core')
const { context, getOctokit } = require('@actions/github')

const BODY_BREAK = '<!-- appcenter-review-checklist -->'

function includesChecklist(body) {
  return body && body.includes(BODY_BREAK)
}

function addChecklist(body, checklist) {
  return [body, BODY_BREAK, checklist].filter(s => s).join('\n\n')
}

async function run() {
  const octokit = getOctokit(core.getInput('token', { required: true }))

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number
  })

  if (includesChecklist(pullRequest.body)) {
    core.info('PR already includes checklist. Skipping.')
    return false
  }

  const checklist = core.getInput('body', { required: true })
  const newBody = addChecklist(pullRequest.body, checklist)

  const response = await octokit.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
    body: newBody
  })

  core.info(`Response: ${response.status}`)
  if (response.status > 399) {
    core.setFailed('Error updating the pull request')
  }

  return true
}

module.exports = { run }

if (require.main === module) {
  ; (async () => {
    try {
      await run()
    } catch (error) {
      core.error(error)
      core.setFailed(error.message)
    }
  })()
}
