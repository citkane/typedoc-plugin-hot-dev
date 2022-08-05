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
	 * An array of npm scripts from you package.json you may want to run.
	 * This is handy for eg. keeping a non blocking sass compiler in watch mode running.
	 */
	npmScripts?: string[]
}

export type allOptions = {
	/** The typdoc options as seen by the spawned process */
	tsc?: { [key: string]: unknown };
	/** The tdoc options as seen by typedoc in theme project*/
	tdocSource?: { [key: string]: unknown };
	/** The tdoc options as seen by typedoc spawn in the target project*/
	tdocTarget?: { [key: string]: unknown };
	/** relative paths passed as an override to default options */
	overrideHot?: hotOptions;
	/** relative paths as defined in typedoc.json */
	localHot?: hotOptions;
	/** The absolute path to the target cwd */
	targetCwdPath?: string;
	/** The absolute path to the target docs output directory */
	targetOutPath?: string;
	/** The absolute path to the source media directory */
	sourceMediaPath?: string;
	/** The absoluete path to the source dist build directory */
	sourceDistPath?: string;
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

export type logContexts = 'tsc' | 'tdoc' | 'hot' | 'npm';
export type runners = 'node' | 'ts-node';
