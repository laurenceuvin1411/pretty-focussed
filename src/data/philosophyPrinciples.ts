// ── Philosophy Principles ──────────────────────────────────────────────────
// Distilled from 14 books. Shown daily. Embedded as invisible architecture.

export interface Principle {
  id: string
  quote: string
  author: string
  book: string
  theme: 'leverage' | 'compounding' | 'identity' | 'focus' | 'courage' | 'wealth' | 'meaning' | 'resistance' | 'clarity' | 'relationships' | 'surrender'
  morning?: boolean // show in morning ritual
}

export const principles: Principle[] = [
  // ── Naval Ravikant ──
  { id: 'n1', quote: 'Specific knowledge is knowledge you cannot be trained for. If society can train you, it can train someone else and replace you.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'leverage', morning: true },
  { id: 'n2', quote: 'You want to be the best in the world at what you do. Keep redefining what you do until this is true.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'clarity' },
  { id: 'n3', quote: 'The most important skill for getting rich is becoming a perpetual learner.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'wealth' },
  { id: 'n4', quote: 'Arm yourself with specific knowledge, accountability, and leverage. Do this for as long as it takes.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'wealth', morning: true },
  { id: 'n5', quote: 'If you cannot decide, the answer is no. When faced with a difficult choice, your gut is telling you the right answer.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'clarity' },
  { id: 'n6', quote: 'Play long-term games with long-term people. All returns in life come from compound interest.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'compounding' },
  { id: 'n7', quote: 'Escape competition through authenticity. No one can compete with you on being you.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'identity' },
  { id: 'n8', quote: 'Code and media are the only leverage that works while you sleep.', author: 'Naval Ravikant', book: 'Almanack of Naval Ravikant', theme: 'leverage' },

  // ── Psychology of Money ──
  { id: 'pm1', quote: 'Doing well with money has little to do with how smart you are and a lot to do with how you behave.', author: 'Morgan Housel', book: 'The Psychology of Money', theme: 'wealth' },
  { id: 'pm2', quote: 'The most important financial skill is getting the goalpost to stop moving.', author: 'Morgan Housel', book: 'The Psychology of Money', theme: 'wealth' },
  { id: 'pm3', quote: '$81.5 billion of Warren Buffett\'s net worth came after his 65th birthday. Compounding is patience.', author: 'Morgan Housel', book: 'The Psychology of Money', theme: 'compounding', morning: true },
  { id: 'pm4', quote: 'A plan is only useful if it can survive reality. A good plan that bends is better than a rigid plan that breaks.', author: 'Morgan Housel', book: 'The Psychology of Money', theme: 'clarity' },
  { id: 'pm5', quote: 'Enough is not too little. The hardest financial skill is getting the goalpost to stop moving.', author: 'Morgan Housel', book: 'The Psychology of Money', theme: 'wealth' },
  { id: 'pm6', quote: 'Save for no reason. Save without a specific goal. Save just to save.', author: 'Morgan Housel', book: 'The Psychology of Money', theme: 'compounding' },

  // ── $100M Offers ──
  { id: 'o1', quote: 'Make an offer so good people feel stupid saying no.', author: 'Alex Hormozi', book: '$100M Offers', theme: 'leverage', morning: true },
  { id: 'o2', quote: 'The value equation: Dream Outcome × Perceived Likelihood ÷ Time Delay ÷ Effort = Value.', author: 'Alex Hormozi', book: '$100M Offers', theme: 'wealth' },
  { id: 'o3', quote: 'The market you choose matters more than the offer you make. Choose a starving crowd.', author: 'Alex Hormozi', book: '$100M Offers', theme: 'leverage' },
  { id: 'o4', quote: 'Rich people have big libraries. Poor people have big televisions. Invest in your brain first.', author: 'Alex Hormozi', book: '$100M Offers', theme: 'compounding' },

  // ── $100M Leads ──
  { id: 'l1', quote: 'The business that can spend the most to acquire a customer wins.', author: 'Alex Hormozi', book: '$100M Leads', theme: 'wealth' },
  { id: 'l2', quote: 'Content is a permanent sales asset. Every piece you publish works forever.', author: 'Alex Hormozi', book: '$100M Leads', theme: 'leverage' },
  { id: 'l3', quote: 'If you help enough people get what they want, you will get what you want.', author: 'Alex Hormozi', book: '$100M Leads', theme: 'relationships' },

  // ── Atomic Habits ──
  { id: 'ah1', quote: 'Every action you take is a vote for the type of person you wish to become.', author: 'James Clear', book: 'Atomic Habits', theme: 'identity', morning: true },
  { id: 'ah2', quote: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear', book: 'Atomic Habits', theme: 'clarity', morning: true },
  { id: 'ah3', quote: 'The most effective form of motivation is progress. Seeing yourself improve is addictive.', author: 'James Clear', book: 'Atomic Habits', theme: 'identity' },
  { id: 'ah4', quote: 'Be the architect of your environment, not a victim of it.', author: 'James Clear', book: 'Atomic Habits', theme: 'focus' },
  { id: 'ah5', quote: '1% better every day = 37x better in a year. 1% worse every day = nearly zero.', author: 'James Clear', book: 'Atomic Habits', theme: 'compounding', morning: true },
  { id: 'ah6', quote: 'Habits are the compound interest of self-improvement.', author: 'James Clear', book: 'Atomic Habits', theme: 'compounding' },

  // ── Deep Work ──
  { id: 'dw1', quote: 'The ability to perform deep work is becoming increasingly rare and increasingly valuable.', author: 'Cal Newport', book: 'Deep Work', theme: 'focus', morning: true },
  { id: 'dw2', quote: 'Clarity about what matters provides clarity about what does not.', author: 'Cal Newport', book: 'Deep Work', theme: 'clarity', morning: true },
  { id: 'dw3', quote: 'Decide what to be. And go be it. Ruthlessly eliminate everything else.', author: 'Cal Newport', book: 'Deep Work', theme: 'focus' },
  { id: 'dw4', quote: 'A deep life is a good life. Wasted attention is wasted life.', author: 'Cal Newport', book: 'Deep Work', theme: 'meaning' },
  { id: 'dw5', quote: 'Batch shallow work into dedicated blocks. Never let it crowd your depth.', author: 'Cal Newport', book: 'Deep Work', theme: 'focus' },

  // ── Principles (Ray Dalio) ──
  { id: 'rd1', quote: 'Pain + Reflection = Progress.', author: 'Ray Dalio', book: 'Principles', theme: 'courage', morning: true },
  { id: 'rd2', quote: 'The biggest mistake investors make is thinking the things that happened in the recent past will continue.', author: 'Ray Dalio', book: 'Principles', theme: 'clarity' },
  { id: 'rd3', quote: 'Recognize that mistakes are a natural part of the evolutionary process.', author: 'Ray Dalio', book: 'Principles', theme: 'courage' },
  { id: 'rd4', quote: 'Don\'t let ego or blind spots prevent you from learning.', author: 'Ray Dalio', book: 'Principles', theme: 'clarity' },
  { id: 'rd5', quote: 'Radical transparency and radical open-mindedness are the keys to success.', author: 'Ray Dalio', book: 'Principles', theme: 'relationships' },

  // ── Good to Great ──
  { id: 'gg1', quote: 'The Hedgehog Concept is not a goal, strategy, or intention. It is an understanding.', author: 'Jim Collins', book: 'Good to Great', theme: 'clarity', morning: true },
  { id: 'gg2', quote: 'First who, then what. Get the right people on the bus before you decide where to drive.', author: 'Jim Collins', book: 'Good to Great', theme: 'relationships' },
  { id: 'gg3', quote: 'Greatness is not a function of circumstance. It is largely a matter of conscious choice.', author: 'Jim Collins', book: 'Good to Great', theme: 'courage' },
  { id: 'gg4', quote: 'The flywheel turns, and then it turns again. Momentum builds.', author: 'Jim Collins', book: 'Good to Great', theme: 'compounding' },
  { id: 'gg5', quote: 'Stop doing lists are more important than to-do lists.', author: 'Jim Collins', book: 'Good to Great', theme: 'focus' },

  // ── The War of Art ──
  { id: 'wa1', quote: 'Resistance is the most toxic force on the planet. It stops us from living our best life.', author: 'Steven Pressfield', book: 'The War of Art', theme: 'resistance', morning: true },
  { id: 'wa2', quote: 'The most important thing about art is to work. Nothing else matters except sitting down every day and trying.', author: 'Steven Pressfield', book: 'The War of Art', theme: 'resistance' },
  { id: 'wa3', quote: 'Amateurs play when they feel like it. Professionals show up regardless of how they feel.', author: 'Steven Pressfield', book: 'The War of Art', theme: 'resistance', morning: true },
  { id: 'wa4', quote: 'The moment you cross the threshold of turning pro, everything changes.', author: 'Steven Pressfield', book: 'The War of Art', theme: 'identity' },
  { id: 'wa5', quote: 'Don\'t think about making art, just get it done. Let everyone else decide if it\'s good or bad.', author: 'Steven Pressfield', book: 'The War of Art', theme: 'resistance' },

  // ── Can't Hurt Me ──
  { id: 'ch1', quote: 'When you think you\'re done, you\'re only 40% done. The other 60% is mental.', author: 'David Goggins', book: 'Can\'t Hurt Me', theme: 'courage', morning: true },
  { id: 'ch2', quote: 'No one is going to come and save you. Be your own hero.', author: 'David Goggins', book: 'Can\'t Hurt Me', theme: 'courage' },
  { id: 'ch3', quote: 'Callusing the mind is a daily practice. You build mental toughness the same way you build muscle.', author: 'David Goggins', book: 'Can\'t Hurt Me', theme: 'courage' },
  { id: 'ch4', quote: 'The accountability mirror doesn\'t lie. Face yourself first.', author: 'David Goggins', book: 'Can\'t Hurt Me', theme: 'clarity', morning: true },
  { id: 'ch5', quote: 'Most people give up right before the breakthrough. Stay hard.', author: 'David Goggins', book: 'Can\'t Hurt Me', theme: 'courage' },

  // ── Man's Search for Meaning ──
  { id: 'mf1', quote: 'He who has a why to live can bear almost any how.', author: 'Viktor Frankl', book: 'Man\'s Search for Meaning', theme: 'meaning', morning: true },
  { id: 'mf2', quote: 'Between stimulus and response there is a space. In that space is our power to choose.', author: 'Viktor Frankl', book: 'Man\'s Search for Meaning', theme: 'clarity' },
  { id: 'mf3', quote: 'Happiness cannot be pursued; it must ensue from doing meaningful work.', author: 'Viktor Frankl', book: 'Man\'s Search for Meaning', theme: 'meaning' },
  { id: 'mf4', quote: 'Success, like happiness, cannot be pursued; it must ensue.', author: 'Viktor Frankl', book: 'Man\'s Search for Meaning', theme: 'meaning' },

  // ── The Untethered Soul ──
  { id: 'us1', quote: 'You are not your thoughts. You are the observer of your thoughts.', author: 'Michael Singer', book: 'The Untethered Soul', theme: 'surrender', morning: true },
  { id: 'us2', quote: 'The only way to inner freedom is through the one who witnesses the self.', author: 'Michael Singer', book: 'The Untethered Soul', theme: 'surrender' },
  { id: 'us3', quote: 'Relax and release. Do not let anything close your heart.', author: 'Michael Singer', book: 'The Untethered Soul', theme: 'surrender' },

  // ── The Surrender Experiment ──
  { id: 'se1', quote: 'Life is unfolding around you. Learn to flow with it, not against it.', author: 'Michael Singer', book: 'The Surrender Experiment', theme: 'surrender' },
  { id: 'se2', quote: 'When life itself becomes your spiritual practice, everything becomes a gift.', author: 'Michael Singer', book: 'The Surrender Experiment', theme: 'surrender' },
  { id: 'se3', quote: 'The more I surrendered, the more life gave me.', author: 'Michael Singer', book: 'The Surrender Experiment', theme: 'surrender', morning: true },

  // ── How to Win Friends ──
  { id: 'wf1', quote: 'Become genuinely interested in other people. Not in what they can do for you. in them.', author: 'Dale Carnegie', book: 'How to Win Friends & Influence People', theme: 'relationships', morning: true },
  { id: 'wf2', quote: 'Talk to someone about themselves and they\'ll listen for hours.', author: 'Dale Carnegie', book: 'How to Win Friends & Influence People', theme: 'relationships' },
  { id: 'wf3', quote: 'The deepest desire in human nature is the craving to be appreciated.', author: 'Dale Carnegie', book: 'How to Win Friends & Influence People', theme: 'relationships' },
  { id: 'wf4', quote: 'Any fool can criticize, complain, and condemn. and most do. It takes character to understand and forgive.', author: 'Dale Carnegie', book: 'How to Win Friends & Influence People', theme: 'relationships' },
]

// Get today's principle. cycles through all, changes daily
export function getTodaysPrinciple(): Principle {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return principles[dayOfYear % principles.length]
}

// Get morning principles (shown in morning ritual)
export function getMorningPrinciples(): Principle[] {
  return principles.filter(p => p.morning)
}

// Get principle by theme
export function getPrinciplesByTheme(theme: Principle['theme']): Principle[] {
  return principles.filter(p => p.theme === theme)
}
