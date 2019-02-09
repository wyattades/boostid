const ter = require('./terminus');
const logger = require('./log');


const multidev = 'updates';

module.exports = async () => {

  logger.info('Authenticating with Pantheon');

  await ter.login();
  ter.assertExists();

  logger.info('Fetching upstream update info');

  const upstreamInfo = await ter.getUpstreamInfo();
  
  if (upstreamInfo.live.is_up_to_date_with_upstream)
    throw 'There are no upstream updates available for "live"';

  // logger.info('Cloning content from "live" to "dev"');
  // await ter.cloneContent('dev', 'live');
  // await ter.cloneFiles('dev', 'live');

  logger.info(`Checking if "${multidev}" multidev exists`);

  let exists = false;
  try {
    await ter.getEnvInfo(multidev);
    exists = true;
  } catch (err) {
    if (err.statusCode !== 404)
      throw err;
  }

  if (exists) {
    // logger.info(`Deleting "${multidev}" multidev`);
    // await ter.deleteMultidev(multidev);

    logger.info(`Resetting "${multidev}" multidev from "dev"`);
    // TODO does this work?
    // await ter.multidevMergeFromDev(multidev);
    await ter.deleteMultidev(multidev);
    await ter.createMultidev(multidev, 'dev');
  } else {
    logger.info(`Creating "${multidev}" multidev from "dev"`);
    await ter.createMultidev(multidev, 'dev');
  }

  // Note: git mode is enabled by default
  
  logger.info(`Applying upstream updates to "${multidev}" multidev`);
  await ter.applyUpstreamUpdates(multidev);
  
  logger.success(`Successfully updated "${multidev}" multidev with latest updates`);
};
