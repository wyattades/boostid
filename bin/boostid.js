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
  // .option('new', {
  //   desc: 'Creates a new Pantheon site',
  // }),
  handler: runModule('../lib/setup'),
// }, {
//   command: 'check-local',
//   desc: 'Test if local environment is ready for development',
//   handler: runModule('../lib/local', 'devReady'),
}, {
  command: 'test',
  desc: 'Run coverage tests locally in a Docker container',
  builder: (_yargs) => _yargs
  // .choices('type', ['all', 'visualreg', 'coverage'])
  // .default('type', 'all')
  .option('results', {
    desc: 'Local path to store test results. Set to "S3" if you want the results uploaded online',
    type: 'string',
    default: './__image_snapshots__',
    requiresArg: true,
  })
  .option('dev-boostid', {
    desc: 'FOR DEVELOPMENT ONLY: Path to a local "boostid" repository',
    type: 'string',
    requiresArg: true,
  }),
  handler: runModule('../lib/test'),
}, {
  command: 'config',
  desc: 'Read and write global config',
  example: 'boostid config-get session.user_id',
  builder: (_yargs) => _yargs
  .demandCommand(1, '')
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
  // handler: runModule('../lib/config', 'getArg'),
// }, {
//   command: 'config-set <key> [value]',
//   desc: 'Set config value for specified "key". Exclude "value" to delete the key instead',
//   example: 'boostid config-set foo.bar biz',
//   handler: runModule('../lib/config', 'setArg'),
}, {
  command: 'upstream-updates <multidev>',
  desc: 'Create multidev as copy of "dev" and apply upstream updates',
  handler: runModule('../lib/update'),
}, {
  command: 'ci-update-meta <git>',
  desc: 'Update CircleCI environment variables of specified git url',
  builder: (_yargs) => _yargs
  .option('slack-webhook', {
    desc: 'Slack webhook url',
    type: 'string',
    requiresArg: true,
  }),
  handler: runModule('../lib/ci', 'updateMeta'),
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
  // }, {
  //   command: 'trigger-circleci <branch>',
  //   desc: 'Trigger a build workflow in CircleCI',
  //   handler: runModule('../lib/circleci', 'triggerBuild'),
}];

const program = (args) => {

  const parser = yargs(args)
  .scriptName(packageJson.name)
  .usage('Command suite for Rootid development and testing\n\nUsage: $0 <command> [options]')
  .wrap(100)
  // .strict(true) // allow any options
  .demandCommand(1, '')
  .env('BOOSTID')
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
    defaultDescription: '$BOOSTID_SITE',
  })
  .option('machine-token', {
    desc: 'Machine token for Terminus cli',
    type: 'string',
    requiresArg: true,
    alias: 'm',
    defaultDescription: '$BOOSTID_MACHINE_TOKEN',
  })
  .option('ci-token', {
    desc: 'CircleCI API user token',
    type: 'string',
    requiresArg: true,
  });
  // .option('reponame', {
  //   desc: 'Github repository name',
  //   type: 'string',
  //   requiresArg: true,
  //   alias: 'n',
  // });

  // config file
  // .option('config', {
  //   desc: 'Path to custom config file',
  //   type: 'string',
  //   requiresArg: true,
  //   default: 'boostid.config.js',
  //   alias: 'c',
  //   coerce: (filename) => {
  //     config.setFilename(filename);
  //     return filename;
  //   },
  // });

  // commands
  for (const cmd of commands) parser.command(cmd);

  // run the parser
  parser.argv;
};

program(process.argv.slice(2));
