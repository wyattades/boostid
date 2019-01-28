
# Types of Tests

## Testing Locally
1. update your test files in `__tests__` directory
2. Run `boostid test`, which does the following:
  1. Builds new docker container from local project
  2. `npm install`
  3. Runs visualreg tests with `jest`

## Cron task to update `dev` from upstream
CircleCI steps:
1. `npm install -g boostid`
2. `boostid`: Create `updates` multidev (copy of `live`)
3. `boostid`: Run updates on `updates` multidev
4. In docker container:
5. Fetch `updates` multidev code
6. `npm install`
7. Runs visualreg tests with `jest`
8. Merge code with `dev`
9. Destroy `updates` multidev (even if build fails)


> Note: visualreg tests are comparing `<env>-<sitename>.pantheonsite.io` with `<livesite_url>`

---

## Commit & Push to a Multidev (TODO)
CircleCI steps:
1. `checkout`
2. Deploy code to Pantheon
3. `npm install`
4. Runs coverage tests with `jest`

## Commit & Push to `dev` i.e. master branch (TODO)
CircleCI steps:
1. idk

