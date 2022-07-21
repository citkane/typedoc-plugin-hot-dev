
import { ParameterType, Application } from 'typedoc';
import Hot from './lib/Hot';
export { HotEmitter } from './HotEmitter';

export function load(app: Application) {
	app.options.addDeclaration({
		help: '[hot-dev] Options for typedoc-plugin-hot-dev',
		name: 'hot-dev',
		type: ParameterType.Mixed,
		defaultValue: {
			targetDocDir: 'docs',
			targetCwdPath: './',
			sourceDistPath: './dist',
			sourceMediaPath: './media'
		},
	});
}

export default Hot;
