/* ─────────────────────────────────────────────────────────────────
   js/chatAssistant.js
   AI Mentor Chat Assistant — floating widget for A.I.R.C. Pro.

   • Pure vanilla JS/HTML/CSS. No frameworks, no dependencies.
   • Builds its own DOM at runtime and injects it into <body>, so no
     existing markup needs to be touched.
   • Namespaced entirely under `window.AIRC_CHAT` — does not read or
     write any global variable used by index.js / dashboard.js / etc.
   • Ships with a local, offline "mentor brain" (rule-based knowledge
     engine) covering DSA, resume guidance, interview tips and core
     technical concepts, so the assistant works immediately with zero
     backend/API configuration.
   • `AIRC_CHAT.setResponder(async (message, history) => string)` lets
     a developer swap in a real LLM API call later without touching
     any other part of this file.
───────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const STORAGE_KEY   = 'airc_chat_history_v1';
  const MAX_HISTORY    = 60;
  const MENTOR_NAME    = 'Mentor AI';

  let elRoot, elLauncher, elPanel, elBody, elInput, elSendBtn, elSuggestions;
  let isOpen = false;
  let isMinimized = false;
  let isThinking = false;
  let history = [];
  let customResponder = null; // optional async(message, history) => string

  /* ════════════════════════════════════════════
     LOCAL STORAGE HELPERS
  ════════════════════════════════════════════ */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      history = raw ? JSON.parse(raw) : [];
    } catch (e) { history = []; }
  }

  function saveHistory() {
    try {
      const trimmed = history.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) { /* storage unavailable — fail silently, chat still works in-memory */ }
  }

  /* ════════════════════════════════════════════
     DOM BUILDING
  ════════════════════════════════════════════ */
  function buildDom() {
    elRoot = document.createElement('div');
    elRoot.id = 'airc-chat-root';

    elRoot.innerHTML = `
      <button type="button" class="airc-chat-launcher" id="aircChatLauncher" aria-label="Open AI mentor chat">
        <span class="airc-launcher-dot"></span>
        <svg class="airc-icon-chat" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4h16v12H8l-4 4V4z" stroke="#04121c" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
          <circle cx="8.5" cy="10" r="1.1" fill="#04121c"/>
          <circle cx="12" cy="10" r="1.1" fill="#04121c"/>
          <circle cx="15.5" cy="10" r="1.1" fill="#04121c"/>
        </svg>
        <svg class="airc-icon-close" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6l12 12M18 6L6 18" stroke="#04121c" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="airc-chat-panel" id="aircChatPanel" role="dialog" aria-label="AI interview mentor chat">
        <div class="airc-chat-header" id="aircChatHeader">
          <div class="airc-chat-avatar">◈</div>
          <div class="airc-chat-title-wrap">
            <div class="airc-chat-title">${MENTOR_NAME}</div>
            <div class="airc-chat-status"><span class="airc-dot-live"></span>Online · Interview prep helper</div>
          </div>
          <div class="airc-chat-header-actions">
            <button type="button" id="aircChatMinBtn" title="Minimize">─</button>
            <button type="button" id="aircChatCloseBtn" title="Close">✕</button>
          </div>
        </div>

        <div class="airc-chat-body" id="aircChatBody"></div>

        <div class="airc-chat-suggestions" id="aircChatSuggestions"></div>

        <div class="airc-chat-footer">
          <textarea
            id="aircChatInput"
            class="airc-chat-input"
            rows="1"
            placeholder="Ask about DSA, resume, interview tips…"
            aria-label="Message the AI mentor"
          ></textarea>
          <button type="button" class="airc-send-btn" id="aircChatSendBtn" title="Send" disabled>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11l18-8-8 18-2-8-8-2z" fill="#04121c"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(elRoot);

    elLauncher    = elRoot.querySelector('#aircChatLauncher');
    elPanel       = elRoot.querySelector('#aircChatPanel');
    elBody        = elRoot.querySelector('#aircChatBody');
    elInput       = elRoot.querySelector('#aircChatInput');
    elSendBtn     = elRoot.querySelector('#aircChatSendBtn');
    elSuggestions = elRoot.querySelector('#aircChatSuggestions');
  }

  function renderSuggestions(list) {
    elSuggestions.innerHTML = '';
    list.forEach((label) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'airc-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => {
        elInput.value = label;
        handleSend();
      });
      elSuggestions.appendChild(chip);
    });
  }

  const DEFAULT_SUGGESTIONS = [
    'Give me a DSA hint',
    'Resume tips',
    'Interview tips',
    'Explain Big-O',
    'STAR method'
  ];

  /* ════════════════════════════════════════════
     MESSAGE RENDERING
  ════════════════════════════════════════════ */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Very small, safe markdown-ish formatter: **bold** and `code`
  function formatText(str) {
    let out = escapeHtml(str);
    out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    out = out.replace(/`(.+?)`/g, '<code>$1</code>');
    return out;
  }

  function appendMessage(role, text, opts) {
    opts = opts || {};
    const msg = document.createElement('div');
    msg.className = 'airc-msg ' + (role === 'user' ? 'user' : 'bot');

    const avatar = document.createElement('div');
    avatar.className = 'airc-msg-avatar';
    avatar.textContent = role === 'user' ? 'YOU' : '◈';

    const bubble = document.createElement('div');
    bubble.className = 'airc-bubble';
    bubble.innerHTML = formatText(text);

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    elBody.appendChild(msg);

    if (!opts.skipPersist) {
      history.push({ role, text, ts: Date.now() });
      saveHistory();
    }

    scrollToBottom();
    return msg;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { elBody.scrollTop = elBody.scrollHeight; });
  }

  function showTyping() {
    const msg = document.createElement('div');
    msg.className = 'airc-msg bot airc-typing';
    msg.innerHTML = `
      <div class="airc-msg-avatar">◈</div>
      <div class="airc-bubble">
        <span class="airc-typing-dot"></span>
        <span class="airc-typing-dot"></span>
        <span class="airc-typing-dot"></span>
      </div>`;
    elBody.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  /* ════════════════════════════════════════════
     KNOWLEDGE ENGINE (offline "mentor brain")
     Rule-based matcher covering DSA, resume, interview
     tips, and core technical concepts. Swappable via
     AIRC_CHAT.setResponder() for a real API later.
  ════════════════════════════════════════════ */
  const KB = [
    {
      tags: ['hello', 'hi', 'hey', 'yo', 'greetings'],
      reply: "Hey! I'm your AI interview mentor. Ask me about **DSA concepts**, **resume feedback**, **interview strategy**, or a **technical topic** — or just tell me what you're stuck on."
    },
    {
      tags: ['thank', 'thanks', 'thx', 'appreciate'],
      reply: "Anytime — that's what I'm here for. Good luck with your prep! 🚀"
    },
    {
      tags: ['big-o', 'big o', 'time complexity', 'complexity'],
      reply: "**Time complexity** measures how runtime grows with input size `n`.\n\nCommon orders (fastest → slowest):\n`O(1)` → `O(log n)` → `O(n)` → `O(n log n)` → `O(n²)` → `O(2ⁿ)`\n\nTip: when analyzing your own code, count nested loops (usually `O(n^k)` for `k` nested loops) and watch for hidden work inside library calls (e.g. `.includes()` on an array is `O(n)`)."
    },
    {
      tags: ['array', 'arrays'],
      reply: "**Arrays** store elements in contiguous memory, giving `O(1)` index access but `O(n)` insert/delete in the middle.\n\nInterview patterns to know: **two pointers**, **sliding window**, **prefix sums**, and **sorting first** to simplify a problem. Want a hint for a specific array problem? Tell me what it is."
    },
    {
      tags: ['linked list', 'linkedlist'],
      reply: "**Linked lists** trade `O(1)` index access for `O(1)` insert/delete at a known node.\n\nClassic interview tricks: **fast & slow pointers** (cycle detection, middle of list), **dummy head node** to simplify edge cases, and **reversing** a list iteratively with three pointers (`prev`, `curr`, `next`)."
    },
    {
      tags: ['stack', 'queue'],
      reply: "**Stack** = LIFO (push/pop from the same end) — great for matching brackets, undo history, DFS.\n**Queue** = FIFO (enqueue at back, dequeue from front) — great for BFS, task scheduling.\n\nIn JS you can use an array as a stack (`push`/`pop`), but for a queue prefer a proper structure since `.shift()` is `O(n)`."
    },
    {
      tags: ['tree', 'binary tree', 'bst'],
      reply: "**Trees**: know the three DFS traversals (**pre-order, in-order, post-order**) and **BFS (level-order)** using a queue.\n\nFor a **Binary Search Tree**, in-order traversal gives sorted output — a very common interview \"aha\" moment. Recursion is usually the cleanest way to write tree logic."
    },
    {
      tags: ['graph', 'graphs', 'bfs', 'dfs'],
      reply: "**Graphs**: represent as an adjacency list for sparse graphs. **BFS** finds shortest path in unweighted graphs; **DFS** is great for connectivity, cycle detection, and topological sort.\n\nAlways ask in the interview: *is it directed or undirected? weighted? can it have cycles?* — clarifying this shows strong fundamentals."
    },
    {
      tags: ['dynamic programming', ' dp ', 'dp problem', 'memoization'],
      reply: "**Dynamic Programming** = recursion + remembering results (memoization) or building a table bottom-up (tabulation).\n\nApproach:\n1. Define the subproblem in words (e.g. `dp[i]` = best answer using first `i` items).\n2. Find the recurrence relating `dp[i]` to smaller subproblems.\n3. Identify the base case.\n4. Decide top-down (memo) vs bottom-up (table).\n\nClassic starters: Fibonacci, climbing stairs, knapsack, longest common subsequence."
    },
    {
      tags: ['sort', 'sorting', 'quicksort', 'mergesort'],
      reply: "**Sorting** you should be able to explain: **Merge Sort** (`O(n log n)`, stable, needs extra space) and **Quick Sort** (`O(n log n)` average, in-place, `O(n²)` worst case).\n\nMost languages give you a built-in sort — in interviews it's usually fine to use it unless the question is specifically about implementing a sort."
    },
    {
      tags: ['binary search'],
      reply: "**Binary search** works on sorted data: compare the middle element, discard half each time → `O(log n)`.\n\nWatch out for the classic off-by-one bugs — decide up front whether your range is `[low, high]` inclusive or `[low, high)` and stay consistent with `mid = low + Math.floor((high-low)/2)` to avoid overflow-style mistakes."
    },
    {
      tags: ['sliding window'],
      reply: "**Sliding window** is for contiguous subarray/substring problems. Keep a `left`/`right` pointer, expand `right` to grow the window, and shrink from `left` when a condition breaks — this avoids the `O(n²)` brute force. Common uses: longest substring without repeats, max sum subarray of size k."
    },
    {
      tags: ['two pointer', 'two-pointer'],
      reply: "**Two pointers** usually beat brute force for sorted arrays or palindromes: one pointer from the start, one from the end (or both moving forward at different speeds). Great for pair-sum problems, removing duplicates in place, and reversing in place."
    },
    {
      tags: ['recursion'],
      reply: "For **recursion**, always identify: (1) the **base case** — when to stop, (2) the **recursive case** — how the problem shrinks, and (3) what work happens **before vs after** the recursive call. Drawing the call stack for a small input (e.g. n=3) makes it click fast."
    },
    {
      tags: ['resume', 'cv'],
      reply: "**Resume tips that actually move the needle**:\n• Start bullets with strong action verbs (Built, Led, Reduced, Shipped).\n• Quantify impact — \"Reduced load time by 40%\" beats \"Improved performance\".\n• Keep it to 1 page for <8 years experience.\n• Mirror keywords from the job description (helps with ATS screening).\n• Put your strongest, most relevant project first — recruiters skim in seconds."
    },
    {
      tags: ['ats', 'applicant tracking'],
      reply: "**ATS (Applicant Tracking Systems)** scan resumes for keywords before a human sees them. To pass: use standard section headers (Experience, Education, Skills), avoid tables/images with text, use the exact tech names from the job posting, and export as a text-selectable PDF, not a scanned image."
    },
    {
      tags: ['cover letter'],
      reply: "A good **cover letter** is 3 short paragraphs: (1) why this role/company specifically, (2) one concrete story proving you can do the job, (3) an enthusiastic, confident close. Avoid repeating your resume line by line — add color and motivation instead."
    },
    {
      tags: ['tell me about yourself', 'introduce myself', 'self introduction'],
      reply: "For **\"Tell me about yourself\"**, use a simple present → past → future arc:\n1. **Present** — your current role/what you do.\n2. **Past** — the relevant experience that got you here.\n3. **Future** — why this role/company is the natural next step.\nKeep it under 90 seconds and end by connecting back to the job you're interviewing for."
    },
    {
      tags: ['star method', 'star technique', 'behavioral'],
      reply: "**STAR method** for behavioral questions:\n• **Situation** — brief context.\n• **Task** — what you needed to achieve.\n• **Action** — what *you* specifically did (use \"I\", not \"we\").\n• **Result** — the outcome, ideally with a number.\nPrep 4-5 STAR stories covering: conflict, failure, leadership, and a proud achievement — most behavioral questions map to one of these."
    },
    {
      tags: ['weakness', 'greatest weakness'],
      reply: "For **\"what's your weakness\"**: pick something real (not a humble-brag like \"I work too hard\"), show self-awareness, and describe the concrete steps you're taking to improve it. Interviewers care more about your growth mindset than the flaw itself."
    },
    {
      tags: ['salary', 'negotiat'],
      reply: "**Salary negotiation** basics: let them name a number first if possible, always negotiate (most offers have room), and back your ask with market data (e.g. levels.fyi, Glassdoor). It's fine to say: \"Based on my research and experience, I was expecting closer to X — is there flexibility?\""
    },
    {
      tags: ['nervous', 'anxious', 'anxiety about interview', 'calm down before interview'],
      reply: "Nerves before an interview are completely normal. A few things that help: do a few slow breaths before you start, keep a glass of water nearby, and remember an interview is a two-way conversation — you're also evaluating them. Prep 2-3 solid stories in advance so you're not thinking from scratch under pressure."
    },
    {
      tags: ['thank you email', 'follow up email', 'follow-up after interview'],
      reply: "Send a **thank-you email** within 24 hours: thank them for their time, reference one specific thing you discussed, and reaffirm your interest in the role. Keep it under 100 words — it's a courtesy note, not a second cover letter."
    },
    {
      tags: ['oop', 'object oriented', 'object-oriented'],
      reply: "**OOP's four pillars**:\n• **Encapsulation** — bundling data + behavior, hiding internal state.\n• **Abstraction** — exposing only what's needed, hiding complexity.\n• **Inheritance** — a class reusing/extending another's behavior.\n• **Polymorphism** — same interface, different underlying implementation.\nBe ready with a real example for each, not just the definition."
    },
    {
      tags: ['sql', 'database', 'normalization', 'dbms'],
      reply: "**Database basics** interviewers probe: primary vs foreign keys, `JOIN` types (`INNER`, `LEFT`, `RIGHT`, `FULL`), indexing (speeds up reads, costs writes), and **normalization** (organizing tables to reduce redundancy, usually up to 3NF). Also know when denormalization is a valid tradeoff for read-heavy systems."
    },
    {
      tags: ['nosql', 'sql vs nosql'],
      reply: "**SQL vs NoSQL**: SQL databases (Postgres, MySQL) are relational, enforce schema, and are strong for structured data with complex relationships. NoSQL (MongoDB, DynamoDB, Redis) trades strict schema/joins for horizontal scalability and flexible data models — good fit when access patterns matter more than relationships."
    },
    {
      tags: ['process', 'thread', 'os concepts', 'operating system'],
      reply: "**Process vs Thread**: a process has its own memory space (isolated, heavier); a thread shares memory with other threads in the same process (lighter, but needs synchronization to avoid race conditions). Know **mutexes/locks** and **deadlock** conditions (mutual exclusion, hold & wait, no preemption, circular wait) as a follow-up."
    },
    {
      tags: ['tcp', 'http', 'networking', 'rest api'],
      reply: "**Networking basics**: TCP is connection-oriented & reliable (used by HTTP); UDP is connectionless & faster but can drop packets. For **REST APIs**, know the verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), status codes (200, 201, 400, 401, 404, 500), and that REST should be stateless between requests."
    },
    {
      tags: ['git', 'version control'],
      reply: "**Git essentials** to be fluent in: `git branch` / `checkout -b` for feature branches, `git rebase` vs `git merge` (rebase = clean linear history, merge = preserves branch context), resolving conflicts, and `git stash` to shelve work-in-progress. Interviewers sometimes ask how you'd undo a bad commit — know `git revert` (safe, new commit) vs `git reset` (rewrites history)."
    },
    {
      tags: ['system design'],
      reply: "For **system design** rounds: start by clarifying requirements & scale (users, requests/sec, data size), sketch a high-level architecture (client → load balancer → app servers → cache → DB), then dive deep into the trickiest component. Always talk tradeoffs out loud — interviewers care more about your reasoning than a \"correct\" answer."
    },
    {
      tags: ['coding hint', 'stuck on', 'approach this problem', 'how do i solve', 'hint'],
      reply: "General approach to any coding problem:\n1. **Restate** the problem in your own words and clarify edge cases out loud.\n2. Work a **small example** by hand.\n3. Get a **brute force** working first — it's better than nothing.\n4. Look for repeated work you can cut with a **hash map, two pointers, or DP**.\n5. Talk through **time/space complexity** before you finish.\nWhat's the specific problem you're working on? I can give a more targeted hint."
    },
    {
      tags: ['what can you do', 'help me with', 'who are you', 'what are you'],
      reply: "I'm your built-in AI mentor for this app. I can help with:\n• **DSA** — arrays, trees, graphs, DP, complexity, hints\n• **Resume & cover letters**\n• **Interview strategy** — STAR method, behavioral Qs, nerves, negotiation\n• **Core CS concepts** — OOP, databases, OS, networking, Git, system design\nJust ask naturally, like you would a mentor."
    }
  ];

  const FALLBACKS = [
    "I don't have a specific answer for that yet, but I can help with **DSA concepts, resume feedback, interview strategy, or core CS topics** — try rephrasing, or tap a suggestion below.",
    "Good question — I'm most useful on interview-prep topics right now (algorithms, resume, behavioral prep, CS fundamentals). Could you narrow it down a bit, or pick a suggestion below?",
    "I'm not fully sure on that one. Want to try a related DSA, resume, or interview-strategy question instead? I'll give you a solid, concrete answer."
  ];

  function scoreMatch(text, tags) {
    let score = 0;
    tags.forEach((tag) => { if (text.includes(tag)) score += tag.trim().length; });
    return score;
  }

  function localBrainRespond(userText) {
    const text = ' ' + userText.toLowerCase().trim() + ' ';
    let best = null;
    let bestScore = 0;
    for (const entry of KB) {
      const s = scoreMatch(text, entry.tags);
      if (s > bestScore) { bestScore = s; best = entry; }
    }
    if (best && bestScore > 0) return best.reply;
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  async function getResponse(userText) {
    if (typeof customResponder === 'function') {
      try {
        return await customResponder(userText, history.slice());
      } catch (e) {
        return "Sorry — I hit an error reaching the response engine. Here's what I can tell you locally instead:\n\n" + localBrainRespond(userText);
      }
    }
    return localBrainRespond(userText);
  }

  /* ════════════════════════════════════════════
     UI STATE / EVENTS
  ════════════════════════════════════════════ */
  function openPanel() {
    isOpen = true;
    isMinimized = false;
    elPanel.classList.add('airc-open');
    elPanel.classList.remove('airc-minimized');
    elLauncher.classList.add('open');
    elLauncher.classList.remove('has-unread');
    setTimeout(() => elInput.focus(), 180);
    scrollToBottom();
  }

  function closePanel() {
    isOpen = false;
    isMinimized = false;
    elPanel.classList.remove('airc-open');
    elPanel.classList.remove('airc-minimized');
    elLauncher.classList.remove('open');
  }

  function toggleMinimize(e) {
    if (e) e.stopPropagation();
    isMinimized = !isMinimized;
    elPanel.classList.toggle('airc-minimized', isMinimized);
    if (!isMinimized) scrollToBottom();
  }

  function updateSendState() {
    elSendBtn.disabled = isThinking || !elInput.value.trim();
  }

  function autoGrow() {
    elInput.style.height = 'auto';
    elInput.style.height = Math.min(elInput.scrollHeight, 90) + 'px';
  }

  async function handleSend() {
    const text = elInput.value.trim();
    if (!text || isThinking) return;

    appendMessage('user', text);
    elInput.value = '';
    autoGrow();
    updateSendState();

    isThinking = true;
    updateSendState();
    const typingEl = showTyping();

    const delay = 500 + Math.random() * 500;
    let reply;
    try {
      reply = await getResponse(text);
    } catch (e) {
      reply = "Something went wrong generating a response. Please try again.";
    }

    setTimeout(() => {
      typingEl.remove();
      appendMessage('bot', reply);
      isThinking = false;
      updateSendState();
    }, delay);
  }

  function wireEvents() {
    elLauncher.addEventListener('click', () => {
      if (isOpen) closePanel(); else openPanel();
    });

    elRoot.querySelector('#aircChatCloseBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel();
    });

    elRoot.querySelector('#aircChatMinBtn').addEventListener('click', toggleMinimize);

    elRoot.querySelector('#aircChatHeader').addEventListener('click', () => {
      if (isMinimized) toggleMinimize();
    });

    elInput.addEventListener('input', () => { autoGrow(); updateSendState(); });

    elInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    elSendBtn.addEventListener('click', handleSend);
  }

  function restoreOrGreet() {
    if (history.length) {
      history.slice(-MAX_HISTORY).forEach((m) => appendMessage(m.role, m.text, { skipPersist: true }));
    } else {
      appendMessage('bot', "Hi, I'm your AI interview mentor! Ask me anything about **DSA, resume writing, interview strategy, or core CS concepts** — I'm here to help you prep.", { skipPersist: false });
    }
    renderSuggestions(DEFAULT_SUGGESTIONS);
  }

  /* ════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════ */
  const AIRC_CHAT = {
    open: openPanel,
    close: closePanel,
    /** Provide a custom async responder, e.g. a real LLM API call:
     *  AIRC_CHAT.setResponder(async (message, history) => { ... return "reply text"; });
     */
    setResponder(fn) { customResponder = typeof fn === 'function' ? fn : null; },
    /** Clears saved conversation history from localStorage + UI. */
    resetHistory() {
      history = [];
      saveHistory();
      elBody.innerHTML = '';
      restoreOrGreet();
    }
  };

  function init() {
    if (document.getElementById('airc-chat-root')) return; // avoid double-init
    loadHistory();
    buildDom();
    wireEvents();
    restoreOrGreet();
    updateSendState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AIRC_CHAT = AIRC_CHAT;
})();
