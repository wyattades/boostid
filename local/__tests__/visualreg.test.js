const prebuilt = require('boostid/tests');
const config = require('../boostid.config');


prebuilt.init(config);

describe('Visual regression on live', () => {
  prebuilt.visualRegOnLive();
});

describe('Visual regression on updates', () => {
  prebuilt.visualRegOnUpdates();
});
