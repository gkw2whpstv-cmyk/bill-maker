# Bill Maker Mobile — iPhone and Android

React Native / Expo source project (not a website, not a signed installable app).

## Features
- Native Add Item and Remove Item controls
- Separate Item / Quantity / Rate / Total columns
- Automatic per-line and grand total calculations
- Draft autosave and saved bills on device
- PDF export, native share sheet (WhatsApp if installed)
- Offline bill editing

## Run and test
1. Install Node.js 20+.
2. Run `npm install` in this folder.
3. Run `npm run check` and `npm run test:static`.
4. Run `npx expo start`; use Expo Go on iPhone or Android to scan QR.
5. Test adding 10+ items, editing amounts, saving/reopening, sharing PDF to WhatsApp, and printing.

## Signed builds
Requires Expo login and platform credentials:
- `npx eas-cli build --platform android`
- `npx eas-cli build --platform ios`

## Verification
Static TSX parsing, transpilation and feature presence checks can run without Expo dependencies.
Dependency installation timed out in this environment, so compilation against Expo types, runtime tests,
device tests, signed APK/IPA creation and store distribution are NOT complete.
The current app exports PDF, not PNG. The native share sheet opens WhatsApp if available.
