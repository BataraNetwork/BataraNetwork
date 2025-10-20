import { createHash, generateKeyPairSync, createSign, createVerify } from 'crypto';

export const hash = (data: any): string => {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(str).digest('hex');
};

export const generateKeys = () => {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
};

export const sign = (data: string, privateKey: string): string => {
  const signer = createSign('sha256');
  signer.update(data);
  signer.end();
  return signer.sign(privateKey, 'hex');
};

export const verify = (data: string, publicKey: string, signature: string): boolean => {
  const verifier = createVerify('sha256');
  verifier.update(data);
  verifier.end();
  return verifier.verify(publicKey, signature, 'hex');
};
