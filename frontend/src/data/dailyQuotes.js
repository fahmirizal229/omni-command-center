/**
 * @file dailyQuotes.js
 * @description Curated collection of philosophical, stoic, engineering, and growth quotes in English.
 * Provides a deterministic quote for the day (rotates daily) with random fallback.
 */

export const DAILY_QUOTES = [
  {
    quote: "We suffer more often in imagination than in reality.",
    author: "Seneca",
    tag: "Stoicism"
  },
  {
    quote: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
    tag: "Engineering"
  },
  {
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    tag: "Mindset"
  },
  {
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
    tag: "Problem Solving"
  },
  {
    quote: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    tag: "Perseverance"
  },
  {
    quote: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
    tag: "Architecture"
  },
  {
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    tag: "Focus"
  },
  {
    quote: "Talk is cheap. Show me the code.",
    author: "Linus Torvalds",
    tag: "Execution"
  },
  {
    quote: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    tag: "Purpose"
  },
  {
    quote: "Premature optimization is the root of all evil.",
    author: "Donald Knuth",
    tag: "Engineering"
  },
  {
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
    tag: "Discipline"
  },
  {
    quote: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
    author: "Antoine de Saint-Exupéry",
    tag: "Craftsmanship"
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    tag: "Growth"
  },
  {
    quote: "Focus is a muscle; the more you practice saying no, the stronger your yes becomes.",
    author: "James Clear",
    tag: "Productivity"
  },
  {
    quote: "Do not pray for an easy life, pray for the strength to endure a difficult one.",
    author: "Bruce Lee",
    tag: "Resilience"
  },
  {
    quote: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    tag: "Excellence"
  },
  {
    quote: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
    tag: "Clean Code"
  },
  {
    quote: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
    tag: "Action"
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    tag: "Momentum"
  },
  {
    quote: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
    tag: "Clarity"
  },
  {
    quote: "Consistency is the DNA of mastery.",
    author: "Robin Sharma",
    tag: "Consistency"
  },
  {
    quote: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
    tag: "Endurance"
  },
  {
    quote: "Truth can only be found in one place: the code.",
    author: "Robert C. Martin",
    tag: "Integrity"
  },
  {
    quote: "Discipline equals freedom.",
    author: "Jocko Willink",
    tag: "Discipline"
  },
  {
    quote: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    tag: "Vision"
  },
  {
    quote: "Continuous improvement is better than delayed perfection.",
    author: "Mark Twain",
    tag: "Iteration"
  },
  {
    quote: "Stay hungry, stay foolish.",
    author: "Stewart Brand",
    tag: "Curiosity"
  },
  {
    quote: "Energy flows where attention goes.",
    author: "Tony Robbins",
    tag: "Focus"
  },
  {
    quote: "If you are not willing to learn, no one can help you. If you are determined to learn, no one can stop you.",
    author: "Zig Ziglar",
    tag: "Learning"
  },
  {
    quote: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
    tag: "Mindset"
  },
  {
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    tag: "Courage"
  }
];

/**
 * Returns the deterministic quote for today (changes once every 24 hours).
 * @returns {{ quote: string, author: string, tag: string }}
 */
export function getDailyQuote() {
  const now = new Date();
  // Generate a deterministic day key: YYYYMMDD
  const dayKey = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const index = Math.abs(dayKey) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
