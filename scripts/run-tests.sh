#!/usr/bin/env bash

set -e

TEST_RESULTS_DIR=__boostid_results__

mkdir -p $TEST_RESULTS_DIR

JEST_PUPPETEER_CONFIG=./node_modules/boostid/test_lib/jest-puppeteer.config.js ./node_modules/.bin/jest \
--color --ci=false --runInBand --no-watchman --config ./node_modules/boostid/test_lib/jest.config.js \
--json --outputFile=${TEST_RESULTS_DIR}/results.json
