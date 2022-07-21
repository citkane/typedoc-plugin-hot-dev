import { ChildProcessWithoutNullStreams } from 'node:child_process';

/**
 * The development options which can be overridden by "devOptions.json" in the project root directory.
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