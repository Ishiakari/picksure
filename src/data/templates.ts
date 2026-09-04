import { ImageSourcePropType } from 'react-native';
import { CategoryType } from '@/src/constants/categories';

export interface Template {
  id: string;
  title: string;
  category: CategoryType;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  time: string;
  usedCount: string;
  savedCount: string;
  ratio?: string;
  description: string;
  imageSource: ImageSourcePropType | { uri: string };
  tips: string[];
  creator_id?: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'cafe-01',
    title: 'Golden Latte Moment',
    category: 'Cafe & Lifestyle',
    difficulty: 'Beginner',
    time: '2 min',
    usedCount: '12.4k',
    savedCount: '3.2k',
    ratio: '3:4 RATIO',
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
    category: 'Cafe & Lifestyle',
    difficulty: 'Intermediate',
    time: '3 min',
    usedCount: '5.4k',
    savedCount: '1.8k',
    ratio: '4:5 RATIO',
    description: 'A relaxing outdoor study setup focusing on diagonal perspectives and deep bench alignment.',
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
    category: 'Cottagecore & Nature',
    difficulty: 'Beginner',
    time: '2 min',
    usedCount: '8.2k',
    savedCount: '2.5k',
    ratio: '4:5 RATIO',
    description: 'A whimsical, fairytale-inspired back-profile shot in a sunlit flower field, capturing natural movement and deep green forest contrast.',
    imageSource: require('../../assets/images/previews/meadow.jpg'), 
    tips: [
      "Place your subject along the right vertical grid line, keeping them framed within the lower-right intersections.",
      "Capture a dynamic back-profile perspective as the subject walks away from the camera into the field.",
      "Utilize a low-to-medium camera height to make the yellow wildflowers look dense and immersive.",
      "Let the dark tree line occupy the upper third row to add depth and high-contrast color separation."
    ]
  },
  {
    id: 'ootd-street-01',
    title: 'Urban Crosswalk Strut',
    category: 'OOTD & Streetwear',
    difficulty: 'Intermediate',
    time: '3 min',
    usedCount: '15.1k',
    savedCount: '4.7k',
    ratio: '1:1.618 RATIO',
    description: 'Dynamic low-angle street portrait capturing fluid motion, shoe details, and architectural leading lines.',
    imageSource: require('../../assets/images/previews/cafe-portrait.jpg'),
    tips: [
      "Hold the camera at knee level and tilt slightly upwards to lengthen proportions.",
      "Ask the subject to take slow, natural steps across the zebra lines for genuine movement.",
      "Align the vanishing point of the street straight down the center column of your grid."
    ]
  },
  {
    id: 'editorial-noir-01',
    title: 'Shadow & Silhouette Noir',
    category: 'Editorial & Noir',
    difficulty: 'Advanced',
    time: '5 min',
    usedCount: '9.8k',
    savedCount: '3.9k',
    ratio: '1:1 RATIO',
    description: 'High-contrast studio-style editorial framing using harsh shadows and precise geometry.',
    imageSource: require('../../assets/images/previews/study.jpg'),
    tips: [
      "Expose for the bright highlights to let ambient shadows drop into deep velvety black.",
      "Direct the model to create strong geometric angles with their elbows and jawline.",
      "Utilize window blinds or hard direct light to project sharp linear shadow patterns."
    ]
  },
  {
    id: 'minimal-silhouette-01',
    title: 'Golden Hour Archway',
    category: 'Minimalist & Silhouette',
    difficulty: 'Beginner',
    time: '2 min',
    usedCount: '11.3k',
    savedCount: '3.1k',
    ratio: '1:1.618 RATIO',
    description: 'Clean, serene composition using doorway archways and negative sky space to frame a clean silhouette.',
    imageSource: require('../../assets/images/previews/meadow.jpg'),
    tips: [
      "Frame the subject dead center within the architectural arch or doorway.",
      "Turn down exposure compensation slightly until the subject is rendered as a clean silhouette.",
      "Ensure the background horizon line rests along the lower horizontal grid line."
    ]
  },
  {
    id: 'mirror-check-01',
    title: 'Elevator Flash Mirror Check',
    category: 'Casual & Mirror Check',
    difficulty: 'Beginner',
    time: '1 min',
    usedCount: '21.0k',
    savedCount: '6.2k',
    ratio: '9:16 RATIO',
    description: 'Effortless everyday fit check highlighting textures and relaxed posture with direct mirror reflection.',
    imageSource: require('../../assets/images/previews/cafe-portrait.jpg'),
    tips: [
      "Hold phone at chest height, tilting slightly forward to avoid perspective distortion.",
      "Relax one shoulder and place weight on the back leg for a natural casual silhouette.",
      "Look into the phone screen or camera reflection rather than directly into the mirror glass."
    ]
  },
  {
    id: 'couples-friends-01',
    title: 'Sunset Coastline Laugh',
    category: 'Couples & Friends',
    difficulty: 'Intermediate',
    time: '4 min',
    usedCount: '14.6k',
    savedCount: '5.0k',
    ratio: '3:2 RATIO',
    description: 'Heartwarming candid duo composition capturing genuine laughter and side-by-side golden hour warmth.',
    imageSource: require('../../assets/images/previews/meadow.jpg'),
    tips: [
      "Keep both subjects framed within the center two-thirds, leaving breathing room around them.",
      "Encourage candid interaction or movement rather than stiff posing toward the camera.",
      "Position the setting sun behind the subjects to create an ethereal golden rim-light hair effect."
    ]
  }
];
