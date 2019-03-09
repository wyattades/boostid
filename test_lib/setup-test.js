const path = require('path');
// Required when running tests locally
const { toMatchImageSnapshot } = require(path.join(process.cwd(), 'node_modules/jest-image-snapshot'));

expect.extend({ toMatchImageSnapshot });


// Default timeout for each test
jest.setTimeout(30000);
