const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ora = require('ora');


const format = (msgs, color = 0) => {
  msgs = msgs.map((msg) => {
    if (msg instanceof Error) {
      return msg.stack;
    } else if (typeof msg === 'object') {
      try {
        return JSON.stringify(msg);
      } catch (_) {
        return msg.toString();
      }
    }
    return msg;
  });
  return `\x1b[32m\x1b[1m[boostid]\x1b[0m \x1b[${color}m${msgs.join(' ')}\x1b[0m`;
};
const logger = {
  spinner(...msg) { return ora(format(msg)); },
  debug(...msg) { ora(format(msg, 90)).info(); },
  info(...msg) { ora(format(msg)).info(); },
  warn(...msg) { ora(format(msg, 33)).warn(); },
  error(...msg) { ora(format(msg, 31)).fail(); },
};
exports.logger = logger;


// REMEMBER to add PATH variable to `spawn` if you need it
exports.run = (cmd, capture = false, options = {}) => new Promise((resolve, reject) => {
  let err = '',
      msg = '';

  const [ binary, ...args ] = Array.isArray(cmd) ? cmd : cmd.split(/\s+/);

  const child = spawn(binary, args, {
    stdio: capture ? undefined : 'inherit',
    ...options,
  })
  .once('error', (error) => {
    reject(error);
  })
  .once('exit', (code, signal) => {
    if (code === 0) resolve(msg);
    else reject(err);
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


const MAX_DEPTH = 10;
exports.findFileUp = (filename, startdir = process.cwd()) => {
  let depth = 0;
  while (true) {
    const list = fs.readdirSync(startdir);
    if (list.indexOf(filename) !== -1)
      return path.join(startdir, filename);
    else if (startdir === '/' || depth > MAX_DEPTH)
      return null;
    else {
      startdir = path.normalize(path.join(startdir, '..'));
      depth++;
    }
  }
};
