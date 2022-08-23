/**
 * #### Api for events
 * Provides the interface class for an event driven application.
 *
 * @module API
 */
import EventEmitter from 'node:events';
import { logContexts } from '../types';

/**
 * Provides a API space by extension of the standard Node event emitter.
 */
export class HotEmitter extends EventEmitter {
	/** the typescript compiler */
	tsc = {
		compile: {
			/** notifies that the compiler has completed a compile. */
			done: () => this.emit('tsc.compile.done'),
		},
	};
	/** the typedoc compiler */
	tdoc = {
		build: {
			/** notifies that the compiler has completed the initial document build. */
			init: () => this.emit('tdoc.build.init'),
			/** notifies that the compiler has refreshed the initial document build. */
			refreshed: () => this.emit('tdoc.build.refreshed'),
		},
	};
	/** the file watcher */
	file = {
		/** notifies of a file change */
		changed: (path: string) => this.emit('files.changed', path),
	};
	options = {
		set: {
			tsc: (opts: { [key: string]: unknown }) =>
				this.emit('options.set.tsc', opts),
			tdoc: (opts: { [key: string]: unknown }) =>
				this.emit('options.set.tdoc', opts),
		},
		ready: () => this.emit('options.ready'),
	};
	log = {
		message: (context: logContexts, mess: string, prefix?: boolean) =>
			this.emit('log.message', context, mess, 'log', prefix),
		warning: (context: logContexts, mess: string, prefix?: boolean) =>
			this.emit('log.message', context, mess, 'warn', prefix),
		error: (context: logContexts, mess: string, prefix?: boolean) =>
			this.emit('log.message', context, mess, 'error', prefix),
	};
}
