const ora = require('ora');
const inquirer = require('inquirer');
const { run } = require('./utils');


const PROGRAMS = [{
  cmd: 'node',
  minVersion: 8.2,
}, {
  cmd: 'php',
  minVersion: 7.2,
}, {
  cmd: 'docker',
  minVersion: 18.0,
}];

exports.devReady = async () => {

  const msg = ora('Fetching local environment info...').start();
  
  const results = await Promise.all(PROGRAMS.map(async (prgm) => {
    let [err, version] = await run(`${prgm.cmd} -v`, true);

    if (err) return `${prgm.cmd}: Not setup in this environment`;

    const match = version.match(/.*?v?(\d+\.\d+)/);
    version = Number.parseFloat(match && match[1]);

    if (!version || Number.isNaN(version)) return `${prgm.cmd}: Failed to find version`;

    if (version < prgm.minVersion) return `${prgm.cmd}: Installed version is ${version}, but boostid requires ${prgm.minVersion}`;

    return `${prgm.cmd}: Good`;
  }));

  msg.stop();

  console.log('Local environment info:');
  console.log(results.join('\n'));
};

exports.runTests = async () => {
  `docker cp differencify-react:/differencify-react/src/tests/__image_snapshots__/ src/tests/`;
};

