export interface Template {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  imageSource: any;     // Handles the local require() paths for photos
  overlaySource: any;   // Handles the transparent wireframe PNGs
  tips: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'cafe-01',
    title: 'Golden Latte Moment',
    category: 'Cafe Vibes',
    difficulty: 'Beginner',
    // We point these to our local asset paths
    imageSource: require('../../assets/previews/cafe-portrait.jpg'), 
    overlaySource: require('../../assets/overlays/cafe-grid.png'),
    tips: [
      "Position your subject slightly off-center — let the negative space breathe on one side.",
      "Find a window or warm light source at 45° to sculpt natural shadows on the face.",
      "Ask them to look just past the lens for a candid, effortlessly present feel."
    ]
  },
  {
    id: 'ootd-01',
    title: 'Off-Duty Fit Check',
    category: 'OOTD',
    difficulty: 'Medium',
    imageSource: require('../../assets/previews/street-ootd.jpg'),
    overlaySource: require('../../assets/overlays/ootd-grid.png'),
    tips: [
      "Crouch down and hold the phone near knee level.",
      "Tilt the phone upward slightly to make your subject look taller.",
      "Align the subject's shoes near the bottom horizontal line."
    ]
  }
];