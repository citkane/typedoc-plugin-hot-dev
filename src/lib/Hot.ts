import browserSync from 'browser-sync';
import { hotOptions, runners, spawnedProcess } from '../types';
import { Application } from 'typedoc';
import { Spawn } from './Spawn';
import { HotEmitter } from '../HotEmitter';
import { load } from '..';

const browser = browserSync.create();
const testing = (process.env.Node === 'test');
const emitter = new HotEmitter();

export default class Hot extends Spawn {
	opts: hotOptions;
	defaultOpts: hotOptions;
	tscOptions: string[];
	tsc: spawnedProcess;
	tdoc: spawnedProcess;
	fileWatcher;
	browser: typeof browser;
	tdocBuildCount: number;
	aborted: boolean;
	tdocApp: Application;

	constructor(...tscOptions) {
		super(emitter);
		this.tscOptions = tscOptions;
		const tdocApp = new Application();
		load(tdocApp);
		this.defaultOpts = tdocApp.options.getValue('hot-dev') as hotOptions;
		this.browser = browser;
		this.tdocBuildCount = 0;
		this.aborted = false;
	}

	public async init(tsdocRunner: runners = 'node'): Promise<{ tsc, tdoc, fileWatcher, httpPath }> {

		this.opts = this.makeOptions(this.defaultOpts);
		this.tsc = this.spawnTscWatch(this.emitter, new AbortController(), ...this.tscOptions);

		return new Promise(resolve => {

			this.emitter.on('tsc.compile.done', () => {
				this.fileWatcher = this.startWatchingFiles(this.opts);
				this.tdoc = this.spawnTsDoc(this.emitter, this.opts, new AbortController(), tsdocRunner, this.tdocBuildCount);
			});
			this.emitter.once('tdoc.build.init', () => {
				let counter = 0;
				const time = 100;
				const interval = setInterval(() => {
					const isReady = this.startHttpServer(this.opts, this.emitter, counter);
					isReady && clearInterval(interval);
					counter += time;
				}, time);

			});
			this.emitter.on('tdoc.build.refreshed', () => {
				!testing && this.browser.reload(); //cannot get Mocha/sinon to stub browserSync
			});
			this.emitter.on('http.server.ready', httpPath => {
				!testing && this.browser.init({ server: httpPath }); //cannot get Mocha/sinon to stub browserSync
				resolve({
					tsc: this.tsc,
					tdoc: this.tdoc,
					fileWatcher: this.fileWatcher,
					httpPath
				}); //resolve values are for the purpose of tests
			});
			this.emitter.on('files.changed', path => {
				if (path.startsWith(this.opts.sourceMediaPath)) {
					console.log('[hot]---------------------------------------- change asset');
					this.tdoc.process.stdin.write('buildDocs');
				} else {
					console.log('[hot]---------------------------------------- change source');
					this.tdocBuildCount++;
					this.tdoc.controller.abort();
					this.tdoc = this.spawnTsDoc(this.emitter, this.opts, new AbortController(), tsdocRunner, this.tdocBuildCount);
				}
			});
		});
	}

}

