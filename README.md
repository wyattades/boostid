# Boostid ![](https://img.shields.io/npm/v/boostid.svg) ![](https://img.shields.io/node/v/boostid.svg)

> Command suite for [Pantheon](https://pantheon.io) website development and testing

#### ** THIS PACKAGE IS NOT YET READY FOR PRODUCTION **

## Installation
1. Install _Boostid_ globally
    ```bash
    npm install -g boostid
    ```
2. Make sure you have [_Docker_](https://docs.docker.com/install/#supported-platforms) v18.06 and up
    ```bash
    docker -v
    ```

## Getting started
1. Setup dev environment for a new or existing Pantheon site.
    ```bash
    boostid setup -s <sitename>
    ```
    This create a directory `<sitename>` in the current directory, and will walk you through setting up various API services.
2. After editing the tests in `__tests__` directory, test them locally
    ```bash
    cd <sitename>
    boostid test
    ```
3. Commit and push your changes with `git`, and get notified on `Slack` when the coverage tests on CircleCI succeed or fail.

## CLI Documentation
TODO

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

## Github Setup
1. Create a new empty repository on Github
2. `cd` into your Pantheon project's directory
3. `git remote set-url --add origin <github_repo_url.git>`
4. Confirm both remotes are set successfully by running `git remote -v`
5. commit and `git push`

## CircleCI Setup
1. Add the following environment variables to CircleCI through the dashboard:
   - `PANTHEON_SITE_ID` (required)
   - `PANTHEON_MACHINE_TOKEN` (required)
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `VISUALREG_BUCKET`: post visual regression results to AWS S3
   - `SLACK_WEBHOOK`: Post test results to Slack
<!-- 1. Create a passwordless rsa SSH key (using `ssh-keygen ...`)
1. Add the public ssh key to your Pantheon account
2. Enable this project on CircleCI
3. Add the private ssh key to the CircleCI project settings -->

<!-- ## Local Testing
After editing your test files, you can avoid having to push to CircleCI by running them locally with `boostid test`. -->

## Helpful Links

**Puppeteer API**
- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md

**Deploy files to S3 bucket with AWS**
- https://www.npmjs.com/package/aws-sdk

**Jest image snapshot, for visual regression**
- https://www.npmjs.com/package/jest-image-snapshot

**Slack messages from CircleCI**
- https://github.com/CircleCI-Public/slack-orb
