
document.addEventListener('DOMContentLoaded', loadOptions);

function loadOptions() {
  document.getElementById('save').addEventListener('click', saveOptions);
  chrome.storage.sync.get({
    repo_user: '',
    repo: '',
    crbug_api_key: '',
    github_client_id: '',
    github_client_secret: ''
  }, function(items) {
    document.getElementById('repo_user').value = items.repo_user;
    document.getElementById('repo').value = items.repo;
    document.getElementById('crbug_api_key').value = items.crbug_api_key;
    document.getElementById('github_client_id').value = items.github_client_id;
    document.getElementById('github_client_secret').value = items.github_client_secret;
  });
}

function saveOptions() {
  chrome.storage.sync.set({
    repo_user: document.getElementById('repo_user').value,
    repo: document.getElementById('repo').value,
    crbug_api_key: document.getElementById('crbug_api_key').value,
    github_client_id: document.getElementById('github_client_id').value,
    github_client_secret: document.getElementById('github_client_secret').value
  }, function() {
    document.getElementById('saved_success').style.display = '';
  });
}