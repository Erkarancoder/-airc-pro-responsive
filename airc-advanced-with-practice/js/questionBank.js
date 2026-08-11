/* ─────────────────────────────────────────────
   js/questionBank.js — A.I.R.C. Pro
   Central question bank for all interview categories.
   Extends the original QUESTION_BANK (general, frontend,
   backend, fullstack, data, devops, product, design) with:
   hr, mern, react, javascript, java, dsa, sql, dbms,
   os, cn, oop, system-design.
   Each question: { q, hint, tags } — tags are used by the
   dynamic follow-up engine (js/followUpEngine.js) and the
   answer evaluator to check keyword coverage.
───────────────────────────────────────────── */
'use strict';

/* Original categories, carried over unchanged from the previous version
   (general, frontend, backend, fullstack, data, devops, product, design). */
const QUESTION_BANK = {
  general: {
    beginner: [
      { q: "Tell me about yourself.", hint: "background, skills, goals", tags: ["intro"] },
      { q: "Why do you want this role?", hint: "motivation, growth, alignment", tags: ["motivation"] },
      { q: "What are your greatest strengths?", hint: "concrete examples, impact", tags: ["strengths"] },
      { q: "Describe a challenge you overcame.", hint: "STAR method: situation, task, action, result", tags: ["challenge"] },
      { q: "Where do you see yourself in 3–5 years?", hint: "ambition, realism, role alignment", tags: ["goals"] },
      { q: "How do you handle tight deadlines?", hint: "prioritization, communication, outcome", tags: ["priority"] },
      { q: "What motivates you to do your best work?", hint: "intrinsic/extrinsic, examples", tags: ["motivation"] },
      { q: "Describe your ideal work environment.", hint: "culture, collaboration, autonomy", tags: ["culture"] },
    ],
    mid: [
      { q: "Describe a time you led a project under pressure.", hint: "leadership, decision-making, result", tags: ["leadership"] },
      { q: "How do you handle conflict with a team member?", hint: "empathy, communication, resolution", tags: ["conflict"] },
      { q: "Tell me about a failure and what you learned.", hint: "honesty, growth mindset, change", tags: ["failure"] },
      { q: "How do you prioritize tasks when everything is urgent?", hint: "frameworks: MoSCoW, Eisenhower", tags: ["priority"] },
    ],
    senior: [
      { q: "How do you influence without authority?", hint: "persuasion, data, relationships", tags: ["leadership"] },
      { q: "Describe how you mentor junior team members.", hint: "patience, structured feedback, growth", tags: ["leadership"] },
      { q: "How do you align stakeholders with conflicting priorities?", hint: "negotiation, shared goals, data", tags: ["leadership"] },
    ],
  },
  frontend: {
    beginner: [
      { q: "Explain the difference between HTML, CSS, and JavaScript.", hint: "structure, style, behaviour", tags: ["javascript"] },
      { q: "What is the CSS Box Model?", hint: "content, padding, border, margin", tags: ["css"] },
      { q: "What is the difference between let, const, and var?", hint: "scope, hoisting, mutability", tags: ["javascript"] },
      { q: "What is a responsive design and how do you achieve it?", hint: "media queries, flexbox, grid, fluid units", tags: ["css"] },
      { q: "Explain event bubbling and event capturing.", hint: "propagation direction, stopPropagation", tags: ["javascript"] },
    ],
    mid: [
      { q: "What is the Virtual DOM and why does React use it?", hint: "diffing, reconciliation, performance", tags: ["react"] },
      { q: "Explain closures in JavaScript with an example.", hint: "lexical scope, inner function, persistence", tags: ["javascript"] },
      { q: "What are React Hooks? Name at least three.", hint: "useState, useEffect, useCallback, useMemo", tags: ["react"] },
      { q: "How does CSS specificity work?", hint: "inline > id > class > tag, 0-1-1-1 notation", tags: ["css"] },
      { q: "What is debouncing vs throttling?", hint: "delay vs interval, use cases (search, scroll)", tags: ["javascript"] },
    ],
    senior: [
      { q: "How would you optimise a React app with 1000 list items?", hint: "virtualisation (react-window), memo, lazy", tags: ["react","performance"] },
      { q: "Explain the Critical Rendering Path.", hint: "DOM, CSSOM, render tree, layout, paint", tags: ["performance"] },
      { q: "What are Web Workers and when would you use them?", hint: "off-main-thread, compute-heavy tasks", tags: ["javascript"] },
    ],
  },
  backend: {
    beginner: [
      { q: "What is REST? Name its key constraints.", hint: "stateless, uniform interface, client-server", tags: ["api"] },
      { q: "What is the difference between SQL and NoSQL?", hint: "schema, scalability, query flexibility", tags: ["database"] },
      { q: "Explain the difference between authentication and authorisation.", hint: "who you are vs what you can do", tags: ["auth"] },
      { q: "What is an API and why is it important?", hint: "contract, abstraction, interoperability", tags: ["api"] },
    ],
    mid: [
      { q: "Explain database indexing and when to use it.", hint: "B-tree, read vs write trade-off, selectivity", tags: ["database","sql"] },
      { q: "What is the N+1 query problem? How do you fix it?", hint: "eager loading, JOIN, DataLoader", tags: ["database"] },
      { q: "How does JWT authentication work?", hint: "header.payload.signature, stateless, expiry", tags: ["jwt"] },
      { q: "Describe the differences between TCP and UDP.", hint: "reliability, ordering, speed, use cases", tags: ["cn"] },
    ],
    senior: [
      { q: "How would you design a rate-limiting system?", hint: "token bucket, sliding window, Redis", tags: ["system-design"] },
      { q: "Explain eventual consistency in distributed systems.", hint: "CAP theorem, BASE, conflict resolution", tags: ["system-design"] },
      { q: "How do you handle database migrations with zero downtime?", hint: "expand-contract, backward compat, feature flags", tags: ["database"] },
    ],
  },
  fullstack: {
    beginner: [
      { q: "What is the difference between frontend and backend development?", hint: "client, server, responsibilities", tags: ["general"] },
      { q: "How does HTTP work? Explain request-response.", hint: "methods, status codes, headers, body", tags: ["cn"] },
      { q: "What is CORS and why does it exist?", hint: "same-origin policy, preflight, headers", tags: ["cn","api"] },
    ],
    mid: [
      { q: "How would you design a login system from scratch?", hint: "hashing, sessions/JWT, HTTPS, CSRF", tags: ["auth"] },
      { q: "Describe your approach to testing a full-stack feature.", hint: "unit, integration, e2e, test pyramid", tags: ["testing"] },
      { q: "How do you manage environment variables across environments?", hint: ".env, secrets manager, CI/CD", tags: ["devops"] },
    ],
    senior: [
      { q: "Design a scalable URL shortener (like bit.ly).", hint: "hash, redirect, analytics, cache, CDN", tags: ["system-design"] },
      { q: "How would you migrate a monolith to microservices?", hint: "strangler fig, API gateway, bounded context", tags: ["system-design"] },
    ],
  },
  data: {
    beginner: [
      { q: "What is the difference between supervised and unsupervised learning?", hint: "labelled data, clustering, regression", tags: ["ml"] },
      { q: "Explain overfitting and how to prevent it.", hint: "regularisation, dropout, cross-validation", tags: ["ml"] },
      { q: "What is a confusion matrix?", hint: "TP, TN, FP, FN, precision, recall", tags: ["ml"] },
    ],
    mid: [
      { q: "Explain gradient descent and its variants.", hint: "SGD, mini-batch, Adam, learning rate", tags: ["ml"] },
      { q: "What is feature engineering? Give examples.", hint: "normalisation, encoding, interaction terms", tags: ["ml"] },
      { q: "How does a Random Forest differ from a single Decision Tree?", hint: "bagging, variance reduction, diversity", tags: ["ml"] },
    ],
    senior: [
      { q: "How do you handle class imbalance in a dataset?", hint: "SMOTE, class weights, threshold tuning, F1", tags: ["ml"] },
      { q: "Explain the bias-variance trade-off.", hint: "underfitting, overfitting, model complexity", tags: ["ml"] },
    ],
  },
  devops: {
    beginner: [
      { q: "What is CI/CD and why is it important?", hint: "automation, fast feedback, reliability", tags: ["devops"] },
      { q: "What is Docker? What problem does it solve?", hint: "containerisation, reproducibility, isolation", tags: ["docker"] },
      { q: "Explain the difference between horizontal and vertical scaling.", hint: "add instances vs bigger instance, trade-offs", tags: ["system-design"] },
    ],
    mid: [
      { q: "How does Kubernetes manage containers?", hint: "pods, deployments, services, scheduler", tags: ["kubernetes"] },
      { q: "What is Infrastructure as Code? Name a tool.", hint: "Terraform, Pulumi, reproducibility, state", tags: ["devops"] },
      { q: "Describe your approach to monitoring a production system.", hint: "metrics, logs, traces, alerting, SLOs", tags: ["devops"] },
    ],
    senior: [
      { q: "How would you design a disaster recovery strategy?", hint: "RTO, RPO, multi-region, failover testing", tags: ["system-design"] },
      { q: "Explain blue-green vs canary deployments.", hint: "traffic split, rollback, feature flags", tags: ["devops"] },
    ],
  },
  product: {
    beginner: [
      { q: "How do you prioritise a product backlog?", hint: "RICE, MoSCoW, stakeholder alignment", tags: ["product"] },
      { q: "What is a North Star metric? Give an example.", hint: "single KPI, user value, business growth", tags: ["product"] },
      { q: "Describe how you would gather user requirements.", hint: "interviews, surveys, analytics, shadowing", tags: ["product"] },
    ],
    mid: [
      { q: "How do you define and track success for a new feature?", hint: "OKRs, A/B testing, leading vs lagging KPIs", tags: ["product"] },
      { q: "Walk me through how you would run a discovery sprint.", hint: "problem framing, research, prototype, validate", tags: ["product"] },
    ],
    senior: [
      { q: "How do you influence engineering trade-offs as a PM?", hint: "data, relationships, shared goals, trust", tags: ["leadership"] },
      { q: "Describe how you manage a product across multiple markets.", hint: "localisation, compliance, prioritisation", tags: ["product"] },
    ],
  },
  design: {
    beginner: [
      { q: "What is the difference between UX and UI design?", hint: "experience vs interface, research vs aesthetics", tags: ["design"] },
      { q: "Explain the concept of a design system.", hint: "tokens, components, consistency, docs", tags: ["design"] },
      { q: "What is accessibility in design and why does it matter?", hint: "WCAG, colour contrast, screen readers, inclusion", tags: ["design"] },
    ],
    mid: [
      { q: "How do you conduct a usability test?", hint: "tasks, moderated vs unmoderated, observation, synthesis", tags: ["design"] },
      { q: "Explain your design process from brief to delivery.", hint: "research, ideation, prototype, test, iterate", tags: ["design"] },
      { q: "How do you handle design critiques and push-back?", hint: "data, principles, humility, iteration", tags: ["design"] },
    ],
    senior: [
      { q: "How do you influence product direction through design?", hint: "research evidence, prototypes, storytelling", tags: ["leadership"] },
      { q: "Describe how you scale design quality across a large org.", hint: "design system, review process, culture, docs", tags: ["design"] },
    ],
  },
};

const QUESTION_BANK_EXT = {

  hr: {
    beginner: [
      { q: "Tell me about yourself.", hint: "background, skills, goals", tags: ["intro"] },
      { q: "Why should we hire you?", hint: "unique value, evidence, fit", tags: ["value","fit"] },
      { q: "What are your strengths and weaknesses?", hint: "self-awareness, growth plan", tags: ["strengths","weaknesses"] },
      { q: "Why do you want to work at our company?", hint: "research, mission alignment", tags: ["motivation"] },
      { q: "How do you handle stress and pressure?", hint: "coping strategy, example", tags: ["stress"] },
    ],
    mid: [
      { q: "Describe a time you disagreed with your manager.", hint: "respect, evidence, resolution", tags: ["conflict"] },
      { q: "Tell me about a time you failed and what you learned.", hint: "honesty, ownership, growth", tags: ["failure"] },
      { q: "How do you prioritise when you have multiple deadlines?", hint: "frameworks, communication", tags: ["priority"] },
      { q: "Describe a situation where you had to persuade someone.", hint: "data, empathy, outcome", tags: ["persuasion"] },
    ],
    senior: [
      { q: "How do you handle underperforming team members?", hint: "feedback, coaching, documentation", tags: ["leadership"] },
      { q: "Tell me about a difficult decision you made with incomplete information.", hint: "risk, judgement, outcome", tags: ["decision"] },
      { q: "How do you build trust with a new team quickly?", hint: "listening, consistency, transparency", tags: ["trust"] },
    ],
  },

  mern: {
    beginner: [
      { q: "What does the MERN stack stand for?", hint: "MongoDB, Express, React, Node", tags: ["mern","mongodb","express","react","node"] },
      { q: "How does Express.js handle routing?", hint: "app.get/post, middleware, router", tags: ["express","middleware"] },
      { q: "What is Mongoose and why is it used with MongoDB?", hint: "ODM, schema validation", tags: ["mongodb","mongoose"] },
      { q: "How do you connect a React frontend to a Node/Express backend?", hint: "REST API, fetch/axios, CORS", tags: ["react","node","api","cors"] },
    ],
    mid: [
      { q: "How would you structure a MERN app for scalability?", hint: "MVC, service layer, env config", tags: ["architecture"] },
      { q: "Explain middleware in Express with an example.", hint: "req/res/next, error handling", tags: ["express","middleware"] },
      { q: "How do you manage authentication in a MERN app?", hint: "JWT, bcrypt, HTTP-only cookies", tags: ["jwt","auth"] },
      { q: "How does MongoDB handle relationships compared to SQL?", hint: "embedding vs referencing", tags: ["mongodb"] },
    ],
    senior: [
      { q: "How would you optimise MongoDB queries at scale?", hint: "indexing, aggregation pipeline, sharding", tags: ["mongodb","indexing"] },
      { q: "How do you design a real-time feature (e.g. chat) in MERN?", hint: "WebSockets, Socket.io, scaling", tags: ["websocket","realtime"] },
      { q: "How do you handle state management in a large React app within a MERN stack?", hint: "Redux/Context, caching, React Query", tags: ["react","state"] },
    ],
  },

  react: {
    beginner: [
      { q: "What is JSX?", hint: "syntax extension, compiles to React.createElement", tags: ["react","jsx"] },
      { q: "What is the difference between props and state?", hint: "immutable input vs internal mutable data", tags: ["react","props","state"] },
      { q: "What is the Virtual DOM?", hint: "diffing, reconciliation, performance", tags: ["react","virtualdom"] },
      { q: "What are React components? Class vs functional?", hint: "reusability, hooks vs lifecycle methods", tags: ["react","components"] },
    ],
    mid: [
      { q: "Explain the useState and useEffect hooks.", hint: "state updates, side effects, dependency array", tags: ["react","hooks","usestate","useeffect"] },
      { q: "What is the difference between useState and useReducer?", hint: "simple vs complex state logic", tags: ["react","usereducer"] },
      { q: "What is React Context and when should you use it?", hint: "prop drilling, global-ish state", tags: ["react","context"] },
      { q: "Explain reconciliation and keys in lists.", hint: "diffing algorithm, stable identity", tags: ["react","reconciliation","keys"] },
    ],
    senior: [
      { q: "How would you optimise performance in a large React application?", hint: "memo, useMemo, useCallback, code-splitting, virtualisation", tags: ["react","performance"] },
      { q: "Explain React Server Components and their trade-offs.", hint: "server rendering, bundle size, data fetching", tags: ["react","rsc"] },
      { q: "How do you design a scalable component architecture?", hint: "composition, design system, atomic design", tags: ["react","architecture"] },
    ],
  },

  javascript: {
    beginner: [
      { q: "What is the difference between let, const, and var?", hint: "scope, hoisting, mutability", tags: ["javascript","scope","hoisting"] },
      { q: "What is hoisting in JavaScript?", hint: "declarations moved to top of scope", tags: ["javascript","hoisting"] },
      { q: "Explain == vs === in JavaScript.", hint: "type coercion vs strict equality", tags: ["javascript","equality"] },
      { q: "What is the difference between null and undefined?", hint: "intentional absence vs uninitialised", tags: ["javascript"] },
    ],
    mid: [
      { q: "Explain closures with an example.", hint: "lexical scope, inner function retains outer variables", tags: ["javascript","closures"] },
      { q: "What is the event loop in JavaScript?", hint: "call stack, task queue, microtasks", tags: ["javascript","eventloop","async"] },
      { q: "Explain promises and async/await.", hint: "then/catch, error handling, syntactic sugar", tags: ["javascript","promises","async"] },
      { q: "What is the difference between call, apply, and bind?", hint: "this binding, argument passing", tags: ["javascript","this"] },
    ],
    senior: [
      { q: "Explain prototypal inheritance in JavaScript.", hint: "prototype chain, Object.create", tags: ["javascript","prototype"] },
      { q: "How does garbage collection work in JavaScript engines?", hint: "mark-and-sweep, reference counting", tags: ["javascript","memory"] },
      { q: "How would you debounce and throttle in vanilla JavaScript?", hint: "setTimeout, delay control, use cases", tags: ["javascript","performance"] },
    ],
  },

  java: {
    beginner: [
      { q: "What is the difference between JDK, JRE, and JVM?", hint: "development kit, runtime, virtual machine", tags: ["java"] },
      { q: "What is the difference between an interface and an abstract class?", hint: "multiple inheritance, partial implementation", tags: ["java","oop"] },
      { q: "Explain the concept of constructors in Java.", hint: "initialisation, overloading, default constructor", tags: ["java"] },
      { q: "What are the main principles of OOP in Java?", hint: "encapsulation, inheritance, polymorphism, abstraction", tags: ["java","oop"] },
    ],
    mid: [
      { q: "Explain exception handling in Java.", hint: "try/catch/finally, checked vs unchecked", tags: ["java","exceptions"] },
      { q: "What is the difference between ArrayList and LinkedList?", hint: "array-backed vs node-based, access vs insertion cost", tags: ["java","collections"] },
      { q: "Explain multithreading and synchronisation in Java.", hint: "Thread/Runnable, synchronized, race conditions", tags: ["java","concurrency"] },
      { q: "What is the difference between == and .equals() in Java?", hint: "reference equality vs value equality", tags: ["java"] },
    ],
    senior: [
      { q: "Explain the Java Memory Model and garbage collection.", hint: "heap, stack, generational GC", tags: ["java","memory"] },
      { q: "How would you design a thread-safe singleton in Java?", hint: "double-checked locking, enum singleton", tags: ["java","design-pattern"] },
      { q: "How does the JVM optimise performance at runtime?", hint: "JIT compilation, escape analysis", tags: ["java","jvm"] },
    ],
  },

  dsa: {
    beginner: [
      { q: "What is the time complexity of binary search and why?", hint: "O(log n), divide and conquer", tags: ["dsa","complexity","search"] },
      { q: "Explain the difference between an array and a linked list.", hint: "contiguous memory vs pointers, access vs insertion", tags: ["dsa","array","linkedlist"] },
      { q: "What is a stack and where is it used?", hint: "LIFO, recursion, undo functionality", tags: ["dsa","stack"] },
      { q: "What is a queue and where is it used?", hint: "FIFO, scheduling, BFS", tags: ["dsa","queue"] },
    ],
    mid: [
      { q: "Explain how a hash map works internally.", hint: "hashing, buckets, collision resolution", tags: ["dsa","hashmap"] },
      { q: "What is the difference between BFS and DFS?", hint: "level order vs depth-first, queue vs stack/recursion", tags: ["dsa","graph","bfs","dfs"] },
      { q: "Explain the concept of dynamic programming with an example.", hint: "overlapping subproblems, memoisation, tabulation", tags: ["dsa","dp"] },
      { q: "How does quicksort work and what is its complexity?", hint: "pivot, partition, O(n log n) average", tags: ["dsa","sorting"] },
    ],
    senior: [
      { q: "How would you design an LRU cache?", hint: "hash map + doubly linked list, O(1) ops", tags: ["dsa","design","lru"] },
      { q: "Explain trade-offs between different balanced trees (AVL, Red-Black).", hint: "rotation cost, balance guarantee", tags: ["dsa","tree"] },
      { q: "How would you find the shortest path in a weighted graph?", hint: "Dijkstra, Bellman-Ford, complexity", tags: ["dsa","graph"] },
    ],
  },

  sql: {
    beginner: [
      { q: "What is the difference between WHERE and HAVING?", hint: "row filter before vs after aggregation", tags: ["sql"] },
      { q: "Explain the different types of SQL joins.", hint: "inner, left, right, full outer", tags: ["sql","join"] },
      { q: "What is a primary key vs a foreign key?", hint: "unique identifier, referential integrity", tags: ["sql","keys"] },
      { q: "What is normalisation? Name a couple of normal forms.", hint: "1NF, 2NF, 3NF, redundancy reduction", tags: ["sql","normalization"] },
    ],
    mid: [
      { q: "How do indexes improve query performance? What's the trade-off?", hint: "B-tree, faster reads, slower writes", tags: ["sql","indexing"] },
      { q: "What is the difference between a clustered and non-clustered index?", hint: "physical order vs pointer structure", tags: ["sql","indexing"] },
      { q: "Explain ACID properties in databases.", hint: "atomicity, consistency, isolation, durability", tags: ["sql","acid"] },
      { q: "What is a subquery and when would you use a CTE instead?", hint: "readability, recursion, reuse", tags: ["sql"] },
    ],
    senior: [
      { q: "How would you optimise a slow-running query on a large table?", hint: "EXPLAIN plan, indexing, query rewrite", tags: ["sql","optimization"] },
      { q: "Explain database sharding and partitioning.", hint: "horizontal split, routing, hotspot avoidance", tags: ["sql","scaling"] },
      { q: "How do you handle deadlocks in a relational database?", hint: "lock ordering, timeout, retry", tags: ["sql","deadlock"] },
    ],
  },

  dbms: {
    beginner: [
      { q: "What is a DBMS and how is it different from a file system?", hint: "structured access, concurrency, integrity", tags: ["dbms"] },
      { q: "What is a transaction in a database?", hint: "unit of work, ACID", tags: ["dbms","transaction"] },
      { q: "Explain the entity-relationship (ER) model.", hint: "entities, attributes, relationships", tags: ["dbms","er-model"] },
    ],
    mid: [
      { q: "Explain the different levels of transaction isolation.", hint: "read uncommitted to serializable, anomalies", tags: ["dbms","isolation"] },
      { q: "What is deadlock and how can it be prevented?", hint: "circular wait, prevention/avoidance/detection", tags: ["dbms","deadlock"] },
      { q: "Explain the difference between 2PL and timestamp-based concurrency control.", hint: "locking protocol vs ordering", tags: ["dbms","concurrency"] },
    ],
    senior: [
      { q: "How would you design a database schema for a multi-tenant SaaS product?", hint: "shared schema vs isolated schema, tenant id", tags: ["dbms","design"] },
      { q: "Explain write-ahead logging and crash recovery.", hint: "WAL, redo/undo, durability", tags: ["dbms","recovery"] },
    ],
  },

  os: {
    beginner: [
      { q: "What is the difference between a process and a thread?", hint: "own memory space vs shared memory", tags: ["os","process","thread"] },
      { q: "What is a deadlock? Name its four necessary conditions.", hint: "mutual exclusion, hold and wait, no preemption, circular wait", tags: ["os","deadlock"] },
      { q: "What is virtual memory and why is it used?", hint: "paging, isolation, more usable memory", tags: ["os","memory"] },
    ],
    mid: [
      { q: "Explain the difference between paging and segmentation.", hint: "fixed vs variable-size blocks", tags: ["os","memory"] },
      { q: "What is a semaphore and how does it differ from a mutex?", hint: "counting vs binary, signalling vs ownership", tags: ["os","synchronization"] },
      { q: "Explain different CPU scheduling algorithms.", hint: "FCFS, SJF, Round Robin, priority", tags: ["os","scheduling"] },
    ],
    senior: [
      { q: "How does a modern OS handle memory management under high load?", hint: "swapping, thrashing prevention, OOM killer", tags: ["os","memory"] },
      { q: "Explain the producer-consumer problem and how to solve it.", hint: "bounded buffer, semaphores/condition variables", tags: ["os","concurrency"] },
    ],
  },

  cn: {
    beginner: [
      { q: "What is the difference between TCP and UDP?", hint: "connection-oriented vs connectionless, reliability", tags: ["cn","tcp","udp"] },
      { q: "Explain the OSI model layers briefly.", hint: "physical to application, 7 layers", tags: ["cn","osi"] },
      { q: "What happens when you type a URL into a browser?", hint: "DNS, TCP handshake, HTTP request, rendering", tags: ["cn","http","dns"] },
    ],
    mid: [
      { q: "Explain the TCP three-way handshake.", hint: "SYN, SYN-ACK, ACK", tags: ["cn","tcp"] },
      { q: "What is DNS and how does resolution work?", hint: "recursive resolver, root/TLD/authoritative servers", tags: ["cn","dns"] },
      { q: "What is the difference between HTTP and HTTPS?", hint: "TLS encryption, certificates", tags: ["cn","http","https"] },
    ],
    senior: [
      { q: "How would you design a CDN to reduce latency globally?", hint: "edge caching, anycast, geo-routing", tags: ["cn","cdn"] },
      { q: "Explain load balancing algorithms and when to use each.", hint: "round robin, least connections, consistent hashing", tags: ["cn","loadbalancing"] },
    ],
  },

  oop: {
    beginner: [
      { q: "What are the four pillars of OOP?", hint: "encapsulation, abstraction, inheritance, polymorphism", tags: ["oop"] },
      { q: "What is the difference between method overloading and overriding?", hint: "compile-time vs runtime polymorphism", tags: ["oop"] },
      { q: "What is encapsulation and why is it important?", hint: "data hiding, controlled access", tags: ["oop"] },
    ],
    mid: [
      { q: "Explain the SOLID principles.", hint: "single responsibility, open/closed, Liskov, interface segregation, dependency inversion", tags: ["oop","solid"] },
      { q: "What is composition over inheritance?", hint: "flexibility, avoiding fragile base class", tags: ["oop"] },
      { q: "Explain the difference between abstraction and encapsulation.", hint: "hiding complexity vs hiding data", tags: ["oop"] },
    ],
    senior: [
      { q: "Describe a design pattern you've used to solve a real problem.", hint: "factory, strategy, observer, decorator", tags: ["oop","design-pattern"] },
      { q: "How do you balance SOLID principles against shipping speed?", hint: "pragmatism, incremental refactor", tags: ["oop","tradeoffs"] },
    ],
  },

  'system-design': {
    beginner: [
      { q: "What is the difference between vertical and horizontal scaling?", hint: "bigger machine vs more machines", tags: ["system-design","scaling"] },
      { q: "What is a load balancer and why is it needed?", hint: "traffic distribution, availability", tags: ["system-design","loadbalancer"] },
      { q: "What is caching and where would you apply it?", hint: "reduce latency, CDN, Redis, browser cache", tags: ["system-design","caching"] },
    ],
    mid: [
      { q: "Design a URL shortener like bit.ly.", hint: "hashing, redirect, storage, analytics", tags: ["system-design","url-shortener"] },
      { q: "Design a rate limiter for an API.", hint: "token bucket, sliding window, Redis", tags: ["system-design","rate-limit"] },
      { q: "How would you design a notification system (email/SMS/push)?", hint: "queues, workers, retries, templating", tags: ["system-design","notifications"] },
    ],
    senior: [
      { q: "Design a scalable chat application like WhatsApp.", hint: "WebSockets, message queues, delivery guarantees", tags: ["system-design","chat"] },
      { q: "Design a distributed file storage system like Google Drive.", hint: "chunking, metadata service, replication", tags: ["system-design","storage"] },
      { q: "How would you design a system to handle 1 million concurrent users?", hint: "horizontal scaling, caching layers, async processing", tags: ["system-design","scale"] },
    ],
  },
};

// Merge original + extended categories into one lookup table used app-wide.
const QUESTION_BANK_ALL = { ...QUESTION_BANK, ...QUESTION_BANK_EXT };

window.QUESTION_BANK = QUESTION_BANK;
window.QUESTION_BANK_EXT = QUESTION_BANK_EXT;
window.QUESTION_BANK_ALL = QUESTION_BANK_ALL;

const CATEGORY_LABELS = {
  general:'General/Behavioural', hr:'HR Round', frontend:'Frontend Dev', backend:'Backend Dev',
  fullstack:'Full Stack Dev', mern:'MERN Stack', data:'Data Science/ML', devops:'DevOps/Cloud',
  product:'Product Manager', design:'UI/UX Designer', react:'React.js', javascript:'JavaScript',
  java:'Java', dsa:'DSA', sql:'SQL', dbms:'DBMS', os:'Operating System', cn:'Computer Networks',
  oop:'OOP', 'system-design':'System Design',
};
window.CATEGORY_LABELS = CATEGORY_LABELS;
