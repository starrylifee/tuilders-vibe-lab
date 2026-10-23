"""Encrypt an already authored course JSON. This does not import or generate PDF lessons."""
import argparse
import base64
import getpass
import json
import os
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


def encrypt(payload, password):
    if len(password) < 12:
        raise ValueError('비밀번호는 12자 이상으로 정해 주세요.')
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=600000).derive(password.encode('utf-8'))
    raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    encoded = lambda data: base64.b64encode(data).decode('ascii')
    return {'version': 1, 'algorithm': 'AES-256-GCM', 'kdf': 'PBKDF2-SHA256', 'iterations': 600000,
            'salt': encoded(salt), 'iv': encoded(iv), 'data': encoded(AESGCM(key).encrypt(iv, raw, None))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('출력 파일이 이미 있습니다. 새 파일명으로 저장한 뒤 교안 목록의 경로를 바꾸세요.')
    payload = json.loads(args.source.read_text(encoding='utf-8'))
    if not payload.get('pages'):
        raise SystemExit('작성된 pages가 필요합니다.')
    # Private images must be included in the encrypted payload, never publicly served paths.
    for page in payload['pages']:
        if not page.get('image', '').startswith(('data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,')):
            raise SystemExit('비공개 교안 이미지는 base64 data URL로 포함해야 합니다. 공개 이미지 경로를 사용할 수 없습니다.')
    password = getpass.getpass('교안 비밀번호 (12자 이상): ')
    if password != getpass.getpass('비밀번호 확인: '):
        raise SystemExit('비밀번호가 일치하지 않습니다.')
    result = encrypt(payload, password)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result), encoding='utf-8')
    print('암호화 교안 생성 완료. 원본 JSON과 이미지, PDF/PPT는 배포 폴더 밖에 보관하세요.')


if __name__ == '__main__':
    main()
