/**
 * #### The script to rebuild documentation from a spawned process.
 * 
 * @module spawned
 */

import td = require('typedoc');

const args = process.argv.slice(2);
const getOptions = args[0] === 'getOptions';

const app = new td.Application();

app.options.addReader(new td.ArgumentsReader(0));
app.options.addReader(new td.TypeDocReader());
app.options.addReader(new td.TSConfigReader());
app.options.addReader(new td.ArgumentsReader(300));

app.bootstrap();

if (getOptions) {
	console.log(JSON.stringify(app.options['_values']));
} else {
	const project = app.convert();
	const targetDocDir = app.options.getValue('out');
	buildDocs(app, project, targetDocDir);

	// Only do a quick build to update static assets
	process.stdin.on('data', (message: Buffer | string) => {
		message = message.toString('utf8').trim();
		(message === 'buildDocs') && buildDocs(app, project, targetDocDir);
	});
}

/**
 * Does the final document build.
 * This provides a shortcut for ewhen media updates and does not require a full document rebuild.
 * @param app 
 * @param project 
 * @param targetDocDir 
 * 
 * @function
 */
function buildDocs(app, project, targetDocDir: string): void {
	app.generateDocs(project, targetDocDir)
		.then(() => {
			console.log('build done');
		})
		.catch((err: Error) => console.error(err));
}

