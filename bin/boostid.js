#!/usr/bin/env node

const yargs = require('yargs/yargs');
const packageJson = require('../package.json');
// const { run } = require('../lib/utils');
const logger = require('../lib/log');
const config = require('../lib/config');


const runModule = (path, method) => (argv) => {

  config.init(argv);

  const res = (method ? require(path)[method](argv) : require(path)(argv));
  if (res instanceof Promise)
    res.catch((err) => {
      logger.error(err);
      process.exit(1);
    });
};

// const runScript = (cmd, args) => (argv) => {
//   spawn(cmd, args ? args : argv._.slice(1), {
//     stdio: 'inherit',
//   });
// };
// const runScript = (path) => (argv) => run([ path, ...argv._.slice(1) ])
// .catch((err) => {
//   logger.error(err);
//   process.exit(1);
// });

const commands = [{
  command: 'setup',
  desc: 'Setup dev environment for a new or existing Pantheon site.\n\
  Creates a directory `sitename` under the current directory',
  builder: (_yargs) => _yargs
  .require('site'),
  // .option('new', {
  //   desc: 'Creates a new Pantheon site',
  // }),
  handler: runModule('../lib/setup'),
}, {
  command: 'check-local',
  desc: 'Test if local environment is ready for development',
  handler: runModule('../lib/local', 'devReady'),
}, {
  command: 'test [type]',
  desc: 'Test stuff',
  builder: (_yargs) => _yargs
  .choices('type', ['all', 'visualreg', 'coverage'])
  .default('type', 'all')
  .option('dev-boostid', {
    desc: 'Uses a local "boostid" directory (for development)',
    type: 'string',
    requiresArg: true,
  }),
  handler: runModule('../lib/test'),
}, {
  command: 'upstream-updates',
  desc: 'Create "updates" multidev and apply upstream updates',
  handler: runModule('../lib/update'),
}, {
  command: 'trigger-circleci <branch>',
  desc: 'Trigger a build workflow in CircleCI',
  handler: runModule('../lib/circleci', 'triggerBuild'),
}, {
  command: 'config-get [key]',
  desc: 'TODO',
  handler: runModule('../lib/config', 'getArg'),
}, {
  command: 'config-set <key> [value]',
  desc: 'TODO',
  handler: runModule('../lib/config', 'setArg'),
}];

const program = (args) => {

  const parser = yargs(args)
  .scriptName(packageJson.name)
  .usage('Command suite for Rootid development and testing\n\nUsage: $0 <command> [options]')
  .wrap(100)
  .strict(true)
  .demandCommand(1, '')
  // .completion()

  // version
  .version(packageJson.version)
  .alias('v', 'version')

  // help
  .alias('h', 'help')
  .command('help <command>', 'View help for a specific command', () => {}, (argv) => {
    program([ argv.command, '-h' ]);
  })

  // global options
  .option('site', {
    desc: 'Manually set pantheon site name or id',
    type: 'string',
    requiresArg: true,
    alias: 's',
    defaultDescription: '$PANTHEON_SITE_NAME',
  })
  .option('machine-token', {
    desc: 'Machine token for Terminus cli',
    type: 'string',
    requiresArg: true,
    alias: 'm',
    defaultDescription: '$PANTHEON_MACHINE_TOKEN',
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
