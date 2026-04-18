
/**
 * CryptoService: Cung cấp các phương thức mã hóa chuẩn quân đội (AES-GCM, PBKDF2, SHA-256)
 */

const ENCRYPTION_ALGO = 'AES-GCM';
const PBKDF2_ITERATIONS = 100000;

// Tạo vân tay SHA-256 (Dùng để che giấu email trong storage key)
export async function hashEmail(email: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Tạo khóa AES từ mật khẩu và salt (Sử dụng PBKDF2)
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ENCRYPTION_ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Mã hóa dữ liệu bằng mật khẩu
export async function encryptData(data: any, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGO, iv },
    key,
    encoder.encode(JSON.stringify(data))
  );

  // Kết quả gộp: salt (16b) + iv (12b) + encrypted_data
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...result));
}

// Giải mã dữ liệu bằng mật khẩu
export async function decryptData(encryptedBase64: string, password: string): Promise<any> {
  try {
    const binary = atob(encryptedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const data = bytes.slice(28);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGO, iv },
      key,
      data
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    throw new Error('Mật khẩu không đúng hoặc dữ liệu bị hỏng');
  }
}

// Băm mật khẩu để lưu trữ đối soát (Bảo mật cao hơn plain text)
export async function hashPasswordForStorage(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + "zentask_salt_2024");
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}
