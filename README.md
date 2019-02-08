# Boostid ![](https://img.shields.io/npm/v/boostid.svg) ![](https://img.shields.io/node/v/boostid.svg)

> Command suite for [Pantheon](https://pantheon.io) website development and testing

#### ** THIS PACKAGE IS NOT YET READY FOR PRODUCTION **

## Installation
- Install _Boostid_ globally
    ```bash
    npm install -g wyattades/boostid
    ```
- Make sure you have [_Docker_](https://docs.docker.com/install/#supported-platforms) v18 and up
    ```bash
    docker -v
    ```

## Getting started
1. Setup dev environment for a new or existing Pantheon site.
    ```bash
    boostid setup -s <sitename>
    ```
    This walks the user through the following:
    - Authenticate with APIs: _CircleCI, Terminus, Slack_ (this only needs to be done once)
    - Clones Pantheon site into folder under the current directory
    - Setup a multidev for automated upstream updates
    - Add Boostid config and testing files to project
2. After editing the tests in the `__tests__` directory, test them locally
    ```bash
    cd <sitename>
    boostid test
    ```
3. Commit and push your changes with `git`, and get notified on `Slack` when the coverage tests on CircleCI succeed or fail.

## CLI Documentation
You can view the CLI documentation by running:
```bash
boostid --help
```

## Config File

There should be a file __boostid.config.js__ in your project root.

It must export an object with the following properties:
- **name**: Unique Pantheon name
- **id**: Unique Pantheon id
- **multidev**: the name of the multidev to run automatic updates on (do not use this multidev for anything else)
- **pages**: Array of config objects for each path. Page config properties:
  - **path**: e.g. `'/my-page'`
  - **visualreg**: whether or not to run visual regression on this page (boolean)
  - ... TODO


<!-- ### Navigation Tests

View full [docs](docs/navigation_tests.md)

### Visual Regression

View full [docs](docs/visual_regression.md) -->

## Helpful Links

**Puppeteer API** headless Chrome testing
- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md

**Jest Testing with Puppeteer**
- https://www.npmjs.com/package/jest-environment-puppeteer
- https://www.npmjs.com/package/jest-image-snapshot
