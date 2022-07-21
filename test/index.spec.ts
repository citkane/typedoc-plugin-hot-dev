process.env.Node = 'test';

import Hot, {HotEmitter, load} from '../src/index';
import fs from 'fs-extra';
import path, { resolve } from 'path';
import sinon from 'sinon';
import { assert } from 'chai';
import { hotOptions } from '../src/types';
import { spawnSync } from 'child_process';
import { Application } from 'typedoc';

const cwd = process.cwd();

const sourceDistPath = path.join(cwd, './.tmp/dist');
const sourceMediaPath = path.join(cwd, './.tmp/media');
const targetDocDir = './.tmp/docs';
const stubSrcFile = path.join(cwd, '/src/teststubfile.ts');
const stubDistFile = path.join(sourceDistPath, 'teststubfile.js');
const stubSrcMediaFile = path.join(sourceMediaPath, '/teststubfile.css');
const stubDocMediaFile = path.join(cwd, targetDocDir, './media/teststubfile.css');
const stubDocIndexfile = path.join(cwd, targetDocDir, './index.html');

let defaultOptions: hotOptions;
const fullTestingOptions: hotOptions = {
	targetDocDir,
	targetCwdPath: process.cwd(),
	sourceDistPath,
	sourceMediaPath
}

describe('Plugin loading and environment smoke tests', function(){

	it('loads default options from "hot-dev" custom options', function(){
		this.tdocApp = new Application();
		load(this.tdocApp);
		assert.doesNotThrow(() => { defaultOptions = this.tdocApp.options.getValue('hot-dev') as hotOptions; })	
		assert.hasAllKeys(defaultOptions, ['targetDocDir', 'targetCwdPath', 'sourceDistPath', 'sourceMediaPath'])
	})

	it('needs a build in the "./dist" folder', async function(){
		this.timeout(10000);
		spawnSync('npm', ['run', 'build'], {cwd: process.cwd()});
		assert.isTrue(fs.existsSync('./dist/index.js'), 'no index.js found in ./dist folder');
		
	})
})


describe('Unit testing for typedoc-plugin-hot-dev', function () {
	before(function () {
		cleanDirs(['./.tmp']);
		this.tdocApp = new Application();
		load(this.tdocApp);
		defaultOptions = this.tdocApp.options.getValue('hot-dev') as hotOptions;
		this.hot = new Hot();
		this.emitter = new HotEmitter();
		this.httpPath = false;
	});

	it('creates and transforms options', function () {
		const options = (<any>this.hot).makeOptions(defaultOptions);
		assert.hasAllKeys(options, defaultOptions);
		Object.keys(defaultOptions).forEach(function (key) {
			if (key === 'targetDocDir') {
				assert.notEqual(options.targetDocDir, 'test/docs', 'makeOptions did not overide "targetDocDir" from "typedoc.json".');
			} else {
				assert.notEqual(options[key], defaultOptions[key], `"makeOptions" did not resolve the path for: ${key} `);
			}
		})
		assert.isTrue(options.targetCwdPath.endsWith('/'), '"makeOptions did not correctly resolve the process cwd.');
	});
	describe('Environment for http server / client', function(){
		it('does not trigger when "index.html" is not present', function(){
			const isStarted = this.hot.startHttpServer(fullTestingOptions, this.emitter);
			assert.isFalse(isStarted, 'server start should not be triggered');
		})
		it('triggers when "index.html" is present', async function (){
	
			this.emitter.on('http.server.ready', path => this.httpPath = path);
			fs.createFileSync(stubDocIndexfile);
			const isStarted = this.hot.startHttpServer(fullTestingOptions, this.emitter);
	
			assert.isTrue(isStarted, 'server start should be triggered');
			
	
		})
		it('returns the http root folder', function(){
			assert.equal(this.httpPath, path.join(process.cwd(), targetDocDir));
		})
	})
})

describe('Functional testing for typedoc-plugin-hot-dev', function () {

	before(function () {
		cleanDirs(['./.tmp', stubSrcFile]);
		this.hot = new Hot();
		this.emitter = new HotEmitter()
	});
	after(function () {
		//cleanDirs(['./.tmp', stubSrcFile]);
	});
	it(`spawns a tsc process that compiles to the "${sourceDistPath}" folder and watches the "./src" folder`, async function () {
		this.timeout(10000);
		const spawnTscWatch = (<any>this.hot).spawnTscWatch
		const tsc = spawnTscWatch(this.emitter, new AbortController(), '--outDir', sourceDistPath);

		assert.exists(tsc.controller.abort, 'spawn did not return a controller');
		assert.exists(tsc.process.kill, 'spawn did not return a process');
		assert.isObject(tsc.process, 'spawn did not return a process');
		await new Promise(resolve => {
			this.emitter.on('tsc.compile.done', () => resolve(true));
		})
		assert.isTrue(fs.existsSync(sourceDistPath), `tsc did not create the "${sourceDistPath}" folder`);
		assert.isTrue(fs.existsSync(path.join(sourceDistPath, 'index.js')), 'tsc did not compile "index.js" from "index.ts"');
		assert.isTrue(fs.existsSync(path.join(sourceDistPath, 'index.d.ts')), 'tsc did not compile "index.ts" with a "index.d.ts"');
		fs.createFileSync(stubSrcFile);
		const hasWatched = await waitForFile(stubDistFile);
		cleanDirs([stubSrcFile]);
		assert.isTrue(hasWatched, 'the tsc compiler is not watching the src folder');
		tsc.controller.abort();
		tsc.process.kill(0);
	});
	it(`spawns a typedoc process that builds docs to the "${targetDocDir}" folder`, async function () {
		this.timeout(10000);
		const startController = new AbortController();
		const spawnTsDoc = (<any>this.hot).spawnTsDoc;
		const tdoc = spawnTsDoc(this.emitter, fullTestingOptions, startController, 'ts-node', 0);
		assert.exists(tdoc.controller.abort, 'spawn did not return a controller');
		assert.exists(tdoc.process.kill, 'spawn did not return a process');
		assert.isObject(tdoc.process, 'spawn did not return a process');
		const hasBuiltDocs = await waitForFile(path.join(targetDocDir, 'index.html'), this.timeout());
		assert.isTrue(hasBuiltDocs, 'spawn did not build docs');
		tdoc.controller.abort();
		tdoc.process.kill(0);
	});
})

describe('End to End test for typedoc-plugin-hot-dev', function () {
	this.timeout(100000);
	
	before(async function () {
		cleanDirs(['./.tmp', stubSrcFile]);
		this.hot = new Hot('--outDir', './.tmp/dist');
		sinon.stub(this.hot, 'makeOptions').returns(fullTestingOptions);
		({
			tsc: this.tsc,
			tdoc: this.tdoc,
			fileWatcher: this.fileWatcher,
			httpPath: this.httpPath
		} = await this.hot.init('ts-node'));

	});
	after(function(done){
		cleanDirs(['./.tmp', stubSrcFile]);
		this.fileWatcher.close();
		this.tdoc.controller.abort();
		this.tsc.controller.abort();
		
		setTimeout(() => {
			this.tdoc.process.kill(0);
			this.tsc.process.kill(0);
			done()
		},100)
	})

	it('starts a tsc compiler in watch mode and runs the initial doc build', async function () {
		assert.exists(this.tsc.controller.abort);
		assert.exists(this.tdoc.controller.abort);
		assert.exists(this.tsc.process.kill);
		assert.exists(this.tdoc.process.kill);
		assert.exists(this.fileWatcher.close);
	})
	it('triggers the browser client at the correct path', function(){
		assert.equal(this.httpPath, path.join(process.cwd(), targetDocDir), 'the hot browser was not trigged');
	})
	it('updates asset files on change', async function(){
		fs.createFileSync(stubSrcMediaFile);
		const wasUpdated = await waitForFile(stubDocMediaFile, 5000);
		assert.isTrue(wasUpdated, 'update was not triggered on asset change');
	});
	it('updates source files on change', async function(){
		fs.createFileSync(stubSrcFile);
		const wasUpdated = await waitForFile(stubDistFile, 100000);
		assert.isTrue(wasUpdated, 'update was not triggered on source file change');
	});
})

function cleanDirs(dirs) {
	dirs.forEach(dir => fs.removeSync(dir));
}
function waitForFile(file: string, timeout = 3000) {
	return new Promise((resolve) => {
		const interval = setInterval(function () {
			if (fs.existsSync(file)) {
				clearTimeout(timer);
				clearInterval(interval);
				resolve(true);
			}
		}, 100)
		const timer = setTimeout(function () {
			clearInterval(interval);
			resolve(false);
		}, timeout)
	});
}