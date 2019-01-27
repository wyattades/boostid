const fs = require('fs-extra');
const path = require('path');
// const logger = require('./log');

let config;
let filename;
exports.setFilename = (_filename) => {
  filename = _filename;
};

exports.get = () => {
  if (config) return config;

  const configPath = path.resolve(process.cwd(), filename);

  if (!/\.js(on)?$/.test(configPath)) {
    throw 'Config file must of type json or js';
  }
  
  if (!fs.existsSync(configPath)) {
    throw `Failed to find config file: ${configPath}`;
  }
  console.log(configPath);
  try {
    if (configPath.endsWith('.json'))
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    else
      config = require(configPath);
  } catch (_) {
    throw 'Config file is invalid json or js';
  }

  if (typeof config !== 'object') {
    throw 'Config file must contain an object';
  }

  return config;
};

// exports.saveConfig = (name, config) => {

// };
