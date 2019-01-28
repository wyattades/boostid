const ter = require('./terminus');
const logger = require('./log');


module.exports = async (argv) => {

  if (!argv.site)
    throw 'Must provide boostid config file, -s <siteId> cli option, or PANTHEON_SITE_ID environment variable';

  if (!argv.machineToken)
    throw 'Must provide -m <machineToken> cli option or PANTHEON_MACHINE_TOKEN environment variable';

  logger.info('Authenticating');

  ter.setSite(argv.site);
  await ter.login(argv.machineToken);

  logger.info('Fetching upstream update info');

  const upstreamInfo = await ter.getUpstreamInfo();
  
  if (upstreamInfo.live.is_up_to_date_with_upstream)
    throw 'There are no upstream updates available for "live"';

  logger.info('Checking if "updates" multidev exists');

  let exists = false;
  try {
    await ter.getEnvInfo('updates');
    exists = true;
  } catch (err) {
    if (err.statusCode !== 404)
      throw err;
  }

  if (exists) {
    logger.info('Deleting "updates" multidev');

    await ter.deleteMultidev('updates');
  }

  logger.info('Creating "updates" multidev from "live"');
  await ter.createMultidev('updates', 'live');
  
  // Note: git mode is enabled by default
  
  logger.info('Applying upstream updates to "updates" multidev');
  await ter.applyUpstreamUpdates('updates');
  
  logger.success('Success');
};
