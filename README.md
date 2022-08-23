[![codecov](https://codecov.io/gh/citkane/typedoc-plugin-hot-dev/branch/main/graph/badge.svg?token=GXPS7CMTXP)](https://codecov.io/gh/citkane/typedoc-plugin-hot-dev)
[![RELEASE AND PUBLISH](https://github.com/citkane/typedoc-plugin-hot-dev/actions/workflows/release.yml/badge.svg)](https://github.com/citkane/typedoc-plugin-hot-dev/actions/workflows/release.yml)
[![GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/citkane/typedoc-plugin-hot-dev)
[![Npm](https://badgen.net/badge/icon/npm?icon=npm&label)](https://npmjs.com/package/typedoc-plugin-hot-dev)
[![docs stable](https://img.shields.io/badge/docs-stable-teal.svg)](https://citkane.github.io/typedoc-plugin-hot-dev/stable)
[![docs dev](https://img.shields.io/badge/docs-dev-teal.svg)](https://citkane.github.io/typedoc-plugin-hot-dev/dev)

# 🔥 Typedoc-Plugin-Hot-Dev

This is a helper for [TypeDoc](https://typedoc.org/) theme development.

Think 'create-react-app' live server - just for TypeDoc.

-   Quick compile for media asset updates (eg. css)
-   Slow(er) compile for source files (documents get rebuilt).
-   Works with all typedoc entrypoint strategies.
-   Automatically opens in your browser

<br /><br />

## Hot development usage

```bash
npm i -D typedoc-plugin-hot-dev
npx hot-dev #please set up options first
```

#### Programatic usage

```ts
import { init } from 'typedoc-hot-plugin-hot-dev';

// do your pre-processing logic, sass, etc.

init([, options]);
```

<br /><br />

## Options

Options can be passed into `init(options)` or defined in `typedoc.json` under the key of `"hot-dev":{...}`

| key              | Description                                                                                                                                               | Type       | Required | Default Value |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- | :------: | :-----------: |
| **_sourceDist_** | The relative path to the root of your theme's tsc compiled code. Hot-dev watches here for source changes, so if it is not the default you must define it. | _string_   |  **no**  |    "dist"     |
| **_targetCwd_**  | The relative path to the root of the project that you want to build documentation for. The default is documentation for the theme you are developing.     | _string_   |  **no**  |     "./"      |
| **_npmScripts_** | Scripts defined in your package.json.scripts which you may want to run in a non-blocking fashion, eg. sass in watch mode.                                 | _string[]_ |  **no**  |      []       |

<br /><br />

## Footnote

When, and only when, targeting an external project to build docs for your development theme (ie. **_targetCwd_** is pointing to a project that is not the theme you are developing), at that location you are likely to install the theme you are developing as so:

```
npm install ../path/to/typedoc-theme-yourtheme/dist
```

This will create a symlink to your theme in the `./node_modules` folder of your external project.

This will cause Typedoc's peerdependency to fail when running hot-dev. [This is an issue with node](https://github.com/npm/npm/issues/5875).

To work around this, from your theme directory directory, do:

```
npm install ../some/other/project/node_modules/typedoc
```

This will ensure that typedoc instance is always from the highest level.

After hot development work is done , do something like this in your theme to restore sanity:

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
