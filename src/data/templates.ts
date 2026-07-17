export interface Template {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  time: string;
  usedCount: string;
  savedCount: string;
  description: string;
  imageSource: any;     // Handles local require() asset loading paths for your reference photos
  tips: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'cafe-01',
    title: 'Golden Latte Moment',
    category: 'Cafe Vibes',
    difficulty: 'Beginner',
    time: '2 min',
    usedCount: '12.4k',
    savedCount: '3.2k',
    description: 'Capture that effortless, sun-dappled café energy. Perfect for lifestyle portraits with a warm, intimate feel.',
    imageSource: require('../../assets/images/previews/cafe-portrait.jpg'), 
    tips: [
      "Position your subject slightly off-center — let the negative space breathe on one side.",
      "Find a window or warm light source at 45° to sculpt natural shadows on the face.",
      "Ask them to look just past the lens for a candid, effortlessly present feel."
    ]
  },
  {
    id: 'garden-study-01',
    title: 'Secret Garden Study',
    category: 'Lifestyle',
    difficulty: 'Intermediate',
    time: '3 min',
    usedCount: '5.4k',
    savedCount: '1.8k',
    description: 'A relaxing outdoor study setup focusing on diagonal perspectives and deep bench alignment.',
    // Corrected path to point to assets/images/previews/study.jpg
    imageSource: require('../../assets/images/previews/study.jpg'), 
    tips: [
      "Align your subject completely along the right vertical third line.",
      "Use diagonal perspective: position the edge of a path, pond, or bench along the lower left corner to draw eyes to the subject.",
      "Position the focus indicator circle directly on the center of the subject's back for crisp focus."
    ]
  },
  {
    id: 'meadow-walk-01',
    title: 'Enchanted Meadow Walk',
    category: 'Cottagecore',
    difficulty: 'Beginner',
    time: '2 min',
    usedCount: '8.2k',
    savedCount: '2.5k',
    description: 'A whimsical, fairytale-inspired back-profile shot in a sunlit flower field, capturing natural movement and deep green forest contrast.',
    imageSource: require('../../assets/images/previews/meadow.jpg'), 
    tips: [
      "Place your subject along the right vertical grid line, keeping them framed within the lower-right intersections.",
      "Capture a dynamic back-profile perspective as the subject walks away from the camera into the field.",
      "Utilize a low-to-medium camera height to make the yellow wildflowers look dense and immersive.",
      "Let the dark tree line occupy the upper third row to add depth and high-contrast color separation."
    ]
  }
];