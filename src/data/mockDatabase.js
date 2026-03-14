// ============================================
// STORY DATABASE
// ============================================
export const STORY_DATABASE = {
  stories: [
    {
      id: 1,
      title: 'Midnight Encounter',
      description: 'A mysterious message appears at 2:13 AM. Who is sending it?',
      category: 'Mystery',
      tags: ['thriller', 'urban', 'suspense'],
      image: 'https://image.qwenlm.ai/public_source/b5a993e0-9295-487e-a8f3-21f4eba3a246/14c43e383-4b43-4292-9d05-2deec160dcea.png',
      characters: [
        { name: 'Alex', role: 'The mysterious texter' },
        { name: 'Emma', role: 'Your best friend' }
      ],
      rating: 4.8,
      plays: 15420,
      mature: true,
      createdAt: '2024-01-15',
      // Начальная структура сюжета - только введение
      plot: {
        opening: [
          "You receive a message from a number you don't recognize.",
          "Alex: You finally replied. I wasn't sure you would.",
          "Alex: So… do you remember me?"
        ]
      }
    }
  ],
  users: [
    {
      id: 1,
      name: 'Guest User',
      characters: []
    }
  ]
};
