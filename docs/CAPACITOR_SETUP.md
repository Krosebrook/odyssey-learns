# Capacitor Android Setup Guide

## Overview

Inner Odyssey is built as a Progressive Web App (PWA) with Capacitor support for native Android deployment. The web version remains the primary runtime.

## Prerequisites

- Node.js 18+ and npm
- Android Studio (for building APK/AAB files)
- Java Development Kit (JDK) 17+
- Android SDK (API level 22+)

## Configuration

Capacitor is configured in `capacitor.config.ts`:

```typescript
{
  appId: 'com.odysseylearns.app',
  appName: 'Inner Odyssey',
  webDir: 'dist'
}
```

## Build & Run Steps

### 1. Build the Web Application

```bash
# Build the production web bundle
npm run build
```

This creates optimized assets in the `dist/` directory.

### 2. Sync Capacitor

```bash
# Copy web assets to Android project
npx cap sync android
```

This command:
- Copies `dist/` assets to `android/app/src/main/assets/public`
- Updates native dependencies
- Synchronizes Capacitor configuration

### 3. Open in Android Studio

```bash
# Open the Android project
npx cap open android
```

Or manually open `android/` folder in Android Studio.

### 4. Build APK

**Option A: Using Android Studio**
1. Open project in Android Studio
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. Find APK in `android/app/build/outputs/apk/`

**Option B: Using Command Line**
```bash
cd android
./gradlew assembleDebug    # Debug build
./gradlew assembleRelease  # Release build (requires signing)
```

### 5. Run on Device/Emulator

```bash
# Run on connected device or emulator
npx cap run android
```

## Development Workflow

1. **Web Development** (Primary)
   ```bash
   npm run dev  # Vite dev server at localhost:8080
   ```

2. **Test on Android** (When needed)
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

3. **Live Reload** (Optional)
   - Use Android emulator with browser
   - Or use `npx cap run android --livereload` (experimental)

## Platform-Specific Considerations

### Performance
- Web build already optimized for mobile
- No platform-specific code required
- Uses responsive design (mobile-first)

### Permissions
Edit `android/app/src/main/AndroidManifest.xml` for permissions:
- Internet access (already included)
- Camera (for avatar customization, if needed)
- Storage (for offline caching)

### Splash Screen
Configure in `capacitor.config.ts`:
```typescript
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFF9E6",
      showSpinner: false
    }
  }
}
```

## Troubleshooting

### Build Fails
- Ensure JDK 17+ is installed and JAVA_HOME is set
- Update Android SDK tools to latest version
- Check Gradle wrapper version (should be 8.0+)

### Assets Not Loading
```bash
# Rebuild and sync
npm run build
npx cap sync android
```

### Android Studio Won't Open Project
- Ensure Gradle sync completes successfully
- Invalidate caches: File → Invalidate Caches / Restart

## Release Build Configuration

For production releases, configure signing in `android/app/build.gradle`:

```gradle
android {
  signingConfigs {
    release {
      storeFile file("path/to/keystore.jks")
      storePassword "your-store-password"
      keyAlias "your-key-alias"
      keyPassword "your-key-password"
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
```

**Never commit signing credentials to version control.**

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Build Android APK
  run: |
    npm run build
    npx cap sync android
    cd android
    ./gradlew assembleRelease
```

## Non-Breaking Changes

- Web application functionality unchanged
- No API changes or breaking modifications
- Android is an optional deployment target
- All features work identically on web and Android

## Further Reading

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/studio/build)
- [Capacitor Android Platform](https://capacitorjs.com/docs/android)
