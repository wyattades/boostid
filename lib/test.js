const fs = require('fs-extra');
const { run } = require('./utils');
const log = require('./log');
const config = require('./config');
const packageJson = require('../package.json');


module.exports = async (argv) => {

  config.assertExists();

  if (!fs.existsSync('__tests__'))
    throw 'Cannot run tests without test directory (__tests__)';

  const envs = {};
  if (argv.results === 'S3') {
    const bucket = config.get('bucket');
    if (!bucket)
      throw 'Please specify an S3 bucket as the "bucket" parameter in Boostid config file';
    envs.BOOSTID_SITE = config.get('site');
    envs.BOOSTID_BUCKET = config.get('bucket');
    envs.AWS_ACCESS_KEY_ID = config.get(`aws.${bucket}.accessKey`);
    envs.AWS_SECRET_ACCESS_KEY = config.get(`aws.${bucket}.secretAccessKey`);
  }

  if (argv.devBoostid) {
    log.info('Copying local boostid directory');
    argv.devBoostid = argv.devBoostid.replace(/\/*$/, '/');
    await run(`rsync -av ${argv.devBoostid} ./tmp_boostid --exclude node_modules \
--exclude .git --exclude wades`, 'ignore');
  }

  // TODO support boostid.config.json
  const Dockerfile = `
FROM wades/boostid:${packageJson.version}

COPY package*.json ./
RUN npm install

COPY boostid.config.js ./
COPY __tests__ ./__tests__

${argv.devBoostid ? `
COPY ./tmp_boostid ./node_modules/boostid
` : ''}

CMD ["./node_modules/boostid/scripts/run-tests.sh"]
`;

  fs.outputFileSync('./.dockerignore', `
*
!package*.json
!boostid.config.js
!__tests__/
!tmp_boostid/
  `);
  fs.outputFileSync('./dev.Dockerfile', Dockerfile);

  const imageId = (await log.promise(
    run(`docker build -q -f ./dev.Dockerfile .`, true),
    `Building docker container from: ${process.cwd()}`,
    true,
  )).trim();

  log.info(`Running image: ${imageId}`);

  let failed = false;
  try {
    await run(`docker run -it ${Object.keys(envs).map((key) => `-e ${key}=${envs[key]}`).join(' ')} ${imageId}`);
  } catch (error) {
    console.error(error);

    failed = true;
  }

  const containerId = (await run(`docker ps -lq`, true)).trim();

  if (failed && argv.results !== 'S3') {
    log.info(`Copying snapshot files to directory: ${argv.results} (If they exist)`);
    fs.removeSync(argv.results);
    try {
      await run(`docker cp ${containerId}:/app/__tests__/__image_snapshots__ ${argv.results}`);
    } catch (_) {}
  }

  log.info('Cleaning up...');
  try {
    await run(`docker container rm ${containerId}`, 'ignore');
  } catch (_) {}
  fs.removeSync('./dev.Dockerfile');
  fs.removeSync('./.dockerignore');
  if (argv.devBoostid) fs.removeSync('./tmp_boostid');

  if (failed) {
    log.error('Tests failed');
    process.exit(1);
  } else {
    log.success('Tests passed');
  }
};
