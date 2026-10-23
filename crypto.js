// The password never leaves this browser. Private content is stored as authenticated ciphertext.
export async function decryptCourse(envelope, password) {
  if (envelope.version !== 1 || envelope.algorithm !== 'AES-256-GCM' || envelope.kdf !== 'PBKDF2-SHA256' || envelope.iterations < 600000 || envelope.iterations > 2000000) throw new Error('지원하지 않는 교안 형식입니다.');
  const decode = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: decode(envelope.salt), iterations: envelope.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
