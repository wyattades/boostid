// const { findFileUp } = require('./utils');
const fs = require('fs');
const path = require('path');

exports.loadConfig = (configPath = 'boostid.config.js') => {
  // path: git rev-parse --show-toplevel
  // git-remote: git config --get remote.origin.url

  // const path = findFileUp(name);
  // if (!path) throw 'Could not find config file!';

  configPath = path.resolve(process.cwd(), configPath);

  let config;
  try {
    if (path.endsWith('.json'))
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    else if (path.endsWith('.js'))
      config = require(path);
    else throw '';
  } catch (_) {
    throw 'Config file is invalid json or js';
  }

  if (typeof config !== 'object')
    throw 'Config file must contain a config object';

  return config;

  // os.homedir();

  // const [err,txt] = await run('git rev-parse --show-toplevel');
  // console.log(err, txt);
};

// exports.saveConfig = (name, config) => {

// };
