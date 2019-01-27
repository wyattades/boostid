const { run } = require('./utils');
const logger = require('./log');
const packageJson = require('../package.json');


const Dockerfile = `
FROM wades/boostid:${packageJson.version}
COPY . .
RUN npm install
CMD ./node_modules/boostid/test_lib/run-tests.sh
`;

module.exports = async (argv) => {
  const msg = logger.spinner('Building docker container...');

  const containerId = await run(`docker build -q -`, true, {
    stdin: Dockerfile,
  });

  msg.stopAndPersist({ text: 'Running container...' });

  await run(`docker run --rm ${containerId}`);

};
