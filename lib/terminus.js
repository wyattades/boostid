const request = require('superagent');


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
  .catch((err) => {
    return Promise.reject('Api call failed: ' + err.status + ' - ' + err.message);
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

// waits for workflow to resolve (I think)
const waitForWorkflow = (workflowId) => api(`${API_URL}/sites/${siteId}/workflows/${workflowId}`);

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
  * @return {Promise<EnvInfo[]>}
  */
exports.getEnvironments = async (justMultidevs) => {
  
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
  const info  = await api(`/sites/${siteId}/environments/${env}`);

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

exports.createMultidev = async (multidevId) => {

  if (!/^\w{1,11}$/.test(multidevId)) throw new Error('Invalid multidev id');

  // Create multidev
  const { id: workflowId } = await api(`/sites/${siteId}/workflows`, {
    type: 'create_cloud_development_environment',
    params: {
      environment_id: multidevId,
      deploy: {
        clone_database: { from_environment: 'dev' },
        clone_files: { from_environment: 'dev' },
        annotation: `Create the "${multidevId}" environment.`,
      },
    },
  });

  await waitForWorkflow(workflowId);

};

exports.deleteMultidev = async (multidevId) => {
  
  const { id: workflowId } = await api(`/sites/${siteId}/workflows`, {
    type: 'delete_cloud_development_environment',
    params: {
      environment_id: multidevId,
      delete_branch: false,
    },
  });

  await waitForWorkflow(workflowId);

};
