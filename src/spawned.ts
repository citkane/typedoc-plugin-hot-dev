import TypeDoc = require('typedoc');

const thatDocDir = process.argv.slice(2)[0];

const app = new TypeDoc.Application();
app.options.addDeclaration({
	help: '[typedoc-hot-dev] Options for typedoc-hot-dev',
	name: 'typedoc-hot-dev',
	type: TypeDoc.ParameterType.Mixed,
	defaultValue: {},
});
app.options.addReader(new TypeDoc.TSConfigReader());
app.options.addReader(new TypeDoc.TypeDocReader());
app.bootstrap();
const project = app.convert();
buildDocs(app, project, thatDocDir);

// Only do a quick build to update static assets
process.stdin.on('data', (message: Buffer | string) => {
	message = message.toString().trim();
	console.log(`---------------------------------------- ${message}`);
	if (message === 'buildDocs') buildDocs(app, project, thatDocDir);
});

function buildDocs(app, project, thatDocDir: string): void {
	app.generateDocs(project, thatDocDir)
		.then(() => {
			console.log('---------------------------------------- build done');
		})
		.catch((err: Error) => console.error(err));
}