# 📱 Hướng Dẫn Cài Đặt Work Manager Pro trên iOS

## Mục Lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt công cụ cần thiết](#2-cài-đặt-công-cụ-cần-thiết)
3. [Build ứng dụng web](#3-build-ứng-dụng-web)
4. [Đồng bộ với Capacitor iOS](#4-đồng-bộ-với-capacitor-ios)
5. [Chạy trên Simulator](#5-chạy-trên-simulator)
6. [Chạy trên thiết bị thật](#6-chạy-trên-thiết-bị-thật)
7. [Đẩy lên App Store](#7-đẩy-lên-app-store)
8. [Xử lý lỗi thường gặp](#8-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Yêu cầu             | Phiên bản tối thiểu       |
|----------------------|---------------------------|
| macOS                | 13.0 (Ventura) trở lên    |
| Xcode                | 15.0 trở lên              |
| Node.js              | 18.x trở lên              |
| npm                  | 9.x trở lên               |
| CocoaPods (nếu cần)  | 1.14 trở lên              |
| Apple Developer Account | Bắt buộc (cho thiết bị thật & App Store) |

> ⚠️ **Lưu ý**: Bạn chỉ có thể build iOS trên **macOS**. Không thể build trên Windows hoặc Linux.

---

## 2. Cài đặt công cụ cần thiết

### 2.1 Cài Xcode

```bash
# Mở App Store và tải Xcode, HOẶC:
xcode-select --install
```

Sau khi cài xong, mở Xcode một lần để chấp nhận license:
```bash
sudo xcodebuild -license accept
```

### 2.2 Cài Node.js & npm

```bash
# Sử dụng Homebrew
brew install node

# Kiểm tra phiên bản
node -v
npm -v
```

### 2.3 Cài CocoaPods (nếu chưa có)

```bash
sudo gem install cocoapods
# HOẶC dùng Homebrew:
brew install cocoapods
```

### 2.4 Cài dependencies dự án

```bash
cd work-manager-pro
npm install
```

---

## 3. Build ứng dụng web

Trước khi chạy trên iOS, cần build ứng dụng web vào thư mục `dist/`:

```bash
npm run build
```

> **Kết quả**: Thư mục `dist/` sẽ chứa các file HTML, JS, CSS đã được tối ưu.

---

## 4. Đồng bộ với Capacitor iOS

### 4.1 Đồng bộ code web vào project iOS

```bash
npx cap sync ios
```

Lệnh này sẽ:
- Copy nội dung từ `dist/` vào `ios/App/App/public/`
- Cài đặt/cập nhật các plugin Capacitor native
- Cập nhật cấu hình Capacitor

### 4.2 Mở project trong Xcode

```bash
npx cap open ios
```

---

## 5. Chạy trên Simulator

### Cách 1: Dùng Xcode (Khuyến nghị)

1. Mở Xcode: `npx cap open ios`
2. Chọn **Simulator** ở thanh toolbar (ví dụ: iPhone 15 Pro)
3. Nhấn **▶ Run** (hoặc `Cmd + R`)

### Cách 2: Dùng dòng lệnh

```bash
npx cap run ios --target "iPhone 15 Pro"
```

Liệt kê danh sách simulator có sẵn:
```bash
npx cap run ios --list
```

---

## 6. Chạy trên thiết bị thật

### 6.1 Chuẩn bị

1. **Đăng ký Apple Developer Account** tại [developer.apple.com](https://developer.apple.com)
2. Kết nối iPhone/iPad qua cáp USB
3. Trên thiết bị: **Cài đặt → Chung → Quản lý thiết bị** → Trust developer certificate

### 6.2 Cấu hình Signing trong Xcode

1. Mở Xcode: `npx cap open ios`
2. Click vào **App** trong Project Navigator (sidebar trái)
3. Tab **Signing & Capabilities**
4. Tick ✅ **Automatically manage signing**
5. Chọn **Team** = tài khoản Apple Developer của bạn
6. **Bundle Identifier**: `com.workmanager.pro` (đã được cấu hình sẵn)

### 6.3 Build & Run

1. Chọn thiết bị thật ở thanh toolbar
2. Nhấn **▶ Run** (`Cmd + R`)

---

## 7. Đẩy lên App Store

### 7.1 Chuẩn bị trên App Store Connect

1. Truy cập [App Store Connect](https://appstoreconnect.apple.com)
2. Tạo App mới:
   - **Bundle ID**: `com.workmanager.pro`
   - **Tên ứng dụng**: Work Manager Pro
   - **Ngôn ngữ**: Vietnamese
   - **SKU**: `work-manager-pro`

### 7.2 Cấu hình icon ứng dụng

Chuẩn bị file icon 1024x1024px, sau đó tạo tất cả các kích thước:
```bash
npx @capacitor/assets generate --ios
```

Hoặc thêm icon thủ công tại:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

### 7.3 Cấu hình version

Trong Xcode → App target → **General**:
- **Version**: `1.0.1` (CFBundleShortVersionString)
- **Build**: `1` (CFBundleVersion) - tăng mỗi lần upload

### 7.4 Archive & Upload

1. Xcode: **Product → Archive**
2. Khi archive xong → **Distribute App**
3. Chọn **App Store Connect** → **Upload**
4. Đợi Apple review (thường 1-3 ngày)

### 7.5 Thông tin cần chuẩn bị cho App Store

| Mục                  | Yêu cầu                                    |
|-----------------------|---------------------------------------------|
| Screenshots           | iPhone 6.7", 6.5", 5.5" + iPad (nếu hỗ trợ) |
| App Icon              | 1024x1024 PNG, không bo tròn                 |
| Mô tả ứng dụng       | Tiếng Việt + Tiếng Anh                       |
| Privacy Policy URL    | Bắt buộc                                     |
| Nhóm tuổi             | 4+ (không có nội dung nhạy cảm)              |

---

## 8. Xử lý lỗi thường gặp

### ❌ Lỗi: "No signing certificate"
```
→ Xcode → Preferences → Accounts → Thêm Apple ID
→ Tick "Automatically manage signing"
```

### ❌ Lỗi: "Unable to install app"
```
→ Trên thiết bị: Cài đặt → Chung → Quản lý thiết bị → Trust
→ Xóa app cũ trên thiết bị, build lại
```

### ❌ Lỗi: "capacitor.config.json not found"
```bash
npx cap sync ios
```

### ❌ Lỗi: Build failed với Swift version
```bash
# Kiểm tra Swift version
swift --version

# Trong Xcode: Build Settings → Swift Language Version → 5.0
```

### ❌ Lỗi: Màn trắng sau khi build
```bash
# Đảm bảo đã build web trước
npm run build
npx cap sync ios
```

### ❌ Lỗi: Plugin không hoạt động
```bash
# Xóa cache và cài lại
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

---

## 📋 Tóm tắt quy trình nhanh

```bash
# 1. Cài dependencies
npm install

# 2. Build web
npm run build

# 3. Đồng bộ iOS
npx cap sync ios

# 4. Mở Xcode
npx cap open ios

# 5. Chọn device/simulator → Run (Cmd+R)
```

---

> 💡 **Mẹo**: Trong quá trình phát triển, bạn có thể dùng Live Reload:
> ```bash
> # Chạy dev server
> npm run dev
>
> # Trong capacitor.config.ts, thêm:
> # server: { url: 'http://YOUR_IP:3000', cleartext: true }
>
> npx cap sync ios
> npx cap open ios
> ```
