#!/usr/bin/env bash

set -e

$MULTIDEV=updates

rm -rf /tmp/boostid_updates_repo
git clone --branch $MULTIDEV ssh://codeserver.dev.${PANTHEON_SITE_ID}@codeserver.dev.${PANTHEON_SITE_ID}.drush.in:2222/~/repository.git /tmp/boostid_updates_repo
cd /tmp/boostid_updates_repo
git remote set-url origin $CIRCLE_REPOSITORY_URL
git push
