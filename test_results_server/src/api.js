// import * as aws from './aws';
import * as ci from './ci';


// const api = {
//   aws,
//   ci,
// };

// const auth = {
//   aws: null,
//   ci: null,
// };

// let mode = window.localStorage.getItem('boostid_ci_mode') ? 'ci' : 'aws';

// export const setMode = (_mode) => {
//   mode = _mode;
//   window.localStorage.setItem('boostid_ci_mode', mode === 'ci' ? '1' : '')
//   // mode = mode === 'aws' ? 'ci' : 'aws';
// };

// export const getMode = () => mode;

export const init = () => {
  // for (const type in api) {
    try {
      const _auth = JSON.parse(window.localStorage.getItem(`boostid_ci_auth`));
      if (_auth && typeof _auth === 'object') {
        login(_auth);
      }
    } catch (_) {}
  // }
};


export const login = async (_auth) => {
  if (ci.login(_auth)) {
    // api[type].auth = _auth;
    window.localStorage.setItem(`boostid_ci_auth`, JSON.stringify(_auth));
  }
};

export const logout = () => {
  ci.logout();
  window.localStorage.removeItem(`boostid_ci_auth`);
};

export const getAuth = () =>ci.auth;



export const getBuckets = () => ci.getBuckets();

export const getProjects = (params) => ci.getProjects(params);
export const getTests = (params) => ci.getTests(params);
export const getResults = (params) => ci.getResults(params);
export const deleteTests = (params, tests) => ci.deleteTests(params, tests);
