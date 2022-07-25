#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { init } = require('../../dist/index.js');

init().then(() => {
	clearInterval(hold);
});
const hold = setInterval(() => null, 1 << 30);