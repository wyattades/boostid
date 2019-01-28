const fs = require('fs-extra');
const { run } = require('./utils');
const logger = require('./log');
const packageJson = require('../package.json');


module.exports = async (argv) => {

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

  fs.writeFileSync('./dev.Dockerfile', Dockerfile, 'utf8');

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
    await run(`docker run -it --env-file ./.env ${imageId}`);
  } catch (error) {
    console.error(error);

    failed = true;
  }

  const containerId = (await run(`docker ps -lq`, true)).trim();

  if (failed) {
    logger.info('Copying snapshot files to ./__image_snapshots__ (If they exist)');
    fs.removeSync('./__image_snapshots__');
    await run(`docker cp ${containerId}:/app/__tests__/__image_snapshots__ ./__image_snapshots__`);
  }

  logger.info('Cleaning up...');
  try { await run(`docker container rm ${containerId}`, true); } catch (_) {}
  fs.removeSync('dev.Dockerfile');
  if (argv.devBoostid) fs.removeSync('./tmp_boostid');

  if (failed) process.exit(1);
};
