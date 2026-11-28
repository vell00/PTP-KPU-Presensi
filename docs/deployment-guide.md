# PTP-KPU-Presensi — Deployment Guide (Firebase, Android APK & Admin Web Portal)

**Organization:** Komisi Pemilihan Umum (KPU) Provinsi Sulawesi Utara  
**Firebase Project:** `ptp-kpu-presensi` (Region: `asia-southeast2`)  
**Components:**
1. **Firebase Backend:** `firestore.rules`, `flutter_application_1/firestore.indexes.json`, and `flutter_application_1/functions/`
2. **Employee Mobile App (Android `.apk`):** `flutter_application_1/`
3. **Admin Web Portal (Next.js 15):** `admin-dashboard/`

---

## Step 1: Deploy Firebase Backend (Required First)

Both the Android `.apk` and the Admin Web Portal depend on the hardened Firestore rules and Cloud Functions. Deploy them before releasing either app.

### 1.1 Prerequisites
- Node.js 22 LTS
- Firebase project `ptp-kpu-presensi` upgraded to the **Blaze** plan (required for Cloud Functions v2)
- **Authentication → Email/Password** and **Firestore Database** enabled in Firebase Console

### 1.2 Install Firebase CLI & Authenticate
```powershell
npm install -g firebase-tools
firebase login
```

### 1.3 Configure the Initial Employee Password Secret
Used by `createManagedUser` and `resetUserPassword` (must be 12–128 characters with uppercase, lowercase, and at least one number):
```powershell
cd flutter_application_1
firebase functions:secrets:set INITIAL_USER_PASSWORD --project ptp-kpu-presensi
```

### 1.4 Deploy Firestore Rules, Indexes & Cloud Functions
```powershell
cd flutter_application_1/functions
npm ci
npm test
cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions --project ptp-kpu-presensi
```

### 1.5 Bootstrap the First Administrator Account
Run once from a trusted machine with Google Application Default Credentials (`gcloud auth application-default login` or `GOOGLE_APPLICATION_CREDENTIALS`) if you do not yet have an active `isAdmin: true` user in `users/{uid}`:
```powershell
cd flutter_application_1/firebase
npm ci
$env:INITIAL_USER_PASSWORD="Your-Initial-Password-123"
npm run admin:bootstrap -- ptp-kpu-presensi 198001012005011001 "Nama Administrator"
Remove-Item Env:INITIAL_USER_PASSWORD
```
To grant admin rights to an existing provisioned user:
```powershell
npm run admin:grant -- ptp-kpu-presensi nip_198001012005011001
```

---

## Step 2: Build the Flutter Employee App into a Release `.apk`

### 2.1 Prerequisites
- **Flutter SDK** `>= 3.38.0` (**Dart** `>= 3.10.0`)
- **Android Studio / Android SDK** (API 24–34) and **Java 17**
- Verify environment:
  ```powershell
  flutter doctor
  ```

### 2.2 Configure Release Signing (Recommended Before Production Distribution)
By default, `flutter_application_1/android/app/build.gradle.kts` signs release builds with the debug key and uses `applicationId = "com.example.flutter_application_1"`.

1. *(Optional — recommended before Play Store submission)* Update `applicationId` and `namespace` in `flutter_application_1/android/app/build.gradle.kts` (e.g., `id.go.kpu.sulut.presensi`), register that package name in Firebase Console, and replace `flutter_application_1/android/app/google-services.json`. *(For internal APK distribution using the existing `google-services.json`, you may keep the current `applicationId`.)*
2. Generate a release keystore (**back it up safely and never commit it to Git**):
   ```powershell
   cd flutter_application_1
   keytool -genkey -v -keystore android/app/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
3. Create `flutter_application_1/android/key.properties` (gitignored):
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=upload
   storeFile=upload-keystore.jks
   ```
4. Configure `signingConfigs.create("release")` in `flutter_application_1/android/app/build.gradle.kts` to read `key.properties` and assign `signingConfig = signingConfigs.getByName("release")` inside `buildTypes.release`.

### 2.3 Run Checks & Build the `.apk`
```powershell
cd flutter_application_1
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

- **Universal release APK output:**  
  `flutter_application_1/build/app/outputs/flutter-apk/app-release.apk`
- **Smaller per-architecture APKs (optional):**
  ```powershell
  flutter build apk --release --split-per-abi
  ```
  *(Most modern Android devices use `app-arm64-v8a-release.apk`.)*
- **Google Play Store bundle (optional):**
  ```powershell
  flutter build appbundle --release
  ```

---

## Step 3: Deploy the Next.js Admin Web Portal (`admin-dashboard/`)

### Required Environment Variables
Set these 6 public Firebase Web SDK variables (from `flutter_application_1/lib/firebase_options.dart` or Firebase Console → Project Settings → Web App):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<your-web-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ptp-kpu-presensi.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ptp-kpu-presensi
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ptp-kpu-presensi.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=760531501154
NEXT_PUBLIC_FIREBASE_APP_ID=<your-web-app-id>
```

### Option A: Deploy on Vercel (Recommended — Zero-Config Next.js 15)
1. Push the repository to GitHub/GitLab (or deploy directly with `npx vercel` inside `admin-dashboard/`).
2. In Vercel, import the repo and set **Root Directory** to `admin-dashboard`.
3. Add the 6 `NEXT_PUBLIC_FIREBASE_*` environment variables under **Project Settings → Environment Variables**.
4. Trigger **Deploy**.
5. In **Firebase Console → Authentication → Settings → Authorized domains**, add your deployed domain (e.g., `your-portal.vercel.app` or custom KPU Sulut domain).

### Option B: Self-Host on a Linux/Windows Server (Node.js 22)
```bash
cd admin-dashboard
npm ci
# Create .env.local with the 6 NEXT_PUBLIC_FIREBASE_* variables above
npx tsc --noEmit
npm run build
npm run start
```
- The server listens on port `3000`. Place **Nginx** or **Caddy** with HTTPS (TLS) in front of it, and run it under a process manager such as `pm2` (`pm2 start "npm run start" --name kpu-admin`) or `systemd`.
- Add your production domain to **Firebase Console → Authentication → Settings → Authorized domains**.

---

## Step 4: Post-Deployment Checklist

1. **Admin Login:** Sign in to the deployed Admin Portal with your bootstrapped 18-digit Admin NIP.
2. **Office Geofence & Policy:** Open **Pengaturan**, verify the office coordinates (`1.4748, 124.8421` or exact KPU Sulut Manado pin), WFO radius (`25–1000 m`), per-subdepartment WFH days, WITA work hours, and national holidays, then click **Simpan Pengaturan**.
3. **Provision Test Employee:** Open **Pegawai → Tambah Pegawai**, create a test employee (18-digit NIP), sign in on the Android `.apk`, complete mandatory password change + 6-digit PIN setup, and verify live check-in/out appears immediately in **Dashboard** and **Rekap**.
