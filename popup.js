// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var ISSUES_GET_URL = 'https://www.googleapis.com/projecthosting/v2/projects/chromium/issues/${issue_id}?key=AIzaSyDrEBALf59D7TkOuz-bBuOnN2OqzD70NCQ';
var ISSUES_GET_COMMENTS_URL = 'https://www.googleapis.com/projecthosting/v2/projects/chromium/issues/${issue_id}/comments?key=AIzaSyDrEBALf59D7TkOuz-bBuOnN2OqzD70NCQ'

var ISSUE_TEMPLATE = '**Issue by [${user_name}](${user_url})**\n_${date}_\n_Originally opened as ${url}_\n\n----\n\n${body}'
var COMMENT_TEMPLATE = '**Comment by [${user_name}](${user_url})**\n_${date}_\n\n----\n\n${body}'

var CREATE_ISSUE_URI = 'https://api.github.com/repos/anniesullie/testing_repo/issues';
var CREATE_COMMENT_URI = 'https://api.github.com/repos/anniesullie/testing_repo/issues/%NUMBER%/comments';

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
document.getElementById('foo').addEventListener('click', function() {
  getCurrentTabUrl(function(url) {
    // Get bug id
    if (url.indexOf('code.google.com/p/chromium/issues') == -1) {
      renderStatus('Not a valid bug (' + url + ')');
      return
    }
    var result = url.match(/id=([\d]+)/);
    if (!result || result.length < 2) {
      renderStatus('Not a valid bug (' + url + ')');
      return;
    }
    var bugId = result[1];
    var issueUrl = ISSUES_GET_URL.replace('${issue_id}', bugId);
    var issueCommentsUrl = ISSUES_GET_COMMENTS_URL.replace('${issue_id}', bugId);
    var issueData = null, issueCommentData = null;
    renderStatus('BUG ID = ' + bugId)

    function doGitHubAuth() {
      function doGithubAuthPost(responseURL) {
        console.log(responseURL);
        var code = responseURL.match(/code=([a-z\d]+)/)[1];
        console.log(code);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://github.com/login/oauth/access_token', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            var access_token = xhr.responseText.match(/access_token=([a-z\d]+)/)[1];
            console.log('ACCESS TOKEN', access_token);
            sendToGitHub(access_token);
          }
        }
        xhr.send('client_id=a0e51932464d63e1ec27&client_secret=aa2bd4dc5dfad3836c21337952f22bb96d78b0da&code=' + code + '&state=' + state);
      }


      var state = 'current_state'; // TODO(sullivan): This should be random.
      chrome.identity.launchWebAuthFlow({
          'url': 'https://github.com/login/oauth/authorize?client_id=a0e51932464d63e1ec27&scope=repo&state=' + state,
          'interactive': true
      }, doGithubAuthPost);

    }

    function sendToGitHub(access_token) {
      renderStatus('sendToGitHub placeholder');
      var issueBody = ISSUE_TEMPLATE.
          replace('${user_name}', issueData.author.name).
          replace('${user_url}', issueData.author.htmlLink).
          replace('${url}', 'http://crbug.com/' + issueData.id).
          replace('${date}', issueData.published).
          replace('${body}', issueCommentData.items[0].content);
      var data = {
        'title': issueData.title,
        'body': issueBody,
        'labels': issueData.labels
      };
      var xhr = new XMLHttpRequest();
      xhr.open('POST', CREATE_ISSUE_URI, true);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.setRequestHeader('Authorization', 'token ' + access_token);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          console.log(xhr.responseText);
          renderStatus('RESPONSE:' + xhr.responseText);
        }
      }
      xhr.send(JSON.stringify(data));
      console.log('sent xhr json');
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", issueUrl, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        // JSON.parse does not evaluate the attacker's scripts.
        issueData = JSON.parse(xhr.responseText);
        console.log('GOT ISSUE DATA:', issueData);
        if (issueCommentData) {
          doGitHubAuth();
        }
      }
    }
    xhr.send();
    var commentsXhr = new XMLHttpRequest();
    commentsXhr.open('get', issueCommentsUrl, true);
    commentsXhr.onreadystatechange = function () {
      if (commentsXhr.readyState == 4) {
        issueCommentData = JSON.parse(commentsXhr.responseText);
        console.log('GOT COMMENT DATA:', issueCommentData);
        if (issueData) {
          doGitHubAuth();
        }
      }
    }
    commentsXhr.send();

    }, function(errorMessage) {
      renderStatus('Cannot get current url. ' + errorMessage);
    });
});
});