import { spawn } from 'child_process';
import path from 'path';
import { HotEmitter } from '../interface/HotEmitter';
import { HotUtils } from './Utils';
import { spawnedProcess, hotOptions, allOptions } from '../types';


/**
 * ### Creates spawned processes.
 * - the tsc compiler in watch mode
 * - disposable typedoc processes
 * 
 */
export class Spawn extends HotUtils {

	emitter: HotEmitter;
	constructor(emitter: HotEmitter) {
		super(emitter);
		this.emitter = emitter;
	}

	/**
	 * Spawns a tsc process in watch mode
	 * @param emitter 
	 * @param controller
	 * @returns 
	 */
	protected spawnTscWatch(
		emitter: HotEmitter,
		controller: AbortController,
		opts: allOptions
	): spawnedProcess {
		let tscOptions = ['--preserveWatchOutput', '--watch'];
		(opts.tsc.references && opts.tsc.references['length']) && (tscOptions = ['--build', ...tscOptions]);
		const { signal } = controller;

		let resolved = false;
		const tsc = spawn('npx', ['tsc', ...tscOptions], { signal });

		tsc.on('error', (err: Error) => emitter.log.error('tsc', err.message.toString()));
		tsc.stdout.on('data', (data: Buffer) => {
			const message = data.toString('utf8').trim();
			emitter.log.message('tsc', message);
			if (!resolved && message.endsWith('Watching for file changes.')) {
				resolved = true;
				emitter.tsc.compile.done();
			}
		});
		tsc.stderr.on('data', (data: Buffer) => emitter.log.warning('tsc', data.toString('utf8')));

		return { process: tsc, controller };
		
	}
	protected getTscConfig(emitter: HotEmitter) {
		const tsc = spawn('./node_modules/.bin/tsc', ['--showConfig']);
		tsc.on('error', (err: Error) => emitter.log.error('tsc', err.message.toString()));
		tsc.stdout.on('data', (data: Buffer) => {
			const message = data.toString('utf8').trim();
			const tscOpts = this.isJson(message) as { compilerOptions: { outDir } };
			!tscOpts && (() => { throw new Error('could not get tsc options'); })();
			tsc.kill(0);
			emitter.options.set.tsc(tscOpts);
		});
		tsc.stderr.on('data', (data: Buffer) => emitter.log.warning('tsc', data.toString('utf8')));
	}

	/**
	 * Spawns a disposable typedoc process using
	 * 
	 * @param emitter 
	 * @param opts 
	 * @param controller 
	 * @param command 
	 * @param buildCount 
	 * @returns 
	 */
	protected spawnTsDoc(
		emitter: HotEmitter,
		opts: allOptions,
		controller: AbortController,
		command = 'node',
		buildCount
	): spawnedProcess {
		const { signal } = controller;
		const tsdoc = spawn(
			command,
			[path.join(__dirname, '../spawned')],
			{ cwd: opts.targetCwdPath, signal }
		);

		tsdoc.on('error', (err: Error) => {
			(err.message !== 'The operation was aborted') && emitter.log.error('tdoc', err.message);
		});

		tsdoc.stdout.on('data', (data: Buffer) => {
			const message = data.toString('utf8').trim();
			emitter.log.message('tdoc', message);
			if (message.endsWith('build done')) {
				if (!buildCount) {
					buildCount = 1;
					emitter.tdoc.build.init();
				} else {
					emitter.tdoc.build.refreshed();
				}
			}
		});
		tsdoc.stderr.on('data', (data: Buffer) => emitter.log.warning('tdoc', data.toString('utf8')));
		return { process: tsdoc, controller };
	}

	protected getTdocOptions(
		emitter: HotEmitter,
		opts: hotOptions,
		controller: AbortController,
		command = 'node'
	) {
		const cwd = path.join(process.cwd(), opts.targetCwd);
		const { signal } = controller;
		
		const tsdoc = spawn(command, [ path.join(__dirname, '../spawned'), 'getOptions'], { cwd, signal });

		tsdoc.on('error', (err: Error) => emitter.log.error('tsc', err.message.toString()));
		tsdoc.stdout.on('data', (data: Buffer) => {
			const message = data.toString('utf8').trim();
			const tsdocOpts = this.isJson(message);
			tsdocOpts && emitter.options.set.tdoc(tsdocOpts);
		});
		tsdoc.stderr.on('data', (data: Buffer) => emitter.log.warning('tdoc', data.toString('utf8')));
		tsdoc.on('error', (err: Error) => { throw err; });
	}
}