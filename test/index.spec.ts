process.env.Node = 'test';

import fs from 'fs-extra';
import path, { resolve } from 'path';
import sinon from 'sinon';
import { assert } from 'chai';
import { getHotOptions } from '../src/index';
import { Hot } from '../src/lib/Hot';
import { allOptions, hotOptions } from '../src/types';
import { HotEmitter } from '../src/interface/HotEmitter';
import { spawnSync } from 'child_process';
import { Application, TSConfigReader } from 'typedoc';

const cwd = path.normalize(process.cwd());
const tempFolder = path.normalize('./.tmp');
const sourcDistDir = path.normalize('./dist');
const sourceDistPath = path.join(cwd,  sourcDistDir);
const sourceMediaPath = path.join(cwd, tempFolder, 'media');
const targetDocDir = path.normalize('./docs');
const targetDocPath = path.join(cwd, targetDocDir);
const stubSrcFile = path.join(cwd, '/src/teststubfile.ts');
const stubDistFile = path.join(sourceDistPath, 'teststubfile.js');
const stubSrcMediaFile = path.join(sourceMediaPath, '/teststubfile.css');
const stubDocMediaFile = path.join(targetDocPath, './media/teststubfile.css');

const testingOptions: hotOptions = {
	targetCwd: path.normalize('./'),
	sourceDist: sourcDistDir
}

describe('Plugin loading and environment smoke tests', function(){
	it(`compiles into the default distribution folder`, async function(){
		this.timeout(10000);
		assert.doesNotThrow(() => spawnSync('npx', ['tsc'], {cwd}));
	})
	it('loads options from "hot-dev" custom options', function(){
		this.tdocApp = new Application();
		const opts = getHotOptions();
		assert.hasAllKeys(opts, ['defaultOpts', 'mediaPath'])
		assert.hasAllKeys(opts.defaultOpts , testingOptions)
	})
})


describe('Unit testing for typedoc-plugin-hot-dev', function () {
	before(function () {
		this.timeout(10000);
		cleanDirs(['./.tmp']);
		this.emitter = new HotEmitter();
		this.opts = {
			hot: testingOptions
		};
		this.hot = new Hot(testingOptions);
	});
	it('retrieves spawned tsc options', function(done){
		this.timeout(10000);
		this.emitter.on('options.set.tsc', opts => {
			assert.hasAnyKeys(opts, ['compilerOptions']);
			this.opts.tsc = opts;
			done();
		})
		this.hot.getTscConfig(this.emitter);
	})
	it('retrieves spawned tdoc options', function(done){
		this.timeout(10000);
		this.emitter.on('options.set.tdoc', opts => {
			assert.hasAnyKeys(opts, ['out']);
			this.opts.tdoc = opts;
			done();
		})
		this.hot.getTdocOptions(this.emitter, testingOptions, new AbortController(), 'ts-node');
	})
	it('creates and transforms options', function () {
		this.opts = this.hot.parseOptions(this.opts, sourceMediaPath);

		assert.hasAnyKeys(this.opts, ['targetCwdPath','sourceMediaPath'], 'did not generate root keys')
		assert.equal(stripTrailing(this.opts.targetCwdPath), stripTrailing(cwd), 'did not resolve the path for "targetCwd" correctly')
		assert.equal(stripTrailing(this.opts.sourceMediaPath), stripTrailing(sourceMediaPath), 'did not resolve the path for "sourceMediaPath" correctly')
		assert.equal(stripTrailing(this.opts.sourceDistPath), stripTrailing(sourceDistPath), 'did not resolve the path for "sourcDistPath" correctly')

	});
})

describe('Functional testing for typedoc-plugin-hot-dev', function () {

	before(function () {
		cleanDirs([tempFolder, stubSrcFile]);
		this.hot = new Hot(testingOptions);
		this.emitter = new HotEmitter()
	});
	after(function () {
		cleanDirs([tempFolder, stubSrcFile]);
	});
	it(`spawns a tsc process that compiles to the "${sourceDistPath}"`, function (done) {
		this.timeout(10000);
		this.tsc = this.hot.spawnTscWatch(this.emitter, new AbortController(),{sourceDistPath, tsc:{}, tdoc: {}});

		assert.exists(this.tsc.controller.abort, 'spawn did not return a controller');
		assert.isObject(this.tsc.process, 'spawn did not return a process object');
		assert.exists(this.tsc.process.kill, 'spawn did not return a process kill');
		
		this.emitter.on('tsc.compile.done', () => {
			assert.isTrue(fs.existsSync(sourceDistPath), `tsc did not create the "${sourceDistPath}" folder`);
			assert.isTrue(fs.existsSync(path.join(sourceDistPath, 'index.js')), 'tsc did not compile "index.js" from "index.ts"');
			assert.isTrue(fs.existsSync(path.join(sourceDistPath, 'index.d.ts')), 'tsc did not compile "index.ts" with a "index.d.ts"');
			done();
		});


	});
	it(`watches the "${cwd}/src" folder and compiles on change`, async function(){
		this.timeout(10000);
		fs.createFileSync(stubSrcFile);
		const hasWatched = await waitForFile(stubDistFile);
		cleanDirs([stubSrcFile]);
		assert.isTrue(hasWatched, 'the tsc compiler is not watching the src folder');
		this.tsc.controller.abort();
		this.tsc.process.kill(0);
	})
	it(`spawns a typedoc process that builds docs to the "${targetDocDir}" folder`, async function () {
		this.timeout(30000);
		const allOps = await getAllOpts(); 
		const startController = new AbortController();
		const tdoc = this.hot.spawnTsDoc(this.emitter, allOps, startController, 'ts-node', 0);
		assert.exists(tdoc.controller.abort, 'spawn did not return a controller');
		assert.exists(tdoc.process.kill, 'spawn did not return a process');
		assert.isObject(tdoc.process, 'spawn did not return a process');

		const hasBuiltDocs = await waitForFile(path.join(targetDocPath, 'index.html'), this.timeout());
		assert.isTrue(hasBuiltDocs, 'spawn did not build docs');
		tdoc.controller.abort();
		tdoc.process.kill(0);
		
	});
})

describe('End to End test for typedoc-plugin-hot-dev', function () {
	
	
	before(async function () {
		cleanDirs([tempFolder, stubSrcFile])
		fs.ensureDirSync(sourceMediaPath);
	});
	after(function(done){
		cleanDirs([tempFolder, stubSrcFile]);
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
		this.timeout(30000);
		({
			tsc: this.tsc,
			tdoc: this.tdoc,
			fileWatcher: this.fileWatcher,
			httpPath: this.httpPath
		} = await new Hot(testingOptions).init(sourceMediaPath, 'ts-node'));
		
		assert.exists(this.tsc.controller.abort);
		assert.exists(this.tdoc.controller.abort);
		assert.exists(this.tsc.process.kill);
		assert.exists(this.tdoc.process.kill);
		assert.exists(this.fileWatcher.close);
	})
	it('triggers the browser client at the correct path', function(done){
		assert.equal(this.httpPath, path.join(process.cwd(), targetDocDir), 'the hot browser was not trigged');
		setTimeout(() => done(), 100)
	})
	it('updates asset files on change', async function(){
		this.timeout(10000);
		fs.createFileSync(stubSrcMediaFile);
		const wasUpdated = await waitForFile(stubDocMediaFile, 5000);
		assert.isTrue(wasUpdated, 'update was not triggered on asset change');
	});
	it('updates source files on change', async function(){
		this.timeout(30000);
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
const stripTrailing = (path) => path.replace(/\/$/, '');

function getAllOpts(): Promise<allOptions>{
	return new Promise(resolve => {
		const options: {[key: string]: unknown} = {
			hot: testingOptions,

		}
		const emitter = new HotEmitter();
		const hot = new Hot(testingOptions);
		emitter.on('options.set.tsc', opts => {
			options.tsc = opts;
			options.tdoc && resolve((<any>hot).parseOptions(options));
		})
		emitter.on('options.set.tdoc', opts => {
			options.tdoc = opts
			options.tdoc && resolve((<any>hot).parseOptions(options));
		});
	
		(<any>hot).getTscConfig(emitter);
		(<any>hot).getTdocOptions(emitter, testingOptions, new AbortController(), 'ts-node');
	})
}
