const path = require('path');
const { run } = require('./utils');


const boostidDir = path.resolve(__dirname, '..');
// const packageBin = execSync('npm bin').toString().trim();
const projectRoot = process.cwd();

module.exports = (argv) => run([
  path.resolve(projectRoot, './node_modules/.bin/jest'),
  '--no-watchman',
  '--runInBand',
  '--config', path.resolve(boostidDir, 'config/jest.config.js'),
  path.resolve(projectRoot, '__tests__'),
], false, {
  env: {
    JEST_PUPPETEER_CONFIG: path.resolve(boostidDir, 'config/jest-puppeteer.config.js'),
  },
});
