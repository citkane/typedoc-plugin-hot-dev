import sinon from 'sinon';
import { cleanDirs, sourceDistPath, stubSrcFile, targetDocPath, tempPath  } from './testutils';



export const mochaHooks = {
	beforeAll(done){
		cleanDirs([tempPath, stubSrcFile, sourceDistPath, targetDocPath]);
		done();
	},
	beforeEach(done){
		sinon.stub(console, 'error');
		sinon.stub(console, 'warn');
		sinon.stub(console, 'log');	
		done();
	},
	afterEach(done){
		sinon.restore();
		done();
	},
	afterAll(done){		
		setTimeout(()=>{
			cleanDirs([tempPath, stubSrcFile, targetDocPath]);
			done();
		},100)
	}
}