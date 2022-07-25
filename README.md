## :fire: Typedoc-Plugin-Hot-Dev
This is a helper for [TypeDoc](https://typedoc.org/) theme development.  

Think 'create-react-app' live server - just for TypeDoc.
- Quick compile for media asset updates (eg. css)
- Slow(er) compile for source files (documents get rebuilt).
- Works with all typedoc entrypoint strategies.

#### Hot development usage
```bash
npm i -D typedoc-plugin-hot-dev
npx hot-dev #please set up options first
```
#### Programatic usage
```ts
import {init} from 'typedoc-hot-plugin-hot-dev';

// do your pre-processing logic, sass, etc.

init([, options]);

```

#### Options
Options can be passed into `init(options)` or defined in `typedoc.json` under the key of `"hot-dev":{...}`

- **"sourceDist"**  
  The relative path to the root of your theme's tsc compiled code.  
  Defaults to `./dist`.  
  Hot-dev watches here for source changes, so **you must defined it if not as per the default.**
- **"targetCwd"**  
  The relative path to the root of the project that you want to build documentation for.  
  Defaults to `./` (ie. documentation for the theme you are developing).  
  \* See Footnote

**Footnote**  
When targeting an external project for hot previewing (ie. not the documentation for the theme you are developing), at that location you will install the theme you are developing as so:
```
npm install ../path/to/typedoc-theme-yourtheme
```

This will create a symlink in ./node_modules of your theme project, but will cause peerdependies to fail. [This is an issue with node](https://github.com/npm/npm/issues/5875).

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