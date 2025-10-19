import { generateKeys, sign } from '../utils/crypto';

export class Validator {
  public readonly publicKey: string;
  private readonly privateKey: string;

  constructor() {
    const { publicKey, privateKey } = generateKeys();
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    console.log(`Validator initialized with public key:\n${this.publicKey}`);
  }

  public sign(data: string): string {
    return sign(data, this.privateKey);
  }
}
