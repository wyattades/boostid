const ter = require('./terminus');
const log = require('./log');


module.exports = async ({ multidev, useGit }) => {

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

  let multidevInfo;
  try {
    multidevInfo = await ter.getEnvInfo(multidev);
  } catch (err) {
    if (err.status !== 404)
      throw err;
  }

  if (multidevInfo) {

    const devInfo = await ter.getEnvInfo('dev');

    if (devInfo.target_commit === multidevInfo.target_commit || process.env.BOOSTID_FORCE_SKIP_RESET) {
      log.info(`Cloning content & files from "dev" to "${multidev}" multidev`);

      await ter.cloneContent(multidev, 'dev');
      await ter.cloneFiles(multidev, 'dev');
    } else {
      log.info(`Recreating "${multidev}" multidev from "dev"`);

      await ter.deleteMultidev(multidev);
      await ter.createMultidev(multidev, 'dev');
    }

  } else {
    log.info(`Creating "${multidev}" multidev from "dev"`);
    await ter.createMultidev(multidev, 'dev');
  }

  // Note: git mode is enabled by default
  
  log.info(`Applying upstream updates to "${multidev}" multidev`);
  await ter.applyUpstreamUpdates(multidev);
  
  log.success(`Successfully updated "${multidev}" multidev with latest updates`);
};
