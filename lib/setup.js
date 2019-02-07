const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./log');
const { run } = require('./utils');
const ter = require('./terminus');
const config = require('./config');
const ci = require('./ci');


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

const multidev = 'updates';

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

  const { id: siteId } = await ter.getInfo()
  .catch((err) => {
    logger.error(err);
    throw `Cannot find site: ${sitename}. Please create a Pantheon site \
manually then run 'boostid setup -s <sitename>'`;
  });

  logger.info(`Setup dev environment for an existing Pantheon site: ${sitename}`);

  logger.info('Updating `dev` environment from `live`...');

  await ter.cloneContent('dev', 'live');
  await ter.cloneFiles('dev', 'live');

  logger.info(`Creating '${multidev}' multidev...`);

  let info;
  try {
    info = await ter.getEnvInfo(multidev);
  } catch (err) {
    if (err.statusCode !== 404)
      throw err;
  }

  if (info) {
    if (info.on_server_development)
      await ter.connectionSet(multidev, 'git');
    ter.multidevMergeFromDev(multidev);
  } else {
    await ter.createMultidev(multidev, 'dev');
  }

  logger.success(`Created '${multidev}' multidev`);

  const { dir } = await inquirer.prompt([{
    type: 'input',
    name: 'dir',
    message: `Clone project into:`,
    default: `./${sitename}`,
  }]);

  const pantheonOrigin = `ssh://codeserver.dev.${siteId}@codeserver.dev.${siteId}.drush.in:2222/~/repository.git`;
  await run(`git clone ${pantheonOrigin} ${dir}`);

  const { git, ciToken, boostidConfig, testsDir, slackWebhook } = await inquirer.prompt([{
    type: 'confirm',
    name: 'boostidConfig',
    message: 'Create a default `boostid.config.js` file?',
    when: () => !fs.existsSync(`${dir}/boostid.config.js`),
  }, {
    type: 'confirm',
    name: 'testsDir',
    message: 'Create default coverage tests in `__tests__` directory?',
    when: () => !fs.existsSync(`${dir}/__tests__`),
  }, {
    type: 'input',
    name: 'git',
    message: 'Enter a git repository url (If you don\'t have one, create one now using either Github or Bitbucket)',
  }, {
    type: 'password',
    name: 'ciToken',
    message: 'CircleCI user API token (obtain from https://circleci.com/account/api)',
    when: () => !config.get('ciToken'),
  }, {
    type: 'input',
    name: 'slackWebhook',
    message: 'Enter a Slack webhook (for CircleCI) if you want test status notifications',
  }]);

  if (ciToken)
    config.setGlobal('ciToken', ciToken);

  if (boostidConfig)
    fs.copySync(path.resolve(__dirname, '../local/boostid.config.js'), dir);

  if (testsDir)
    fs.copySync(path.resolve(__dirname, '../local/__tests__'), dir);

  await run(`git remote set-url --add origin ${git}`, false, { cwd: dir });

  logger.info('Output of `git remote -v`:');
  await run(`git remote -v`);

  await ci.createProject(git, {
    CIRCLE_USER_TOKEN: '',
  });

  logger.success('Successfully setup local environment');
};
