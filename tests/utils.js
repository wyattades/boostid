const URL = require('url');


/**
 * @async
 * Click a button that will navigate the page, and wait for navigation to finish
 * @param {*} page Puppeteer page
 * @param {string} selector CSS selector
 */
exports.navClick = (page, selector, navOptions = {}) => Promise.all([
  page.waitForNavigation(navOptions),
  page.click(selector),
]);  

/**
 * @async
 * Goto a new path or new URL
 * @param {*} page Puppeteer page
 * @param {string} path full URL, or path e.g. /my-page
 */
exports.goto = async (page, path) => {
  const url = page.url();

  await page.goto(URL.resolve(url, path));
};

/**
 * @async
 * Fill and submit an HTML form. Automatically waits for each selector if they aren't yet visible
 * @param {*} page Puppeteer page
 * @param {string} formSelector The form's CSS selector
 * @param {Object.<string, string>} nameValues Map form names to their value
 * @param {Object} [options] Options
 * @param {boolean} [options.noNavigate=false] Set to `true` if your know the form will not reload/navigate the page
 * @param {boolean} [options.noSubmit=false] Don't submit the form
 * @param {string} [options.submitSelector='[type="submit"]'] Custom selector for submit button
 */
exports.submitForm = async (page, formSelector, nameValues, options = {}) => {

  for (const name in nameValues) {
    const sel = `${formSelector} [name="${name}"]`;
    await page.waitForSelector(sel, { timeout: 3000 });

    const { tagName, type } = await page.$eval(sel, ({ tagName, type }) => ({
      tagName,
      type,
    }));

    const value = nameValues[name];

    if (tagName === 'SELECT') {
      await page.select(sel, ...Array.isArray(value) ? value : [value]);
    } else if (tagName === 'INPUT' && (type === 'checkbox' || type === 'radio')) {
      const vals = Array.isArray(value) ? value : [value];

      for (const val of vals) {
        await page.click(`${sel}[value="${val}"]`);
      }

    } else {
      await page.type(sel, nameValues[name]);
    }
  }

  if (!options.noSubmit) {
    if (!options.submitSelector) options.submitSelector = '[type="submit"]';
    if (options.noNavigate)
      await page.click(`${formSelector} ${options.submitSelector}`);
    else
      await exports.navClick(page, `${formSelector} ${options.submitSelector}`);
  }
};
