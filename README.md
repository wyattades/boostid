# Boostid ![](https://img.shields.io/npm/v/boostid.svg) ![](https://img.shields.io/node/v/boostid.svg)

> Command suite for [Pantheon](https://pantheon.io) website development and testing

#### ** THIS PACKAGE IS NOT YET READY FOR PRODUCTION **

## Installation
- Install _Boostid_ globally
    ```bash
    npm install -g wyattades/boostid
    ```
- It's helpful to have [_Docker_](https://docs.docker.com/install/#supported-platforms) v18 and up
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
  boostid help [command]                            Output usage information
  boostid setup                                     Setup a Pantheon site for development with
                                                    Boostid
  boostid check-local                               Test if local environment is ready for
                                                    development
  boostid test                                      Run coverage tests locally in a Docker container
  boostid config                                    Read and write global config
  boostid upstream-updates <multidev>               Create multidev as copy of "dev" and apply
                                                    upstream updates
  boostid ter <cmd> [args...]                       Run terminus commands
  boostid ci-update-meta <git_url>                  Update CircleCI (specified by the git url)
                                                    environment variables and SSH keys
  boostid ci-local <job>                            Run CircleCI job locally using Docker
  boostid ci-trigger <git_url>                      Trigger CircleCI workflows for specified the git
                                                    url
  boostid create-github-repo <username> <reponame>  Create a Github repository from the command line

Options:
  --help, -h           Show help                                                           [boolean]
  --site, -s           Manually set pantheon site name                                      [string]
  --machine-token, -m  Machine token for Terminus cli                                       [string]
  --ci-token           CircleCI API user token                                              [string]
  -v, --version        Show version number                                                 [boolean]
```

## Config File

There should be a file __boostid.config.js__ in your project root.

It should export an object with the following properties:
- **name**: Unique Pantheon site name
- **id**: Unique Pantheon site id
- **multidev**: Pantheon multidev id for running upstream-updates tests
- **bucket**: AWS S3 bucket for hosting visual regression tests (optional)


<!-- ### Navigation Tests

View full [docs](docs/navigation_tests.md)

### Visual Regression

View full [docs](docs/visual_regression.md) -->

## Running Tests Locally
You can run your tests locally in a number of ways:
- In a Docker container (Recommended)
  ```bash
  boostid test
  ```
- On the current machine i.e. without Docker. You can also set environment variable `BOOSTID_DEV=true` to enable non-headless mode, so you can watch the tests as they run.
  ```bash
  boostid test --no-docker
  ```
- Using CircleCI CLI (requires the official CircleCI CLI and Docker to be installed)
  ```bash
  boostid ci-local
  ```  


## Testing with Jest and Puppeteer

Any `.js` files in the `__tests__` directory of your project will be run as [Jest tests](https://jestjs.io/docs/en/getting-started).

A few Puppeteer global variables are provided for convenience: `browser`, `context`, and a default `page` (See [jest-puppeteer-environment](https://www.npmjs.com/package/jest-environment-puppeteer)).

Note: You can disable the default Puppeteer environment by adding the following docblock to the top of your test file:
```js
/**
 * @jest-environment node
 */
```


### Helpful Links

**Jest Testing**
- https://jestjs.io/docs/en/getting-started

**Puppeteer API** headless Chrome testing
- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md

**Jest Testing with Puppeteer**
- https://www.npmjs.com/package/jest-environment-puppeteer
- https://www.npmjs.com/package/jest-image-snapshot
- https://www.npmjs.com/package/expect-puppeteer
