import path from 'path';
import chokidar = require('chokidar');

import { allOptions, logContexts } from '../types';
import { HotEmitter } from '../interface/HotEmitter';
import TypeDoc = require('typedoc');
import { load } from '..';
import fs from 'fs-extra';

export class HotUtils {
	emitter: HotEmitter;
	isReady: boolean;
	timer;
	constructor(emitter: HotEmitter) {
		this.emitter = emitter;
		this.isReady = false;
		this.timer;
	}

	protected parseOptions(
		opts: allOptions,
		app: TypeDoc.Application
	): allOptions {
		load(app);
		opts.localHot = app.options.getValue('hot-dev');
		app.options.addReader(new TypeDoc.TypeDocReader());
		app.bootstrap();
		opts.tdocSource = app.options['_values'];

		const hotOpts = opts.localHot;
		Object.keys(hotOpts).forEach((key) => {
			opts.tdocSource['hot-dev'][key] &&
				(hotOpts[key] = opts.tdocSource['hot-dev'][key]);
			opts.overrideHot[key] && (hotOpts[key] = opts.overrideHot[key]);
		});

		const cwd = path.normalize(process.cwd());
		opts.targetCwdPath = path.normalize(path.join(cwd, hotOpts.targetCwd));
		opts.sourceMediaPath = path.normalize(opts.tdocSource.media as string);
		opts.sourceDistPath = path.join(cwd, hotOpts.sourceDist);

		return opts;
	}

	/**
	 * For compatibility with any other plugins which may override the 'out'
	 * option, we explicitly get it from 'typedoc.json'.
	 * @param opts
	 * @returns
	 */
	protected getHttpRoot(opts: allOptions): string {
		const tdPath = path.join(opts.targetCwdPath, 'typedoc.json');
		!fs.existsSync(tdPath) &&
			(() => {
				throw new Error(
					`Please create "${path.join(
						opts.targetCwdPath,
						'typedoc.json'
					)}" and set "out"`
				);
			});
		const docFolder = fs.readJSONSync(tdPath).out;
		!docFolder &&
			(() => {
				throw new Error(`Please set "out" in "${tdPath}"`);
			});
		return path.join(opts.targetCwdPath, docFolder);
	}

	protected startWatchingFiles(opts: allOptions, emitter = this.emitter) {
		const watchDirs = [opts.sourceDistPath];
		opts.sourceMediaPath && watchDirs.push(opts.sourceMediaPath);

		const watcher = chokidar
			.watch(watchDirs, { ignoreInitial: true })
			.on('unlink', (path) => this.debounceWatchCallBack(path, emitter))
			.on('add', (path) => this.debounceWatchCallBack(path, emitter))
			.on('change', (path) => this.debounceWatchCallBack(path, emitter))
			.on('error', (err) => emitter.log.error('hot', err.message));

		watchDirs.forEach((dir) =>
			emitter.log.message('hot', `watching dir "${dir}"`, true)
		);
		return watcher;
	}

	protected debounceWatchCallBack(path, emitter: HotEmitter) {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			emitter.file.changed(path);
		}, 100);
	}

	protected findJsonInString(
		string: string
	): false | { [key: string]: unknown } {
		let json = false;

		string = string.split(/\n/).find((subString) => {
			subString = subString.trim();
			return subString.startsWith('{') && subString.endsWith('}');
		});
		if (!string) return;
		try {
			json = JSON.parse(string.trim());
		} catch (err) {
			json = false;
		}
		return json as false | { [key: string]: unknown };
	}

	protected logger(
		context: logContexts,
		message: string,
		type: 'log' | 'warn' | 'error',
		prefix = false
	) {
		const messageArray = message.split(/\n/g);
		let dashLen = 110;
		let content: string;

		switch (type) {
			case 'log':
				content = `[${context}]`;
				break;
			case 'warn':
				content = `[${context}][warning]`;
				break;
			case 'error':
				content = `[${context}][error]`;
		}
		messageArray.forEach((messagePart) => {
			messagePart = messagePart.trimEnd();
			const messLen = messagePart.length + content.length;
			messLen >= dashLen ? (dashLen = 1) : (dashLen = dashLen - messLen);

			messagePart = prefix
				? `${'-'.repeat(dashLen)} ${messagePart}\n`
				: messagePart;
			prefix && (content = `\n${content}`);
			console[type](content, messagePart);
		});
	}
}
