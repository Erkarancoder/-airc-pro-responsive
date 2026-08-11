/* ─────────────────────────────────────────────
   js/practiceContent.js — Practice module (isolated)

   Static content banks for Communication Skills, Group
   Discussion and Interview Practice. Kept separate from
   logic so content can be extended without touching any
   controller code.
───────────────────────────────────────────── */
'use strict';

(function () {
  const COMMUNICATION_SENTENCES = {
    beginner: [
      "Good communication helps us express our ideas clearly.",
      "I am learning to speak English every day.",
      "This is a simple sentence for practice.",
      "She enjoys reading books in her free time.",
      "We will meet at the library tomorrow.",
      "He always arrives early for his classes.",
      "Practice makes a person more confident.",
    ],
    intermediate: [
      "Clear communication is important in every workplace.",
      "Effective teamwork depends on listening carefully to others.",
      "A confident speaker maintains steady eye contact with the audience.",
      "Time management helps students balance study and personal life.",
      "Constructive feedback should be delivered with kindness and clarity.",
      "Professionals often improve their skills through regular practice.",
      "Good planning reduces stress during a busy work week.",
    ],
    advanced: [
      "Articulating complex ideas clearly is a valuable professional skill.",
      "A well-structured argument strengthens your position during an interview.",
      "Adaptability and clear communication are essential in a fast-changing workplace.",
      "Successful negotiations depend on active listening and thoughtful responses.",
      "Demonstrating leadership often begins with communicating a clear vision.",
      "Employers value candidates who can explain technical concepts simply.",
      "Building rapport quickly is a critical skill in client-facing roles.",
    ],
  };

  /* Long technology/professional passages for Communication Skills.
     Each passage is 3-5 complete sentences a real tutor could read aloud;
     one sentence is later picked from the SAME passage for the student
     to repeat, so practice content always stays contextual. */
  const COMMUNICATION_PASSAGES = [
    "Cloud computing has changed the way modern applications are developed. Developers can deploy applications faster, manage resources efficiently, and scale their systems according to demand. Instead of buying physical servers, companies now rent computing power from providers like AWS or Azure. This shift has made it much easier for small teams to build large, reliable products.",
    "Artificial intelligence is becoming a normal part of everyday software. Many applications now use machine learning to recommend products, detect fraud, or understand natural language. Engineers train these models using large amounts of data collected from real user behavior. As the technology improves, AI systems are able to make faster and more accurate decisions.",
    "Good communication is one of the most valuable skills in any workplace. Employees who explain their ideas clearly are more likely to be trusted with important responsibilities. Speaking with confidence does not mean speaking quickly; it means choosing the right words and pausing when necessary. Over time, regular practice can help anyone become a more effective communicator.",
    "Version control systems like Git allow teams to work on the same codebase without overwriting each other's changes. Every developer can create a separate branch to build a new feature safely. Once the feature is tested, it can be merged back into the main project. This process reduces conflicts and keeps large software projects organized.",
    "Cybersecurity has become a major concern for organizations of every size. Hackers constantly look for weaknesses in software, networks, and human behavior. Companies now train employees to recognize phishing emails and suspicious links. Strong passwords and regular software updates remain some of the simplest ways to prevent an attack.",
    "Remote work has changed how teams communicate and collaborate. Video calls, shared documents, and project management tools help distributed teams stay aligned. Clear written communication becomes even more important when colleagues are not sitting in the same room. Many companies now consider strong communication skills as important as technical ability.",
    "Mobile applications are designed to work smoothly across many different devices and screen sizes. Developers must consider slow internet connections, limited battery life, and touch-based interaction. A well-designed app loads quickly and feels intuitive from the very first use. User feedback plays an important role in improving an application after it is released.",
    "Data plays a central role in how modern businesses make decisions. Companies collect information from websites, applications, and customer interactions to understand patterns. Analysts use this data to identify trends and predict future outcomes. When used responsibly, data can help organizations serve their customers more effectively.",
  ];

  /** Split a passage into clean, complete sentences. */
  function splitIntoSentences(passage) {
    return (passage.match(/[^.!?]+[.!?]+/g) || [passage])
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const GD_TOPICS = [
    "Should Artificial Intelligence replace some traditional jobs?",
    "Is Artificial Intelligence more beneficial than harmful for students?",
    "Should coding be compulsory for every engineering student?",
    "Is remote work more productive than working from an office?",
    "Should social media platforms be regulated more strictly?",
    "Is online education as effective as traditional classroom learning?",
    "Should companies prioritize experience over academic qualifications?",
    "Is automation a threat or an opportunity for the job market?",
    "Should students be allowed to use AI tools for assignments?",
    "Is work-life balance more important than career growth?",
  ];

  const GD_STAGES = [
    { key: 'opening',     prompt: 'What is your opening opinion on this topic?' },
    { key: 'reason',      prompt: 'Good. Now give one supporting reason for your opinion.' },
    { key: 'example',     prompt: 'Can you give a real-world example that supports your point?' },
    { key: 'counterpoint',prompt: 'Now give one counterpoint — a view that disagrees with yours.' },
    { key: 'conclusion',  prompt: 'Now conclude your argument in one or two sentences.' },
  ];

  const INTERVIEW_QUESTIONS = {
    HR: [
      "Please introduce yourself.",
      "What are your strengths and weaknesses?",
      "Where do you see yourself in five years?",
      "Why should we hire you?",
      "Tell me about a time you handled pressure at work.",
    ],
    Technical: [
      "What is the difference between a process and a thread?",
      "Explain how a hash table works.",
      "What is the time complexity of binary search?",
      "What is the difference between REST and GraphQL?",
      "How does garbage collection work in general-purpose languages?",
    ],
    ProjectBased: [
      "Tell me about a project you are proud of.",
      "What was the biggest challenge in your last project and how did you solve it?",
      "How did you handle disagreements within your project team?",
      "What would you improve if you rebuilt your last project today?",
    ],
    Behavioral: [
      "Describe a situation where you had to learn something quickly.",
      "Tell me about a time you made a mistake and how you handled it.",
      "Describe a time you had to convince a teammate to see things your way.",
    ],
    Java: [
      "What is the difference between an abstract class and an interface in Java?",
      "Explain the concept of exception handling in Java.",
      "What is the difference between == and .equals() in Java?",
    ],
    JavaScript: [
      "What is the difference between let, const and var?",
      "Explain closures in JavaScript with an example.",
      "What is the event loop in JavaScript?",
    ],
    React: [
      "What is the difference between state and props in React?",
      "Explain the purpose of the useEffect hook.",
      "What is the virtual DOM and why does React use it?",
    ],
    NodeJS: [
      "What makes Node.js good for building scalable network applications?",
      "Explain the difference between synchronous and asynchronous code in Node.js.",
      "What is middleware in an Express application?",
    ],
    SQL: [
      "What is the difference between INNER JOIN and LEFT JOIN?",
      "What is a primary key and how is it different from a foreign key?",
      "Explain the purpose of the GROUP BY clause.",
    ],
    DBMS: [
      "What is normalization and why is it important?",
      "Explain the ACID properties of a transaction.",
      "What is the difference between a clustered and non-clustered index?",
    ],
  };

  const INTERVIEW_CATEGORY_LABELS = {
    HR: 'HR', Technical: 'Technical', ProjectBased: 'Project Based', Behavioral: 'Behavioral',
    Java: 'Java', JavaScript: 'JavaScript', React: 'React', NodeJS: 'Node.js', SQL: 'SQL', DBMS: 'DBMS',
  };

  window.AIRC_PRACTICE_CONTENT = {
    COMMUNICATION_SENTENCES,
    COMMUNICATION_PASSAGES,
    splitIntoSentences,
    GD_TOPICS,
    GD_STAGES,
    INTERVIEW_QUESTIONS,
    INTERVIEW_CATEGORY_LABELS,
  };
})();
