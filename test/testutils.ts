import fs from 'fs-extra';
import path from 'path';
import { hotOptions } from '../src/types';

export function cleanDirs(dirs) {
	dirs.forEach(dir => fs.existsSync(dir) && fs.removeSync(dir));
}
export function waitForFile(file: string, timeout = 3000) {
	return new Promise((resolve) => {
		const interval = setInterval(function () {
			if (fs.existsSync(file)) {
				clearTimeout(timer);
				clearInterval(interval);
				resolve(true);
			}
		}, 100)
		const timer = setTimeout(function () {
			clearInterval(interval);
			resolve(false);
		}, timeout)
	});
}
export const stripTrailing = (path) => path.replace(/\/$/, '');


export const cwd = path.normalize(process.cwd());
export const tempFolder = path.normalize('./.tmp');
export const tempPath = path.join(cwd, tempFolder);
export const sourcDistDir = path.normalize('./dist');
export const sourceDistPath = path.join(cwd,  sourcDistDir);
export const sourceMediaPath = path.join(cwd, tempFolder, 'media');
export const targetDocDir = path.normalize('./docs');
export const targetDocPath = path.join(cwd, targetDocDir);
export const stubSrcFile = path.join(cwd, '/src/teststubfile.ts');
export const stubDistFile = path.join(sourceDistPath, 'teststubfile.js');
export const stubSrcMediaFile = path.join(sourceMediaPath, '/teststubfile.css');
export const stubDocMediaFile = path.join(targetDocPath, './media/teststubfile.css');

export const overrideHot: hotOptions = {
	targetCwd: path.normalize('./'),
	sourceDist: sourcDistDir
}