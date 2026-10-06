import crypto from 'crypto';
import { SecretsManager } from 'aws-sdk';

export class PaymentSecurityService {
  private secretsManager: SecretsManager;
  private encryptionKey: string;

  constructor() {
    this.secretsManager = new SecretsManager({ region: process.env.AWS_REGION });
    this.encryptionKey = process.env.ENCRYPTION_KEY!;
  }

  // Encrypt sensitive payment credentials
  encryptCredentials(credentials: { publicKey: string; secretKey: string; webhookSecret?: string }) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('paystack-credentials'));
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt payment credentials
  decryptCredentials(encryptedData: { encrypted: string; iv: string; authTag: string }) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    
    decipher.setAAD(Buffer.from('paystack-credentials'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Store credentials in AWS Secrets Manager
  async storeCredentials(associationId: string, credentials: any) {
    const secretName = `alumzi/paystack/${associationId}`;
    const encryptedCreds = this.encryptCredentials(credentials);
    
    try {
      await this.secretsManager.createSecret({
        Name: secretName,
        SecretString: JSON.stringify(encryptedCreds),
        Description: `Paystack credentials for association ${associationId}`
      }).promise();
    } catch (error: any) {
      if (error.code === 'ResourceExistsException') {
        await this.secretsManager.updateSecret({
          SecretId: secretName,
          SecretString: JSON.stringify(encryptedCreds)
        }).promise();
      } else {
        throw error;
      }
    }
  }

  // Retrieve credentials from AWS Secrets Manager
  async getCredentials(associationId: string) {
    const secretName = `alumzi/paystack/${associationId}`;
    
    try {
      const result = await this.secretsManager.getSecretValue({
        SecretId: secretName
      }).promise();
      
      const encryptedData = JSON.parse(result.SecretString!);
      return this.decryptCredentials(encryptedData);
    } catch (error: any) {
      if (error.code === 'ResourceNotFoundException') {
        return null;
      }
      throw error;
    }
  }
}