const ter = require('./terminus');
const logger = require('./log');

const multidev = 'updates';

module.exports = async (argv) => {

  if (!argv.site)
    throw 'Must provide boostid config file, -s <siteId> cli option, or PANTHEON_SITE_ID environment variable';

  if (!argv.machineToken)
    throw 'Must provide -m <machineToken> cli option or PANTHEON_MACHINE_TOKEN environment variable';

  logger.info('Authenticating with Pantheon');

  ter.setSite(argv.site);
  await ter.login(argv.machineToken);

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
    await ter.multidevMergeFromDev(multidev);
  } else {
    logger.info(`Creating "${multidev}" multidev from "dev"`);
    await ter.createMultidev(multidev, 'dev');
  }

  // Note: git mode is enabled by default
  
  logger.info(`Applying upstream updates to "${multidev}" multidev`);
  await ter.applyUpstreamUpdates(multidev);
  
  logger.success(`Successfully updated "${multidev}" multidev with latest updates`);
};
