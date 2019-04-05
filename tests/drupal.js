const URL = require('url');
const ter = require('../lib/terminus');
const config = require('../lib/config');
const { navClick } = require('./utils');


let loggedIn = false;

/**
 * @async
 * Login to Drupal site as admin
 * @param {*} page Puppeteer page instance
 * @param {string} env Pantheon environment to login as
 * @param {string} [path="/"] Redirect to this url path after login e.g. /foo/bar
 */
exports.login = async (page, env, path = '/') => {

  config.init();

  await ter.login();
  await ter.assertExists();
  
  const output = await ter.remoteRun(env, 'drush', 'uli', '1', path.substring(1));

  const oneTimeLogin = output.trim();
  const parsed = URL.parse(oneTimeLogin);
  if (!parsed.hostname)
    throw new Error(`Failed to create one-time-login link: ${oneTimeLogin}`);

  await page.goto(oneTimeLogin.replace('http:', 'https:'));
  // expect(URL.parse(page.url()).pathname).toBe('/user/1/edit');

  loggedIn = true;
};

/**
 * @async
 * Add a Drupal page node (must login first)
 * @param {*} page Puppeteer page instance
 * @param {Object} PageData
 * @param {string} PageData.title
 * @param {string} PageData.body
 */
exports.addPageNode = async (page, { title, body }) => {

  if (!loggedIn)
    throw 'Must login first';

  const testerSite = `https://${config.get('multidev')}-${config.get('name')}.pantheonsite.io`;

  await page.goto(`${testerSite}/node/add/page`);

  await page.waitForSelector('#node-page-form [name="body[0][value]"]', { timeout: 8000 });

  await page.type('#node-page-form [name="title[0][value]"]', title);
  await page.$eval('#node-page-form [name="body[0][value]"]', (el, _body) => { el.value = _body; }, body);

  // Make sure changes propogate for body
  await page.waitFor(500);

  await navClick(page, '#node-page-form input[type="submit"]');

  expect(page.url()).not.toMatch('/node/add/page');
  await expect(page).toMatch(title);
};
