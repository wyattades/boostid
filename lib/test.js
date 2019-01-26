const path = require('path');
const { execSync } = require('child_process');
const { run, logger } = require('./utils');


const boostidDir = path.resolve(__dirname, '..');
const packageBin = execSync('npm bin', { cwd: process.cwd() }).toString().trim();
// const projectRoot = process.cwd();

module.exports = (argv) => run([
  path.resolve(packageBin, 'jest'),
  '--no-watchman',
  '--runInBand',
  '--config', path.resolve(boostidDir, 'config/jest.config.js'),
], false, {
  env: {
    PATH: process.env.PATH,
    JEST_PUPPETEER_CONFIG: path.resolve(boostidDir, 'config/jest-puppeteer.config.js'),
  },
});
