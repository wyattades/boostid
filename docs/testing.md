
# Types of Tests

## Testing Locally
1. update your test files in `__tests__` directory
2. Run `boostid test`, which does the following:
  1. Builds new docker container from local project
  2. `npm install`
  3. Runs visualreg tests with `jest`

## Cron task to update `dev` from upstream
CircleCI steps:
1. check if there are upstream updates
2. Create `updates` multidev (copy of `dev`)
3. Run updates on `updates` multidev
4. Checkout Pantheon `updates` branch, and push it to github `updates` branch. This will trigger a new job:
5. In docker container:
6. Fetch `updates` multidev code
7. `npm install`
8. Runs visualreg tests with `jest`
9. Merge code with `dev`
10. Destroy `updates` multidev


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

