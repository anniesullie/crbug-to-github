// Update the declarative rules on install or upgrade.
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        // When a url contains a crbug...
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { urlContains: 'code.google.com/p/chromium/issues/detail' }
        })
      ],
      // ... show the page action.
      actions: [new chrome.declarativeContent.ShowPageAction() ]
    }]);
  });
});