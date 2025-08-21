// Mock implementation of ansi-styles for testing
module.exports = {
  color: {
    close: '\u001b[39m',
    ansi: (code) => `\u001b[${code}m`,
    ansi256: (code) => `\u001b[38;5;${code}m`,
    ansi16m: (r, g, b) => `\u001b[38;2;${r};${g};${b}m`
  },
  bgColor: {
    close: '\u001b[49m',
    ansi: (code) => `\u001b[${code + 10}m`,
    ansi256: (code) => `\u001b[48;5;${code}m`,
    ansi16m: (r, g, b) => `\u001b[48;2;${r};${g};${b}m`
  },
  modifier: {
    reset: ['\u001b[0m', '\u001b[0m'],
    bold: ['\u001b[1m', '\u001b[22m'],
    dim: ['\u001b[2m', '\u001b[22m'],
    italic: ['\u001b[3m', '\u001b[23m'],
    underline: ['\u001b[4m', '\u001b[24m'],
    overline: ['\u001b[53m', '\u001b[55m'],
    inverse: ['\u001b[7m', '\u001b[27m'],
    hidden: ['\u001b[8m', '\u001b[28m'],
    strikethrough: ['\u001b[9m', '\u001b[29m']
  }
};