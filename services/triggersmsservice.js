import twilio from 'twilio';
import env from '../config/env.js';

class SMSService {
  constructor() {
    // Clean any hidden characters in Twilio number
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    this.fromNumber = this.cleanNumber(env.TWILIO_PHONE_NUMBER);
  }

  /**
   * Remove invisible Unicode characters
   */
  cleanNumber(num) {
    if (!num) return null;

    // Remove zero-width + directional marks
    return num.replace(/[\u202A\u202B\u202C\u202D\u202E\u200B\u200C\u200D\uFEFF\u00A0]/g, '');
  }

  /**
   * Format phone number safely
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remove invisible characters
    phone = this.cleanNumber(phone);

    // Remove everything except digits and +
    phone = phone.replace(/[^\d+]/g, '');

    // India formatting
    if (phone.startsWith('91') && !phone.startsWith('+91')) {
      phone = '+91' + phone.substring(2);
    } else if (phone.startsWith('0')) {
      phone = '+91' + phone.substring(1);
    } else if (phone.length === 10 && /^[6-9]/.test(phone)) {
      phone = '+91' + phone;
    } else if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    return phone;
  }

  /**
   * Send emergency SMS
   */
  async sendEmergencySMS(contacts, deviceId) {
    if (!contacts?.length) {
      console.log('No contacts configured');
      return [];
    }

    const messageText = `🚨 EMERGENCY ALERT from MITR Device ${deviceId}
Help needed! Click to see location: https://mitr-beta.vercel.app
This is an automated alert from MITR SOS system.`;

    const jobs = contacts.map(async (contact) => {
      try {
        const toNumber = this.formatPhoneNumber(contact.phone);

        console.log("SENDING SMS →", {
          contact: contact.name,
          to: JSON.stringify(toNumber),
          from: JSON.stringify(this.fromNumber)
        });

        const response = await this.client.messages.create({
          body: messageText,
          from: this.fromNumber,
          to: toNumber
        });

        console.log(`SMS delivered to ${contact.name}: ${response.sid}`);

        return {
          contactName: contact.name,
          phone: toNumber,
          messageSid: response.sid,
          status: "sent"
        };
      } catch (err) {
        console.error(`Failed SMS → ${contact.name}:`, err.message);
        return {
          contactName: contact.name,
          phone: contact.phone,
          status: "failed",
          error: err.message
        };
      }
    });

    return Promise.all(jobs);
  }

  /**
   * Manual test SMS
   */
  async sendSMS(to, message) {
    try {
      const formattedTo = this.formatPhoneNumber(to);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedTo
      });

      console.log(`SMS sent to ${formattedTo}: ${result.sid}`);
      return result;
    } catch (error) {
      console.error("SMS Send Error:", error.message);
      throw error;
    }
  }
}

export default new SMSService();
