const fs = require('fs-extra');
const path = require('path');
const { run } = require('./utils');
const log = require('./log');
const config = require('./config');
const packageJson = require('../package.json');
const { getEnvs, formatEnvs } = require('./ci');


const TEST_RESULTS_DIR = '__boostid_results__';


const localTests = async (argv) => {

  fs.removeSync(TEST_RESULTS_DIR);

  // TODO
  if (!fs.existsSync('node_modules/puppeteer/.local-chromium'))
    log.warn('It doesn\'t look like `puppeteer` has a local chromium installatio, which may cause issues.\nSuggest to run: npm install -S puppeteer@1.11.0');

  await run('node_modules/boostid/scripts/run-tests.sh', false, {
    env: process.env,
  });
};

const dockerTests = async (argv) => {

  if (argv.devBoostid) {
    log.info('Copying local boostid directory');
    
    argv.devBoostid = path.resolve(process.cwd(), argv.devBoostid).replace(/\/$/, '');

    const include = {
      'package.json': true,
      'package-lock.json': true,
    };
    for (const file of packageJson.files) include[file.replace(/\/$/, '')] = true;

    await fs.copySync(argv.devBoostid, 'tmp_boostid', {
      filter(file) {
        const { dir, base } = path.parse(file);
        if (dir === argv.devBoostid) return base in include;
        return true;
      },
    });
  }

  const envs = await getEnvs();

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

CMD ["bash", "-c", "./node_modules/boostid/scripts/run-tests.sh\
${argv.s3 ? ' || (node ./node_modules/boostid/lib/reporter.js failed; exit 1)' : ''}"]
  `);

  const imageId = (await log.promise(
    run(`docker build -q -f ./dev.Dockerfile .`, true),
    `Building docker container from: ${process.cwd()}`,
    true,
  )).trim();

  log.info(`Running image: ${imageId}`);

  let failed = false;
  try {
    const privateKey = config.get('ssh.privateKey');
    await run(`docker run ${privateKey ? `-v ${privateKey}:/root/.ssh/id_rsa` : ''} -it ${formatEnvs(envs)} ${imageId}`);
  } catch (error) {
    console.error(error);

    failed = true;
  }

  const containerId = (await run(`docker ps -lq`, true)).trim();

  if (failed && !argv.noSave) {
    log.info(`Copying test results and image snapshots to directory: ${TEST_RESULTS_DIR}`);
    fs.removeSync(TEST_RESULTS_DIR);
    try {
      await run(`docker cp ${containerId}:/app/${TEST_RESULTS_DIR} ${TEST_RESULTS_DIR}`);
    } catch (_) {}
  }

  log.info('Cleaning up...');

  try {
    await run(`docker container rm ${containerId}`, 'ignore');
  } catch (_) {}
  fs.removeSync('./dev.Dockerfile');
  fs.removeSync('./.dockerignore');
  if (argv.devBoostid) fs.removeSync('./tmp_boostid');

  return !failed;
};

exports.coverage = async (argv) => {

  config.assertExists();

  let testFiles;
  try {
    testFiles = fs.readdirSync('./__tests__');
  } catch (_) {}
  if (!testFiles || !testFiles.length)
    throw 'No tests exist in the "__tests__" directory!';

  // if (!argv.s3) delete envs.AWS_ACCESS_KEY_ID;

  const passed = !argv.docker
    ? (await localTests(argv))
    : (await dockerTests(argv));

  if (passed) {
    log.success('Tests passed');
  } else {
    throw 'Tests failed';
  }
};
