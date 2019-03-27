const { visualReg } = require('boostid/tests/visual_reg');
const config = require('boostid/config');


config.init();

visualReg(
  config.get('targetUrl') || `https://dev-${config.get('name')}.pantheonsite.io`,
  config.get('devUrl') || `https://${config.get('multidev')}-${config.get('name')}.pantheonsite.io`,
  config.pages,
);
