#!/bin/bash

#
# Detect which environment we're running in (Github or e.g. someone's laptop)
# and initialize standard Github Actions environment variables if needed.
#
if [ "$GITHUB_ACTIONS" == "true" ]; then
    echo "This is the \"commit changes\" script running on $(date) as part of Github Actions workflow \"$GITHUB_WORKFLOW\""
else
    echo "This is the \"commit changes\" script running on $(date)"
    GITHUB_WORKFLOW="(Not running in Github Actions)"
    GITHUB_EVENT_NAME="(Not running in Github Actions)"
    GITHUB_RUN_NUMBER="(Not running in Github Actions)"
fi

#
# Check if any data files have changed. If none have, there's no need to continue.
#
CHANGED_FILES=$(git status --short)
CHANGED_DATA_FILES=$(git status --short | egrep '^ M public/calendars/' | awk '{print $2}')
if [ "$CHANGED_DATA_FILES" == "" ]; then
    echo "No changes to data files detected:";
    echo "$CHANGED_FILES"
    exit 0
fi

#
# Create a temp file that we'll use for formulating the Git commit message.
#
COMMIT_MESSAGE_FILE=$(mktemp)
trap 'rm -f -- "$COMMIT_MESSAGE_FILE"' EXIT  # Delete the temp file on exit
echo "Commit message will be written to $COMMIT_MESSAGE_FILE"
echo "Github Action:      $GITHUB_WORKFLOW" >> "$COMMIT_MESSAGE_FILE"
echo "" >> "$COMMIT_MESSAGE_FILE"
echo "GITHUB_EVENT_NAME:  $GITHUB_EVENT_NAME" >> "$COMMIT_MESSAGE_FILE"
echo "GITHUB_RUN_NUMBER:  $GITHUB_RUN_NUMBER" >> "$COMMIT_MESSAGE_FILE"
echo "" >> "$COMMIT_MESSAGE_FILE"

#
# Add the list of changed data files to the commit message and stage them for commit.
#
echo "" >> "$COMMIT_MESSAGE_FILE"
echo "The following data files changed:" >> "$COMMIT_MESSAGE_FILE"
for i in $CHANGED_DATA_FILES; do
    git add "$i"
    echo "- $i" >> "$COMMIT_MESSAGE_FILE"
done

#
# Commit the changes, rebase, and push to the repository.
#
echo "Making the commit..."
git commit -F "$COMMIT_MESSAGE_FILE"
echo "Rebasing..."
git pull -r
echo "Pushing..."
git push
echo "Done!"
