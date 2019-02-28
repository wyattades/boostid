
exports.navClick = (page, selector) => {
  return Promise.all([
    page.waitForNavigation(),
    page.click(selector),
  ]);  
};
