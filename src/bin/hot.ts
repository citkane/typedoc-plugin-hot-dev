#!/usr/bin/env node

import { init } from '../index';

init().then(() => {
	clearInterval(hold);
});
const hold = setInterval(() => null, 1 << 30);
