// popup.js — starts capture on active tab and opens the UI with optional meeting info

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const serverInput = document.getElementById('serverUrl');
const meetingInput = document.getElementById('meetingInput');
const status = document.getElementById('status');

const DEFAULT_SERVER = 'http://localhost:8000';

async function getSaved() {
  return new Promise(resolve => {
    chrome.storage.local.get(['zc_server','zc_running'], (r) => resolve(r));
  });
}

async function saveServer(url) {
  await chrome.storage.local.set({ zc_server: url });
}

// Send start/stop messages to content script on the active tab
async function sendCmdToActiveTab(cmd) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    console.warn('No active tab found');
    return { ok: false, reason: 'no-tab' };
  }
  try {
    // Use chrome.scripting to execute a small script that posts a window message
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (c) => window.postMessage({ type: 'zc_control', cmd: c }, '*'),
      args: [cmd],
    });
    return { ok: true, tabId: tab.id };
  } catch (e) {
    console.error('sendCmd error', e);
    return { ok: false, reason: e.message || e };
  }
}

// Open UI and include meeting link as query param (if present)
function openUI(server, meeting) {
  let url = server || DEFAULT_SERVER;
  if (meeting && meeting.trim()) {
    // encode meeting param to pass to UI
    const q = encodeURIComponent(meeting.trim());
    url += `/?meeting=${q}`;
  }
  // open in new tab and focus it
  chrome.tabs.create({ url }, (tab) => {
    // optionally store the UI tab id
    chrome.storage.local.set({ zc_ui_tab: tab.id });
  });
}

startBtn.addEventListener('click', async () => {
  const server = (serverInput.value || (await getSaved()).zc_server || DEFAULT_SERVER).trim();
  const meeting = meetingInput.value.trim();

  // Save server URL
  await saveServer(server);

  // Mark running state
  chrome.storage.local.set({ zc_running: true });

  // Send start command to active tab (Zoom web client tab)
  const r = await sendCmdToActiveTab('start');
  if (!r.ok) {
    status.textContent = 'Start sent — but failed to reach tab. Make sure you are on Zoom web client tab.';
    status.style.color = 'orange';
  } else {
    status.textContent = 'Capture started on active tab. Opening UI...';
    status.style.color = 'green';
  }

  // open UI and pass meeting id if provided
  openUI(server, meeting);

  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', async () => {
  chrome.storage.local.set({ zc_running: false });
  const r = await sendCmdToActiveTab('stop');
  if (r.ok) {
    status.textContent = 'Stopped capture.';
    status.style.color = '#333';
  } else {
    status.textContent = 'Stop sent — but tab unreachable.';
    status.style.color = 'orange';
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;

  // optional: bring UI tab to front if exists
  chrome.storage.local.get('zc_ui_tab', (res) => {
    if (res.zc_ui_tab) {
      chrome.tabs.update(res.zc_ui_tab, { active: true });
    }
  });
});

// On popup open, load saved server and running status
(async () => {
  const saved = await getSaved();
  serverInput.value = saved.zc_server || DEFAULT_SERVER;
  if (saved.zc_running) {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    status.textContent = 'Capture is running';
    status.style.color = 'green';
  } else {
    status.textContent = 'Idle';
  }
})();
