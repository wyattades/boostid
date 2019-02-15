#!/usr/bin/env bash

set -e

JEST_PUPPETEER_CONFIG=./node_modules/boostid/test_lib/jest-puppeteer.config.js ./node_modules/.bin/jest \
--color --ci=false --runInBand --no-watchman --config ./node_modules/boostid/test_lib/jest.config.js
