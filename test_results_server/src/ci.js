import superagent from 'superagent';


const DEV = process.env.NODE_ENV === 'development';

const API_BASE = DEV
  ? 'http://localhost:3000/api/ci'
  : '/api/ci';

export let auth = null;

export const logout = () => { auth = null; };

export const request = async (path, body, method) => {

  if (!auth || !auth.token) throw { code: 403 };

  if (!method) method = body ? 'post' : 'get';

  const res = await superagent(method, `${API_BASE}${path}`)
  .type('json')
  .accept('json')
  .auth(auth.token, '')
  .send(body || undefined);

  return res.body;
};

export const login = (_auth) => {
  const { token } = _auth;

  if (!token)
    return false;

  auth = _auth;

  return true;
}

const parseProject = (bucket) => {
  const [vcs_type, username, reponame, ...x] = decodeURIComponent(bucket).split('/');
  if (x.length || !vcs_type || !username || !reponame) throw { code: 400 };
  return {
    vcs_type,
    username,
    reponame,
  };
};

export const getBuckets = async () => {
  const { name, login, selected_email } = await request('/me');
  
  return {
    name,
    login,
    email: selected_email,
  };
};

export const getProjects = async ({ bucket }) => {

  const projects = await request('/projects');
  return projects.map((p) => {
    const label = `${p.vcs_type}/${p.username}/${p.reponame}`;

    let status;
    let time;

    const { last_success, last_non_success } = p.branches.master;
    const s_time = last_success ? new Date(last_success.added_at).getTime() : 0;
    const ns_time = last_non_success ? new Date(last_non_success.added_at).getTime() : 0;

    if (!s_time && !ns_time);
    else if ((!s_time && ns_time) || (s_time && ns_time && ns_time > s_time)) {
      status = 'failing';
      time = ns_time;
    } else if ((!ns_time && s_time) || (s_time && ns_time && s_time > ns_time)) {
      status = 'passing';
      time = s_time;
    }

    return {
      label: `${p.vcs_type}/${p.username} - ${p.reponame}`,
      status,
      time,
      id: encodeURIComponent(label),
    }
  }).sort((a, b) => b.time - a.time);
};

export const getTests = async ({ project }) => {
  const { username, vcs_type, reponame } = parseProject(project);

  const tests = await request(`/project/${vcs_type}/${username}/${reponame}`);

  return tests.map((t) => ({
    id: t.build_num,
    time: new Date(t.queued_at).toLocaleString(),
    status: t.status,
  }));
};

export const getResults = async ({ project, test }) => {
  const { username, vcs_type, reponame } = parseProject(project);

  const artifacts = await request(`/project/${vcs_type}/${username}/${reponame}/${test}/artifacts`);

  const artif = artifacts.find((a) => a.path === 'boostid_results/results.json');


  const results = {
    timestamp: null,
    ciJob: test,
    ciUrl: `https://circleci.com/${vcs_type === 'github' ? 'gh' : 'bb'}/${username}/${reponame}/${test}`,
    ciStatus: '?',
    testResults: null,
    diffFiles: [],
  };

  // console.log(artifacts);
  if (artif) {
    // throw { code: 400, message: 'Could not find test results JSON file in CircleCI artifacts' };

    const json = await request(`/results?url=${encodeURIComponent(artif.url + `?circle-token=${auth.token}`)}`);

    if (!json || typeof json !== 'object')
      throw { code: 400, message: 'Invalid test results JSON file' };
    console.log(json);
    results.testResults = json.testResults;
    results.ciStatus = json.success ? 'success' : 'failure';
  } else {
    const ciResults = await request(`/project/${vcs_type}/${username}/${reponame}/${test}`);

    results.ciStatus = ciResults.status;
    results.timestamp = ciResults.timestamp;
    console.log(ciResults);
  }

  // for each file
  if (artif && Array.isArray(results.testResults)) {

    const image_url = artif.url.substring(0, artif.url.lastIndexOf('/'));

    for (const { assertionResults } of results.testResults) {

      // for each test in that file
      for (const assertResult of assertionResults) {
        if (assertResult.failureMessages && assertResult.failureMessages.length) {
          const match = assertResult.failureMessages[0].match(/([^\s/]+?-diff\.png)/);
          if (match) {
            results.diffFiles.push({
              label: assertResult.ancestorTitles.slice(1).concat([ assertResult.title ]),
              filename: `${image_url}/${encodeURIComponent(match[1])}?circle-token=${auth.token}`,
            });
          }
        }
      }
    }
  }

  return results;
};

export const deleteTests = async () => {
  window.alert('Sorry, deleting CircleCI tests is not supported');
};
