#!/usr/bin/env node

const yargs = require('yargs/yargs');
const packageJson = require('../package.json');
const { run } = require('../lib/utils');
const logger = require('../lib/log');
const config = require('../lib/config');


const runModule = (path) => (argv) => require(path)(argv)
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
  command: 'create <site_name>',
  desc: 'Create a new site',
  handler: runModule('../lib/create'),
}, {
  command: 'existing <site_name>',
  desc: 'Setup dev environment for existing site',
  handler: runModule('../lib/existing'),
}, {
  command: 'test [type]',
  desc: 'Test stuff',
  builder: (_yargs) => _yargs
  .completion()
  .choices('type', ['visualreg', 'behat', 'all'])
  .option('dev-boostid', {
    desc: 'Use the local boostid repo',
    type: 'string',
    requiresArg: true,
    // global: true // ???
  }),
  handler: runModule('../lib/test'),
}, {
  command: 'update',
  desc: 'Update site with the latest test features',
  handler: runScript('../lib/update.sh'),
}];

const program = (args) => {

  const parser = yargs(args)
  .scriptName(packageJson.name)
  .usage('Command suite for Rootid development and testing\n\nUsage: $0 <command> [options]')
  .wrap(100)
  .strict(true)
  .demandCommand(1, '')
  .completion()

  // version
  .version(packageJson.version)
  .alias('v', 'version')

  // help
  .alias('h', 'help')
  .command('help <command>', 'View help for a specific command', () => {}, (argv) => {
    program([ argv.command, '-h' ]);
  })

  // config file
  .option('config', {
    desc: 'Path to custom config file',
    type: 'string',
    requiresArg: true,
    default: 'boostid.config.js',
    alias: 'c',
    coerce: (filename) => {
      config.setFilename(filename);
      return filename;
    },
  });

  // commands
  for (const cmd of commands) parser.command(cmd);

  // run the parser
  parser.argv;
};

program(process.argv.slice(2));
