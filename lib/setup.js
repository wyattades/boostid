const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./log');
const { run } = require('./utils');
const ter = require('./terminus');
const config = require('./config');
const ci = require('./ci');


const packages = {
  boostid: 'git+https://github.com/wyattades/boostid.git',
  puppeteer: '1.11.0',
  jest: '^23.6.0',
  'jest-environment-puppeteer': '^3.9.0',
  'jest-image-snapshot': '^2.7.0',
  'jest-puppeteer': '^3.9.0',
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
    throw `Cannot access site "${sitename}" on Pantheon. Please create it then try again`;
  });

  logger.info(`Setup dev environment for an existing Pantheon site: ${sitename}`);
  logger.info('----------------------------------------------------');

  logger.info('Updating "dev" environment from "live"...');

  await ter.cloneContent('dev', 'live');
  await ter.cloneFiles('dev', 'live');

  logger.info(`Creating/updating "${multidev}" multidev from "dev"...`);

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

    await ter.cloneContent(multidev, 'dev');
    await ter.cloneFiles(multidev, 'dev');
    // await ter.multidevMergeFromDev(multidev);
  } else {
    await ter.createMultidev(multidev, 'dev');
  }

  logger.success('Remote Pantheon site is setup');

  const { dir } = await inquirer.prompt([{
    type: 'input',
    name: 'dir',
    message: `Clone project into:`,
    default: `./${sitename}`,
    validate: (filePath) => fs.existsSync(filePath) ? 'File/directory already exists' : true,
  }]);

  const pantheonOrigin = `ssh://codeserver.dev.${siteId}@codeserver.dev.${siteId}.drush.in:2222/~/repository.git`;
  await run(`git clone ${pantheonOrigin} ${dir}`);

  const answers = await inquirer.prompt([{
  //   type: 'confirm',
  //   name: 'boostidConfig',
  //   message: 'Create a default `boostid.config.js` file?',
  //   when: () => !fs.existsSync(`${dir}/boostid.config.js`),
  // }, {
    type: 'confirm',
    name: 'testsDir',
    message: 'Create default coverage tests in `__tests__` directory?',
    when: () => !fs.existsSync(`${dir}/__tests__`),
  }, {
    type: 'confirm',
    name: 'ciConfig',
    message: 'Create default CircleCi config file in `.circleci` directory?',
    when: () => !fs.existsSync(`${dir}/.circleci`),
  }, {
    type: 'confirm',
    name: 'npmInstall',
    message: `Install/update the following node modules?\n${JSON.stringify(packages, null, 2)}`,
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
    name: 'sshPubKeyPath',
    message: 'Path to SSH public key used by Pantheon',
    default: () => path.resolve(require('os').homedir(), '.ssh/id_rsa.pub'),
    validate: (filePath) => fs.existsSync(filePath) ? true : `File ${filePath} does not exist`,
  }, {
    type: 'input',
    name: 'slackWebhook',
    message: 'Enter a Slack webhook if you want test status notifications from CircleCI',
    validate: (webhook) => !webhook
      || require('url').parse(webhook).hostname === 'hooks.slack.com' ? true : 'Please enter a valid Slack webhook',
  }, {
    type: 'list',
    name: 'bucket',
    message: 'AWS S3 bucket name. This enables visual regression results to be pushed to a live website',
    choices: () => {
      const aws = config.get('aws') || {};
      const keys = Object.keys(aws);
      return [
        new inquirer.Separator('--- Previous buckets ---'),
        ...keys.map((value) => ({ name: `Existing Bucket: ${value}`, value })),
        new inquirer.Separator(),
        'Specify a new bucket',
        { name: 'None', value: '' },
      ];
    },
  }, {
    type: 'input',
    name: 'bucket',
    message: 'Bucket name',
    when: ({ bucket }) => bucket === 'Different Bucket',
  }, {
    type: 'input',
    name: 'awsAccessKey',
    message: 'AWS access key (must have permission to write to specified S3 bucket)',
    validate: (_) => !!_,
    when: ({ bucket }) => bucket && !config.get(`aws.${bucket}.accessKey`),
  }, {
    type: 'password',
    name: 'awsSecretAccessKey',
    message: 'AWS secret access key',
    validate: (_) => !!_,
    when: ({ bucket }) => bucket && !config.get(`aws.${bucket}.secretAccessKey`),
  }]);

  const { git, ciToken, boostidConfig, testsDir, slackWebhook, ciConfig,
    npmInstall, bucket, awsAccessKey, awsSecretAccessKey } = answers;

  if (bucket && awsAccessKey && awsSecretAccessKey) {
    config.setGlobal(`aws.${bucket}.accessKey`, awsAccessKey.trim());
    config.setGlobal(`aws.${bucket}.secretAccessKey`, awsSecretAccessKey.trim());
  }

  if (ciToken)
    config.setGlobal('ciToken', ciToken);

  if (boostidConfig) {

    const configFile = `
const base = {
  viewPorts: [
    { width: 1920, height: 1080 },
    { width: 500, height: 800, isMobile: true },
  ],
  visualReg: true,
};

module.exports = {
  id: '${siteId}',
  name: '${sitename}',
  bucket: '${bucket || ''}',
  pages: [{
    ...base,
    path: '/',
  }, {
    ...base,
    path: '/404',
  }],
};`;

    fs.outputFileSync(path.resolve(dir, 'boostid.config.js'), configFile);
  }

  if (ciConfig)
    fs.copySync(path.resolve(__dirname, '../local/.circleci/config.yml'), path.resolve(dir, '.circleci/config.yml'));

  if (testsDir)
    fs.copySync(path.resolve(__dirname, '../local/__tests__'), path.resolve(dir, '__tests__'));

  if (npmInstall) {
    const packageJsonPath = path.resolve(dir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      logger.info('Installing node modules');

      await run(`npm i -S ${Object.keys(packages).map((name) => `${name}@${packages[name]}`).join(' ')}`, false, {
        cwd: dir,
        env: {
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true,
        },
      });
    } else {
      logger.info('Creating package.json and installing node modules');

      const packageJson = {
        name: sitename,
        scripts: {
          test: 'boostid test',
        },
        dependencies: packages,
        private: true,
      };
      fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 });

      await run(`npm i`, false, {
        cwd: dir,
        env: {
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true,
        },
      });
    }
  }

  await run(`git remote set-url --add origin ${git}`, false, { cwd: dir });

  logger.info('Output of `git remote -v`:');
  await run(`git remote -v`);

  const envs = {
    PANTHEON_SITE_ID: siteId,
    PANTHEON_SITE_NAME: sitename,
    PANTHEON_MACHINE_TOKEN: config.get('machineToken'),
  };
  if (slackWebhook) envs.SLACK_WEBHOOK_NOTIFY = slackWebhook;
  if (bucket) {
    envs.VISUALREG_BUCKET = bucket;
    envs.AWS_ACCESS_KEY_ID = config.get(`aws.${bucket}.accessKey`);
    envs.AWS_SECRET_ACCESS_KEY = config.get(`aws.${bucket}.secretAccessKey`);
  }

  await ci.createProject(git, envs);

  logger.success('Successfully setup local environment');
};
