const ter = require('./terminus');
const log = require('./log');


module.exports = async ({ multidev }) => {

  log.info('Authenticating with Pantheon');

  await ter.login();
  await ter.assertExists();

  log.info('Fetching upstream update info');

  const upstreamInfo = await ter.getUpstreamInfo();
  
  if (upstreamInfo.live.is_up_to_date_with_upstream)
    throw 'There are no upstream updates available for "live"';

  // logger.info('Cloning content from "live" to "dev"');
  // await ter.cloneContent('dev', 'live');
  // await ter.cloneFiles('dev', 'live');

  log.info(`Checking if "${multidev}" multidev exists`);

  let exists = false;
  try {
    await ter.getEnvInfo(multidev);
    exists = true;
  } catch (err) {
    if (err.status !== 404)
      throw err;
  }

  if (exists) {
    // logger.info(`Deleting "${multidev}" multidev`);
    // await ter.deleteMultidev(multidev);

    log.info(`Resetting "${multidev}" multidev from "dev"`);
    // TODO does this work?
    // await ter.multidevMergeFromDev(multidev);
    await ter.deleteMultidev(multidev);
    await ter.createMultidev(multidev, 'dev');
  } else {
    log.info(`Creating "${multidev}" multidev from "dev"`);
    await ter.createMultidev(multidev, 'dev');
  }

  // Note: git mode is enabled by default
  
  log.info(`Applying upstream updates to "${multidev}" multidev`);
  await ter.applyUpstreamUpdates(multidev);
  
  log.success(`Successfully updated "${multidev}" multidev with latest updates`);
};
