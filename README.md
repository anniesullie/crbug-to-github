# crbug-to-github
This extension allows you to navigate to a crbug page, click a button, and import the bug into a github repository.

## Setup
You need to set up API access for both Google Project Hosting API and GitHub to make the extension work.
### Google Project Hosting API setup.
Follow [these directions](https://developers.google.com/api-client-library/python/guide/aaa_apikeys#acquiring-api-keys) to create an API key, which are summarized here:
  1. Go to [Google Developers Console](https://console.developers.google.com/)
  2. Click Create project
  3. Click on "APIs" under "APIs & auth"
  4. Enable "Project Hosting API"
  5. Click on "Credentials" under "APIs & auth"
  6. Click "Create New Key", then "Browser Key", then "Create".

The "API key" you created can be added in the extension options under "Crbug API key".

### GitHub API setup
Use [this page](https://github.com/settings/applications/new) to register a new GitHub OAuth application.
  1. Set the application name, homepage url, and application description to whatever you want.
  2. Set the Authorization callback URL to https://[CHROME EXTENSION ID HERE].chromiumapp.org/provider_cb

Copy the Client ID and GitHub Client Secret to the extension options under "GitHub Client ID" and "GitHub Client Secret".

### GitHub repo setup
In the options, set the GitHub repo username and repo name to the user and repo of the issue tracker you want to import into (https://GitHub.com/[user]/[repo]/issues).

## Using the extension

  1. Navigate to a crbug page you want to migrate to GitHub.
  2. Click the GitHub issue icon.
  3. The list of labels for the issue will appear. You can uncheck or modify any labels you don't want to import as-is.
  4. Click the "Start Import" button.
  5. The crbug issue is added to your GitHub ssue tracker. The issue will be created with your username and the current date, but the original issue author and date will be noted.

## TODOs

  * There should be a loading spinner when you click the "Start import" button.
  * The extension button should be disabled on non-crbug pages.
  * The code would be much cleaner if it used promises.
  * The state param sent to GitHub oauth should be randomly generated and stored for the proper amount of time.
