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

module.exports = {
  spinner(...msg) { return ora(format(msg)); },
  debug(...msg) { ora(format(msg, 90)).info(); },
  info(...msg) { ora(format(msg)).info(); },
  warn(...msg) { ora(format(msg, 33)).warn(); },
  error(...msg) { ora(format(msg, 31)).fail(); },
};
