/* ─────────────────────────────────────────────
   js/speechRecognitionService.js — Practice module (isolated)

   Thin wrapper around the browser SpeechRecognition /
   webkitSpeechRecognition API. Nothing else in the Practice
   module touches the raw browser API directly.

   Usage:
     const rec = AIRC_SPEECH_RECOGNITION.create({
       onResult(transcript, isFinal, confidence) {},
       onError(message, code) {},
       onEnd() {},
       onStart() {},
     });
     rec.start();  // begins listening (requests mic permission)
     rec.stop();   // stops listening
     rec.isSupported()
───────────────────────────────────────────── */
'use strict';

(function () {
  function getEngine() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function isSupported() {
    return !!getEngine();
  }

  /** navigator.mediaDevices permission check happens implicitly on start();
   *  we also try an explicit getUserMedia probe first so we can show a
   *  friendly message instead of a silent recognition failure. */
  async function ensureMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Can't probe — let SpeechRecognition itself handle it.
      return { ok: true, probed: false };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { ok: true, probed: true };
    } catch (e) {
      return { ok: false, probed: true, error: e };
    }
  }

  function create(handlers) {
    handlers = handlers || {};
    const Engine = getEngine();
    let recognition = null;
    let listening = false;
    let stoppedManually = false;

    function build() {
      const r = new Engine();
      r.lang = 'en-IN';
      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 3;

      r.onstart = () => {
        listening = true;
        handlers.onStart && handlers.onStart();
      };

      r.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscript += text;
            confidence = res[0].confidence || 0;
          } else {
            interimTranscript += text;
          }
        }
        if (finalTranscript) {
          handlers.onResult && handlers.onResult(finalTranscript.trim(), true, confidence);
        } else if (interimTranscript) {
          handlers.onResult && handlers.onResult(interimTranscript.trim(), false, 0);
        }
      };

      r.onerror = (event) => {
        listening = false;
        let message = "I couldn't clearly hear your response. Please speak a little slower and try again.";
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          message = 'Microphone permission is required for speaking practice. Please allow microphone access and try again.';
        } else if (event.error === 'no-speech') {
          message = "I didn't hear anything. Please try again.";
        } else if (event.error === 'audio-capture') {
          message = 'No microphone was detected on this device.';
        } else if (event.error === 'network') {
          message = 'A network issue interrupted speech recognition. Please try again.';
        }
        handlers.onError && handlers.onError(message, event.error);
      };

      r.onend = () => {
        listening = false;
        handlers.onEnd && handlers.onEnd(stoppedManually);
        stoppedManually = false;
      };

      return r;
    }

    return {
      isSupported,
      isListening: () => listening,
      async start() {
        if (!isSupported()) {
          handlers.onError && handlers.onError(
            'Speech recognition is not supported in this browser. Please try Google Chrome on desktop or Android.',
            'unsupported'
          );
          return false;
        }
        if (listening) return true;
        const perm = await ensureMicPermission();
        if (!perm.ok) {
          handlers.onError && handlers.onError(
            'Microphone permission is required for speaking practice. Please allow microphone access and try again.',
            'permission-denied'
          );
          return false;
        }
        try {
          recognition = build();
          recognition.start();
          return true;
        } catch (e) {
          handlers.onError && handlers.onError(
            "I couldn't start the microphone. Please try again.",
            'start-failed'
          );
          return false;
        }
      },
      stop() {
        stoppedManually = true;
        if (recognition && listening) {
          try { recognition.stop(); } catch (e) { /* no-op */ }
        }
      },
      abort() {
        stoppedManually = true;
        if (recognition) {
          try { recognition.abort(); } catch (e) { /* no-op */ }
        }
        listening = false;
      },
    };
  }

  window.AIRC_SPEECH_RECOGNITION = { isSupported, create, ensureMicPermission };
})();
