const request = require('superagent');
const fs = require('fs-extra');
const config = require('../lib/config');
const log = require('../lib/log');


module.exports = async ({ failed = false, testResultsUrl = '' }) => {

  config.init();

  const { multidev, name, slackWebhook } = config.all();

  const {
    CIRCLE_BRANCH: branch,
    CIRCLE_BUILD_NUM: buildNum,
    CIRCLE_BUILD_URL: buildUrl,
    CIRCLE_PROJECT_REPONAME: reponame,
    CIRCLE_REPOSITORY_URL: repoUrl,
  } = process.env;

  // Only send to Slack if on CI service
  if (!slackWebhook || !repoUrl)
    return;

  failed = failed || testResultsUrl;

  const data = {
    attachments: [{
      fallback: `${name}: Coverage Tests ${failed ? 'Failed' : 'Passed'} - \
(${branch}) - ${buildUrl} - ${testResultsUrl}`,
      text: `*${name}*: ${failed ? 'Failed' : 'Passed'}`,
      mrkdwn_in: ['text', 'fields'],
      fields: [{
        title: 'Project',
        value: `<${repoUrl}|\
${reponame} _(${branch})_>`,
        short: true,
      }, {
        title: 'Job Number',
        value: `<${buildUrl}|${buildNum}>`,
        short: true,
      }],
      actions: [...testResultsUrl ? [{
        type: 'button',
        text: 'Test Results',
        url: testResultsUrl,
        style: 'primary',
      }] : [], {
        type: 'button',
        text: 'Dev Site',
        url: `https://dev-${name}.pantheonsite.io`,
      }, {
        type: 'button',
        text: 'Updates Site',
        url: `https://${multidev}-${name}.pantheonsite.io`,
      }],
      color: failed ? 'danger' : 'success',
    }],
  };

  try {
    await request.post(slackWebhook).send(data);
  } catch (e) {
    log.warn('Failed to send to Slack notification');
  }
};

if (require.main === module) {

  let testResultsUrl;
  try {
    testResultsUrl = fs.readFileSync('/tmp/boostid_test_results', 'utf8').trim();
  } catch (_) {}

  const failed = process.argv.includes('fail');
  
  module.exports({ testResultsUrl, failed });
}
