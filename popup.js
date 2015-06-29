var ISSUES_GET_URL = 'https://www.googleapis.com/projecthosting/v2/projects/' +
                     'chromium/issues/${issue_id}?key=${crbug_api_key}';
var ISSUES_GET_COMMENTS_URL = 'https://www.googleapis.com/projecthosting/v2/' +
                              'projects/chromium/issues/${issue_id}/comments?' +
                              'key=AIzaSyDrEBALf59D7TkOuz-bBuOnN2OqzD70NCQ';
var GITHUB_ACCESS_URL = 'https://github.com/login/oauth/authorize?client_id=' +
                        '${github_client_id}&scope=repo&state=${github_state}';
var GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';

var GITHUB_ISSUE_URI = 'https://api.github.com/repos/${user}/${repo}/issues';
var GITHUB_COMMENT_URI = 'https://api.github.com/repos/${user}/${repo}/' +
                         'issues/${number}/comments';
var GITHUB_ISSUE_LINK = 'Issue created: <A HREF="https://github.com/${user}/' +
                        '${repo}/issues/${number}" TARGET="_blank">View issue ' +
                        '${number}</A>';


var ISSUE_TEMPLATE = '**Issue by [${user_name}](${user_url})**\n_${date}_\n' +
                     '_Originally opened as ${url}_\n\n----\n\n${body}'
var COMMENT_TEMPLATE = '**Comment by [${user_name}](${user_url})**\n_' +
                       '${date}_\n\n----\n\n${body}'


var globalData;
document.addEventListener('DOMContentLoaded', onImportDialogOpened);


function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    callback(url);
  });
}

function renderError(msg) {
  document.getElementById('error').style.display = '';
  document.getElementById('error').textContent = msg;
}

function onImportDialogOpened() {
  globalData = {};
  chrome.storage.sync.get({
    repo_user: '',
    repo: '',
    crbug_api_key: '',
    github_client_id: '',
    github_client_secret: ''
  }, function(items) {
    if (items.repo_user) {
      document.getElementById('crbug_ui').style.display = '';
      document.getElementById('options_ui').style.display = 'none';
      globalData.repo_user = items.repo_user;
      globalData.repo = items.repo;
      globalData.crbug_api_key = items.crbug_api_key;
      globalData.github_client_id = items.github_client_id;
      globalData.github_client_secret = items.github_client_secret;
      globalData.github_state = String(Math.random);
      getCurrentTabUrl(requestCrbugIssueData);
    } else {
      document.getElementById('crbug_ui').style.display = 'none';
      document.getElementById('options_ui').style.display = '';
      document.getElementById('options_link').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
      })
    }
  });
}

function requestCrbugIssueData(url) {
  // Get bug id
  if (url.indexOf('code.google.com/p/chromium/issues') == -1) {
    renderError('Not a valid bug (' + url + ')');
    return
  }
  var result = url.match(/id=([\d]+)/);
  if (!result || result.length < 2) {
    renderError('Not a valid bug (' + url + ')');
    return;
  }
  globalData.crbugId = result[1];

  var issueUrl = ISSUES_GET_URL.replace('${issue_id}', globalData.crbugId).
                                replace('${crbug_api_key}', globalData.crbug_api_key);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', issueUrl, true);
  xhr.onload = handleCrbugIssueData;
  xhr.onerror = renderError.bind(null, 'Error accessing crbug API');
  xhr.send();
}

function handleCrbugIssueData() {
  globalData.issueData = JSON.parse(this.responseText);
  requestCrbugIssueComments();
}

function requestCrbugIssueComments() {
  var issueCommentsUrl = ISSUES_GET_COMMENTS_URL.
      replace('${issue_id}', globalData.crbugId).
      replace('${crbug_api_key}', globalData.crbug_api_key);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', issueCommentsUrl, true);
  xhr.onload = handleCrbugIssueCommentData;
  xhr.onerror = renderError.bind(null, 'Error accessing crbug API');
  xhr.send();
}

function handleCrbugIssueCommentData() {
  globalData.issueCommentData = JSON.parse(this.responseText);
  updateImportDialogUI();
}

function updateImportDialogUI() {
  var labels = document.getElementById('labels');
  for (var i = 0; i < globalData.issueData.labels.length; i++) {
    var container = document.createElement('div');
    container.className = 'label-change';
    var label = document.createElement('label');
    container.appendChild(label);
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = 'label-check-' + i;
    label.appendChild(checkbox);
    var span = document.createElement('span')
    span.textContent = globalData.issueData.labels[i] + ' ';
    label.appendChild(span);
    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'label-update-' + i;
    input.placeholder = 'Change label';
    container.appendChild(input);
    labels.appendChild(container);
  }
  document.getElementById('import').style.display = '';
  document.getElementById('start-import').addEventListener(
      'click', onImportButtonClicked);
}

function onImportButtonClicked() {
  globalData.newLabels = [];
  for (var i = 0; i < globalData.issueData.labels.length; i++) {
    var checkbox = document.getElementById('label-check-' + i);
    if (checkbox.checked) {
      var input = document.getElementById('label-update-' + i);
      if (input.value) {
        globalData.newLabels.push(input.value);
      } else {
        globalData.newLabels.push(globalData.issueData.labels[i]);
      }
    }
  }
  document.getElementById('crbug_ui').style.display = 'none';
  document.getElementById('loading_ui').style.display = '';
  requestGithubAccess();
}

function requestGithubAccess() {
  chrome.identity.launchWebAuthFlow({
    'url': GITHUB_ACCESS_URL.replace('${github_client_id}', globalData.github_client_id).
                             replace('${github_state}', globalData.github_state),
    'interactive': true
  }, requestGithubAccessToken);
}

function requestGithubAccessToken(redirectUrl) {
  console.log(arguments);
  var match = redirectUrl.match(/code=([a-z\d]+)/);
  if (!match || match.length != 2) {
    renderError('No GitHub access code in url ' + redirectUrl);
    return;
  }
  var code = match[1];
  var xhr = new XMLHttpRequest();
  xhr.open('POST', GITHUB_ACCESS_TOKEN_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = createGithubIssue;
  xhr.onerror = renderError.bind(null, 'Error requesting GitHub access token');
  xhr.send('client_id=' + globalData.github_client_id +
           '&client_secret=' + globalData.github_client_secret +
           '&code=' + code +
           '&state=' + globalData.github_state);

}

function createGithubIssue(event) {
  globalData.access_token = this.responseText.match(/access_token=([a-z\d]+)/)[1];
  var issueBody = ISSUE_TEMPLATE.
      replace('${user_name}', globalData.issueData.author.name).
      replace('${user_url}', globalData.issueData.author.htmlLink).
      replace('${url}', 'http://crbug.com/' + globalData.issueData.id).
      replace('${date}', globalData.issueData.published).
      replace('${body}', globalData.issueCommentData.items[0].content);
  var data = {
      'title': globalData.issueData.title,
      'body': issueBody,
      'labels': globalData.newLabels
  };
  var xhr = new XMLHttpRequest();
  var issueUrl = GITHUB_ISSUE_URI.replace('${user}', globalData.repo_user).
                                  replace('${repo}', globalData.repo);
  xhr.open('POST', issueUrl, true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.setRequestHeader('Authorization', 'token ' + globalData.access_token);
  xhr.onload = addGithubComment.bind(xhr, 1);
  xhr.onerror = renderError.bind(null, 'Error creating GitHub issue');
  xhr.send(JSON.stringify(data));
}

function addGithubComment(commentNumber) {
  if (!globalData.githubIssueNumber) {
    responseData = JSON.parse(this.responseText);
    globalData.githubIssueNumber = responseData.number;
  }
  if (commentNumber >= globalData.issueCommentData.items.length) {
    linkDialogToGithubIssue()
    return;
  }
  var commentData = globalData.issueCommentData.items[commentNumber];
  var data = {'body': COMMENT_TEMPLATE.
      replace('${user_name}', commentData.author.name).
      replace('${user_url}', commentData.author.htmlLink).
      replace('${date}', commentData.published).
      replace('${body}', commentData.content)};
  var xhr = new XMLHttpRequest();
  var commentUrl = GITHUB_COMMENT_URI.
      replace('${user}', globalData.repo_user).
      replace('${repo}', globalData.repo).
      replace('${number}', globalData.githubIssueNumber);
  xhr.open('POST', commentUrl, true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.setRequestHeader('Authorization', 'token ' + globalData.access_token);
  xhr.onload = addGithubComment.bind(xhr, commentNumber + 1);
  xhr.onerror = renderError.bind(null, 'Error creating GitHub comment');
  xhr.send(JSON.stringify(data));
}

function linkDialogToGithubIssue() {
  var result = document.getElementById('result');
  result.style.display = '';
  result.innerHTML = GITHUB_ISSUE_LINK.
      replace('${user}', globalData.repo_user).
      replace('${repo}', globalData.repo).
      replace('${number}', globalData.githubIssueNumber).
      replace('${number}', globalData.githubIssueNumber);
  document.getElementById('error').style.display = 'none';
  document.getElementById('import').style.display = 'none';
  document.getElementById('loading_ui').style.display = 'none';
  document.getElementById('crbug_ui').style.display = '';
}
