# SAC Community — Android and iOS

Both native projects are generated with Capacitor 8. They load **https://flow-post-sparkle.lovable.app** with the existing design. This is an online, hosted-site wrapper, not an offline app. Publishing website changes updates what it displays; unpublished preview changes will not appear in it.

## What is included

- `android/`: Android Studio project, app ID `app.saccommunity.mobile`, Android 7+ (API 24), targeting API 36.
- `ios/`: Xcode project, same app ID, iOS 15+.
- `capacitor.config.ts`: exact HTTPS origin, no cleartext or mixed-content allowance, no wildcard navigation.
- `mobile-web/`: bundled connection-error page with retry.
- Existing posts, stories, reels, and account forms remain hosted on the website.

## Android installation file

1. Install Node.js 22+, Android Studio with SDK 36, and its compatible JDK (21).
2. Run `bun install` (or install dependencies using npm), then `bun run mobile:sync`.
3. Run `bun run mobile:android` to open Android Studio.
4. Let Gradle sync, select a device/emulator, and run the app.
5. For a test APK: use Build → Generate App Bundles or APKs → Generate APKs, or run `./gradlew assembleDebug` inside `android/`.
6. For Play Store: Generate Signed App Bundle, create/store a private signing key outside this repository, and upload the AAB using your Google Play developer account.

## iPhone installation / TestFlight

1. Use a Mac with Xcode 26+ and Node.js 22+.
2. Install dependencies, run `bun run mobile:sync`, then `bun run mobile:ios`.
3. In Xcode select the App target, set your Apple Developer Team under Signing & Capabilities, and confirm your bundle identifier is available.
4. Run on an iPhone simulator/device. For TestFlight select a device archive destination, then Product → Archive → Distribute App.
5. Store distribution requires an Apple Developer account and App Store Connect setup.

## Before release

- Native APK/IPA compilation, signing and device testing were **not performed in the Lovable sandbox**: Android SDK/JDK and macOS/Xcode are unavailable here.
- Test email sign-in, verification links, session restoration, camera/gallery selection, video/audio uploads, keyboard, notch/status bar, Android back, and reconnection on real Android/iOS devices. A desktop browser does not validate native behavior.
- Email verification delivery and verification-form submission limitations in the existing website are not repaired by packaging.
- Google/Apple OAuth and email links returning to the app need an explicit native callback/deep-link flow; do not assume embedded browser login is sufficient.
- Add native features as needed for store acceptance. A hosted website wrapper alone may be rejected, especially under Apple's minimum-functionality rules; store approval is not guaranteed.
- Supply privacy policy, support URL, data safety/privacy disclosures, moderation/reporting/blocking for social content, account deletion, screenshots and age rating. Audit these against current store requirements.
- Keep signing keys, service secrets, provisioning profiles and `local.properties` out of any source delivery.

## Development

`bun run mobile:sync` copies the connection page and config to both native projects. It deliberately does not build the SSR website as static files. Deploy website updates separately using the existing Lovable workflow.