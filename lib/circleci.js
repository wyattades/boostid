const request = require('superagent');
const { run } = require('./utils');
const logger = require('./log');


const API_URL = 'https://circleci.com/api/v1.1';
let token;

const api = (path, body, method) => {

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_URL}${path}`)
  .auth(token, '') // no password
  .accept('json')
  .type('json')
  .send(body)
  .then((res) => res.body)
  // Format error
  .catch((err) => {
    console.log(err);
    throw `${err.status} - ${typeof err.body === 'string' ? err.body.trim() : err.message}`;
  });
};


exports.triggerBuild = async (argv) => {

  if (!argv.ciToken)
    throw 'Must provide --ci-token <token> cli option or CIRCLE_TOKEN environment variable';
  token = argv.ciToken;

  if (!argv.reponame)
    throw 'Must provide boostid config file with "reponame" option, or -n <reponame> cli option';

  let username = process.env.CIRCLE_PROJECT_USERNAME;
  if (!username) {
    const remote = await run('git config --local remote.origin.url', true);

    const match = remote.match(/github\.com[/:](\w+)\/\w+\.git/);
    if (!match)
      throw 'Could not find a github project';

    username = match[1];
  }

  logger.info(`Triggering build on branch: ${argv.branch}`);

  const res = await api(`/project/github/${username}/${argv.reponame}/build`, {
    branch: argv.branch,
  });

  console.log(res);

  logger.success('Build triggered');
};
