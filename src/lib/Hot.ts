/**
 * #### Provides the highest level app logic, and is the default entry class
 * 
 * Manages events as defined in {@link API!HotEmitter}.
 * 
 * @module
 */

import browserSync from 'browser-sync';
import { allOptions, hotOptions, runners, spawnedProcess } from '../types';
import { Spawn } from './Spawn';
import { HotEmitter } from '../interface/HotEmitter';
import TypeDoc = require('typedoc');

const browser = browserSync.create();
const testing = (process.env.Node === 'test');
const emitter = new HotEmitter();


/**
 * ### Provides the API logic for event listeners.
 * 
 */
export class Hot extends Spawn {
	opts: allOptions;
	tsc: spawnedProcess;
	tdoc: spawnedProcess;
	npmScripts: spawnedProcess[];
	fileWatcher;
	tdocBuildCount: number;
	app: TypeDoc.Application;

	constructor() {
		super(emitter);
		this.tdocBuildCount = 0;
		this.app = new TypeDoc.Application();
		this.npmScripts = [];
	}

	public async init(
		overrideHot: hotOptions,
		tsdocRunner: runners = 'node',
		emitter = this.emitter
	)
	: Promise<{ tsc, tdoc, npmScripts, fileWatcher, opts: allOptions }> 
	{
		this.opts = { overrideHot };
		this.parseOptions(this.opts, this.app);
		this.npmScripts = this.runNpmScripts(emitter, this.opts);
		this.getTdocOptions(emitter, this.opts, new AbortController(), tsdocRunner);
		this.getTscConfig(emitter);
		
		return new Promise(resolve => {

			emitter.on('tsc.compile.done', () => {
				emitter.log.message('hot', 'tsc compiled in watch mode', true);
				this.tdoc = this.spawnTsDoc(emitter, this.opts, new AbortController(), tsdocRunner, this.tdocBuildCount);
			});
			emitter.once('tdoc.build.init', () => {
				emitter.log.message('hot', 'initial documents built', true);
				!testing && browser.init({ server: this.getHttpRoot(this.opts) }); //cannot get Mocha/sinon to stub browserSync
				this.fileWatcher = this.startWatchingFiles(this.opts, emitter);
				resolve({
					tsc: this.tsc,
					tdoc: this.tdoc,
					npmScripts: this.npmScripts,
					fileWatcher: this.fileWatcher,
					opts: this.opts
				}); //resolved values are for the purpose of tests

			});
			emitter.on('tdoc.build.refreshed', () => {
				!testing && browser.reload(); //cannot get Mocha/sinon to stub browserSync
			});

			emitter.on('files.changed', path => {
				if (path.startsWith(this.opts.sourceMediaPath)) {
					emitter.log.message('hot', 'change asset', true);
					this.tdoc.process.stdin.write('buildDocs');
				} else {
					emitter.log.message('hot', 'change source', true);
					this.tdocBuildCount++;
					this.tdoc.controller.abort();
					this.tdoc = this.spawnTsDoc(emitter, this.opts, new AbortController(), tsdocRunner, this.tdocBuildCount);
				}
			});
			emitter.on('options.ready', () => {
				this.tsc = this.spawnTscWatch(emitter, new AbortController(), this.opts);
			});
			emitter.on('options.set.tsc', opts => {
				this.opts.tsc = opts;
				this.opts.tdocTarget && emitter.options.ready();
			});
			emitter.on('options.set.tdoc', opts => {
				this.opts.tdocTarget = opts;
				this.opts.targetOutPath = opts.out;
				this.opts.tsc && emitter.options.ready();
			});
			
			emitter.on('log.message', (context, message, type, prefix) => this.logger(context, message, type, prefix));
		});
	}

}

