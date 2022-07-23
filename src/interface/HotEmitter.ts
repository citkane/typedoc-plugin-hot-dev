/**
 * #### Api for events
 * Provides the interface class for an event driven application.
 * 
 * @module API
 */
import EventEmitter from 'node:events';

/**
 * Provides a API space by extension of the standard Node event emitter.
 */
export class HotEmitter extends EventEmitter {
	/** the typescript compiler */
	tsc = {
		compile: {
			/** notifies that the compiler has completed a compile. */
			done: () => this.emit('tsc.compile.done')
		}
	};
	/** the typedoc compiler */
	tdoc = {
		build: {
			/** notifies that the compiler has completed the initial document build. */
			init: () => this.emit('tdoc.build.init'),
			/** notifies that the compiler has refreshed the initial document build. */
			refreshed: () => this.emit('tdoc.build.refreshed')
		}
	};
	/** the file watcher */
	file = {
		/** notifies of a file change */
		changed: (path: string) => this.emit('files.changed', path)
	};
	/** the http server / client */
	http = {
		server: {
			/** notifies that the context for starting the server / client is ready */
			ready: (httpPath: string) => this.emit('http.server.ready', httpPath)
		}
	};
	options = {
		set: {
			tsc: (opts: {[key:string]: unknown}) => this.emit('options.set.tsc', opts),
			tdoc: (opts: {[key:string]: unknown}) => this.emit('options.set.tdoc', opts)
		},
		ready: () => this.emit('options.ready')
	};
}
