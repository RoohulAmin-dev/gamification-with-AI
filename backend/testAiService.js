const { parseAIResponse, createFallbackLesson } = require('./src/services/aiService');

const tests = [
  {
    name: 'valid quiz',
    text: JSON.stringify({
      title: 'SQL Basics',
      learning_type: 'quiz',
      subtype: '',
      difficulty: 'Beginner',
      reason: 'Test',
      estimated_time: '10 min',
      content: {
        overview: 'Intro.',
        key_points: ['A', 'B', 'C', 'D', 'E'],
        mini_challenge: {
          question: 'Q',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: 'E'
        },
        questions: [
          { question: 'q1', options: ['a', 'b'], answer: 'a' },
          { question: 'q2', options: ['a', 'b'], answer: 'a' },
          { question: 'q3', options: ['a', 'b'], answer: 'a' },
          { question: 'q4', options: ['a', 'b'], answer: 'a' },
          { question: 'q5', options: ['a', 'b'], answer: 'a' }
        ]
      }
    })
  },
  {
    name: 'unsupported type mapping',
    text: JSON.stringify({
      title: 'SQL Basics',
      learning_type: 'Revision/Test',
      subtype: '',
      difficulty: 'Beginner',
      reason: 'Test',
      estimated_time: '10 min',
      content: {
        overview: 'Intro.',
        key_points: ['A', 'B', 'C', 'D', 'E'],
        mini_challenge: {
          question: 'Q',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: 'E'
        },
        questions: [
          { question: 'q1', options: ['a', 'b'], answer: 'a' },
          { question: 'q2', options: ['a', 'b'], answer: 'a' },
          { question: 'q3', options: ['a', 'b'], answer: 'a' },
          { question: 'q4', options: ['a', 'b'], answer: 'a' },
          { question: 'q5', options: ['a', 'b'], answer: 'a' }
        ]
      }
    })
  },
  {
    name: 'markdown wrapped',
    text: '```json\n' + JSON.stringify({
      title: 'SQL Basics',
      learning_type: 'quiz',
      subtype: '',
      difficulty: 'Beginner',
      reason: 'Test',
      estimated_time: '10 min',
      content: {
        overview: 'Intro.',
        key_points: ['A', 'B', 'C', 'D', 'E'],
        mini_challenge: {
          question: 'Q',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: 'E'
        },
        questions: [
          { question: 'q1', options: ['a', 'b'], answer: 'a' },
          { question: 'q2', options: ['a', 'b'], answer: 'a' },
          { question: 'q3', options: ['a', 'b'], answer: 'a' },
          { question: 'q4', options: ['a', 'b'], answer: 'a' },
          { question: 'q5', options: ['a', 'b'], answer: 'a' }
        ]
      }
    }) + '\n```'
  },
  {
    name: 'missing mini challenge',
    text: JSON.stringify({
      title: 'SQL Basics',
      learning_type: 'quiz',
      subtype: '',
      difficulty: 'Beginner',
      reason: 'Test',
      estimated_time: '10 min',
      content: {
        overview: 'Intro.',
        key_points: ['A', 'B', 'C', 'D', 'E'],
        questions: [
          { question: 'q1', options: ['a', 'b'], answer: 'a' },
          { question: 'q2', options: ['a', 'b'], answer: 'a' },
          { question: 'q3', options: ['a', 'b'], answer: 'a' },
          { question: 'q4', options: ['a', 'b'], answer: 'a' },
          { question: 'q5', options: ['a', 'b'], answer: 'a' }
        ]
      }
    })
  }
];

tests.forEach((test) => {
  try {
    const parsed = parseAIResponse(test.text);
    console.log(test.name, 'OK', parsed.learning_type, parsed.content.mini_challenge.question, parsed.content.key_points.length, parsed.content.key_points.length);
  } catch (err) {
    console.error(test.name, 'ERR', err.message);
  }
});
console.log('FALLBACK', JSON.stringify(createFallbackLesson('SQL Basics', 'Beginner', 'diagram'), null, 2));
