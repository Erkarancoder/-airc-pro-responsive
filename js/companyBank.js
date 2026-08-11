/* ─────────────────────────────────────────────
   js/companyBank.js — A.I.R.C. Pro
   Company-flavoured interview question sets.
   These are representative practice questions in the
   style commonly associated with each company's process
   (DSA-heavy, system design, HR/behavioural, etc.) —
   not verbatim leaked questions.
───────────────────────────────────────────── */
'use strict';

function mkSet(list) { return list.map(q => ({ ...q })); }

const COMPANY_BANK = {
  google: {
    label: 'Google',
    focus: 'DSA depth, clean code, Googleyness (collaboration & ambiguity)',
    beginner: mkSet([
      { q: "What is Big-O notation and why does it matter when writing code?", hint: "time/space complexity, scalability", tags: ["dsa"] },
      { q: "How would you reverse a string without using built-in reverse functions?", hint: "two-pointer swap, in-place", tags: ["dsa"] },
      { q: "Tell me about a project you're proud of and the trade-offs you made.", hint: "impact, ownership, decision rationale", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "Given an array, find two numbers that add up to a target (Two Sum).", hint: "hash map, O(n) time", tags: ["dsa","hashmap"] },
      { q: "How would you design an autocomplete feature for search?", hint: "trie, ranking, latency budget", tags: ["system-design"] },
      { q: "Describe a time you had to make a decision with ambiguous requirements.", hint: "clarifying questions, iteration", tags: ["conflict"] },
    ]),
    senior: mkSet([
      { q: "Design a scalable web crawler.", hint: "URL frontier, politeness, dedup, distributed workers", tags: ["system-design"] },
      { q: "How would you improve search relevance ranking for a product?", hint: "signals, A/B testing, feedback loops", tags: ["system-design"] },
      { q: "Tell me about a time you influenced a technical decision across teams.", hint: "data-driven persuasion, stakeholder alignment", tags: ["leadership"] },
    ]),
  },
  microsoft: {
    label: 'Microsoft',
    focus: 'Problem solving, system design, growth mindset',
    beginner: mkSet([
      { q: "What is the difference between an abstract class and an interface?", hint: "partial implementation vs contract", tags: ["oop"] },
      { q: "How would you detect a cycle in a linked list?", hint: "Floyd's cycle detection, two pointers", tags: ["dsa"] },
      { q: "Describe a time you learned a new technology quickly.", hint: "growth mindset, self-learning", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "Design a scalable notification system for a productivity app.", hint: "queues, retries, delivery guarantees", tags: ["system-design"] },
      { q: "Explain how you would design a class hierarchy for a parking lot system.", hint: "OOP design, extensibility", tags: ["oop","system-design"] },
      { q: "Tell me about a time you disagreed with a design decision.", hint: "respectful pushback, evidence, resolution", tags: ["conflict"] },
    ]),
    senior: mkSet([
      { q: "Design Microsoft Teams' real-time messaging backend.", hint: "WebSockets, message ordering, presence", tags: ["system-design"] },
      { q: "How do you mentor engineers with very different skill levels on the same team?", hint: "tailored feedback, pairing", tags: ["leadership"] },
    ]),
  },
  amazon: {
    label: 'Amazon',
    focus: 'Leadership Principles, DSA, ownership & customer obsession',
    beginner: mkSet([
      { q: "Tell me about a time you went above and beyond for a customer.", hint: "customer obsession (LP), specific example", tags: ["intro"] },
      { q: "How would you find the missing number in an array of 1 to n?", hint: "sum formula or XOR trick", tags: ["dsa"] },
      { q: "Describe a time you had to make a decision quickly with limited data.", hint: "bias for action (LP)", tags: ["decision"] },
    ]),
    mid: mkSet([
      { q: "Design an inventory management system for an e-commerce warehouse.", hint: "consistency, concurrency, reservations", tags: ["system-design"] },
      { q: "Tell me about a time you took ownership of a problem outside your role.", hint: "ownership (LP)", tags: ["leadership"] },
      { q: "How would you design a rate limiter for Amazon's API gateway?", hint: "token bucket, sliding window", tags: ["system-design","rate-limit"] },
    ]),
    senior: mkSet([
      { q: "Design Amazon's product recommendation system.", hint: "collaborative filtering, real-time signals, caching", tags: ["system-design"] },
      { q: "Tell me about a time you dived deep into a problem others had given up on.", hint: "dive deep (LP)", tags: ["leadership"] },
    ]),
  },
  adobe: {
    label: 'Adobe',
    focus: 'DSA, product thinking, creativity & craftsmanship',
    beginner: mkSet([
      { q: "How would you check if two strings are anagrams?", hint: "sorting or frequency map", tags: ["dsa"] },
      { q: "What excites you about building creative software tools?", hint: "product passion, user empathy", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "How would you design an undo/redo feature for a design tool like Photoshop?", hint: "command pattern, stack of states", tags: ["system-design","oop"] },
      { q: "Explain how you'd optimise rendering performance for a canvas-based editor.", hint: "layers, dirty-rect rendering, GPU", tags: ["performance"] },
    ]),
    senior: mkSet([
      { q: "Design a real-time collaborative editing feature (like Figma/Adobe XD).", hint: "operational transform / CRDT, sync", tags: ["system-design"] },
      { q: "How do you balance creative product vision with engineering constraints?", hint: "trade-offs, cross-functional collaboration", tags: ["leadership"] },
    ]),
  },
  flipkart: {
    label: 'Flipkart',
    focus: 'DSA, system design at e-commerce scale, ownership',
    beginner: mkSet([
      { q: "What is the difference between an array list and a linked list, and when would you use each?", hint: "access vs insertion trade-off", tags: ["dsa"] },
      { q: "Why do you want to work in e-commerce technology?", hint: "domain interest, scale, impact", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "Design a flash-sale system that can handle sudden traffic spikes.", hint: "queueing, rate limiting, inventory locking", tags: ["system-design"] },
      { q: "How would you design a product search and filter system?", hint: "indexing, faceted search, caching", tags: ["system-design"] },
    ]),
    senior: mkSet([
      { q: "Design Flipkart's order management and tracking system.", hint: "state machine, event-driven architecture", tags: ["system-design"] },
      { q: "How do you handle scaling a service during a major sale event (like Big Billion Days)?", hint: "capacity planning, load testing, graceful degradation", tags: ["system-design","scale"] },
    ]),
  },
  tcs: {
    label: 'TCS',
    focus: 'Fundamentals, communication, aptitude & HR fit',
    beginner: mkSet([
      { q: "Explain OOP concepts with real-life examples.", hint: "encapsulation, inheritance, polymorphism, abstraction", tags: ["oop"] },
      { q: "What is a database and why is normalisation important?", hint: "redundancy reduction, integrity", tags: ["dbms","sql"] },
      { q: "Tell me about yourself and your career goals.", hint: "background, aspirations, fit", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "Explain the SDLC (Software Development Life Cycle).", hint: "requirements, design, development, testing, deployment", tags: ["general"] },
      { q: "What is exception handling and why is it important?", hint: "robustness, graceful failure", tags: ["java","javascript"] },
    ]),
    senior: mkSet([
      { q: "How do you ensure code quality across a large distributed team?", hint: "code review, CI/CD, standards", tags: ["leadership"] },
      { q: "Describe your approach to client communication on a project.", hint: "expectation management, transparency", tags: ["communication"] },
    ]),
  },
  infosys: {
    label: 'Infosys',
    focus: 'Fundamentals, logical reasoning, communication',
    beginner: mkSet([
      { q: "What is the difference between a compiler and an interpreter?", hint: "translation strategy, execution", tags: ["general"] },
      { q: "Explain the concept of inheritance with an example.", hint: "code reuse, is-a relationship", tags: ["oop"] },
      { q: "Why do you want to join Infosys?", hint: "company research, culture fit", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "What is the difference between process and thread?", hint: "isolated vs shared memory", tags: ["os"] },
      { q: "Explain normalisation in databases with an example.", hint: "1NF/2NF/3NF", tags: ["sql","dbms"] },
    ]),
    senior: mkSet([
      { q: "How would you approach a legacy system modernisation project?", hint: "incremental migration, risk management", tags: ["leadership"] },
    ]),
  },
  accenture: {
    label: 'Accenture',
    focus: 'Communication, adaptability, client-facing scenarios',
    beginner: mkSet([
      { q: "How do you handle working with a difficult client?", hint: "empathy, active listening, resolution", tags: ["communication"] },
      { q: "What is Agile methodology?", hint: "sprints, iterative delivery, standups", tags: ["general"] },
    ]),
    mid: mkSet([
      { q: "Describe a time you adapted quickly to a changing project requirement.", hint: "flexibility, communication", tags: ["conflict"] },
      { q: "What is the difference between Agile and Waterfall?", hint: "iterative vs sequential", tags: ["general"] },
    ]),
    senior: mkSet([
      { q: "How do you manage stakeholder expectations across multiple time zones?", hint: "communication cadence, documentation", tags: ["leadership"] },
    ]),
  },
  cognizant: {
    label: 'Cognizant',
    focus: 'Technical fundamentals, teamwork, client delivery',
    beginner: mkSet([
      { q: "What is polymorphism? Give a real-world example.", hint: "many forms, method overriding", tags: ["oop"] },
      { q: "What is version control and why is Git useful?", hint: "collaboration, history, branching", tags: ["general"] },
    ]),
    mid: mkSet([
      { q: "How do you ensure smooth handoffs in a distributed delivery team?", hint: "documentation, communication, overlap hours", tags: ["communication"] },
      { q: "Explain RESTful API design principles.", hint: "resources, statelessness, HTTP verbs", tags: ["backend"] },
    ]),
    senior: mkSet([
      { q: "How do you manage technical debt on a long-running client project?", hint: "prioritisation, incremental refactor", tags: ["leadership"] },
    ]),
  },
  capgemini: {
    label: 'Capgemini',
    focus: 'Fundamentals, aptitude, communication',
    beginner: mkSet([
      { q: "What is the difference between GET and POST HTTP methods?", hint: "idempotency, body payload", tags: ["cn","backend"] },
      { q: "Explain the concept of encapsulation with an example.", hint: "data hiding, access modifiers", tags: ["oop"] },
    ]),
    mid: mkSet([
      { q: "What is the difference between synchronous and asynchronous programming?", hint: "blocking vs non-blocking", tags: ["javascript"] },
      { q: "Explain indexing in databases and when it can hurt performance.", hint: "faster reads, slower writes", tags: ["sql"] },
    ]),
    senior: mkSet([
      { q: "How do you drive process improvement across delivery teams?", hint: "metrics, retrospectives, buy-in", tags: ["leadership"] },
    ]),
  },
  wipro: {
    label: 'Wipro',
    focus: 'Fundamentals, aptitude, HR fit',
    beginner: mkSet([
      { q: "What is the difference between == and === in JavaScript?", hint: "type coercion", tags: ["javascript"] },
      { q: "What are the SOLID principles (briefly)?", hint: "five OOP design principles", tags: ["oop"] },
    ]),
    mid: mkSet([
      { q: "Explain the difference between monolithic and microservices architecture.", hint: "single deployable vs distributed services", tags: ["system-design"] },
      { q: "How do you approach debugging a production issue under time pressure?", hint: "logs, reproduction, rollback", tags: ["general"] },
    ]),
    senior: mkSet([
      { q: "How would you plan a phased migration from monolith to microservices?", hint: "strangler fig pattern", tags: ["system-design"] },
    ]),
  },
  deloitte: {
    label: 'Deloitte',
    focus: 'Business acumen, technical fundamentals, consulting mindset',
    beginner: mkSet([
      { q: "How would you explain a technical concept to a non-technical client?", hint: "simplification, analogies", tags: ["communication"] },
      { q: "What do you know about our consulting practice areas?", hint: "company research", tags: ["intro"] },
    ]),
    mid: mkSet([
      { q: "Describe a time you balanced technical accuracy with business urgency.", hint: "trade-offs, stakeholder communication", tags: ["conflict"] },
      { q: "What is data normalisation and why does it matter for reporting systems?", hint: "consistency, redundancy reduction", tags: ["sql"] },
    ]),
    senior: mkSet([
      { q: "How do you structure a technical recommendation for C-level stakeholders?", hint: "executive summary, risk framing, ROI", tags: ["leadership"] },
    ]),
  },
};

window.COMPANY_BANK = COMPANY_BANK;
