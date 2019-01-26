#!/usr/bin/env node

const yargs = require('yargs/yargs');
const packageJson = require('../package.json');
const { run } = require('../lib/utils');
const logger = require('../lib/log');

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
const runScript = (path) => (argv) => run([ path, ...argv._.slice(1) ], false)
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
  .option('cmd1-option', {
    desc: 'command 1 option 1',
    type: 'string',
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
  .config('config', (configPath) => {
    return JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
  })
  .alias('c', 'config');

  // commands
  for (const cmd of commands) parser.command(cmd);

  // run the parser
  parser.argv;
};

program(process.argv.slice(2));
