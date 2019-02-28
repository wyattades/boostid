const URL = require('url');
const ter = require('../lib/terminus');
const config = require('../lib/config');
const { navClick } = require('./utils');


let loggedIn = false;

exports.login = async () => {

  config.init();

  await ter.login();
  await ter.assertExists();

  // Need this?
  // await ter.connectionSet('boostidup', 'sftp')

  const output = await ter.remoteRun(config.get('multidev'), 'drush', 'uli');

  const oneTimeLogin = output.trim();
  const parsed = URL.parse(oneTimeLogin);
  expect(parsed.hostname).toBeTruthy();

  await page.goto(oneTimeLogin.replace('http:', 'https:'));
  expect(URL.parse(page.url()).pathname).toBe('/user/1/edit');

  loggedIn = true;
};

exports.addPageNode = async ({ title, body }) => {

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
