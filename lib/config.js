const fs = require('fs-extra');
const path = require('path');
const ConfigStore = require('configstore');
const os = require('os');
const log = require('./log');
const { deepGet, deepSet } = require('./utils');

let configStore;
let config;
let loadError;


const loadConfig = () => {
  let configPath = path.resolve(process.cwd(), 'boostid.config.js');
  
  if (!fs.existsSync(configPath)) {
    configPath += 'on';
    if (!fs.existsSync(configPath)) {
      throw 'Failed to find boostid config file';
    }
  }

  try {
    if (configPath.endsWith('.json'))
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    else
      config = require(configPath);
  } catch (_) {
    throw 'Config file is invalid json or js';
  }

  if (typeof config !== 'object')
    throw 'Config file must contain an object';
  
  if (!config.id || !config.name)
    throw 'Config files must contain "name" and "id" parameters';

  // const store = new ConfigStore('boostid');
  // store.all = {

  // };

  return config;
};

exports.assertExists = () => {
  if (loadError) throw loadError;
};

exports.init = (argv = {}) => {

  if (config) return;

  try {
    config = loadConfig();
  } catch (e) {
    loadError = e;
    config = {};
  }

  if (config.name) config.site = config.name;

  configStore = new ConfigStore('boostid');

  // const argvNew = { ...argv };
  // delete argvNew._;
  // delete argvNew.$0;

  // config = Object.assign({}, configStore.all, config, argvNew);
  
  if (argv.machineToken) config.machineToken = argv.machineToken;
  else if (configStore.has('machineToken')) config.machineToken = configStore.get('machineToken');
  else {
    const tokenDir = path.resolve(os.homedir(), '.terminus/cache/tokens');

    try {
      const tokens = fs.readdirSync(tokenDir);
      const token = fs.readJSONSync(path.resolve(tokenDir, tokens[0]));
      if (token.token) {
        exports.setGlobal('machineToken', token.token);
      }
    } catch (_) {}
  }

  if (argv.ciToken) config.ciToken = argv.ciToken;
  else if (configStore.has('ciToken')) config.ciToken = configStore.get('ciToken');

  if (argv.site) config.site = argv.site;

  if (argv.bucket) config.bucket = argv.bucket;
  // if (argv.id) config.id = argv.id;

  if (configStore.has('ssh')) config.ssh = configStore.get('ssh');

  if (configStore.has('aws')) config.aws = configStore.get('aws');

  if (configStore.has('session')) config.session = configStore.get('session');
  
  if (!config.multidev) config.multidev = 'boostid-up';
  
};

exports.setGlobal = (key, value) => {
  configStore.set(key, value);
  deepSet(config, key, value);
};

exports.setLocal = (key, value) => deepSet(config, key, value);

exports.get = (key) => deepGet(config, key);

exports.all = () => config;

exports.setArg = ({ key, value }) => {
  log.info(`Set config key: ${key}=${value}`);
  configStore.set(key, value);
};
exports.getArg = ({ key }) => {
  if (key) {
    const value = exports.get(key);
    if (value === undefined);
    else if (typeof value === 'string') console.log(value);
    else console.log(JSON.stringify(value, null, 2));
  } else console.log(JSON.stringify(config, null, 2));
};
exports.deleteArg = ({ keys }) => {
  for (const key of keys) configStore.delete(key);
  log.info(`Deleted config key(s): ${keys}`);
};
