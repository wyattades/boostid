# Boostid

> Command suite for Rootid development and testing

## Getting Started

1. Install [Node.js](https://nodejs.org) version 8 and up
2. Install _Boostid_
    ```bash
    npm install -S boostid
    ```
3. Setup dev environment for an existing Rootid website
    ```bash
    boostid setup my_existing_site
    ```
    __OR__ create a new site
    ```bash
    boostid create my_new_site
    ```
    These commands create a directory named after the site.
4. After making some changes to the code, test them locally
    ```bash
    boostid test
    ```
5. Commit and push your changes with `git`, and get notified on `Slack` when the CI service succeeds or fails.

## CLI Documentation

### Tests
To run `boostid test`, add the command to your package.json scripts or run `npx boostid test`

### ...
TODO

## Config File

__boostid.config.js__

Must export an object with the following properties:
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
3. `git config --add remote.origin.url <github_repo_url.git>`
4. Confirm remote was added successfully by running `git remote -v`
5. `git push`

## CircleCI Setup
1. Create a passwordless rsa SSH key
2. Add the public ssh key to your Pantheon account
3. Enable this project on CircleCI
4. Add the private ssh key to the CircleCI project settings

## Helpful Links

### Puppeteer API
- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md

### Deploy files to S3 bucket with AWS
- https://www.npmjs.com/package/aws-sdk

### Jest image snapshot, for visual regression
- https://www.npmjs.com/package/jest-image-snapshot
