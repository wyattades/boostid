const path = require('path');
const { spawn } = require('child_process');


const boostidDir = path.resolve(__dirname, '..');
// const packageBin = execSync('npm bin').toString().trim();
const projectRoot = process.cwd();

module.exports = (argv) => {
  spawn(path.resolve(projectRoot, './node_modules/.bin/jest'),
    ['--no-watchman', '--runInBand', '--config', path.resolve(boostidDir, 'config/jest.config.js'), path.resolve(projectRoot, '__tests__')], {
    stdio: 'inherit',
    env: {
      JEST_PUPPETEER_CONFIG: path.resolve(boostidDir, 'config/jest-puppeteer.config.js'),
    },
  })
  .once('error', (err) => {
    throw err; // Failed to spawn jest
  });
};
