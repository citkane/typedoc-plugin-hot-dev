import { ChildProcessWithoutNullStreams } from 'node:child_process';

/**
 * The development options which can be overridden by "hot-dev" in the "typedoc.json" config file.
 * 
 */
export interface hotOptions {
	/**
	 * The relative path to the target project directory from which documentation is to be built.  
	 * If this is not specified, it will be the actual theme itself, ie './'
	*/
	targetCwd?: string,
	/**The relative path to the directory for compiled code.  
	 * Typically `./dist`.  
	 * If not specified, the default tsc `outDir` will be used.
	*/
	sourceDist?: string,
	/**
	 * The relative path to the folder for built documentation.  
	 * If not specified, will default to the target 'out' directory in the `targetCwd` space.
	 */
	targetDoc?: string
}

export type allOptions = {
	/** The tsc options as seen by a spawned process */
	tsc?: { [key: string]: unknown };
	/** The tdoc options as seen by typedoc */
	tdoc?: { [key: string]: unknown };
	/** The absolute paths for hot-dev */
	hot?: hotOptions;
	targetCwdPath?: string;
	sourceMediaPath?: string;
	sourceDistPath?: string;
	targetDocsPath?: string;
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

export type logContexts = 'tsc' | 'tdoc' | 'hot';
export type runners = 'node' | 'ts-node';
