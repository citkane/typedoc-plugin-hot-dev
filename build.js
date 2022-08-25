const fs = require('fs-extra');

fs.copyFileSync('README.md', 'dist/README.md');
fs.copyFileSync('LICENSE.txt', 'dist/LICENSE.txt');
fs.copyFileSync('.npmignore', 'dist/.npmignore');
fs.copyFileSync('package.json', 'dist/package.json');
