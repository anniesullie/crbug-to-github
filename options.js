
document.addEventListener('DOMContentLoaded', loadOptions);

//TODO(anniesullie): use chrome.storage.sync "options_page": "options.html",
function loadOptions() {
  document.getElementById('repo_user').value = localStorage['repo_user'];
  document.getElementById('repo').value = localStorage['repo'];
  document.getElementById('crbug_api_key').value = localStorage['crbug_api_key'];
  document.getElementById('github_client_id').value = localStorage['github_client_id'];
  document.getElementById('github_client_secret').value = localStorage['github_client_secret'];
  document.getElementById('save').addEventListener('click', saveOptions);
}

function saveOptions() {
  localStorage['repo_user'] = document.getElementById('repo_user').value;
  localStorage['repo'] = document.getElementById('repo').value;
  localStorage['crbug_api_key'] = document.getElementById('crbug_api_key').value;
  localStorage['github_client_id'] = document.getElementById('github_client_id').value;
  localStorage['github_client_secret'] = document.getElementById('github_client_secret').value;
}