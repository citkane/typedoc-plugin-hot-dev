[![codecov](https://codecov.io/gh/citkane/typedoc-plugin-hot-dev/branch/main/graph/badge.svg?token=GXPS7CMTXP)](https://codecov.io/gh/citkane/typedoc-plugin-hot-dev)
[![RELEASE AND PUBLISH](https://github.com/citkane/typedoc-plugin-hot-dev/actions/workflows/release.yml/badge.svg)](https://github.com/citkane/typedoc-plugin-hot-dev/actions/workflows/release.yml)
[![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/citkane/typedoc-plugin-hot-dev)
[![Npm](https://badgen.net/badge/icon/npm?icon=npm&label)](https://npmjs.com/package/typedoc-plugin-hot-dev)
[![docs stable](https://img.shields.io/badge/docs-stable-teal.svg)](https://citkane.github.io/typedoc-plugin-hot-dev/stable)
[![docs dev](https://img.shields.io/badge/docs-dev-teal.svg)](https://citkane.github.io/typedoc-plugin-hot-dev/dev)

## 🔥 Typedoc-Plugin-Hot-Dev
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

```jsonc
{
	/* The relative path to the root of your theme's tsc compiled code. 
	 * Hot-dev watches here for source changes,
	 * so if it is not the default you must define it.
	 */
	"sourceDist": "dist", //<default>

	/* The relative path to the root of the project that you want to build documentation for.  
	 * Defaults to documentation for the theme you are developing.
	 */
	"targetCwd": "./" //<default> * See Footnote
}
```

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