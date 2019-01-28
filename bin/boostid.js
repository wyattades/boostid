#!/usr/bin/env node

const yargs = require('yargs/yargs');
const packageJson = require('../package.json');
const { run } = require('../lib/utils');
const logger = require('../lib/log');


const runModule = (path, method) => (argv) => (method ? require(path)[method](argv) : require(path)(argv))
.catch((err) => {
  logger.error(err);
  process.exit(1);
});

// const runScript = (cmd, args) => (argv) => {
//   spawn(cmd, args ? args : argv._.slice(1), {
//     stdio: 'inherit',
//   });
// };
const runScript = (path) => (argv) => run([ path, ...argv._.slice(1) ])
.catch((err) => {
  logger.error(err);
  process.exit(1);
});

const commands = [{
  command: 'setup <site_name>',
  desc: 'Create a new site',
  builder: (_yargs) => _yargs
  .option('new', {
    desc: 'Creates a new site',
  }),
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
  builder: (_yargs) => _yargs
  .option('ci-token', {
    desc: 'CircleCI API user token',
    type: 'string',
    requiresArg: true,
    default: () => {
      if (process.env.CIRCLE_TOKEN)
        return process.env.CIRCLE_TOKEN;
      return null;
    },
  })
  .option('reponame', {
    desc: 'Github repository name',
    type: 'string',
    requiresArg: true,
    alias: 'n',
    default: () => {
      if (process.env.CIRCLE_PROJECT_REPONAME)
        return process.env.CIRCLE_PROJECT_REPONAME;
      try {
        return require('../lib/config').get().reponame;
      } catch (_) {
        return null;
      }
    },
  }),
  handler: runModule('../lib/circleci', 'triggerBuild'),
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
    desc: 'Manually set pantheon site id',
    type: 'string',
    requiresArg: true,
    alias: 's',
    defaultDescription: '$PANTHEON_SITE_ID',
    default: () => {
      if (process.env.PANTHEON_SITE_ID)
        return process.env.PANTHEON_SITE_ID;
      try {
        return require('../lib/config').get().id;
      } catch (_) {
        return null;
      }
    },
  })
  .option('machine-token', {
    desc: 'Machine token for Terminus cli',
    type: 'string',
    requiresArg: true,
    alias: 'm',
    defaultDescription: '$PANTHEON_MACHINE_TOKEN',
    default: () => {
      if (process.env.PANTHEON_MACHINE_TOKEN)
        return process.env.PANTHEON_MACHINE_TOKEN;
      return null;
    },
  });

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
