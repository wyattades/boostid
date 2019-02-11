const request = require('superagent');
const fs = require('fs-extra');
const config = require('./config');
const ter = require('./terminus');
const log = require('./log');


const API_URL = 'https://circleci.com/api/v1.1';

let vcsType,
    owner,
    reponame;

exports.setGitUrl = (gitUrl) => {
  const match = gitUrl.match(/.*?(github|bitbucket)\.(org|com)[/:]([\w-]+)\/([\w-]+)(\.git)?$/);
  if (!match)
    throw `Invalid github/bitbucket url: ${gitUrl}`;

  [, vcsType,, owner, reponame] = match;
};

const api = (path, body, method) => {

  if (!config.get('ciToken'))
    throw 'Must provide "ciToken" config value or BOOSTID_CI_TOKEN environment variable';

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_URL}${path}`)
  .auth(config.get('ciToken'), '') // no password
  .accept('json')
  .type('json')
  .send(body)
  .then((res) => res.body)
  // Format error
  .catch((err) => {
    const res = err.response;
    const msg = res && typeof res.body === 'object' ? res.body.message : res.body;
    err.message = `CircleCI: Error ${err.status} - ${typeof msg === 'string' ? msg.trim() : err.message}`;
    throw err;
  });
};


exports.triggerBuild = async (branch) => {
  throw 'Not implemented';
  // log.info(`Triggering build on branch: ${branch}`);

  // const res = await api(`/project/github/${username}/${reponame}/build`, {
  //   branch,
  // });

  // console.log(res);
};

exports.projectInfo = async () => {
  const info = await api(`/project/${vcsType}/${owner}/${reponame}`);
  
  return info;
};

exports.createProject = async () => {
  await api(`/project/${vcsType}/${owner}/${reponame}/follow`, {});
};

exports.updateMeta = async ({ git, slackWebhook }) => {

  if (git) exports.setGitUrl(git);

  log.info('Updating CircleCI environment variables and SSH keys...');

  await ter.login();
  const id = await ter.assertExists();

  const envs = {
    BOOSTID_ID: id,
    BOOSTID_SITE: config.get('site'),
    BOOSTID_MACHINE_TOKEN: config.get('machineToken'),
  };

  if (slackWebhook) {
    envs.BOOSTID_SLACK_WEBHOOK = slackWebhook;
  }

  const bucket = config.get('bucket');
  if (bucket) {
    envs.BOOSTID_BUCKET = config.get('bucket');
    envs.AWS_ACCESS_KEY_ID = config.get(`aws.${bucket}.accessKey`);
    envs.AWS_SECRET_ACCESS_KEY = config.get(`aws.${bucket}.secretAccessKey`);
  }

  await exports.setEnv(envs);

  let privateKey;
  try {
    privateKey = fs.readFileSync(config.get('ssh.privateKey'), 'utf8');
  } catch (_) {}

  if (privateKey) {
    await exports.deleteSSHKey(config.get('ssh.fingerprint'));
    await exports.addSSHKey(privateKey);
  }
};

exports.setEnv = async (vars) => {
  await Promise.all(Object.keys(vars).map((name) => (
    api(`/project/${vcsType}/${owner}/${reponame}/envvar`, {
      name,
      value: vars[name] === undefined ? '' : vars[name],
    })
  )));
};

exports.deleteSSHKey = async (fingerprint) => {
  await api(`/project/${vcsType}/${owner}/${reponame}/ssh-key`, {
    hostname: '',
    fingerprint,
  }, 'DELETE');
};

exports.addSSHKey = async (private_key) => {
  await api(`/project/${vcsType}/${owner}/${reponame}/ssh-key`, {
    hostname: '', // Leave blank to use this key by default
    private_key,
  });
};
