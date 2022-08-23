/**
 * #### The entry point
 * - exports the typedoc-plugin loader
 * - exports the Hot entry class
 *
 * @module INDEX
 */

import { ParameterType, Application } from 'typedoc';
import { Hot } from './lib/Hot';

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
				sourceDist: './dist',
				npmScripts: [],
			},
		});
}

export function init(overrideHot: hotOptions = {}) {
	return new Hot().init(overrideHot);
}
