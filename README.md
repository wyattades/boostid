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
1. Setup dev environment for an existing Pantheon site, where `<sitename>` is the site's Pantheon name
    ```bash
    boostid setup -s <sitename>
    ```
    This walks the user through the following:
    - Authenticate with APIs: _CircleCI, AWS, Terminus, Slack_ (this only needs to be done once)
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
$ boostid --help
Command suite for Rootid development and testing

Usage: boostid <command> [options]

Commands:
  boostid help <command>               View help for a specific command
  boostid setup                        Setup a Pantheon site for development with Boostid
  boostid check-local                  Test if local environment is ready for development
  boostid test                         Run coverage tests locally in a Docker container
  boostid upstream-updates <multidev>  Create multidev and apply upstream updates
  boostid ter <cmd> [args ...]         Run terminus commands
  boostid trigger-circleci <branch>    Trigger a build workflow in CircleCI
  boostid config-get [key]             Prints config value for specified "key". Exclude "key" to get
                                       all config as json
  boostid config-set <key> [value]     Set config value for specified "key". Exclude "value" to delete
                                       the key instead

Options:
  --site, -s           Manually set pantheon site name       [string] [default: $PANTHEON_SITE_NAME]
  --machine-token, -m  Machine token for Terminus cli    [string] [default: $PANTHEON_MACHINE_TOKEN]
  --ci-token           CircleCI API user token                                              [string]
  -v, --version        Show version number                                                 [boolean]
  -h, --help           Show help  
```

## Config File

There should be a file __boostid.config.js__ in your project root.

It must export an object with the following properties:
- **name**: Unique Pantheon site name
- **id**: Unique Pantheon id
- **bucket**: AWS S3 bucket for hosting visual regression tests
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
