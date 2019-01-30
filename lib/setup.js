module.exports = () => Promise.reject('NOT IMPLEMENTED');


/* TODO
creates `updates` multidev
prompts user for setup
*/

// const ora = require('ora');
// const inquirer = require('inquirer');
// const { run } = require('./utils');


// module.exports = async ({ site_name }) => {

//   console.log(`Setting up dev environment for '${site_name}'...`);

//   const msg = ora('Fetching site info...').start();

//   const [err, succ] = await run(`terminus site:info ${site_name} --format=json`, false);
//   msg.stop();
//   if (err) throw err;

//   const info = JSON.parse(succ);
//   console.log(info);

//   // msg.text = 'Fetching site...';



//   // const answers = await inquirer.prompt({
//   //   type: 'confirm',
//   //   name: 'create',
//   //   message: 'This wil',
//   // });

//   msg.stop();

// };
