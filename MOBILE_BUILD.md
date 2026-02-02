# StreakOS Mobile App Build Guide

This guide explains how to build StreakOS as a native iOS or Android app using Capacitor.

## Prerequisites

### For iOS
- macOS with Xcode installed (from App Store)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer account (for device testing/App Store)

### For Android
- Android Studio installed
- Android SDK and build tools
- Java JDK 11+

## Initial Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the web app**
   ```bash
   npm run build
   ```

3. **Initialize Capacitor** (only needed once)
   ```bash
   npx cap init StreakOS com.streakos.app --web-dir dist
   ```

## iOS Build

1. **Add iOS platform** (only needed once)
   ```bash
   npx cap add ios
   ```

2. **Build and sync**
   ```bash
   npm run build
   npx cap sync ios
   ```

3. **Open in Xcode**
   ```bash
   npx cap open ios
   ```

4. **In Xcode**
   - Select your development team in Signing & Capabilities
   - Select a simulator or connected device
   - Click the Play button to build and run

### Quick Command
```bash
npm run mobile:ios
```
This builds the web app, syncs with iOS, and opens Xcode.

## Android Build

1. **Add Android platform** (only needed once)
   ```bash
   npx cap add android
   ```

2. **Build and sync**
   ```bash
   npm run build
   npx cap sync android
   ```

3. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

4. **In Android Studio**
   - Wait for Gradle sync to complete
   - Select a device/emulator
   - Click Run

### Quick Command
```bash
npm run mobile:android
```

## Development Workflow

When making changes to the web app:

1. Make your code changes
2. Run `npm run build`
3. Run `npx cap sync`
4. Rebuild in Xcode/Android Studio

For faster development, you can use live reload:

```bash
# In one terminal
npm run dev

# Then configure Capacitor to use localhost
# Edit capacitor.config.ts and add to server:
# url: 'http://YOUR_IP:5173'
```

## App Icons

Replace the default icons in:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

Use a tool like [App Icon Generator](https://appicon.co/) to generate all sizes.

## Splash Screen

To customize the splash screen:
1. Add your splash images to the native projects
2. iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`
3. Android: `android/app/src/main/res/drawable/`

## Publishing

### iOS App Store
1. Create app in App Store Connect
2. In Xcode: Product > Archive
3. Distribute to App Store

### Google Play Store
1. In Android Studio: Build > Generate Signed Bundle/APK
2. Upload to Google Play Console

## Troubleshooting

### iOS: "Unable to boot simulator"
- Restart Xcode
- Or try: `xcrun simctl shutdown all && xcrun simctl erase all`

### Android: Gradle sync failed
- Update Android Studio
- File > Invalidate Caches and Restart

### Capacitor sync issues
```bash
npx cap sync --deployment
rm -rf ios/App/Pods
cd ios/App && pod install
```

## Native Features Available

With Capacitor, you can access native features:

- **Haptics**: Vibration feedback on actions
- **Status Bar**: Customize appearance
- **Keyboard**: Handle keyboard events
- **Local Storage**: Persistent data (already works via web)
- **Push Notifications**: Add `@capacitor/push-notifications`
- **Camera**: Add `@capacitor/camera` for proof photos
- **Share**: Add `@capacitor/share` for sharing cards
