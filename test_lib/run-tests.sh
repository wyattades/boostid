#!/usr/bin/env bash

export JEST_PUPPETEER_CONFIG=./node_modules/boostid/test_lib/jest-puppeteer.config.js

npx jest --runInBand --no-watchman --config ./node_modules/boostid/test_lib/jest.config.js
