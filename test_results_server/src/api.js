import * as aws from './aws';
import * as ci from './ci';


const api = {
  aws,
  ci,
};

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
  for (const type in api) {
    try {
      const _auth = JSON.parse(window.localStorage.getItem(`boostid_${type}_auth`));
      if (_auth && typeof _auth === 'object') {
        login(_auth, type);
      }
    } catch (_) {}
  }
};


export const login = async (_auth, type = 'aws') => {
  if (api[type].login(_auth)) {
    // api[type].auth = _auth;
    window.localStorage.setItem(`boostid_${type}_auth`, JSON.stringify(_auth));
  }
};

export const logout = (type = 'aws') => {
  api[type].logout();
  window.localStorage.removeItem(`boostid_${type}_auth`);
};

export const getAuth = (type = 'aws') => api[type].auth;

export const getBuckets = (type = 'aws') => api[type].getBuckets();

export const getProjects = (params) => api[params.bucket === 'ci' ? 'ci' : 'aws'].getProjects(params);
export const getTests = (params) => api[params.bucket === 'ci' ? 'ci' : 'aws'].getTests(params);
export const getResults = (params) => api[params.bucket === 'ci' ? 'ci' : 'aws'].getResults(params);
export const deleteTests = (params, tests) => api[params.bucket === 'ci' ? 'ci' : 'aws'].deleteTests(params, tests);
