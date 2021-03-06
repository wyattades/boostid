const fs = require('fs-extra');
const path = require('path');
const config = require('../lib/config');
const log = require('../lib/log');


const TEST_RESULTS_DIR = '__boostid_results__';

const reportSlack = async (failed, testResultsUrl = '') => {

  const { multidev, name, slackWebhook } = config.all();

  const {
    CIRCLE_BRANCH: branch,
    CIRCLE_BUILD_NUM: buildNum,
    CIRCLE_PROJECT_REPONAME: reponame,
    CIRCLE_BUILD_URL: buildUrl,
  } = process.env;

  // Normalize url in case it is SSH
  let repoUrl = process.env.CIRCLE_REPOSITORY_URL;
  if (!repoUrl.includes('://')) repoUrl = `https://${repoUrl}`;
  const { pathname, hostname } = require('url').parse(repoUrl);
  repoUrl = `https://${hostname}${pathname.replace(':', '')}`;

  const data = {
    attachments: [{
      fallback: `${name}: Coverage Tests ${failed ? 'Failed' : 'Passed'} - \
(${branch}) - ${buildUrl} - ${testResultsUrl}`,
      text: `Coverage Tests ${failed ? 'Failed' : 'Passed'} for site *${name}*`,
      mrkdwn_in: ['text', 'fields'],
      fields: [{
        title: 'Project',
        value: `<${repoUrl}|${reponame} _(${branch})_>`,
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
      color: failed ? 'danger' : 'good',
    }],
  };

  await require('superagent').post(slackWebhook).send(data);
};

// const uploadResults = async (testResults) => {

//   const { name, bucket } = config.all();

//   log.info(`Uploading test results to AWS S3 bucket: ${bucket}...`);

//   require('aws-sdk/global');
//   const S3 = require('aws-sdk/clients/s3');

//   const s3 = new S3({
//     apiVersion: '2006-03-01',
//   });

//   // let hash;
//   // try {
//   //   hash = fs.readFileSync('/etc/hostname', 'utf8').trim();
//   // } catch (_) {}
//   // if (!hash)
//   //   hash = Date.now().toString();

//   const now = Date.now();
//   const hash = now.toString();

//   let diffFiles = [];
//   try {
//     diffFiles = fs.readdirSync(TEST_RESULTS_DIR).filter((filename) => /-diff\.(png|jpe?g)$/.test(filename));
//   } catch (_) {}

//   let ciJob = Number.parseInt(process.env.CIRCLE_BUILD_NUM, 10);
//   if (Number.isNaN(ciJob)) ciJob = null;

//   const resultsJson = JSON.stringify({
//     version: 1,
//     bucket,
//     project: name,
//     ciJob,
//     ciUrl: process.env.CIRCLE_BUILD_URL || null,
//     timestamp: now,
//     testResults,
//   });
  
//   await Promise.all(diffFiles.map((filename) => (
//     s3.putObject({
//       Body: fs.readFileSync(path.join(TEST_RESULTS_DIR, filename)),
//       Bucket: bucket,
//       Key: `${name}/${hash}/${filename}`,
//       ContentType: 'image/png',
//       ACL: 'public-read',
//     }).promise()
//   )).concat([
//     s3.putObject({
//       Body: resultsJson,
//       Bucket: bucket,
//       Key: `${name}/${hash}/results.json`,
//       ContentType: 'application/json',
//       ACL: 'public-read',
//     }).promise(),
//   ]));
// };

module.exports = async (failed) => {

  config.init();

  let testResults;
  let testResultsUrl;

  try {
    testResults = fs.readJSONSync(path.join(TEST_RESULTS_DIR, 'results.json'));
  } catch (_) {
    log.warn('Failed to read test results JSON file');
  }

  if (typeof failed !== 'boolean')
    failed = !testResults || !testResults.success;

  // if (failed && testResults && config.get('bucket')) {
  //   try {
  //     testResultsUrl = await uploadResults(testResults);
  //   } catch (err) {
  //     log.warn('Failed to upload test results to AWS S3 because:');
  //     log.warn(err);
  //   }
  // }

  if (process.env.CIRCLE_REPOSITORY_URL) {
    const git = require('./git');

    const parsed = git.parseGitUrl(process.env.CIRCLE_REPOSITORY_URL);
    if (parsed) {
      const { vcsType, owner, reponame } = parsed;
      
      const testResultsUrl = `https://boostid.now.sh/ci/${encodeURIComponent(`${vcsType}/${owner}/${reponame}`)}/${process.env.CIRCLE_BUILD_NUM}`;
    
      log.info(`View the test results at:\n${testResultsUrl}`);
    } else {
      log.warn(`Failed to parse git url: "${process.env.CIRCLE_REPOSITORY_URL}"`);
    }
    
    if (config.get('slackWebhook')) {
      try {
        await reportSlack(failed, testResultsUrl);
      } catch (err) {
        log.warn('Failed to send Slack notification because:');
        log.warn(err);
      }
    }
  }
};

if (require.main === module) {
  module.exports();
}
