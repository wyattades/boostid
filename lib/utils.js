const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');


exports.run = (cmd, capture = false, options = {}) => new Promise((resolve) => {
  let err = '',
      msg = '';

  const [ binary, ...args ] = Array.isArray(cmd) ? cmd : cmd.split(/\s+/);

  const child = spawn(binary, args, {
    stdio: capture ? undefined : 'inherit',
    ...options,
  })
  .once('error', (error) => {
    resolve([error, null]);
  })
  .once('exit', (code, signal) => {
    if (code === 0) resolve([null, msg || true]);
    else resolve([err || true, null]);
  });

  if (capture) {
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
      msg += data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => {
      err += data;
    });
  }
});


// exports.run = (cmd, capture = false) => new Promise((resolve) => {
//   exec(cmd, (err, stdout, stderr) => {
//     if (!capture && stdout) console.log(stdout);
//     if (!capture && stderr) console.error('\x1b[31m%s\x1b[0m', stderr);
//     if (err) resolve([ stderr || true, null ]);
//     else resolve([ null, stdout || true ]);
//   });
// });

const MAX_DEPTH = 10;
exports.findFileUp = (filename, startdir = process.cwd()) => {
  let depth = 0;
  while (true) {
    const list = fs.readdirSync(startdir);
    if (list.indexOf(filename) != -1)
      return path.join(startdir, filename);
    else if (startdir == '/' || depth > MAX_DEPTH)
      return null;
    else {
      startdir = path.normalize(path.join(startdir, '..'));
      depth++;
    }
   }
};
