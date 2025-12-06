// background.js — simple MV3 service worker for Zoom Transcript extension

// Fired when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ZC] background installed');
  // initialize defaults
  chrome.storage.local.get(['zc_server','zc_running'], (res) => {
    if (typeof res.zc_server === 'undefined') {
      chrome.storage.local.set({ zc_server: 'http://localhost:8000' });
    }
    if (typeof res.zc_running === 'undefined') {
      chrome.storage.local.set({ zc_running: false });
    }
  });
});

// Simple message handler so content/popup scripts can query background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === 'zc_get_config') {
    chrome.storage.local.get(['zc_server','zc_running'], (res) => {
      sendResponse({ server: res.zc_server || '', running: !!res.zc_running });
    });
    // return true to indicate we'll send response asynchronously
    return true;
  }

  if (message.type === 'zc_set_running') {
    chrome.storage.local.set({ zc_running: !!message.value }, () => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'zc_set_server') {
    chrome.storage.local.set({ zc_server: message.value || '' }, () => sendResponse({ ok: true }));
    return true;
  }

  // unknown message type -> no response
});
