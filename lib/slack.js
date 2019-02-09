const request = require('superagent');
const fs = require('fs-extra');


module.exports = ({ failed = false, testResultsUrl = '' }) => {
  
  // Only send to Slack if on CI service
  if (!process.env.SLACK_NOTIFY_URL || !process.env.CIRCLE_REPOSITORY_URL)
    return Promise.resolve();

  failed = failed || testResultsUrl;

  const data = {
    attachments: [{
      fallback: `${this.name}: Coverage Tests ${failed ? 'Failed' : 'Passed'} - \
(${process.env.CIRCLE_BRANCH}) - ${process.env.CIRCLE_BUILD_URL} - ${testResultsUrl}`,
      text: `*${this.name}*: ${failed ? 'Failed' : 'Passed'}`,
      mrkdwn_in: ['text', 'fields'],
      fields: [{
        title: 'Project',
        value: `<${process.env.CIRCLE_PROJECT_URL}|\
${process.env.CIRCLE_PROJECT_REPONAME} _(${process.env.CIRCLE_BRANCH})_>`,
        short: true,
      }, {
        title: 'Job Number',
        value: `<${process.env.CIRCLE_BUILD_URL}|${process.env.CIRCLE_BUILD_NUM}>`,
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
        url: `https://dev-${this.name}.pantheonsite.io`,
      }, {
        type: 'button',
        text: 'Updates Site',
        url: `https://updates-${this.name}.pantheonsite.io`,
      }],
      color: failed ? 'danger' : 'success',
    }],
  };

  return request.post(process.env.SLACK_NOTIFY_URL)
  .send(data)
  .catch(() => console.error('Failed to send to Slack notification'));
};

if (require.main === module) {

  let testResultsUrl;
  try {
    testResultsUrl = fs.readFileSync('/tmp/boostid_test_results', 'utf8').trim();
  } catch (_) {}

  const failed = process.argv.includes('fail');
  
  module.exports({ testResultsUrl, failed });
}
