const path = require('path');
const { toMatchImageSnapshot } = require(path.join(process.cwd(), 'node_modules/jest-image-snapshot'));

expect.extend({ toMatchImageSnapshot });


// Default timeout for each test
jest.setTimeout(20000);
