/* ─────────────────────────────────────────────
   js/practiceCommon.js — Practice module (isolated)

   Shared UI helpers reused by Communication, GD and
   Interview practice controllers: chat bubble rendering,
   mic button state machine, and mini performance reports.
───────────────────────────────────────────── */
'use strict';

(function () {
  /** Append a chat message bubble. side: 'mentor' | 'student' | 'system' */
  function addMessage(listEl, side, name, text, opts) {
    opts = opts || {};
    const row = document.createElement('div');
    row.className = 'pz-msg pz-msg-' + side;

    if (side !== 'system') {
      const who = document.createElement('div');
      who.className = 'pz-msg-name';
      who.textContent = name;
      row.appendChild(who);
    }

    const bubble = document.createElement('div');
    bubble.className = 'pz-bubble' + (opts.tone ? ' pz-bubble-' + opts.tone : '');
    bubble.innerHTML = text; // text is built internally (safe, not raw user HTML)
    row.appendChild(bubble);

    listEl.appendChild(row);
    listEl.scrollTop = listEl.scrollHeight;
    return row;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function typingIndicator(listEl, name) {
    const row = document.createElement('div');
    row.className = 'pz-msg pz-msg-mentor pz-typing-row';
    row.innerHTML = `<div class="pz-msg-name">${escapeHtml(name)}</div>
      <div class="pz-bubble pz-typing"><span></span><span></span><span></span></div>`;
    listEl.appendChild(row);
    listEl.scrollTop = listEl.scrollHeight;
    return () => row.remove();
  }

  /** Build the "Almost correct" correction bubble HTML from a comparison result. */
  function buildCorrectionHtml(result, expectedSentence) {
    if (result.uncertain) {
      return `I couldn't clearly hear that clearly — different accents can sound different to the browser.<br>
        Please say the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
    }
    const parts = [];
    if (result.wrong && result.wrong.length) {
      result.wrong.forEach((w) => {
        parts.push(`You said <strong>"${escapeHtml(w.spoken)}"</strong> — please say <strong>"${escapeHtml(w.expected)}"</strong>`);
      });
    }
    if (result.missing && result.missing.length) {
      parts.push(`You missed: <strong>"${escapeHtml(result.missing.join(' '))}"</strong>`);
    }
    if (result.extra && result.extra.length) {
      parts.push(`Extra word${result.extra.length > 1 ? 's' : ''}: <strong>"${escapeHtml(result.extra.join(' '))}"</strong>`);
    }
    const detail = parts.length ? parts.join('<br>') : 'That was not quite right.';
    return `Almost correct. 👍<br>${detail}<br><br>Please try the sentence again:<br><strong>"${escapeHtml(expectedSentence)}"</strong>`;
  }

  /* ── Mic button state machine ──
     states: idle -> listening -> (processing) -> idle
     Renders label/icon and wires click to provided callbacks. */
  function createMicButton(btnEl, statusEl, { onStart, onStop }) {
    let state = 'idle'; // idle | listening | processing | disabled

    function render() {
      btnEl.classList.remove('pz-mic-idle', 'pz-mic-listening', 'pz-mic-processing', 'pz-mic-disabled');
      switch (state) {
        case 'listening':
          btnEl.classList.add('pz-mic-listening');
          btnEl.innerHTML = '⏹ Stop';
          if (statusEl) statusEl.textContent = 'Listening…';
          break;
        case 'processing':
          btnEl.classList.add('pz-mic-processing');
          btnEl.innerHTML = '⏳ Processing…';
          if (statusEl) statusEl.textContent = 'Processing your answer…';
          break;
        case 'disabled':
          btnEl.classList.add('pz-mic-disabled');
          btnEl.innerHTML = '🎤 Speak';
          if (statusEl) statusEl.textContent = '';
          break;
        default:
          btnEl.classList.add('pz-mic-idle');
          btnEl.innerHTML = '🎤 Speak';
          if (statusEl) statusEl.textContent = 'Ready';
      }
    }

    btnEl.addEventListener('click', () => {
      if (state === 'idle') {
        state = 'listening';
        render();
        onStart && onStart();
      } else if (state === 'listening') {
        state = 'processing';
        render();
        onStop && onStop();
      }
    });

    render();

    return {
      setState(s) { state = s; render(); },
      getState() { return state; },
    };
  }

  /** Render a simple metric bar row, e.g. for GD / Interview reports. */
  function metricRow(label, value, suffix) {
    suffix = suffix || '%';
    const pct = Math.max(0, Math.min(100, value));
    return `
      <div class="pz-metric-row">
        <span class="pz-metric-label">${escapeHtml(label)}</span>
        <div class="pz-metric-bar"><div class="pz-metric-fill" style="width:${pct}%"></div></div>
        <span class="pz-metric-value">${escapeHtml(String(value))}${suffix === '%' ? '%' : ' ' + suffix}</span>
      </div>`;
  }

  window.AIRC_PRACTICE_COMMON = {
    addMessage, escapeHtml, typingIndicator, buildCorrectionHtml, createMicButton, metricRow,
  };
})();
