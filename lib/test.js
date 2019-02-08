const fs = require('fs-extra');
const { run } = require('./utils');
const logger = require('./log');
const config = require('./config');
const packageJson = require('../package.json');


module.exports = async (argv) => {

  if (!fs.existsSync('boostid.config.js'))
    throw 'Cannot run tests without config file (boostid.config.js)';

  if (!fs.existsSync('__tests__'))
    throw 'Cannot run tests without test directory (__tests__)';

  const envs = {};
  if (argv.results === 'S3') {
    const bucket = config.get('bucket');
    if (!bucket)
      throw 'Please specify an S3 bucket as the "bucket" parameter in "boostid.config.js"';
    envs.VISUALREG_BUCKET = config.get('bucket');
    envs.AWS_ACCESS_KEY_ID = config.get(`aws.${bucket}.accessKey`);
    envs.AWS_SECRET_ACCESS_KEY = config.get(`aws.${bucket}.secretAccessKey`);
  }
  

  if (argv.devBoostid) {
    argv.devBoostid = argv.devBoostid.replace(/\/*$/, '/');
    await run(`rsync -av ${argv.devBoostid} ./tmp_boostid --exclude node_modules --exclude .git`, true);
  }

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

  fs.outputFileSync('./dev.Dockerfile', Dockerfile);

  const msg = logger.spinner(`Building docker container from: ${process.cwd()}`);

  const imageId = (await run(`docker build -q -f ./dev.Dockerfile .`, true)).trim();

  msg.info();

  // const { how } = await inquirer.prompt([{
  //   name: 'how',
  //   type: 'list',
  //   message: 'How would you like to run your test?',
  //   choices: ['Now', 'Later', 'Never'],
  // }]);

  logger.info(`Running image: ${imageId}`);

  let failed = false;
  try {
    await run(`docker run -it ${Object.keys(envs).map((key) => `-e "${key}=${envs[key]}"`).join(' ')} ${imageId}`);
  } catch (error) {
    console.error(error);

    failed = true;
  }

  const containerId = (await run(`docker ps -lq`, true)).trim();

  if (failed && argv.results !== 'S3') {
    logger.info(`Copying snapshot files to directory:${argv.results} (If they exist)`);
    fs.removeSync(argv.results);
    await run(`docker cp ${containerId}:/app/__tests__/__image_snapshots__ ${argv.results}`);
  }

  logger.info('Cleaning up...');
  try { await run(`docker container rm ${containerId}`, true); } catch (_) {}
  fs.removeSync('dev.Dockerfile');
  if (argv.devBoostid) fs.removeSync('./tmp_boostid');

  if (failed) {
    logger.error('Tests failed');
    process.exit(1);
  } else {
    logger.success('Tests passed');
  }
};
