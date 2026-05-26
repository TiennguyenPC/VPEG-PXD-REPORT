# VPEG PXD — Cài app Android bằng file APK (không cần CH Play)

## Lấy file APK ở đâu?

Sau khi build xong, file để gửi nhân viên:

```
releases\VPEG-PXD.apk
```

(Hoặc bản gốc Gradle: `android\app\build\outputs\apk\debug\app-debug.apk`)

**Không có link tải trên internet** — IT build trên PC (hoặc dùng file trong `releases/` nếu đã build sẵn).

```
Project (code)  →  [Android Studio + lệnh build]  →  app-debug.apk  →  copy vào điện thoại
```

APK là lớp vỏ mở **https://vpeg-pxd-dashboard.vercel.app**.  
Sửa web rồi deploy Vercel → **không cần build lại APK** (nhân viên mở app là thấy bản mới).

## Phí

| Hạng mục | Chi phí |
|----------|---------|
| Build APK debug (nội bộ) | **0đ** |
| Google Play | **Không cần** |

## Yêu cầu máy build (IT / dev)

- **Node.js** 18+ (đã có trong project)
- **JDK 17** (Android build)
- **Android SDK** — cài [Android Studio](https://developer.android.com/studio) một lần, hoặc chỉ Android command-line tools

Biến môi trường (Windows):

- `JAVA_HOME` → thư mục JDK
- `ANDROID_HOME` → `%LOCALAPPDATA%\Android\Sdk`

## Cách 1 — Android Studio (dễ nhất, khuyên dùng)

### Bước 1: Cài Android Studio (một lần)

1. Tải: https://developer.android.com/studio  
2. Cài mặc định (có kèm **JDK** + **Android SDK**).  
3. Mở Android Studio lần đầu → chờ nó tải SDK xong.

### Bước 2: Mở project Android

Trong thư mục project `epc-solar-dashboard`, mở **Terminal** (PowerShell) và chạy:

```powershell
cd "đường-dẫn\epc-solar-dashboard"
npm install
npm run build
npm run android:sync
npm run android:open
```

Lệnh `android:open` sẽ mở Android Studio với project `android/`.

### Bước 3: Build APK trong Android Studio

1. Đợi Gradle sync xong (thanh dưới không còn “syncing”).  
2. Menu **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.  
3. Khi xong, góc phải có thông báo **locate** — bấm vào hoặc mở thư mục:

```
android\app\build\outputs\apk\debug\app-debug.apk
```

4. Copy `app-debug.apk` → đổi tên `VPEG-PXD.apk` → gửi cho team.

---

## Cách 2 — Chỉ dùng lệnh (đã cài JDK + SDK)

```powershell
cd "đường-dẫn\epc-solar-dashboard"
npm install
npm run android:sync
npm run android:apk
```

File ra: `android\app\build\outputs\apk\debug\app-debug.apk`

Nếu báo `JAVA_HOME is not set` → chưa cài JDK hoặc dùng **Cách 1** (Android Studio).

## Cài trên điện thoại Android

1. Copy file `.apk` vào máy
2. Mở file → cho phép **Cài ứng dụng không rõ nguồn** (hoặc “Install unknown apps” cho trình quản lý file)
3. Cài xong → mở **VPEG PXD**, đăng nhập như trên web

**Lưu ý:** Cần **internet** (GAS + Vercel). APK không thay thế PWA trên iPhone — iPhone vẫn dùng Safari → Thêm vào Màn hình chính.

## Build lại APK khi nào?

| Thay đổi | Cần APK mới? |
|----------|----------------|
| Sửa web, deploy Vercel | **Không** |
| Đổi tên app / icon Android | **Có** — `npm run android:icons` rồi `npm run android:apk` |
| Đổi `appId` / quyền native | **Có** |

## Đổi URL production

Sửa `server.url` trong `capacitor.config.json`, rồi `npm run android:sync` và `npm run android:apk`.
