import * as hot from'../src/index';
import fs from 'fs-extra';
import path from 'path';

process.env.Node = 'test';

const distDir = path.join(__dirname, 'dist');
const docsDir = path.join(__dirname, 'docs');
const assetsDir = path.join(__dirname, 'assets');


describe('Unit testing for typedoc-hot-dev', function (){
	before(function(){
		cleanDirs();
	});
	after(function(){
		cleanDirs();
	});
	it('builds the distribution', function(){
		hot.init('--outDir', distDir);
	})
})

function cleanDirs(){
	[distDir, docsDir, assetsDir].forEach(dir => fs.removeSync(dir));
}