#!/usr/bin/env bash

PANTHEON_SITE_ID=a5e85ee4-91d6-4577-953c-4f866d0a1bfe

git remote set-url origin ssh://codeserver.dev.${PANTHEON_SITE_ID}@codeserver.dev.${PANTHEON_SITE_ID}.drush.in:2222/~/repository.git
git pull
