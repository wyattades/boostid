const fs = require('fs-extra');
// const path = require('path');
const { run } = require('./utils');
const log = require('./log');
const config = require('./config');
const packageJson = require('../package.json');
const { getEnvs } = require('./ci');
const reporter = require('./reporter');


const formatEnvs = (envs) => Object.keys(envs).map((key) => ` -e ${key}=${envs[key]}`).join('');

exports.ciLocal = async () => {
  const job = 'upstream_updates';
  
  const privateKey = config.get('ssh.privateKey');
  if (!privateKey)
    throw 'Must provide SSH private key path in config key: ssh.privateKey';

  const newConfigPath = '.circleci/tmp_config.yml';
  const oldConfig = fs.readFileSync('.circleci/config.yml', 'utf8');
  const newConfig = await run(`circleci config process -`, true, {
    stdin: oldConfig.replace(/<<parameters\.local>>/g, 'true'), // HACK
  });

  fs.outputFileSync(newConfigPath, newConfig);
  
  const envs = await getEnvs(true);
  if (process.env.BOOSTID_FORCE_SKIP_RESET) envs.BOOSTID_FORCE_SKIP_RESET = true;

  let err = false;
  try {
    await run(`circleci local execute -c ${newConfigPath} --job \
${job}${formatEnvs(envs)} -v ${privateKey}:/root/.ssh/id_rsa`);
  } catch (e) {
    err = e;
  }

  fs.removeSync(newConfigPath);

  if (err !== false) throw err;
};

exports.coverage = async (argv) => {

  config.assertExists();

  if (!fs.existsSync('__tests__'))
    throw 'Cannot run tests without test directory "__tests__"';

  if (argv.results === 'S3' && !config.get('bucket'))
    throw 'Please specify an S3 bucket as the "bucket" parameter in Boostid config file';

  const envs = await getEnvs();

  if (argv.devBoostid) {
    log.info('Copying local boostid directory');
    argv.devBoostid = argv.devBoostid.replace(/\/*$/, '/');
    await run(`rsync -av ${argv.devBoostid} ./tmp_boostid --exclude node_modules \
--exclude .git --exclude wades --exclude test_results_server`, 'ignore');
  }

  fs.outputFileSync('./.dockerignore', `
*
!package*.json
!boostid.config.js*
!__tests__/
!tmp_boostid/
  `);

  fs.outputFileSync('./dev.Dockerfile', `
FROM wades/boostid:${packageJson.version}

COPY package*.json ./
RUN npm install

COPY boostid.config.js ./
COPY __tests__ ./__tests__

${argv.devBoostid ? `
COPY ./tmp_boostid ./node_modules/boostid
` : ''}

CMD ["bash", "-c", "./node_modules/boostid/scripts/run-tests.sh || \
(node ./node_modules/boostid/lib/reporter.js failed; exit 1)"]
  `);

  const imageId = (await log.promise(
    run(`docker build -q -f ./dev.Dockerfile .`, true),
    `Building docker container from: ${process.cwd()}`,
    true,
  )).trim();

  log.info(`Running image: ${imageId}`);

  let failed = false;
  try {
    await run(`docker run -it${formatEnvs(envs)} ${imageId}`);
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
    throw 'Tests failed';
  } else {
    log.success('Tests passed');
  }
};
