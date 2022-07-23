import sinon from 'sinon';

//sinon.stub(console, 'error');
//sinon.stub(console, 'warn');
//sinon.stub(console, 'log');

export const mochaHooks = {
	beforeEach(done){
		done();
	},
	afterEach(done){
		sinon.restore();
		//sinon.stub(console, 'error');
		//sinon.stub(console, 'warn');
		//sinon.stub(console, 'log');
		done();
	}
}