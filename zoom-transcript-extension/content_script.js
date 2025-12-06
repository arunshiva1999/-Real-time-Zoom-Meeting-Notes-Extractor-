// content_script.js
(function() {
  console.log('[ZC] content_script loaded');

  // Listen to popup commands
  window.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'zc_control') {
      if (ev.data.cmd === 'start') startCapture();
      if (ev.data.cmd === 'stop') stopCapture();
    }
  });

  let observer = null;
  let lastSent = '';
  let buffer = localStorage.getItem('zc_transcript_buffer') || '';

  async function getServer() {
    return new Promise(resolve => {
      chrome.storage.local.get(['zc_server','zc_running'], (r) => resolve(r.zc_server || 'http://localhost:8000'));
    });
  }

  function findTranscriptElement() {
    // heuristics: find element with many short lines or containing 'Live Transcript' etc.
    const candidates = Array.from(document.querySelectorAll('div, section, span'));
    for (const el of candidates) {
      try {
        const t = (el.innerText || '').trim();
        if (!t) continue;
        if (/Live Transcript|Transcript|Closed Caption|Captions/i.test(t)) return el;
        const lines = t.split('\n');
        if (lines.length > 4 && lines.every(l => l.length < 120)) return el;
      } catch (e) {}
    }
    return null;
  }

  async function postToServer(text) {
    const server = await getServer();
    try {
      await fetch(server + '/upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ text })
      });
      console.log('[ZC] posted to', server);
    } catch (e) {
      console.warn('[ZC] post failed', e);
    }
  }

  function saveBuffer(text) {
    buffer = text;
    localStorage.setItem('zc_transcript_buffer', buffer);
  }

  function onMutations(el) {
    const text = (el.innerText || el.textContent || '').trim();
    if (!text || text.length < 10) return;
    if (text === lastSent) return; // avoid duplicates
    lastSent = text;
    // Update buffer and post
    saveBuffer(text);
    postToServer(text);
  }

  async function startCapture() {
    if (observer) return;
    const el = findTranscriptElement();
    if (!el) {
      console.log('[ZC] transcript element not found, retrying in 1.5s');
      setTimeout(startCapture, 1500);
      return;
    }
    const config = { childList: true, subtree: true, characterData: true };
    observer = new MutationObserver(() => onMutations(el));
    observer.observe(el, config);
    console.log('[ZC] observer started on element', el);
    // initial send
    onMutations(el);
  }

  function stopCapture() {
    if (observer) { observer.disconnect(); observer = null; }
    console.log('[ZC] observer stopped');
  }

  // Auto-start if extension saved running state
  chrome.storage.local.get(['zc_running'], (r) => {
    if (r.zc_running) startCapture();
  });
})();
