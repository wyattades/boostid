// const inquirer = require('inquirer');
const { run } = require('./utils');
const logger = require('./log');


const PROGRAMS = [{
  cmd: 'node',
  minVersion: 8.2,
}, {
// }, {
//   cmd: 'php',
//   minVersion: 7.2,
  cmd: 'docker',
  minVersion: 18.0,
}];

exports.devReady = async () => {

  const wait = logger.spinner('Fetching local environment info...');
  
  const results = await Promise.all(PROGRAMS.map(async (prgm) => {
    let version;
    try {
      version = await run(`${prgm.cmd} -v`, true);
    } catch (_) {
      return {
        cmd: prgm.cmd,
        type: 'info',
        msg: 'Not setup in this environment',
      };
    }

    const match = version.match(/.*?v?(\d+\.\d+)/);
    version = Number.parseFloat(match && match[1]);

    if (!version || Number.isNaN(version))
      return {
        cmd: prgm.cmd,
        type: 'error',
        msg: 'Failed to find version',
      };

    if (version < prgm.minVersion)
      return {
        cmd: prgm.cmd,
        type: 'warn',
        msg: `Installed version is ${version}, but boostid requires ${prgm.minVersion}`,
      };

    return {
      cmd: prgm.cmd,
      type: 'info',
      msg: 'Good',
    };
  }));

  wait.stop();

  logger.info('Local environment info:');
  logger.info('-----------------------');
  for (const { type, msg, cmd } of results) {
    logger[type](`  ${cmd}: ${msg}`);
  }
};

exports.runTests = async () => {

};
