const request = require('superagent');
const inquirer = require('inquirer');

const config = require('./config');
const log = require('./log');


const API_BASE = 'https://api.github.com';

let _username;
let _token = '';

const api = (path, body, method) => {

  if (!method) method = body ? 'POST' : 'GET';

  return request(method, `${API_BASE}${path}`)
  .accept('json')
  .type('json')
  .send(body || undefined)
  .auth(_username, _token)
  .then((res) => res.body)
  .catch((err) => {
    // const res = err.response;
    // const msg = res && typeof res.body === 'object' ? res.body.message : res.body;
    // err.message = `CircleCI: Error ${err.status} - ${typeof msg === 'string' ? msg.trim() : err.message}`;
    throw err;
  });
};

exports.login = async (username) => {
  _username = username;

  _token = config.get(`github.${username}.token`);
  if (_token) return;

  const { password } = await inquirer.prompt([
    { name: 'password', message: `Please enter your Github password for user: ${username}`,
      type: 'password', mask: '*', validate: (x) => !!x },
  ]);

  const existing = await request('GET', `${API_BASE}/authorizations`)
  .accept('json')
  .type('json')
  .auth(username, password)
  .then((res) => res.body);

  const boostidAuth = existing.find(({ note }) => note === 'boostid_scripts');
  if (boostidAuth) {
    await request('DELETE', `${API_BASE}/authorizations/${boostidAuth.id}`)
    .auth(username, password);
  }

  const authData = await request('POST', `${API_BASE}/authorizations`)
  .accept('json')
  .type('json')
  .send({
    scopes: ['repo', 'public_repo', 'user'],
    note: 'boostid_scripts',
  })
  .auth(username, password)
  .then((res) => res.body);

  _token = authData.token;

  config.setGlobal(`github.${username}.token`, _token);
}

exports.createRepo = async ({ username, reponame, public: _public }) => {

  await exports.login(username);

  const org = config.get(`github.${_username}.org`);

  await api(org ? `/orgs/${org}/repos` : '/user/repos', {
    name: reponame,
    private: !_public,
  });

  log.success(`Created repo: ${reponame}`);
};
