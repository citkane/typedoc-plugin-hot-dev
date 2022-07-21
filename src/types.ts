import { ChildProcessWithoutNullStreams } from 'node:child_process';

/**
 * The development options which can be overridden by "hot-dev" in the "typedoc.json" config file.
 * 
 */
export interface hotOptions {
	/**The name of the document directory in the target documentation project. Typically 'docs'*/
	targetDocDir: string,
	/**The relative path to the root of the target project directory */
	targetCwdPath: string,
	/**The relative path to the theme root directory to put compiled code in. Typically `./dist`*/
	sourceDistPath: string,
	/**
	 * The relative path to the theme root directory where media (.js, .css, images, etc) are stored.  
	 * will override the typedoc `media` option if present.
	*/
	sourceMediaPath: string
}

export interface hotProps {
	/** The input options which have been resolved to absolute paths */
	opts: hotOptions;
	/** additional tsc options passed into the {@link lib/Hot!Hot#init} method */
	tscOptions: string[];
	/** Provides a handle on the typescript compiler process and controller */
	tsc: spawnedProcess;
	/** Provides a handle on the typedoc process and controller */
	tdoc: spawnedProcess;
	/** provides a handle on the file watcher */
	fileWatcher;
	/** Registers how many times a typdoc instance has been spawned*/
	tdocBuildCount: number;
}

export interface spawnedProcess {
	controller: AbortController;
	process: ChildProcessWithoutNullStreams;
}

/**
 * A grouping of the `tsc` and `tdoc` spawned instances 
 */
export interface processes {
	/** a spawned typescript instance */
	tsc: spawnedProcess;
	/** a spawned typedoc instance */
	tdoc: spawnedProcess;
}

export interface startHttpServer {
	httpPath: string,
	isStarted: boolean,
	isRetry?: number
}

export type runners = 'node' | 'ts-doc';