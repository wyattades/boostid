const inquirer = require('inquirer');
const logger = require('./log');
const { run } = require('./utils');
const ter = require('./terminus');
const config = require('./config');


const packages = {
  puppeteer: '1.11.0',
  jest: '^23.6.0',
  'jest-environment-puppeteer': '^3.9.0',
  'jest-image-snapshot': '^2.7.0',
  'jest-puppeteer': '^3.9.0',
};
const installPackages = async () => {
  await run(`npm i -S ${Object.keys(packages).map((name) => `${name}@${packages[name]}`).join(' ')}`);
};


module.exports = async (argv) => {

  if (argv.new) {
    throw 'Sorry, this feature is not yet implemented. \
Please create a Pantheon site manually then run `boostid setup -s <sitename>`';
  }

  if (!config.get('machineToken')) {
    const answers = await inquirer.prompt([{
      type: 'password',
      name: 'machineToken',
      message: 'Please provide a Pantheon machine token (you can generate one on the Pantheon dashboard)',
    }]);

    config.setGlobal('machineToken', answers.machineToken);
  }

  const sitename = config.get('site');

  await ter.login();

  let exists = false;
  try {
    await ter.getInfo();
    exists = true;
  } catch (e) {
    logger.error(e);
  }

  if (!exists) {
    throw `Cannot find site: ${sitename}. Please create a Pantheon site \
manually then run 'boostid setup -s <sitename>'`;
  }

  logger.info(`Setup dev environment for an existing Pantheon site: ${sitename}`);

  // msg.text = 'Fetching site...';

  const answers = await inquirer.prompt([{
    type: 'confirm',
    name: 'boostidConfig',
    message: 'Create a default `boostid.config.js` file?',
  }, {
    type: 'confirm',
    name: 'boostidConfig',
    message: 'Create a default `boostid.config.js` file?',
  }]);
  console.log(answers);
};
