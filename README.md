## Typedoc-Plugin-Hot-Dev
This is a helper for [TypeDoc](https://typedoc.org/) theme development.  

Think 'create-react-app' live server - just for TypeDoc.



#### Hot development setup
```bash
npm i -D typedoc-plugin-hot-dev //to be published soon
```
then from a build script:
```ts
import * as hot from 'typedoc-hot dev';

// do your pre-processing, eg sass, etc.

hot.init([, tsc options]);

```

By default, the documentation for the current project (your theme) will be built. Typedoc will need to be configured for this context.

You can configure the project to be documented with your theme from typedoc.json:

```jsonc
{
	//typedoc options
	"typedoc-hot-dev": {
		"targetDocDir": "docs",
		"targetCwdPath": "../some/other/project",
		"sourceDistPath": "./dist",
		"sourceAssetsPath": "./dist/assets"		
	}
}
```
The target project must have typedoc correctly set up, and `targetDocDir` should correspond to the `out` of the external project.

**Note**

When targeting an external project for hot development, from that project, you will probeebely install the theme you are developing as so:
```
npm install ../path/to/typedoc-theme-yourtheme
```

This will create a symlink in ./node_modules,  and cause peerdependies to break. [This is an issue with node](https://github.com/npm/npm/issues/5875).

To work around this from your theme directory directory:
```
npm install ../some/other/project/node_modules/typedoc
```

and after development work is done:
```
npm remove typedoc
npm i -D typedoc
```
and fix package.json with:
```jsonc
	"peerDependencies": {
		"typedoc": "^0.23.0" //or whatever version is relevant
	}
```