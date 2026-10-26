# Bill Maker — Android and iPhone installation

This folder is a React Native / Expo **source project**, not a finished APK or IPA. The source passed static checks, but native builds and on-device behavior have not been verified.

## Requirements
- Computer (Windows, Mac, or Linux), Node.js, internet connection
- Free Expo account at https://expo.dev
- For iPhone distribution through Expo cloud builds: paid Apple Developer Program membership and signing credentials. For ad hoc installs, register your iPhone device. Alternatively, a Mac with Xcode supports local development signing.

## Setup
1. Open a terminal in this folder.
2. Run `npm install`.
3. Run `npx expo install --fix` to align native package versions with the installed Expo SDK.
4. Run `npm run test:static`.
5. Run `npx eas-cli@latest login` and sign in to your own Expo account.
6. Run `npx eas-cli@latest build:configure` if prompted to associate this project with your Expo account. Keep the supplied `eas.json` build profiles.

## Android — install directly
Run `npx eas-cli@latest build --platform android --profile preview`.
After the cloud build finishes, open the APK link on your Android phone, download it, and approve installation if Android asks. Do not use an AAB file for direct installation.

## iPhone — install on your own device
You need Apple signing. For an internal/ad hoc build, run `npx eas-cli@latest device:create` to register the phone, then `npx eas-cli@latest build --platform ios --profile preview`. Follow Expo's prompts to provide or generate signing credentials with your Apple Developer account. Open the finished install link on the registered iPhone. Alternatively, build with the production profile and distribute through TestFlight/App Store Connect.

## Test checklist
- Add 3 items; edit names, quantities and rates; verify per-line and grand totals.
- Remove the middle item; verify total updates.
- Save a bill, reopen it, edit and save again.
- Restart the app and confirm locally saved bills remain available.
- Share a PDF via the system share sheet and select WhatsApp (if installed).
- Print or save a PDF, and check the bill formatting.
- Test on both iPhone and Android. 

Known limitations: 'Open Saved' currently displays only the 7 most recent saved bills; re-saving creates another saved copy; image export is not yet implemented. Saved data is stored on the phone and may be lost if the app is uninstalled. Never send passwords or Apple signing secrets through chat.
