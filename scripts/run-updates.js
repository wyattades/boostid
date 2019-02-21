#!/usr/bin/env node

const { run } = require('../lib/utils');
const config = require('../lib/config');
const ter = require('../lib/terminus');
const update = require('../lib/update');
const reporter = require('../lib/reporter');
const log = require('../lib/log');


(async () => {

  config.init();

  const multidev = config.get('multidev');

  await update({ multidev });

  log.info('Running coverage tests');
  await run(`./node_modules/boostid/scripts/run-tests.sh`);

  log.info('Merging multidev to dev');
  await ter.multidevMergeToDev(multidev);

  await reporter(false);
  
})()
.catch(async (err) => {
  log.error(err);

  await reporter(true);

  process.exit(1);
});
