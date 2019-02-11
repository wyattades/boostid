#!/usr/bin/env bash

set -e

export JEST_PUPPETEER_CONFIG=./node_modules/boostid/test_lib/jest-puppeteer.config.js

npx jest --color --ci=false --runInBand --no-watchman --config ./node_modules/boostid/test_lib/jest.config.js
