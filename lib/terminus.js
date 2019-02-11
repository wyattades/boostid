const request = require('superagent');
const fs = require('fs-extra');
const log = require('./log');
const config = require('./config');


const API_URL = 'https://dashboard.pantheon.io/api';
const USER_AGENT = 'Terminus/1.9.0 (php_version=7.2.13&script=boot-fs.php)';
const NON_MULTIDEVS = { dev: 0, live: 0, test: 0 };

let siteMap;
let siteId;

const formatError = (err) => {
  const res = err.response;
  const msg = res && typeof res.body === 'object' ? res.body.message : res.body;
  err.message = `Terminus: Error ${err.status} - ${typeof msg === 'string' ? msg.trim() : err.message}`;
  throw err;
};

const api = (path, body, method) => {

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_URL}${path}`)
  .set('User-Agent', USER_AGENT)
  .accept('json')
  .send(body)
  .auth(config.get('session.session'), { type: 'bearer' })
  .then((res) => res.body)
  // Format error
  .catch(formatError);
};

// const runTerminus = (cmd, args = [], options = {}) => {
//   const opt = [];
//   for (const key in options) {
//     const option = options[key];
//     opt.push(`${key.length === 1 ? '-' : '--'}${key}`);
//     if (option && typeof option === 'string') opt.push(option);
//   }
//   return run([ 'terminus', cmd, ...opt, ...args ], true);
// }

const wait = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

// waits for workflow to finish
const waitForWorkflow = (workflowId) => log.promise((async () => {
  let info;
  let runTimes = 0;
  let waitFor = 2000;
  do {
    info = await api(`/sites/${siteId}/workflows/${workflowId}`);
  
    await wait(waitFor);
    waitFor *= 1.5;

    if (runTimes++ > 13) // about 4 minutes
      throw `Workflow ${workflowId} timed out`;

  } while (!info.result);

  if (info.result !== 'succeeded') {
    let reason = Array.isArray(info.reason) ? info.reason.join('\n  ') : info.reason;
    if (!reason) {
      log.error(info);
      reason = '[See above]';
    }
    throw `Workflow ${workflowId} ${info.result} because:\n  ${reason}`;
  }

  return info;
})(), `\x1b[37mWaiting for workflow: ${workflowId}...\x1b[0m`);

exports.commands = () => {
  const cmds = { ...exports };
  for (const k of ['login', 'run', 'assertExists', 'help', 'commands'])
    delete cmds[k];
  return cmds;
};

exports.help = () => {

  const STRIP = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/mg;
  const ARGUMENT_NAMES = /([^\s,]+)/g;
  const getParamNames = (func) => {
    const fnStr = func.toString().replace(STRIP, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
      result = [];
    return result;
  };

  const cmds = exports.commands();

  const help = Object.keys(cmds)
  .map((k) => `  ${k}${getParamNames(cmds[k]).map((arg) => ` <${arg}>`).join('')}`)
  .join('\n');

  return help;
};

// Run commands from CLI
exports.run = async ({ cmd, args }) => {

  const fn = exports[cmd];

  await exports.login();

  await exports.assertExists();

  const res = await fn(...args);
  if (typeof res === 'object') console.log(JSON.stringify(res, null, 2));
  else if (res !== undefined) console.log(res);
};

exports.login = async () => {

  if (!config.get('machineToken'))
    throw 'Must provide -m <machineToken> cli option or BOOSTID_MACHINE_TOKEN environment variable';

  const expires = config.get('session.expires_at');
  if (typeof expires !== 'number' || expires * 1000 < Date.now()) {

    const res = await request.post(`${API_URL}/authorize/machine-token`)
    .set('User-Agent', USER_AGENT)
    .send({
      machine_token: config.get('machineToken'),
      client: 'terminus',
    })
    .accept('json')
    .catch(formatError);

    config.setGlobal('session', res.body);
  }
};

/**
 * Throws an error if site does not exist.
 * Must call this before any other method but after "login".
 * @returns {string} Site id
 */
exports.assertExists = async () => {

  const sitename = config.get('site');
  if (!sitename)
    throw 'Must provide boostid config file, -s <sitename> cli option, or BOOSTID_SITE environment variable';

  if (!siteMap) {
    const sites = await api(`/users/${config.get('session').user_id}/memberships/sites?limit=500`);
    
    siteMap = {};
    for (const site of sites) {
      siteMap[site.site.name] = site.id;
    }
  }

  if (!(sitename in siteMap))
    throw `You do not have access to the site: ${sitename}`;
  
  siteId = siteMap[sitename];
  
  return siteId;
};

exports.getSiteInfo = async () => {
  const info = await api(`/sites/${siteId}?site_state=true`);

  return info;
};

/**
 * @typedef {Object} EnvInfo
 * @property {boolean} on_server_development Whether sftp mode is enabled or not
 * @property {string} id Unique environment id
 */

/**
 * @async
 * @param {boolean} justMultidevs Only return multidev info
 * @return {Promise<{Object.<string, EnvInfo>}>}
 */
exports.getEnvironments = async (justMultidevs = false) => {
  
  const environments = await api(`/sites/${siteId}/environments`);

  if (justMultidevs) {
    for (const key in environments) {
      if (key in NON_MULTIDEVS) delete environments[key];
    }
  }

  return environments;
};


/**
 * @async
 * @return {Promise<EnvInfo>}
 */
exports.getEnvInfo = async (env) => {
  const info = await api(`/sites/${siteId}/environments/${env}`);

  if (info.on_server_development === undefined)
    info.on_server_development = false;

  return info;
};


/**
 * @async
 * @param {'git'|'sftp'} type
 */
exports.connectionSet = async (env, type) => {
  const { id: workflowId } = await api(`/sites/${siteId}/environments/${env}/workflows`, {
    type: type === 'git' ? 'enable_git_mode' : 'enable_on_server_development',
    params: {},
  });

  await waitForWorkflow(workflowId);
};

const assertValidMultidev = (multidevId) => {
  if (!/^[a-z-]{1,11}$/.test(multidevId) || multidevId in NON_MULTIDEVS)
    throw `Invalid multidev id: ${multidevId}`;
};

exports.createMultidev = async (multidevId, from_environment = 'dev') => {

  assertValidMultidev(multidevId);

  // Create multidev
  const { id: workflowId } = await api(`/sites/${siteId}/workflows`, {
    type: 'create_cloud_development_environment',
    params: {
      environment_id: multidevId,
      deploy: {
        clone_database: { from_environment },
        clone_files: { from_environment },
        annotation: `Create the "${multidevId}" environment.`,
      },
    },
  });

  await waitForWorkflow(workflowId);

};

exports.deleteMultidev = async (multidevId) => {

  assertValidMultidev(multidevId);
  
  const { id: workflowId } = await api(`/sites/${siteId}/workflows`, {
    type: 'delete_cloud_development_environment',
    params: {
      environment_id: multidevId,
      delete_branch: false,
    },
  });

  await waitForWorkflow(workflowId);

};

exports.multidevMergeFromDev = async (multidevId) => {

  assertValidMultidev(multidevId);

  const { id: workflowId } = await api(`/sites/${siteId}/environments/${multidevId}/workflows`, {
    type: 'merge_dev_into_cloud_development_environment',
    params: {
      updatedb: true,
    },
  });

  await waitForWorkflow(workflowId);
};

exports.multidevMergeToDev = async (multidevId) => {

  assertValidMultidev(multidevId);
  
  const { id: workflowId } = await api(`/sites/${siteId}/environments/dev/workflows`, {
    type: 'merge_cloud_development_environment_into_dev',
    params: {
      updatedb: true,
      from_environment: multidevId,
    },
  });

  await waitForWorkflow(workflowId);
};

exports.cloneContent = async (env, from_environment) => {
  const { id: workflowId } = await api(`/sites/${siteId}/environments/${env}/workflows`, {
    type: 'clone_database',
    params: {
      from_environment,
    },
  });

  await waitForWorkflow(workflowId);
};

exports.cloneFiles = async (env, from_environment) => {
  const { id: workflowId } = await api(`/sites/${siteId}/environments/${env}/workflows`, {
    type: 'clone_files',
    params: {
      from_environment,
    },
  });

  await waitForWorkflow(workflowId);
};

exports.getUpstreamInfo = async () => {
  const info = await api(`/sites/${siteId}/code-upstream-updates?base_branch=master`);

  return info;
};

exports.clearCache = async (env) => {
  const { id: workflowId } = await api(`/sites/${siteId}/environments/${env}/workflows`, {
    type: 'clear_cache',
    params: {
      framework_cache: true,
    },
  });

  await waitForWorkflow(workflowId);
};

exports.applyUpstreamUpdates = async (env) => {
  const { id: workflowId } = await api(`/sites/${siteId}/environments/${env}/workflows`, {
    type: 'apply_upstream_updates',
    params: {
      updatedb: true,
      xoption: true, // automatically resolve merge conflicts
    },
  });

  await waitForWorkflow(workflowId);
};

exports.sshKeyAdd = async (keyPath) => {

  if (!keyPath.endsWith('.pub'))
    keyPath = `${keyPath}.pub`;

  let publicKeyContents;
  try {
    publicKeyContents = fs.readFileSync(keyPath, 'utf8');
  } catch (_) {
    throw 'Failed to read SSH key file';
  }

  await api(`/users/${config.get('session.user_id')}/keys`, publicKeyContents);
};

exports.sshKeyList = async () => {
  const keys = await api(`/users/${config.get('session.user_id')}/keys`);

  return keys;
};
