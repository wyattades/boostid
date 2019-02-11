const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const log = require('./log');
const { run, sshFingerprint } = require('./utils');
const ter = require('./terminus');
const config = require('./config');
const ci = require('./ci');


const packages = {
  boostid: 'github:wyattades/boostid',
  puppeteer: '1.12.2',
  jest: '^23.6.0',
  'jest-environment-puppeteer': '^3.9.0',
  'jest-image-snapshot': '^2.7.0',
  'jest-puppeteer': '^3.9.0',
};

const followCI = async ({ git, slackWebhook }) => {

  log.info('Creating/updating project on CircleCI');

  ci.setGitUrl(git);

  let exists = false;
  try {
    await ci.projectInfo();
    exists = true;
  } catch (err) {
    if (err.status !== 404)
      throw err;
  }

  if (exists)
    log.warn('Project already exists on CircleCI');
  else
    await ci.createProject();

  await ci.updateMeta({ slackWebhook });

  log.success('Successfully created CircleCI project');
};

const pantheonSetup = async () => {

  const multidev = config.get('multidev');

  // logger.info('Updating "dev" environment from "live"...');

  // await ter.cloneContent('dev', 'live');
  // await ter.cloneFiles('dev', 'live');

  log.info(`Creating/updating "${multidev}" multidev from "dev"... (this may take a while)`);

  let info;
  try {
    info = await ter.getEnvInfo(multidev);
  } catch (err) {
    if (err.status !== 404)
      throw err;
  }

  if (info) {
    // if (info.on_server_development)
    //   await ter.connectionSet(multidev, 'git');

    // await ter.cloneContent(multidev, 'dev');
    // await ter.cloneFiles(multidev, 'dev');

    // TEMP because I don't know how merging works yet
    // await ter.deleteMultidev(multidev);
    // await ter.createMultidev(multidev, 'dev');

    // await ter.multidevMergeFromDev(multidev);
  } else {
    await ter.createMultidev(multidev, 'dev');
  }

  log.success('Remote Pantheon site is setup');
};

const loadSSH = async (keyPath) => {

  if (keyPath === 'auto') {
    keyPath = path.resolve(os.homedir(), '.ssh/id_rsa_boostid');
    if (!fs.existsSync(keyPath)) {
      try {
        await run(['ssh-keygen', '-t', 'rsa', '-f', keyPath, '-N', '']);
        await log.promise(ter.sshKeyAdd(keyPath), 'Uploading key to Pantheon...');
      } catch (err) {
        log.error(err);
        return 'Failed to generate passwordless SSH key automatically';
      }

      log.success('Created new SSH key and pushed it to Pantheon');
    }
  }

  if (!path.isAbsolute(keyPath))
    return 'Path must be absolute';

  const privateKeyPath = keyPath.replace(/\.pub$/, '');
  const publicKeyPath = `${privateKeyPath}.pub`;
  let privateKeyContent;
  let publicKeyContent;

  try {
    privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
    publicKeyContent = fs.readFileSync(publicKeyPath, 'utf8');
  } catch (_) {
    return 'Public or private key does not exist or cannot be read';
  }


  if (privateKeyContent.includes(',ENCRYPTED'))
    return `SSH key cannot be password protected for use with CircleCI.
Please provide the path to a passwordless key, or enter "auto" and we'll create the key \
"~/.ssh/id_rsa_boostid" (using "ssh-keygen" command) and add it to your Pantheon account automatically`;

  config.setGlobal('ssh', {
    fingerprint: sshFingerprint(publicKeyContent),
    privateKey: privateKeyPath,
  });

  return true;
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

  await log.promise(ter.login(), 'Authenticating with Pantheon...');
  let siteId;
  try {
    siteId = await log.promise(ter.assertExists(), 'Getting site info...');
  } catch (_) {
    throw `Cannot access site "${sitename}" on Pantheon. Please create it then try again`;
  }

  // config.setLocal('id', siteId);

  log.info(`Setup dev environment for an existing Pantheon site: ${sitename}`);
  // logger.info('----------------------------------------------------');

  const { dir } = await inquirer.prompt([{
    type: 'input',
    name: 'dir',
    message: `Clone project into:`,
    default: `./${sitename}`,
    validate: (filePath) => fs.existsSync(filePath) ? 'File/directory already exists' : true,
  }]);

  const pantheonOrigin = `ssh://codeserver.dev.${siteId}@codeserver.dev.${siteId}.drush.in:2222/~/repository.git`;
  await run(`git clone ${pantheonOrigin} ${dir}`);

  // Try to find ssh key automatically. Key cannot be password-protected
  // if (!config.get('ssh.fingerprint')) {
  //   let sshDebug;
  //   try {
  //     sshDebug = await run(`ssh -p 2222 -vT codeserver.dev.${siteId}@codeserver.dev.${siteId}.drush.in`, true);
  //   } catch (e) {
  //     sshDebug = typeof e === 'string' && e;
  //   }

  //   const match = sshDebug.match(/Offering .*? public key:\s+(.*?)\s+debug1: Server accepts key/);

  //   if (match) loadSSH(match[1]);
  // }

  const answers = await inquirer.prompt([{
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
    validate: (git) => {
      try {
        ci.setGitUrl(git);
        return true;
      } catch (err) {
        return err;
      }
    },
    default: argv.git,
  }, {
    type: 'password',
    name: 'ciToken',
    message: 'CircleCI user API token (obtain from https://circleci.com/account/api)',
    mask: '*',
    when: () => !config.get('ciToken'),
    validate: (_) => !!_,
  }, {
    type: 'input',
    name: 'sshKeyPath',
    message: 'Absolute path to SSH key used by your Pantheon account',
    when: () => !config.get('ssh.fingerprint'),
    default: () => path.resolve(os.homedir(), '.ssh/id_rsa'),
    validate: loadSSH,
  }, {
    type: 'input',
    name: 'slackWebhook',
    message: 'Enter a Slack webhook if you want test status notifications from CircleCI',
    validate: (webhook) => !webhook
      || require('url').parse(webhook).hostname === 'hooks.slack.com' ? true : 'Please enter a valid Slack webhook',
    default: argv.slackWebhook,
  }, {
    type: 'list',
    name: 'bucket',
    message: 'AWS S3 bucket name. This enables visual regression results to be pushed to a live website',
    choices: () => {
      const aws = config.get('aws') || {};
      const keys = Object.keys(aws);
      return [
        ...keys.map((value) => ({ name: `Previously used bucket: ${value}`, value })),
        new inquirer.Separator(),
        'Specify a new bucket',
        { name: 'None', value: '' },
      ];
    },
  }, {
    type: 'input',
    name: 'bucket',
    message: 'Bucket name',
    when: ({ bucket }) => bucket === 'Specify a new bucket',
  }, {
    type: 'input',
    name: 'awsAccessKey',
    message: 'AWS access key id (must have permission to write to specified S3 bucket)',
    validate: (_) => !!_,
    when: ({ bucket }) => bucket && !config.get(`aws.${bucket}.accessKey`),
  }, {
    type: 'password',
    name: 'awsSecretAccessKey',
    message: 'AWS secret access key',
    mask: '*',
    validate: (_) => !!_,
    when: ({ bucket }) => bucket && !config.get(`aws.${bucket}.secretAccessKey`),
  }]);

  const { git, ciToken, boostidConfig, testsDir, slackWebhook, ciConfig,
    npmInstall, bucket, awsAccessKey, awsSecretAccessKey } = answers;

  if (bucket)
    config.setLocal('bucket', bucket);

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
  multidev: '${config.get('multidev')}',
  pages: [{
    ...base,
    path: '/',
  }, {
    ...base,
    path: '/404',
  }],
};
`;

    fs.outputFileSync(path.resolve(dir, 'boostid.config.js'), configFile);
  }

  if (ciConfig)
    fs.copySync(path.resolve(__dirname, '../local/.circleci/config.yml'), path.resolve(dir, '.circleci/config.yml'));

  if (testsDir)
    fs.copySync(path.resolve(__dirname, '../local/__tests__'), path.resolve(dir, '__tests__'));

  if (npmInstall) {
    const packageJsonPath = path.resolve(dir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      log.info('Creating package.json');

      const packageJson = {
        name: sitename,
        scripts: {
          test: 'boostid test',
        },
        dependencies: {},
        private: true,
      };
      fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    log.info('Installing node modules');

    await run(`npm i -S ${Object.keys(packages).map((name) => `${name}@${packages[name]}`).join(' ')}`, false, {
      cwd: dir,
      env: {
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true,
      },
    });
  
  }

  await run(`git remote set-url --add origin ${git}`, false, { cwd: dir });

  log.info('Output of `git remote -v`:');
  await run(`git remote -v`, false, { cwd: dir });

  await pantheonSetup();

  await followCI({ git, slackWebhook });

  log.success('Finished setup');
};
