const request = require('superagent');
const { run } = require('./utils');
const logger = require('./log');
const config = require('./config');


const API_URL = 'https://circleci.com/api/v1.1';
// let reponame,
//     username;

const api = (path, body, method) => {

  if (!config.get('ciToken'))
    throw 'Must provide "ciToken" config value or CIRCLE_TOKEN environment variable';

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_URL}${path}`)
  .auth(config.get('ciToken'), '') // no password
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

// exports.setRepo = async (_repo) => {
//   reponame = _repo;

//   if (!reponame)
//     throw 'Must provide boostid config file with "reponame" option, or -n <reponame> cli option';

//   username = process.env.CIRCLE_PROJECT_USERNAME;
//   if (!username) {
//     const remote = await run('git config --local remote.origin.url', true);

//     const match = remote.match(/github\.com[/:](\w+)\/\w+\.git/);
//     if (!match)
//       throw 'Could not find a github project';

//     username = match[1];
//   }
// };

exports.triggerBuild = async (branch) => {
  throw 'Not implemented';
  // logger.info(`Triggering build on branch: ${branch}`);

  // const res = await api(`/project/github/${username}/${reponame}/build`, {
  //   branch,
  // });

  // console.log(res);

  // logger.success('Build triggered');
};

exports.createProject = async (gitUrl, envs) => {
  const match = gitUrl.match(/.*?(github|bitbucket)\.(org|com)[/:]([\w-]+)\/([\w-]+)(\.git)?$/);
  if (!match)
    throw `Invalid github/bitbucket url: ${gitUrl}`;

  const [, vcsType,, owner, reponame] = match;

  await api(`/project/${vcsType}/${owner}/${reponame}/follow`, {});

  await api(`/project/${vcsType}/${owner}/${reponame}/envvar`, envs);
};

exports.setEnv = async (vars) => {
  // await api(`/project/${vcsType}/${username}/${reponame}/envvar`, vars);
};
