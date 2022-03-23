// URLAutoRedirector
// Copyright (c) David Zhang, 2021
// Idea inspired by Albert Li.

// default options
// Change this notes url to your google doc notes or your notes url
var notes_url = "https://pomofocus.io/"
var defaultOptions = {
  options: {
    isNewTab: false,
    isNotify: true,
    rules: [
      {
        src: 'https://twitter.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      },
      {
        src: 'https://instagram.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      },
      {
        src: 'https://news.ycombinator.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      },
      {
        src: 'https://www.reddit.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      },
      {
        src: 'https://discord.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      },
      {
        src: 'https://amazon.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      },
      {
        src: 'https://notes.com/(.*)',
        dst: notes_url,
        isEnabled: true,
        isRegex: true,
      }
    ],
  },
};


var isNewTab;
var isNotify;
var rules;
var lastTabId = 0;

function matchUrl(url) {
  if (rules == undefined || url == undefined) {
    return false;
  }
  for (var i = 0; i < rules.length; i++) {
    var isEnabled = rules[i].isEnabled;
    var isRegex = rules[i].isRegex;
    var src = rules[i].src;
    var dst = rules[i].dst;

    if (isEnabled) {
      if (isRegex) {
        var re = new RegExp(src);
        if (url.search(re) != -1) {
          newUrl = url.replace(re, dst);
          if (url != newUrl) {
            return newUrl;
          }
        }
      } else {
        if (url == src) {
          return dst;
        }
      }
    }
  }

  return false;
}

function getOptions(callback) {
  chrome.storage.local.get('options', function (data) {
    if (data.options) {
      isNewTab = data.options.isNewTab;
      isNotify = data.options.isNotify;
      rules = data.options.rules;
    }
    callback();
  });
}

function notify() {
  if (!isNotify) {
    return;
  }

  chrome.notifications.create({
    type: 'progress',
    iconUrl: chrome.extension.getURL('images/icon-48.png'),
    title: chrome.i18n.getMessage('ext_name'),
    message: chrome.i18n.getMessage('prompt_msg'),
    progress: 100,
  });
}

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
  if (change.status == 'loading') {
    newUrl = matchUrl(change.url);
    if (newUrl) {
      console.log('Match:' + change.url);
      console.log('Target:' + newUrl);
      if (isNewTab == false) {
        lastTabId = tabId;
        chrome.tabs.update({url: newUrl});
      } else {
        chrome.tabs.create({url: newUrl}, function (tab) {
          notify();
        });
      }
    }
  }
  if (change.status == 'complete' && tabId == lastTabId) {
    notify();
    lastTabId = 0;
  }
});

chrome.runtime.onMessage.addListener(function (request, _sender, _sendResponse) {
  if (request.type == 'syncOptions') {
    isNewTab = request['options']['options']['isNewTab'];
    isNotify = request['options']['options']['isNotify'];
    rules = request['options']['options']['rules'];
  }
  if (request.type == 'resetRules') {
    var newOptions = {
      options: {
        isNewTab: isNewTab,
        isNotify: isNotify,
        rules: defaultOptions['options']['rules'],
      },
    };
    rules = defaultOptions['options']['rules'];
    chrome.storage.local.set(newOptions);
    var msg = {
      type: 'reloadOptions',
    };
    chrome.runtime.sendMessage(msg, function (_response) {
      console.log('Send msg[reloadOptions]');
    });
  }
});

getOptions(function () {
  console.log('getOption Done');
});

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get('options', function (data) {
    if (!data.options) {
      chrome.storage.local.set(defaultOptions);
    }
  });
});
