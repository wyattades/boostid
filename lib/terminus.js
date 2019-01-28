const request = require('superagent');
const logger = require('./log');


const API_URL = 'https://dashboard.pantheon.io/api';
const USER_AGENT = 'Terminus/1.9.0 (php_version=7.2.13&script=boot-fs.php)';
const NON_MULTIDEVS = { dev: 0, live: 0, test: 0 };

let siteId = '';
let sessionToken = '';


const api = (path, body, method) => {

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_URL}${path}`)
  .set('User-Agent', USER_AGENT)
  .accept('json')
  .send(body)
  .auth(sessionToken, { type: 'bearer' })
  .then((res) => res.body)
  // Format error
  .catch((err) => {
    throw `${err.status} - ${typeof err.body === 'string' ? err.body.trim() : err.message}`;
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
      throw `Workflow ${workflowId} ${info.result} because:\n  ${info}`;
    }

    msg.stop();
    return info;
  })()
  .catch((err) => {
    msg.stop();
    throw err;
  });
};

exports.login = async (machine_token) => {

  const res = await request.post(`${API_URL}/authorize/machine-token`)
  .set('User-Agent', USER_AGENT)
  .send({
    machine_token,
    client: 'terminus',
  })
  .accept('json');

  sessionToken = res.body.session;
};

exports.setSite = (site_id) => {
  siteId = site_id;
};

exports.setSessionToken = (session_token) => {
  sessionToken = session_token;
};

/**
 * @typedef {Object} EnvInfo
 * @property {boolean} on_server_development Whether sftp mode is enabled or not
 * @property {string} id Unique environment id
 */

/**
 * @async
 * @param {boolean} justMultidevs Only return multidev info
 * @return {Promise<EnvInfo[]>}
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
      xoption: true,
      // 'accept-upstream': false, // automatically resolve merge conflicts
    },
  });

  await waitForWorkflow(workflowId);
};
