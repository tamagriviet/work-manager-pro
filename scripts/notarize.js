import { notarize } from '@electron/notarize';

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Chỉ notarize trên macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Kiểm tra biến môi trường
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('⚠️  Bỏ qua notarization: Thiếu biến môi trường APPLE_ID, APPLE_ID_PASSWORD, hoặc APPLE_TEAM_ID');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  
  console.log(`🔏 Đang notarize "${appName}"...`);

  try {
    await notarize({
      appBundleId: 'com.workmanager.pro',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    console.log(`✅ Notarization hoàn tất cho "${appName}"`);
  } catch (error) {
    console.error('❌ Notarization thất bại:', error);
    throw error;
  }
};
