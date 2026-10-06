import { EventBridge, CloudWatch } from 'aws-sdk';
import { PaymentSecurityService } from './paymentSecurity.service';
import axios, { AxiosResponse } from 'axios';

interface PaystackPaymentRequest {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  metadata: Record<string, any>;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

export class EnterprisePaymentService {
  private securityService: PaymentSecurityService;
  private eventBridge: EventBridge;
  private cloudWatch: CloudWatch;
  private readonly PAYSTACK_BASE_URL = 'https://api.paystack.co';

  constructor() {
    this.securityService = new PaymentSecurityService();
    this.eventBridge = new EventBridge({ region: process.env.AWS_REGION });
    this.cloudWatch = new CloudWatch({ region: process.env.AWS_REGION });
  }

  // Initialize payment with enterprise patterns
  async initializePayment(
    associationId: string,
    paymentRequest: PaystackPaymentRequest
  ): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const startTime = Date.now();
    
    try {
      // Get encrypted credentials
      const credentials = await this.securityService.getCredentials(associationId);
      if (!credentials) {
        throw new Error('Payment credentials not configured');
      }

      // Validate request
      this.validatePaymentRequest(paymentRequest);

      // Initialize payment with Paystack
      const response = await this.callPaystackAPI('/transaction/initialize', {
        ...paymentRequest,
        callback_url: `${process.env.APP_URL}/payment/callback`,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      }, credentials.secretKey);

      // Emit success event
      await this.emitPaymentEvent('PAYMENT_INITIALIZED', {
        associationId,
        reference: paymentRequest.reference,
        amount: paymentRequest.amount,
        timestamp: new Date().toISOString()
      });

      // Record metrics
      await this.recordMetric('PaymentInitialization', 'Success', 1);
      await this.recordMetric('PaymentInitializationLatency', 'Milliseconds', Date.now() - startTime);

      return {
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference
      };

    } catch (error: any) {
      // Record error metrics
      await this.recordMetric('PaymentInitialization', 'Error', 1);
      await this.recordMetric('PaymentInitializationLatency', 'Milliseconds', Date.now() - startTime);

      // Emit error event
      await this.emitPaymentEvent('PAYMENT_INITIALIZATION_FAILED', {
        associationId,
        reference: paymentRequest.reference,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  // Verify payment with retry logic
  async verifyPayment(associationId: string, reference: string): Promise<any> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const credentials = await this.securityService.getCredentials(associationId);
        if (!credentials) {
          throw new Error('Payment credentials not configured');
        }

        const response = await this.callPaystackAPI(
          `/transaction/verify/${reference}`,
          null,
          credentials.secretKey,
          'GET'
        );

        if (response.data.status === 'success') {
          // Emit success event
          await this.emitPaymentEvent('PAYMENT_VERIFIED', {
            associationId,
            reference,
            amount: response.data.amount / 100, // Convert from kobo
            timestamp: new Date().toISOString(),
            gateway_response: response.data.gateway_response
          });

          await this.recordMetric('PaymentVerification', 'Success', 1);
          return response.data;
        }

        throw new Error(`Payment verification failed: ${response.data.gateway_response}`);

      } catch (error: any) {
        attempt++;
        
        if (attempt >= maxRetries) {
          await this.recordMetric('PaymentVerification', 'Error', 1);
          await this.emitPaymentEvent('PAYMENT_VERIFICATION_FAILED', {
            associationId,
            reference,
            error: error.message,
            attempts: attempt,
            timestamp: new Date().toISOString()
          });
          
          throw error;
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  // Webhook verification with security
  async verifyWebhook(signature: string, payload: string, associationId: string): Promise<boolean> {
    try {
      const credentials = await this.securityService.getCredentials(associationId);
      if (!credentials?.webhookSecret) {
        return false;
      }

      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', credentials.webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = hash === signature;
      
      await this.recordMetric('WebhookVerification', isValid ? 'Success' : 'Failed', 1);
      
      return isValid;
    } catch (error) {
      await this.recordMetric('WebhookVerification', 'Error', 1);
      return false;
    }
  }

  // Private helper methods
  private async callPaystackAPI(
    endpoint: string,
    data: any,
    secretKey: string,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<AxiosResponse<PaystackResponse>> {
    const config = {
      method,
      url: `${this.PAYSTACK_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30 seconds
      ...(data && { data })
    };

    return await axios(config);
  }

  private validatePaymentRequest(request: PaystackPaymentRequest): void {
    if (!request.email || !request.amount || !request.reference) {
      throw new Error('Missing required payment fields');
    }

    if (request.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
      throw new Error('Invalid email format');
    }
  }

  private async emitPaymentEvent(eventType: string, detail: any): Promise<void> {
    try {
      await this.eventBridge.putEvents({
        Entries: [{
          Source: 'alumzi.payments',
          DetailType: eventType,
          Detail: JSON.stringify(detail),
          Time: new Date()
        }]
      }).promise();
    } catch (error) {
      console.error('Failed to emit payment event:', error);
    }
  }

  private async recordMetric(metricName: string, unit: string, value: number): Promise<void> {
    try {
      await this.cloudWatch.putMetricData({
        Namespace: 'Alumzi/Payments',
        MetricData: [{
          MetricName: metricName,
          Unit: unit as any,
          Value: value,
          Timestamp: new Date()
        }]
      }).promise();
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}