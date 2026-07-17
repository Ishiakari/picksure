# PickSure

> **Pick your vibe. Be sure of your shot.**

PickSure is a premium mobile photography assistant designed to eliminate posing and framing anxiety. By overlaying translucent grids, composition guides, and reference pose outlines directly onto the live camera viewfinder, PickSure ensures users get the exact shot they want.

---

## Features

- **Masonry Template Feed & Search**: Discover photography templates sorted by curated categories (Portrait, OOTD, Street, Minimal, etc.) with real-time search.
- **Director's Details Page**: Displays setup difficulty, statistics, direct photography tips, and an SVG-based preview wireframe.
- **Dual-Mode Camera Viewfinder**:
  - **Template Guided Mode**: Overlays the reference photo on the viewfinder with customizable opacity controls (**Faint** - 25%, **Medium** - 55%, **Solid** - 85%), blinking pose alignment status badges, and flash/grid widgets.
  - **Free Mode**: Launches a clean viewport without overlay lines, ideal for free-style capture.
- **Camera Self-Timer**: Supports **3-second** and **10-second** self-timers with a large, animated on-screen countdown overlay.
- **Session Gallery**: An interactive panel accessed via the camera preview thumbnail showing all photos taken in the current session. Supports full-screen high-quality previewing.
- **Notch & Status Bar Safety**: Uses platform-safe `SafeAreaProvider` offsets on both iOS and Android to prevent top-header overlap.
- **Cross-Platform Compatibility**: Fully compatible with native iOS/Android camera devices, with a simulated viewfinder fallback for Web browsers.

---

## File Structure

```text
picksure/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab-routing navigator structure
│   │   └── index.tsx        # Home Screen (Masonry feed, search, filters)
│   ├── _layout.tsx          # Root Stack Navigator & SafeArea wrapper
│   ├── detail.tsx           # Template Detail Screen (Tips, stats, SVG wireframe)
│   └── camera.tsx           # Viewfinder Screen (Timer, opacity, gallery overlay)
├── src/
│   └── data/
│       └── templates.ts     # Curated templates list, asset requires, metadata
├── assets/
│   └── images/              # Preview cards and fallbacks
├── constants/
│   └── theme.ts             # Primary theme configurations & color definitions
├── package.json             # Core React Native, Expo, and SVG dependencies
└── tsconfig.json            # Strict TypeScript configuration
```

---

## Setup Instructions

Follow these steps to set up and run the PickSure mobile app locally:

### 1. Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)

For mobile testing, download the **Expo Go** app from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS App Store](https://apps.apple.com/us/app/expo-go/id984023095).

### 2. Install Dependencies

Clone or copy the workspace files, open your terminal in the `picksure/picksure` directory, and run:

```bash
npm install
```

### 3. Run the Development Server

Launch the Expo bundler:

```bash
npm run start
```

or

```bash
npx expo start
```

### 4. Open the App on Your Platform

Once the server is running, choose your preferred environment:

- **Web Browser**: Press **`w`** in the terminal to launch the simulated web viewport in your default browser.
- **Physical Device**: Open the **Expo Go** app and scan the QR Code displayed in your terminal.
- **Android Emulator**: Press **`a`** (requires Android Studio Emulator running).
- **iOS Simulator**: Press **`i`** (macOS only, requires Xcode Simulator).

---

## Key Technologies

- **Framework**: [Expo](https://expo.dev) & [React Native](https://reactnative.dev)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based router)
- **Vector Graphics**: [React Native SVG](https://github.com/software-mansion/react-native-svg)
- **Layout & Safe Area**: [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- **Images**: [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- **Camera Integration**: [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) & [Expo Media Library](https://docs.expo.dev/versions/latest/sdk/media-library/)
