// Mock implementation of chalk for testing
const chalk = {
  cyan: (str) => str,
  green: (str) => str,
  yellow: (str) => str,
  red: (str) => str,
  gray: (str) => str,
  white: (str) => str,
  blue: (str) => str,
  magenta: (str) => str,
  bold: (str) => str,
  dim: (str) => str,
  italic: (str) => str,
  underline: (str) => str,
  inverse: (str) => str,
  hidden: (str) => str,
  strikethrough: (str) => str,
  visible: (str) => str,
  bgBlack: (str) => str,
  bgRed: (str) => str,
  bgGreen: (str) => str,
  bgYellow: (str) => str,
  bgBlue: (str) => str,
  bgMagenta: (str) => str,
  bgCyan: (str) => str,
  bgWhite: (str) => str,
};

// Support chaining
Object.keys(chalk).forEach(key => {
  if (typeof chalk[key] === 'function') {
    Object.keys(chalk).forEach(innerKey => {
      chalk[key][innerKey] = chalk[innerKey];
    });
  }
});

module.exports = chalk;
module.exports.default = chalk;