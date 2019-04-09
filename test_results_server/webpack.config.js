// const loaderHTML = `<div class="full-page"><div class="spinner">\
// <svg viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\
//   <circle class="length" fill="none" stroke-width="8" stroke-linecap="round" cx="33" cy="33" r="28"></circle>\
// </svg>\
// <svg viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\
//   <circle fill="none" stroke-width="8" stroke-linecap="round" cx="33" cy="33" r="28"></circle>\
// </svg>\
// <svg viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\
//   <circle fill="none" stroke-width="8" stroke-linecap="round" cx="33" cy="33" r="28"></circle>\
// </svg>\
// <svg viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\
//   <circle fill="none" stroke-width="8" stroke-linecap="round" cx="33" cy="33" r="28"></circle>\
// </svg>\
// </div></div>`;

module.exports = require('webpack-boiler')({
  react: true,
  pages: [{
    title: 'Boostid Results',
    favicon: './src/images/favicon.png',
  }],
  // googleAnalytics: 'UA-105229811-4',
});

// delete module.exports.module.rules[3].include;
