#!/usr/bin/env node

const yargs = require('yargs/yargs');
const packageJson = require('../package.json');
// const { run } = require('../lib/utils');
const log = require('../lib/log');
const config = require('../lib/config');


const runModule = (path, method) => (argv) => {

  config.init(argv);

  const res = (method ? require(path)[method](argv) : require(path)(argv));
  if (res instanceof Promise)
    res.catch((err) => {
      log.error(err);
      process.exit(1);
    });
};


const commands = [{
  command: 'setup',
  desc: 'Setup a Pantheon site for development with Boostid',
  builder: (_yargs) => _yargs
  .require('site'),
  handler: runModule('../lib/setup'),
}, {
  command: 'check-local',
  desc: 'Test if local environment is ready for development',
  handler: runModule('../lib/local', 'devReady'),
}, {
  command: 'test',
  desc: 'Run coverage tests locally in a Docker container',
  builder: (_yargs) => _yargs
  // .choices('type', ['all', 'visualreg', 'coverage'])
  // .default('type', 'all')
  .usage(`boostid test\n\nRun coverage tests locally in a Docker container\n\n\
By default, save test results locally in the directory "__boostid_results__"`)
  // .option('s3', {
  //   desc: 'Upload results to AWS S3 bucket',
  //   type: 'boolean',
  // })
  .option('no-save', {
    desc: 'Don\'t save test results locally',
    type: 'boolean',
  })
  .option('no-docker', {
    desc: 'Don\'t run tests using Docker',
    type: 'boolean',
  })
  .option('dev', {
    desc: 'Run Chromium in non-headless mode, so you can see the tests as they run. This also disables Docker',
    type: 'boolean',
  })
  .option('dev-boostid', {
    desc: 'FOR DEVELOPMENT ONLY: Path to a local "boostid" repository',
    type: 'string',
    hidden: true,
    requiresArg: true,
  }),
  handler: runModule('../lib/test', 'coverage'),
}, {
  command: 'config',
  desc: 'Read and write global config',
  example: 'boostid config get session.user_id',
  builder: (_yargs) => _yargs
  .demandCommand(1, '')
  .example('boostid config get aws.my_bucket.accessKey')
  .example('boostid config set aws.my_bucket.secretAccessKey supersecret')
  .command({
    command: 'get [key]',
    desc: 'Prints config value for specified key. Exclude "key" to get all config as json',
    handler: runModule('../lib/config', 'getArg'),
  })
  .command({
    command: 'set <key> <value>',
    desc: 'Set config value for specified key',
    handler: runModule('../lib/config', 'setArg'),
  })
  .command({
    command: 'delete [keys...]',
    desc: 'Delete config value for specified key(s)',
    handler: runModule('../lib/config', 'deleteArg'),
  }),
}, {
  command: 'upstream-updates <multidev>',
  desc: 'Create multidev as copy of "dev" and apply upstream updates',
  handler: runModule('../lib/update'),
}, {
  command: 'ter <cmd> [args...]',
  desc: 'Run terminus commands',
  builder: (_yargs) => _yargs
  .coerce('cmd', (cmd) => {
    if (cmd in require('../lib/terminus').commands()) return cmd;
    else throw `${cmd} is not a valid command`;
  })
  .usage(`boostid ter <cmd>\n\nRun terminus commands. Available commands:\n${require('../lib/terminus').help()}`),
  handler: runModule('../lib/terminus', 'run'),
}, {
  command: 'ci-update-meta <git_url>',
  desc: 'Update CircleCI (specified by the git url) environment variables and SSH keys',
  builder: (_yargs) => _yargs
  .option('slack-webhook', {
    desc: 'Slack webhook url',
    type: 'string',
    requiresArg: true,
  }),
  handler: runModule('../lib/ci', 'updateMeta'),
}, {
  command: 'ci-local <job>',
  // builder: (_yargs) => _yargs
  // .default('job', 'upstream_updates'),
  desc: 'Run CircleCI job locally using Docker',
  handler: runModule('../lib/ci', 'ciLocal'),
}, {
  command: 'ci-trigger <git_url>',
  desc: 'Trigger CircleCI workflows for specified the git url',
  builder: (_yargs) => _yargs
  .example('boostid ci-trigger https://github.com/wyattades/my_project#master')
  .default('branch', 'master'),
  handler: runModule('../lib/ci', 'trigger'),
}, {
  command: 'create-github-repo <username> <reponame>',
  desc: 'Create a Github repository from the command line',
  builder: (_yargs) => _yargs
  .option('public', {
    type: 'boolean',
    desc: 'Make the repo public',
  }),
  handler: runModule('../lib/git', 'createRepo'),
}];

const program = (args) => {

  const parser = yargs(args)
  .scriptName(packageJson.name)
  .usage('Command suite for Rootid development and testing\n\nUsage: $0 <command> [options]')
  .wrap(100)
  // .strict(true) // allow any options
  .demandCommand(1, '')
  // .completion()

  // version
  .version(packageJson.version)
  .alias('v', 'version')

  // help
  .help()
  .alias('help', 'h')
  .command({
    command: 'help [command]',
    desc: 'Output usage information',
    handler: (argv) => {
      const cmd = argv.command;
      if (!cmd) program([ '-h' ]);
      else program([ cmd, '-h' ]);
    },
  })

  // global options
  .option('site', {
    desc: 'Manually set pantheon site name',
    type: 'string',
    requiresArg: true,
    alias: 's',
  })
  .option('machine-token', {
    desc: 'Machine token for Terminus cli',
    type: 'string',
    requiresArg: true,
    alias: 'm',
  })
  .option('ci-token', {
    desc: 'CircleCI API user token',
    type: 'string',
    requiresArg: true,
  });

  // commands
  for (const cmd of commands) parser.command(cmd);

  // run the parser
  parser.argv;
};

program(process.argv.slice(2));
