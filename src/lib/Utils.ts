import path from 'path';
import chokidar = require('chokidar');

import { allOptions, logContexts } from '../types';
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

	protected parseOptions(opts: allOptions, mediaPath): allOptions {

		const cwd = path.normalize(process.cwd());
		opts.targetCwdPath = path.normalize(path.join(cwd, opts.hot.targetCwd));
<<<<<<< HEAD
		opts.sourceMediaPath = path.normalize(opts.tdoc.media as string);
=======
		opts.sourceMediaPath = mediaPath ? path.normalize(mediaPath) : null;
		opts.targetDocsPath = opts.hot.targetDoc ? path.join(cwd, opts.hot.targetDoc) : path.normalize(opts.tdoc.out as string);
>>>>>>> main

		const distPath = opts.hot.sourceDist ? opts.hot.sourceDist : opts.tsc.compilerOptions['outDir'];
		opts.sourceDistPath = path.join(cwd, distPath);

		return opts;
	}

	protected startWatchingFiles(opts: allOptions, emitter = this.emitter) {
		const watchDirs = [opts.sourceDistPath];
		opts.sourceMediaPath && watchDirs.push(opts.sourceMediaPath);

		const watcher = chokidar.watch(watchDirs, { ignoreInitial: true })
			.on('unlink', path => this.debounceWatchCallBack(path, emitter))
			.on('add', path => this.debounceWatchCallBack(path, emitter))
			.on('change', path => this.debounceWatchCallBack(path, emitter))
			.on('error', err => emitter.log.error('hot', err.message));

		watchDirs.forEach(dir => emitter.log.message('hot', `watching dir "${dir}"`, true));
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

	protected logger(
		context: logContexts,
		message: string,
		type: 'log' | 'warn' | 'error',
		prefix = false
	) {
		message = message.trim();
		let dashLen = 110;
		let cont: string;

		switch (type) {
		case 'log':
			cont = `[${context}]`;
			break;
		case 'warn':
			cont = `[${context}][warning]`;
			break;
		case 'error':
			cont = `[${context}][error]`;
		}
		
		const messLen = message.length + cont.length;
		(messLen >= dashLen)? dashLen = 1 : dashLen = dashLen - messLen; 

		message = prefix ? `${'-'.repeat(dashLen)} ${message}\n` : message;
		prefix && (cont = `\n${cont}`);
		console[type](cont, message);
	}
}
