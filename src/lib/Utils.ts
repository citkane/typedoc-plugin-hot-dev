import path from 'path';
import fs from 'fs-extra';
import chokidar = require('chokidar');

import { allOptions, hotOptions } from '../types';
import { HotEmitter } from '../interface/HotEmitter';

export class HotUtils {
	emitter: HotEmitter;
	isReady: boolean;
	timer;
	constructor(emitter: HotEmitter) {
		this.emitter = emitter;
		this.isReady = false;
		this.timer;
	}

	protected parseOptions(opts: allOptions): allOptions {

		const cwd = process.cwd();
		opts.targetCwdPath = path.join(cwd, opts.hot.targetCwd);
		opts.sourceMediaPath = opts.tdoc.media as string;
		opts.targetDocsPath = opts.tdoc.out as string;

		const distPath = opts.hot.sourceDist ? opts.hot.sourceDist : opts.tsc.compilerOptions['outDir'];
		opts.sourceDistPath = path.join(cwd, distPath);

		return opts;
	}

	protected startHttpServer(
		opts: allOptions,
		emitter: HotEmitter,
		//isRetry = 0,
	) {
		console.log(opts);
		/*
		const httpPath = path.join(opts.targetCwdPath, opts.targetDocDir);
		const httpIndexPath = path.join(httpPath, 'index.html');

		let isReady = false;

		if (!fs.existsSync(httpIndexPath)) {
			(isRetry === 0) && console.warn('[hot warning] waiting to see "index.html" in the docs folder so that the http server can start.');
			if (isRetry > 10000) { throw new Error(`Could not open a browser session after ${isRetry / 10} seconds`); }
		} else {
			isReady = true;
			emitter.http.server.ready(httpPath);
		}
		return isReady;
		*/
	}

	protected startWatchingFiles(opts: allOptions, emitter = this.emitter) {
		const watchDirs = [opts.sourceDistPath];
		opts.sourceMediaPath && watchDirs.push(opts.sourceMediaPath);

		const watcher = chokidar.watch(watchDirs, { ignoreInitial: true })
			.on('unlink', path => this.debounceWatchCallBack(path, emitter))
			.on('add', path => this.debounceWatchCallBack(path, emitter))
			.on('change', path => this.debounceWatchCallBack(path, emitter))
			.on('error', err => console.error(err));

		watchDirs.forEach(dir => console.log(`[hot] watching dir "${dir}".`));
		return watcher;
	}

	protected debounceWatchCallBack(path, emitter: HotEmitter) {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			emitter.file.changed(path);
		}, 100);
	}

	protected isJson(string: string): false | { [key: string]: unknown } {
		let json = false;
		string = string.trim();

		(string.startsWith('{') && string.endsWith('}')) &&
			(() => {
				try {
					json = JSON.parse(string);
				}
				catch (err) {
					json = false;
				}
			})();
		return json as false | { [key: string]: unknown };
	}
}