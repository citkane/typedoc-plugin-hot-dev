## :fire: Typedoc-Plugin-Hot-Dev
This is a helper for [TypeDoc](https://typedoc.org/) theme development.  

Think 'create-react-app' live server - just for TypeDoc.



#### Hot development usage
```bash
npm i -D typedoc-plugin-hot-dev
npx hot-dev
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
  The relative path to where hot-dev should put your theme's tsc compiled code.  
  Defaults to `./dist`.
- **"targetCwd"**  
  The relative path to the root of the project that you want to build documentation for.  
  Defaults to `./` (ie. documentation for the theme you are developing).  
  \* See Footnote
- **"targetDoc"**  
  Relative path to where hot-dev should put output documentation.  
  Defaults to `./doc`

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