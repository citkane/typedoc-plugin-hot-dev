import EventEmitter from 'node:events';

export class HotEmitter extends EventEmitter {
	tsc = {
		compile: {
			done: () => this.emit('tsc.compile.done')
		}
	};
	tdoc = {
		build: {
			init: () => this.emit('tdoc.build.init'),
			refreshed: () => this.emit('tdoc.build.refreshed')
		}
	};
	file = {
		changed: (path: string) => this.emit('files.changed', path)
	};
	http = {
		server: {
			ready: (httpPath: string) => this.emit('http.server.ready', httpPath)
		}
	};
}