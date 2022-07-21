import { spawn } from 'child_process';
import path from 'path';
import { HotEmitter } from '..';
import HotUtils from './Utils';
import { spawnedProcess, hotOptions } from '../types';

export class Spawn extends HotUtils {

	emitter: HotEmitter;
	constructor(emitter: HotEmitter){
		super(emitter);
		this.emitter = emitter;
	}

	protected spawnTscWatch(
		emitter: HotEmitter,
		controller: AbortController,
		...tscOptions
	): spawnedProcess {

		(tscOptions.indexOf('--watch') < 0) && tscOptions.push('--watch');
		(tscOptions.indexOf('--preserveWatchOutput') < 0) && tscOptions.push('--preserveWatchOutput');

		const { signal } = controller;

		let resolved = false;
		const tsc = spawn('node_modules/.bin/tsc', tscOptions, { signal });
		tsc.on('error', (err: Error) => console.error('[tsc]', err));
		tsc.stdout.on('data', (data: Buffer) => {
			const message = String(data).trim();
			console.log('[tsc]', message);
			if (!resolved && message.endsWith('Watching for file changes.')) {
				resolved = true;
				emitter.tsc.compile.done();
			}
		});
		return {process: tsc, controller};
	}

	protected spawnTsDoc(
		emitter: HotEmitter,
		opts: hotOptions,
		controller: AbortController,
		command = 'node',
		buildCount
	): spawnedProcess {
		const { signal } = controller;
		const tsdoc = spawn(command, [
			path.join(__dirname, '../spawned'),
			opts.targetDocDir
		], { cwd: opts.targetCwdPath, signal });

		tsdoc.on('error', (err: Error) => {
			(err.message !== 'The operation was aborted') && console.error(`[tsdoc error] ${err.message}`);
		});

		tsdoc.stdout.on('data', (data: Buffer) => {
			const message = data.toString().trim();
			console.log('[typedoc]', message);
			if (message.endsWith('build done')) {
				if(!buildCount) {
					buildCount = 1;
					emitter.tdoc.build.init();
				} else {
					emitter.tdoc.build.refreshed();
				}
			}
		});
		tsdoc.stderr.on('data', (data: Buffer) => { console.error(`[typedoc] stderr: ${data}`); });
		return { process: tsdoc, controller };
	}
}