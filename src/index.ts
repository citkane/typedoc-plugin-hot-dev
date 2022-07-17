/**
 * This is a developer helper script for hot theme development.
 * 
 * It:
 * - watches for changes on this `src` files (ts, tsx, etc defined in this tsconfig).
 * - rebuilds to this `dist` folder (defined in this tsconfig).
 * - uses **this** updated `dist` to rebuild **that** documentation automatically.
 * - watches for changes to assets (css, js, images, etc.) and does a quick update to that documentation 
 * 
 * For the love of turtles all the way down, **that**, by default, is **this** and will build this documentation set.
 * 
 * @module
 */


import chokidar = require('chokidar');
import path from 'path';

import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import fs from 'fs-extra';
import browserSync from 'browser-sync';
browserSync.create();

/**
 * The development options which can be overridden by "devOptions.json" in the project root directory.
 * 
 */
export interface devOptions {
	/**The name of the document directory in the target documentation project. Typically 'docs'*/
	targetDocDir: string,
	/**The relative path to the root of the target project directory */
	targetCwdPath: string,
	/**The relative path to the theme root directory to put compiled code in. Typically `./dist`*/
	sourceDistPath: string,
	/**The relative path to the theme root directory where assets (.js, .css, images, etc) are stored*/
	sourceAssetsPath: string
}

interface spawnedProcess {
	controller: AbortController;
	process: ChildProcessWithoutNullStreams;

}

const defaultDevOptions: devOptions = {
	targetDocDir: 'docs',
	targetCwdPath: './',
	sourceDistPath: './dist',
	sourceAssetsPath: './assets'
};

/**
 * Starts the hot process. Call this from your code:
 * ```js
 * const hot = require('typedoc-hot-dev');
 * hot.init('--build', '--all')
 * ```
 * @param tscOptions Typescript options to pass to the compiler.  
 * Ensure, if you require the --build flag, that it is passed first otherwise the compiler will complain
 */
export function init(...tscOptions) {

	// We are in the local process

	startTsc(...tscOptions).then(() => {
		const { targetDocDir, sourceDistPath, sourceAssetsPath, targetCwdPath } = makeOptions();
		let controller = new AbortController();
		let tsdoc: ChildProcessWithoutNullStreams;
		let timer: ReturnType<typeof setTimeout>;

		

		({ controller, process: tsdoc } = spawnTsDoc(targetDocDir, targetCwdPath, controller));
		startHttpServer(targetCwdPath, targetDocDir);
		
		chokidar.watch([
			sourceDistPath,
			sourceAssetsPath
		], { ignoreInitial: true })
			.on('unlink', (path: string) => callBack(path))
			.on('add', (path: string) => callBack(path))
			.on('change', (path: string) => callBack(path))
			.on('error', err => console.error(err));

		function callBack(path: string) {
			clearTimeout(timer);
			timer = setTimeout(() => {
				if (path.startsWith(sourceAssetsPath)) {
					console.log('---------------------------------------- change asset');
					tsdoc.stdin.write('buildDocs');
				} else {
					console.log('---------------------------------------- change source');
					({ controller, process: tsdoc } = spawnTsDoc(targetDocDir, targetCwdPath, controller));
				}
			}, 100);
		}

	});
}
function startHttpServer(thatCwdPath: string, thatDocDir: string, isRetry = false) {
	const httpPath = path.join(thatCwdPath, thatDocDir);
	const httpIndexPath = path.join(httpPath, 'index.html');
	if (!fs.existsSync(httpIndexPath)) {
		if (!isRetry) console.log(`[warning] waiting to see "${httpIndexPath}" so that the http server can start.\n`);
		setTimeout(() => startHttpServer(thatCwdPath, thatDocDir, true), 1000);
	} else {
		browserSync.init({ server: httpPath });
	}
}


function makeOptions(): devOptions {
	const options = defaultDevOptions;
	const rootPath = process.cwd();
	const optionsPath = path.join(rootPath, 'typedoc.json');

	if (fs.existsSync(optionsPath)) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const typdocOptions = require(optionsPath);
		const devOptions: devOptions = typdocOptions['typedoc-hot-dev'];
		if (devOptions) {
			Object.keys(devOptions).forEach((key) => {
				options[key as keyof devOptions] = devOptions[key as keyof devOptions];
			});
		}
	}
	
	['targetCwdPath', 'sourceDistPath', 'sourceAssetsPath'].forEach(key => {
		const optionPath = path.join(rootPath, options[key as keyof devOptions]);
		options[key as keyof devOptions] = optionPath;
		if (!fs.existsSync(optionPath)) {
			console.error(`[warning] watcher: path "${optionPath}" for option "${key}" does not exists`);
		}
	});
	return options;
}

function startTsc(...tscOptions) {
	if (tscOptions.indexOf('--watch') < 0) tscOptions.push('--watch');
	if (tscOptions.indexOf('--preserveWatchOutput') < 0) tscOptions.push('--preserveWatchOutput');
	return new Promise((resolve) => {
		let resolved = false;
		const tsc = spawn('node_modules/.bin/tsc', tscOptions);
		tsc.on('error', (err: Error) => console.error('[tsc]', err));
		tsc.stdout.on('data', (data: Buffer) => {
			const message = String(data).trim();
			console.log('[tsc]', message);
			if (!resolved && message.endsWith('Watching for file changes.')) {
				resolved = true;
				resolve(true);
			}
		});
	});
}

function spawnTsDoc(
	thatDocDir: string,
	cwd: string,
	controller?: AbortController
): spawnedProcess {

	controller?.abort();
	controller = new AbortController();
	const { signal } = controller;

	const command = process.env.Node === 'test' ? 'ts-node' : 'node';

	const tsdoc = spawn(command, [path.join(__dirname, 'spawned'), thatDocDir], { cwd, signal });

	tsdoc.on('error', (err: Error) => {
		if (err.message !== 'The operation was aborted') {
			console.error(`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ${err.message}`);
		}
	});
	tsdoc.stdout.on('data', (data: Buffer) => {
		const message = data.toString().trim();
		console.log('[typedoc]', message);
		if (message.endsWith('build done')) browserSync.reload();
	});
	tsdoc.stderr.on('data', (data: Buffer) => { console.error(`[typedoc] stderr: ${data}`); });
	return { controller, process: tsdoc };
}
