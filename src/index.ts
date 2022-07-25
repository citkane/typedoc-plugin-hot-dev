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
import { hotOptions } from './types';

/**
 * Hooks into typedoc as a module and declares the "hot-dev" options set.
 * 
 * @param app The typedoc application
 */
export function load(app: Application) {
	!app.options['_values']['hot-dev'] &&
		app.options.addDeclaration({
			help: '[hot-dev] Options for typedoc-plugin-hot-dev',
			name: 'hot-dev',
			type: ParameterType.Mixed,
			defaultValue: {
				targetCwd: './',
				sourceDist: './hot/dist',
				targetDoc: './hot/doc'
			},
		});
}

export function init(overOpts: hotOptions = {}) {
	const app = new TypeDoc.Application();
	load(app);
	const hotOptions = getHotOptions(app);
	Object.keys(overOpts).forEach(key => (hotOptions[key] = overOpts[key]));
	return new Hot(hotOptions).init();
}

export function getHotOptions(app): hotOptions {
	app.options.addReader(new TypeDoc.TypeDocReader());
	app.bootstrap();
	return app.options.getValue('hot-dev');
}
