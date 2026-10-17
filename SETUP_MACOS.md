# 🖥️ Hướng Dẫn Cài Đặt Work Manager Pro trên macOS

## Mục Lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt công cụ cần thiết](#2-cài-đặt-công-cụ-cần-thiết)
3. [Chạy chế độ phát triển](#3-chạy-chế-độ-phát-triển)
4. [Build file cài đặt DMG](#4-build-file-cài-đặt-dmg)
5. [Cài đặt từ file DMG](#5-cài-đặt-từ-file-dmg)
6. [Cấu hình Auto Update](#6-cấu-hình-auto-update)
7. [Ký (Code Signing) & Công chứng (Notarization)](#7-ký-code-signing--công-chứng-notarization)
8. [Phân phối ứng dụng](#8-phân-phối-ứng-dụng)
9. [Xử lý lỗi thường gặp](#9-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Yêu cầu          | Phiên bản tối thiểu    |
|-------------------|------------------------|
| macOS             | 11.0 (Big Sur) trở lên |
| Node.js           | 18.x trở lên           |
| npm               | 9.x trở lên            |
| Dung lượng trống  | ~2GB cho build          |

> 💡 Ứng dụng hỗ trợ cả **Intel (x64)** và **Apple Silicon (arm64)**.

---

## 2. Cài đặt công cụ cần thiết

### 2.1 Cài Homebrew (nếu chưa có)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2.2 Cài Node.js

```bash
brew install node

# Kiểm tra
node -v  # >= 18.x
npm -v   # >= 9.x
```

### 2.3 Cài Xcode Command Line Tools

```bash
xcode-select --install
```

> Cần thiết cho `electron-builder` native compilation.

### 2.4 Cài dependencies dự án

```bash
cd work-manager-pro
npm install
```

---

## 3. Chạy chế độ phát triển (Development)

### 3.1 Chạy web server + Electron đồng thời

```bash
npm run electron:dev
```

Lệnh này sẽ:
- Khởi động Express server tại `http://localhost:45001`
- Đợi server sẵn sàng, rồi mở cửa sổ Electron
- Hot reload khi thay đổi code

### 3.2 Chỉ chạy web server (không cần Electron)

```bash
npm run dev
```

Truy cập tại: `http://localhost:45001`

---

## 4. Build file cài đặt DMG

### 4.1 Build toàn bộ (Web + Server + Electron)

```bash
npm run build:exe
```

Lệnh này thực hiện tuần tự:
1. `vite build` → Build frontend vào `dist/`
2. `esbuild server.ts` → Bundle server vào `dist-server/`
3. `electron-builder` → Đóng gói thành file `.dmg`

### 4.2 Kết quả

File cài đặt được tạo tại:
```
dist-electron/
├── Work Manager Pro-1.0.1.dmg          # File cài đặt cho macOS
├── Work Manager Pro-1.0.1-arm64.dmg    # Cho Apple Silicon (nếu build riêng)
├── Work Manager Pro-1.0.1.dmg.blockmap # Dùng cho auto-update
└── latest-mac.yml                       # Metadata cho auto-update
```

### 4.3 Build cho kiến trúc cụ thể

```bash
# Chỉ build cho Apple Silicon (M1/M2/M3)
npx electron-builder --mac --arm64

# Chỉ build cho Intel
npx electron-builder --mac --x64

# Build Universal (cả hai)
npx electron-builder --mac --universal
```

---

## 5. Cài đặt từ file DMG

### Cài đặt thủ công

1. Mở file `Work Manager Pro-1.0.1.dmg`
2. Kéo **Work Manager Pro** vào thư mục **Applications**
3. Mở ứng dụng từ **Launchpad** hoặc **Applications**

### Lần đầu mở ứng dụng

Nếu macOS cảnh báo "App can't be opened because it is from an unidentified developer":

```bash
# Cách 1: System Preferences
# Cài đặt → Bảo mật & Quyền riêng tư → Cho phép "Work Manager Pro"

# Cách 2: Dùng Terminal
sudo xattr -rd com.apple.quarantine /Applications/Work\ Manager\ Pro.app
```

### Cấu hình khởi động cùng hệ thống

Ứng dụng đã tích hợp sẵn tính năng auto-start. Có thể bật/tắt qua:
- **Trong ứng dụng**: Settings → Khởi động cùng máy
- **macOS**: System Preferences → General → Login Items

---

## 6. Cấu hình Auto Update

Ứng dụng sử dụng `electron-updater` để tự động cập nhật.

### 6.1 Cấu hình GitHub Releases

Trong [package.json](package.json), cập nhật thông tin GitHub:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR_GITHUB_USERNAME",
        "repo": "work-manager-pro"
      }
    ]
  }
}
```

### 6.2 Quy trình phát hành bản cập nhật

```bash
# 1. Tăng version trong package.json
# "version": "1.0.2"

# 2. Build lại
npm run build:exe

# 3. Tạo GitHub Release mới
# Upload file .dmg, .dmg.blockmap, latest-mac.yml

# 4. Ứng dụng trên máy người dùng sẽ tự động:
#    - Phát hiện bản mới
#    - Tải ngầm
#    - Thông báo cập nhật
#    - Cài đặt khi thoát ứng dụng
```

### 6.3 Cách hoạt động

Khi ứng dụng khởi động:
1. `autoUpdater.checkForUpdatesAndNotify()` kiểm tra bản mới
2. Nếu có → tự động tải ngầm
3. Hiển thị thông báo cho người dùng
4. Khi thoát → tự động cài bản mới

---

## 7. Ký (Code Signing) & Công chứng (Notarization)

> ⚠️ **Bắt buộc** nếu muốn phân phối cho người dùng khác. Không cần nếu chỉ dùng cá nhân.

### 7.1 Yêu cầu

- **Apple Developer Account** ($99/năm)
- **Developer ID Application Certificate** (cho macOS)

### 7.2 Tạo Certificate

1. Mở **Xcode → Preferences → Accounts**
2. Chọn team → **Manage Certificates**
3. Tạo **Developer ID Application** certificate

### 7.3 Cấu hình Code Signing

Thêm vào `package.json` phần `build.mac`:

```json
{
  "build": {
    "mac": {
      "target": ["dmg"],
      "category": "public.app-category.productivity",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "identity": "Developer ID Application: YOUR NAME (TEAM_ID)"
    },
    "afterSign": "scripts/notarize.js"
  }
}
```

### 7.4 Tạo file Entitlements

Tạo file `build/entitlements.mac.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
</dict>
</plist>
```

### 7.5 Notarization (Công chứng Apple)

Tạo file `scripts/notarize.js`:
```javascript
import { notarize } from '@electron/notarize';

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;
  
  return await notarize({
    appBundleId: 'com.workmanager.pro',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

Chạy build với biến môi trường:
```bash
APPLE_ID="your@email.com" \
APPLE_ID_PASSWORD="app-specific-password" \
APPLE_TEAM_ID="XXXXXXXXXX" \
npm run build:exe
```

---

## 8. Phân phối ứng dụng

### 8.1 Qua GitHub Releases (Khuyến nghị)

```bash
# Cài gh CLI
brew install gh

# Tạo release
gh release create v1.0.1 \
  dist-electron/Work\ Manager\ Pro-1.0.1.dmg \
  dist-electron/latest-mac.yml \
  --title "Work Manager Pro v1.0.1" \
  --notes "Bản cập nhật mới nhất"
```

### 8.2 Qua Mac App Store

1. Sử dụng `electron-builder` với target `mas`:
```json
{
  "build": {
    "mac": {
      "target": ["dmg", "mas"]
    }
  }
}
```
2. Upload qua **Transporter** hoặc `xcrun altool`

### 8.3 Chia sẻ trực tiếp file DMG

Gửi file `.dmg` qua email, Google Drive, hoặc bất kỳ kênh nào. Người nhận chỉ cần mở và kéo vào Applications.

---

## 9. Xử lý lỗi thường gặp

### ❌ Lỗi: "electron-builder: Cannot find module"
```bash
npm install
# Hoặc xóa cache:
rm -rf node_modules package-lock.json
npm install
```

### ❌ Lỗi: "Code signing failed"
```bash
# Kiểm tra certificate
security find-identity -v -p codesigning

# Nếu không có, tạo mới trong Xcode → Preferences → Accounts
```

### ❌ Lỗi: "ENOMEM" hoặc build hết bộ nhớ
```bash
# Tăng memory cho Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:exe
```

### ❌ Lỗi: App hiện màn trắng
```bash
# Kiểm tra dist/ có tồn tại:
ls dist/

# Nếu trống, build lại:
npm run build
npm run build:exe
```

### ❌ Lỗi: "App is damaged" trên máy người dùng
```bash
# Người dùng chạy:
sudo xattr -rd com.apple.quarantine /Applications/Work\ Manager\ Pro.app
```

### ❌ Lỗi: Port 45001 đang bị sử dụng
```bash
# Tìm và kill process
lsof -i :45001
kill -9 <PID>
```

---

## 📋 Tóm tắt quy trình nhanh

```bash
# === CHẾ ĐỘ PHÁT TRIỂN ===
npm install
npm run electron:dev

# === BUILD FILE CÀI ĐẶT ===
npm install
npm run build:exe
# → File DMG tại: dist-electron/

# === CÀI ĐẶT ===
# Mở file .dmg → Kéo vào Applications → Mở ứng dụng
```

---

## 📂 Cấu trúc thư mục liên quan

```
work-manager-pro/
├── electron/
│   ├── main.js          # Entry point Electron (main process)
│   └── preload.js       # Bridge giữa renderer và main process
├── build/
│   └── installer.nsh    # Script cài đặt Windows (NSIS)
├── dist/                # Web build output (vite build)
├── dist-server/         # Server bundle output (esbuild)
├── dist-electron/       # Electron build output (DMG, exe)
├── package.json         # Cấu hình build electron-builder
├── vite.config.ts       # Cấu hình Vite
└── server.ts            # Express + Socket.IO server
```

---

> 💡 **Mẹo hiệu suất**: Trên macOS, ứng dụng Electron chạy server Express tích hợp sẵn bên trong. Dữ liệu được lưu tại:
> ```
> ~/Library/Application Support/work-manager-pro/db.json
> ```
