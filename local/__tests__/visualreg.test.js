const tests = require('boostid/tests');
const config = require('../boostid.config');


const base = {
  viewPorts: [
    { width: 1920, height: 1080 },
    { width: 500, height: 800, isMobile: true },
  ],
};

tests.visualReg(
  `https://dev-${config.name}.pantheonsite.io`,
  `https://${config.multidev}-${config.name}.pantheonsite.io`,
  [{
    ...base,
    path: '/',
    ignore: [
      'iframe[src*="youtube"]',
    ],
    elements: [
      'body',
    ],
  }, {
    ...base,
    path: '/404',
    elements: [
      'body',
    ],
  }],
);
