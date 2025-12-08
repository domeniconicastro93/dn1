# Strike Mobile App

React Native mobile application for Strike Gaming Cloud, built with Expo.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Structure

- `src/navigation/` - Navigation setup (Tab + Stack navigators)
- `src/screens/` - Screen components
- `src/components/` - Reusable components
- `src/lib/` - Utilities (i18n, API client)
- `messages/` - Translation files (same keys as web)

## Features

- Tab navigation (Feed, Live, Games, Community, Profile)
- Vertical feed with FlashList for 60 FPS performance
- Save Replay button with haptic feedback
- Cloud gaming player placeholder (WebView/browser fallback)
- i18n support (17 languages, same keys as web)
- Type-safe with shared types from web app

## Notes

- Uses placeholder icons (emojis) for Phase 3
- API client is mocked (will be replaced in Phase 4)
- Cloud gaming uses WebView placeholder (WebRTC in Phase 5)

