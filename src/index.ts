/**
 * #### The entry point
 * - exports the typedoc-plugin loader
 * - exports the Hot entry class
 * 
 * @module INDEX
 */

import { ParameterType, Application } from 'typedoc';
import { Hot } from './lib/Hot';
import TypeDoc = require('typedoc');

/**
 * Hooks into typedoc as a module and declares the "hot-dev" options set.
 * 
 * @param app The typedoc application
 */
export function load(app: Application) {
	!app.options.getDeclaration('hot-dev') &&
		app.options.addDeclaration({
			help: '[hot-dev] Options for typedoc-plugin-hot-dev',
			name: 'hot-dev',
			type: ParameterType.Mixed,
			defaultValue: {
				targetCwd: './',
				sourceDist: './dist'
			},
		});
}

export function init(hotOpts = getHotOptions()) {
	return new Hot(hotOpts).init();
}

export function getHotOptions(){
	const app = new TypeDoc.Application();
	app.options.addReader(new TypeDoc.TypeDocReader());
	app.bootstrap();
	return app.options['_values']['hot-dev'];
}
