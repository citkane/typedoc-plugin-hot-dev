import TypeDoc = require('typedoc');

const args = process.argv.slice(2);
const targetDocDir = args[0];

const app = new TypeDoc.Application();

app.options.addReader(new TypeDoc.TSConfigReader());
app.options.addReader(new TypeDoc.TypeDocReader());

app.bootstrap();


const project = app.convert();

buildDocs(app, project, targetDocDir);

// Only do a quick build to update static assets
process.stdin.on('data', (message: Buffer | string) => {
	message = message.toString().trim();
	console.log(`---------------------------------------- ${message}`);
	if (message === 'buildDocs') buildDocs(app, project, targetDocDir);
});

function buildDocs(app, project, targetDocDir: string): void {
	console.log('------------building----------------', );
	console.log(app.options.getValue('media'));
	app.generateDocs(project, targetDocDir)
		.then(() => {
			console.log('---------------------------------------- build done');
		})
		.catch((err: Error) => console.error(err));
}
