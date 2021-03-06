const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');


/**
 * @param {string|string[]} cmd
 * @param {boolean|'capture'|string[]} stdio
 * @param {Object} options
 * @param {string} options.stdin Pass data to stdin
 * @param {Object.<string, any>} options.env Environment variables
 */
exports.run = (cmd, stdio = false, options = {}) => new Promise((resolve, reject) => {
  let err = '',
      msg = '';

  const [ binary, ...args ] = Array.isArray(cmd) ? cmd : cmd.split(/\s+/);

  const stdin = options.stdin;
  delete options.stdin;

  // add PATH and HOME to env
  options.env = options.env || {};
  options.env.PATH = process.env.PATH;
  options.env.HOME = process.env.HOME;
  
  if (typeof stdio === 'boolean')
    stdio = stdio ? 'pipe' : 'inherit';

  const child = spawn(binary, args, {
    stdio,
    ...options,
  })
  .once('error', (error) => {
    reject(error);
  })
  .once('exit', (code, signal) => {
    if (code === 0) resolve(msg);
    else reject(err);
  });

  if (stdin) {
    child.stdin.setEncoding('utf8');
    child.stdin.write(stdin);
    child.stdin.end();
  }

  if (stdio === 'pipe') {
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

exports.deepSet = (obj, is, value) => {
  if (typeof is === 'string')
    exports.deepSet(obj, is.split('.'), value);
  else if (is.length === 1)
    obj[is[0]] = value;
  else {
    if (typeof obj[is[0]] !== 'object') obj[is[0]] = {};
    exports.deepSet(obj[is[0]], is.slice(1), value);
  }
};

exports.deepGet = (obj, is) => {
  if (obj === undefined)
    return undefined;
  else if (typeof is === 'string')
    return exports.deepGet(obj, is.split('.'));
  else if (is.length === 1)
    return obj[is[0]];
  else
    return exports.deepGet(obj[is[0]], is.slice(1));
};

exports.sshFingerprint = (publicKey) => {
  const key = publicKey.replace(/^(ssh-[dr]s[as]\s+)|(\s+.+)|\n/g, '');
  const buffer = Buffer.from(key, 'base64');
  const hash = require('crypto').createHash('md5').update(buffer).digest('hex');
  // Add colon every 2 characters
  return hash.replace(/(.{2})(?=.)/g, '$1:');
};
