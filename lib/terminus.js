const request = require('superagent');
const logger = require('./log');
const config = require('./config');


const API_URL = 'https://dashboard.pantheon.io/api';
const USER_AGENT = 'Terminus/1.9.0 (php_version=7.2.13&script=boot-fs.php)';
const NON_MULTIDEVS = { dev: 0, live: 0, test: 0 };

const siteMap = {};
let siteId;

const api = (path, body, method) => {

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_URL}${path}`)
  .set('User-Agent', USER_AGENT)
  .accept('json')
  .send(body)
  .auth(config.get('session.session'), { type: 'bearer' })
  .then((res) => res.body)
  // Format error
  .catch((err) => {
    const res = err.response;
    const msg = res && typeof res.body === 'object' ? res.body.message : res.body;
    err.message = `Terminus: Error ${err.status} - ${typeof msg === 'string' ? msg.trim() : err.message}`;
    throw err;
  });
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

// waits for workflow to finish
const waitForWorkflow = (workflowId) => {
  const msg = logger.spinner(`Waiting for workflow: ${workflowId}...`);

  return (async () => {
    let info;
    let runTimes = 0;
    let waitFor = 2000;
    do {
      info = await api(`/sites/${siteId}/workflows/${workflowId}`);
    
      await new Promise((resolve) => setTimeout(resolve, waitFor));
      waitFor *= 1.5;

      if (runTimes++ > 13) // about 4 minutes
        throw `Workflow ${workflowId} timed out`;

    } while (!info.result);

    if (info.result !== 'succeeded') {
      let reason = Array.isArray(info.reason) ? info.reason.join('\n  ') : info.reason;
      if (!reason) {
        logger.error(info);
        reason = '[See above]';
      }
      throw `Workflow ${workflowId} ${info.result} because:\n  ${reason}`;
    }

    msg.stop();
    return info;
  })()
  .catch((err) => {
    msg.stop();
    throw err;
  });
};

// Run commands from CLI
exports.run = async ({ cmd, args }) => {

  // const INVALID = { login: true, run: true, setup: true, assertExists: true };
  const CMDS = { ...exports };
  for (const k of ['login', 'run', 'setup', 'assertExists']) delete CMDS[k];

  const fn = CMDS[cmd];
  if (!fn) {
  
    const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/mg;
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    const getParamNames = (func) => {
      const fnStr = func.toString().replace(STRIP_COMMENTS, '');
      let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
      if (result === null)
        result = [];
      return result;
    };

    const cmds = Object.keys(CMDS)
    .map((k) => `${k}${getParamNames(CMDS[k]).map((arg) => ` <${arg}>`).join('')}`)
    .join('\n');

    throw `Boostid-Terminus command "${cmd}" is not defined. Here are the list of commands:\n\x1b[0m${cmds}`;
  }

  await exports.login();

  exports.assertExists();

  const res = await fn(...args);
  if (typeof res === 'object') console.log(JSON.stringify(res, null, 2));
  else if (res !== undefined) console.log(res);
};

exports.login = async () => {

  if (!config.get('machineToken'))
    throw 'Must provide -m <machineToken> cli option or PANTHEON_MACHINE_TOKEN environment variable';

  if (!config.get('session')) {

    const res = await request.post(`${API_URL}/authorize/machine-token`)
    .set('User-Agent', USER_AGENT)
    .send({
      machine_token: config.get('machineToken'),
      client: 'terminus',
    })
    .accept('json');

    config.setGlobal('session', res.body);
  }

  const sites = await api(`/users/${config.get('session').user_id}/memberships/sites?limit=500`);
  for (const site of sites) {
    siteMap[site.site.name] = site;
  }
};

/**
 * Throws an error if site does not exist.
 * Must call this before any other method but after "login".
 * Returns site id
 * @returns {string}
 */
exports.assertExists = () => {
  const sitename = config.get('site');
  if (!sitename)
    throw 'Must provide boostid config file, -s <siteId> cli option, or PANTHEON_SITE_NAME environment variable';

  if (!(sitename in siteMap))
    throw `You do not have access to the site: ${sitename}`;
  
  siteId = siteMap[sitename].id;
  
  return siteId;
};

exports.getSiteInfo = async () => {

  if (!(config.get('site') in siteMap))
    throw 'Could not find site';

  return siteMap[config.get('site')];
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

exports.createMultidev = async (multidevId, from_environment = 'dev') => {

  if (!/^\w{1,11}$/.test(multidevId) || multidevId in NON_MULTIDEVS)
    throw `Invalid multidev id: ${multidevId}`;

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

  if (!/^\w{1,11}$/.test(multidevId) || multidevId in NON_MULTIDEVS)
    throw `Invalid multidev id: ${multidevId}`;
  
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
  const { id: workflowId } = await api(`/sites/${siteId}/environments/${multidevId}/workflows`, {
    type: 'merge_dev_into_cloud_development_environment',
    params: {
      updatedb: true,
    },
  });

  await waitForWorkflow(workflowId);
};

exports.multidevMergeToDev = async (multidevId) => {
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
