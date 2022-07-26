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
	fileWatcher;
	tdocBuildCount: number;
	app: TypeDoc.Application;

	constructor() {
		super(emitter);
		this.tdocBuildCount = 0;
		this.app = new TypeDoc.Application();
	}

	public async init(overrideHot: hotOptions, tsdocRunner: runners = 'node'): Promise<{ tsc, tdoc, fileWatcher, opts: allOptions }> {
		this.opts = {
			overrideHot
		};
		this.parseOptions(this.opts, this.app);
		this.getTdocOptions(this.emitter, this.opts, new AbortController(), tsdocRunner);
		this.getTscConfig(this.emitter);
		
		return new Promise(resolve => {

			this.emitter.on('tsc.compile.done', () => {
				this.emitter.log.message('hot', 'tsc compiled in watch mode', true);
				this.tdoc = this.spawnTsDoc(this.emitter, this.opts, new AbortController(), tsdocRunner, this.tdocBuildCount);
			});
			this.emitter.once('tdoc.build.init', () => {
				this.emitter.log.message('hot', 'initial documents built', true);
				!testing && browser.init({ server: this.opts.targetOutPath }); //cannot get Mocha/sinon to stub browserSync

				this.fileWatcher = this.startWatchingFiles(this.opts, this.emitter);
				resolve({
					tsc: this.tsc,
					tdoc: this.tdoc,
					fileWatcher: this.fileWatcher,
					opts: this.opts
				}); //resolved values are for the purpose of tests

			});
			this.emitter.on('tdoc.build.refreshed', () => {
				!testing && browser.reload(); //cannot get Mocha/sinon to stub browserSync
			});

			this.emitter.on('files.changed', path => {
				if (path.startsWith(this.opts.sourceMediaPath)) {
					this.emitter.log.message('hot', 'change asset', true);
					this.tdoc.process.stdin.write('buildDocs');
				} else {
					this.emitter.log.message('hot', 'change source', true);
					this.tdocBuildCount++;
					this.tdoc.controller.abort();
					this.tdoc = this.spawnTsDoc(this.emitter, this.opts, new AbortController(), tsdocRunner, this.tdocBuildCount);
				}
			});
			this.emitter.on('options.ready', () => {
				this.tsc = this.spawnTscWatch(this.emitter, new AbortController(), this.opts);
			});
			this.emitter.on('options.set.tsc', opts => {
				this.opts.tsc = opts;
				this.opts.tdocTarget && this.emitter.options.ready();
			});
			this.emitter.on('options.set.tdoc', opts => {
				this.opts.tdocTarget = opts;
				this.opts.targetOutPath = opts.out;
				this.opts.tsc && this.emitter.options.ready();
			});
			
			this.emitter.on('log.message', (message, context, type, prefix) => this.logger(message, context, type, prefix));
		});
	}

}

