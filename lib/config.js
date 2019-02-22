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

  if (config)
    return config;

  let localConfig;
  try {
    localConfig = loadConfig();
  } catch (e) {
    loadError = e;
    localConfig = {};
  }

  configStore = new ConfigStore('boostid');

  const envVars = {};
  for (const key in process.env) {
    if (key.startsWith('BOOSTID_')) {
      const realKey = key.substring(8).toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      envVars[realKey] = process.env[key];
    }
  }

  config = Object.assign({}, configStore.all, localConfig, envVars, argv);
  delete config._;
  delete config.$0;

  if (config.name) config.site = config.name;
  
  if (!config.multidev) config.multidev = 'boostidup';

  if (!config.machineToken) {
    const tokenDir = path.resolve(os.homedir(), '.terminus/cache/tokens');

    try {
      const tokens = fs.readdirSync(tokenDir);
      const token = fs.readJSONSync(path.resolve(tokenDir, tokens[0]));
      if (token.token) {
        exports.setGlobal('machineToken', token.token);
      }
    } catch (_) { /**/ }
  }

  return config;
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
    const value = configStore.get(key);
    if (value === undefined);
    else if (typeof value === 'string') console.log(value);
    else console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(JSON.stringify(configStore.all, null, 2));
  }
};

exports.deleteArg = ({ keys }) => {
  for (const key of keys) configStore.delete(key);
  log.info(`Deleted config key(s): ${keys}`);
};
