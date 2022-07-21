import path from 'path';
import fs from 'fs-extra';
import chokidar = require('chokidar');

import { hotOptions } from '../types';
import { HotEmitter } from '..';

export default class HotUtils {
	emitter: HotEmitter;
	isReady: boolean;
	timer;
	constructor(emitter: HotEmitter) {
		this.emitter = emitter;
		this.isReady = false;
		this.timer;
	}

	protected makeOptions( options: hotOptions ): hotOptions {

		const rootPath = process.cwd();
		const optionsPath = path.join(rootPath, 'typedoc.json');
		const outputOptions = {};

		if (fs.existsSync(optionsPath)) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const typdocOptions = require(optionsPath)['hot-dev'];

			typdocOptions &&
			Object.keys(typdocOptions).forEach((key) => {
				outputOptions[key] = typdocOptions[key as keyof hotOptions];
			});
			
		}

		Object.keys(options).forEach(key => {
			!outputOptions[key] && (outputOptions[key] = options[key]);
		});

		['targetCwdPath', 'sourceDistPath', 'sourceMediaPath'].forEach(key => {
			const optionPath = path.join(rootPath, outputOptions[key as keyof hotOptions]);
			outputOptions[key as keyof hotOptions] = optionPath;
			if (!fs.existsSync(optionPath)) {
				console.warn(`[warning] path "${optionPath}" for option "${key}" does not exists`);
			}
		});
		return outputOptions as hotOptions;
	}

	protected startHttpServer(
		opts: hotOptions,
		emitter: HotEmitter,
		isRetry = 0,
	) {
		const httpPath = path.join(opts.targetCwdPath, opts.targetDocDir);
		const httpIndexPath = path.join(httpPath, 'index.html');

		let isReady = false;

		if (!fs.existsSync(httpIndexPath)) {
			(isRetry === 0) && console.warn('[hot warning] waiting to see "index.html" in the docs folder so that the http server can start.');
			if (isRetry > 10000) { throw new Error(`Could not open a browser session after ${isRetry/10} seconds`); }
		} else {
			isReady = true;
			emitter.http.server.ready(httpPath);
		}
		return isReady;
	}
	
	protected startWatchingFiles(opts: hotOptions, emitter = this.emitter){
		const watcher = chokidar.watch([
			opts.sourceDistPath,
			opts.sourceMediaPath
		], { ignoreInitial: true })
			.on('unlink', path => this.debounceWatchCallBack(path, emitter))
			.on('add', path => this.debounceWatchCallBack(path, emitter))
			.on('change', path => this.debounceWatchCallBack(path, emitter))
			.on('error', err => console.error(err));

		return watcher;
	}

	protected debounceWatchCallBack(path, emitter: HotEmitter) {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			emitter.file.changed(path);
		}, 100);
	}
	
}