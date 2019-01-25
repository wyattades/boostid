#!/usr/bin/env bash

##
## Usage: update_from_upstream.sh [sitename]
## Create/update multidev named 'updates'
##

set -e

ORGNAME=rootid-reseller

NAME="$1"
if [ -z "$NAME" ]; then
  read -p "Enter the sitename: " NAME
fi

# TODO: use site:info <site_name> --field=framework
LIST=$(terminus site:list --org=$ORGNAME --fields=name,framework --format=string)

FRAMEWORK=$(echo "$LIST" | awk '($1 == "'"$NAME"'") { print $2 }')

if [ -z "$FRAMEWORK" ]; then
  echo "That site does not exist or does not have a configured framework yet"
  exit 1
fi

if ! terminus multidev:list $NAME --format=list | grep "^updates$" > /dev/null; then
  echo "Multidev $NAME.updates does not exist."
  read -p "Would you like to create it and continue the update? [y/n] " ANSWER
  if [[ $ANSWER =~ [yY](es)* ]]; then
    echo "Creating $NAME.updates"
    terminus multidev:create $NAME.dev updates
  else
    exit 1
  fi
fi

echo "Cloning db from $NAME.live to $NAME.updates..."
terminus env:clone-content -y $NAME.live updates

echo "Applying upstream updates to $NAME.updates..."
terminus upstream:updates:apply -y --updatedb $NAME.updates

echo "Checking website status..."
STATUS=$(curl -Is http://updates-$NAME.pantheonsite.io | head -1)
echo "Status: $STATUS"

echo "Running $NAME.updates website audit..."
terminus remote:drush $NAME.updates -- aa --vendor=pantheon --skip=insights 
