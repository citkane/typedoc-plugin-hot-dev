process.env.Node = 'test';

import fs from 'fs-extra';
import path, { resolve } from 'path';
import { assert } from 'chai';
import { Hot } from '../src/lib/Hot';
import { HotEmitter } from '../src/interface/HotEmitter';
import { spawnSync } from 'child_process';
import { Application } from 'typedoc';
import {
	cwd,
	cleanDirs, 
	sourceDistPath, 
	sourceMediaPath, 
	stripTrailing, 
	stubDistFile, 
	stubDocMediaFile, 
	stubSrcFile, 
	stubSrcMediaFile, 
	targetDocDir, 
	targetDocPath, 
	waitForFile, 
	overrideHot
} from './testutils';


describe('Plugin loading and environment smoke tests', function(){
	it(`compiles into the default distribution folder`, async function(){
		this.timeout(10000);
		assert.doesNotThrow(() => spawnSync('npm', ['run', 'build'], {cwd}));
	})
})


describe('Unit testing for typedoc-plugin-hot-dev', function () {
	before(function () {
		this.timeout(10000);
		this.opts = {overrideHot};
		this.emitter = new HotEmitter();
		this.hot = new Hot();
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
		this.hot.getTdocOptions(this.emitter, overrideHot, new AbortController(), 'ts-node');
	})
	it('creates and transforms options', function () {

		this.opts = this.hot.parseOptions(this.opts, new Application());

		assert.hasAnyKeys(this.opts, ['targetCwdPath','sourceMediaPath', 'targetOutPath', 'sourceDistPath'], 'did not generate root keys')
		assert.equal(stripTrailing(this.opts.targetCwdPath), stripTrailing(cwd), 'did not resolve the path for "targetCwd" correctly')
		assert.equal(stripTrailing(this.opts.sourceMediaPath), stripTrailing(sourceMediaPath), 'did not resolve the path for "sourceMediaPath" correctly')
		assert.equal(stripTrailing(this.opts.sourceDistPath), stripTrailing(sourceDistPath), 'did not resolve the path for "sourcDistPath" correctly')

	});
	it('explicitly fetches the root http path', function(){
		assert.equal(this.hot.getHttpRoot({ targetCwdPath: process.cwd() }), path.join(process.cwd(), 'docs'));
	})
})

describe('Functional testing for typedoc-plugin-hot-dev', function () {

	before(function () {
		this.hot = new Hot();
		this.emitter = new HotEmitter()
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
		const allOps = this.hot.parseOptions({overrideHot}, new Application());
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
	before(function(){
		fs.ensureDirSync(sourceMediaPath);
	});
	after(function(){
		this.tdoc.process.kill(0);
		this.tsc.process.kill(0);
		this.npmScripts.forEach(spawn => {
			spawn.process.kill(0);
		});
	})

	it('starts a tsc compiler in watch mode and runs the initial doc build', async function () {
		this.timeout(30000);

		const emitter = new HotEmitter();
		emitter.on('log.message', (context, message, type, prefix) => {
			if (context === 'npm') {
				message = message.trim();
				(message === 'test') && (this.npmTestRan = true);
				(message.indexOf('Missing script: "foo"') > -1 ) && (this.npmTestFailed = true);
			}
		});
		({
			tsc: this.tsc,
			tdoc: this.tdoc,
			npmScripts: this.npmScripts,
			fileWatcher: this.fileWatcher,
			opts: this.opts
		} = await new Hot().init(overrideHot, 'ts-node', emitter));
		
		assert.exists(this.tsc.controller.abort);
		assert.exists(this.tdoc.controller.abort);
		assert.exists(this.tsc.process.kill);
		assert.exists(this.tdoc.process.kill);
		assert.exists(this.fileWatcher.close);
	})
	it('spawns npm scripts', function(){
		assert.isTrue(this.npmTestRan, 'npm script failed to run');
		assert.isTrue(this.npmTestFailed, 'failed npm script did not register');
	})
	it('updates asset files on change', function(done){
		this.timeout(10000);
		setTimeout(async () => {
			fs.createFileSync(stubSrcMediaFile);
			const wasUpdated = await waitForFile(stubDocMediaFile, 5000);	
			assert.isTrue(wasUpdated, 'update was not triggered on asset change');
			done();
		}, 100)
	});
	it('updates source files on change', async function(){
		this.timeout(30000);
		fs.createFileSync(stubSrcFile);
		const wasUpdated = await waitForFile(stubDistFile, 100000);
		assert.isTrue(wasUpdated, 'update was not triggered on source file change');
	});

})



