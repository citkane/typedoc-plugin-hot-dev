#!/usr/bin/env sh

./node_modules/.bin/tsc;
cp ./README.md ./dist/README.md;
cp ./LICENSE.txt ./dist/LICENSE.txt;
cp ./.npmignore ./dist/.npmignore;
cp ./package.json ./dist/package.json;