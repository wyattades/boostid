const fs = require('fs-extra');
const path = require('path');
// const logger = require('./log');

let config;


exports.get = () => {
  if (config) return config;

  let configPath = path.resolve(process.cwd(), 'boostid.config.js');

  // if (!/\.js(on)?$/.test(configPath)) {
  //   throw 'Config file must of type json or js';
  // }
  
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

  return config;
};

// exports.saveConfig = (name, config) => {

// };
