const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.initialize();
  }

  initialize() {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio SMS service initialized');
      } else {
        console.log('⚠️ Twilio credentials not found. SMS service disabled.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Twilio SMS service:', error);
    }
  }

  isAvailable() {
    return this.client !== null && this.phoneNumber;
  }

  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return phone;
    }
    
    return `+1${cleaned}`;
  }

  async sendSMS(to, message) {
    if (!this.isAvailable()) {
      console.error('SMS service not available');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const formattedTo = this.formatPhoneNumber(to);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: formattedTo
      });

      console.log('✅ SMS sent successfully:', result.sid);
      return { 
        success: true, 
        messageId: result.sid,
        status: result.status 
      };
    } catch (error) {
      console.error('❌ SMS send error:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code 
      };
    }
  }

  // Phone verification code
  async sendVerificationCode(phone, code) {
    const message = `Your SkinSense verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    
    return this.sendSMS(phone, message);
  }

  // Appointment confirmation SMS
  async sendAppointmentConfirmation(booking) {
    const date = booking.appointmentDate.toLocaleDateString();
    const time = booking.appointmentTime;
    const serviceName = booking.service?.name || 'Service';
    
    const message = `SkinSense: Your ${serviceName} appointment is confirmed for ${date} at ${time}. We look forward to seeing you! Reply STOP to opt out.`;
    
    return this.sendSMS(booking.clientInfo.phone, message);
  }

  // Appointment reminder SMS
  async sendAppointmentReminder(booking) {
    const date = booking.appointmentDate.toLocaleDateString();
    const time = booking.appointmentTime;
    const serviceName = booking.service?.name || 'Service';
    
    const message = `SkinSense Reminder: You have a ${serviceName} appointment tomorrow (${date}) at ${time}. Please arrive 15 minutes early. Reply CANCEL to cancel or STOP to opt out.`;
    
    return this.sendSMS(booking.clientInfo.phone, message);
  }

  // Appointment cancellation SMS
  async sendAppointmentCancellation(booking) {
    const date = booking.appointmentDate.toLocaleDateString();
    const time = booking.appointmentTime;
    const serviceName = booking.service?.name || 'Service';
    
    let message = `SkinSense: Your ${serviceName} appointment on ${date} at ${time} has been cancelled.`;
    
    if (booking.cancellation?.refundAmount > 0) {
      message += ` A refund of $${booking.cancellation.refundAmount.toFixed(2)} will be processed within 3-5 business days.`;
    }
    
    message += ' We hope to see you again soon! Reply STOP to opt out.';
    
    return this.sendSMS(booking.clientInfo.phone, message);
  }

  // Appointment rescheduled SMS
  async sendAppointmentRescheduled(booking) {
    const newDate = booking.appointmentDate.toLocaleDateString();
    const newTime = booking.appointmentTime;
    const serviceName = booking.service?.name || 'Service';
    
    const message = `SkinSense: Your ${serviceName} appointment has been rescheduled to ${newDate} at ${newTime}. Please save this new date and time. Reply STOP to opt out.`;
    
    return this.sendSMS(booking.clientInfo.phone, message);
  }

  // Check-in reminder (day of appointment)
  async sendCheckInReminder(booking) {
    const time = booking.appointmentTime;
    const serviceName = booking.service?.name || 'Service';
    
    const message = `SkinSense: Your ${serviceName} appointment is today at ${time}. Please arrive 15 minutes early for check-in. See you soon! Reply STOP to opt out.`;
    
    return this.sendSMS(booking.clientInfo.phone, message);
  }

  // Welcome SMS for new users
  async sendWelcomeSMS(user) {
    const message = `Welcome to SkinSense, ${user.firstName}! We're excited to help you achieve your skincare goals. Visit our website to book your first appointment. Reply STOP to opt out.`;
    
    return this.sendSMS(user.phone, message);
  }

  // Password reset SMS (as backup to email)
  async sendPasswordResetSMS(user, code) {
    const message = `SkinSense: Your password reset code is: ${code}. This code expires in 10 minutes. If you didn't request this, please ignore. Reply STOP to opt out.`;
    
    return this.sendSMS(user.phone, message);
  }

  // Treatment follow-up SMS
  async sendTreatmentFollowUp(booking) {
    const serviceName = booking.service?.name || 'treatment';
    
    const message = `SkinSense: How did you like your ${serviceName}? We'd love your feedback! Visit our website to leave a review and book your next appointment. Reply STOP to opt out.`;
    
    return this.sendSMS(booking.clientInfo.phone, message);
  }

  // Birthday wishes (for marketing)
  async sendBirthdayWish(user) {
    const message = `Happy Birthday from SkinSense, ${user.firstName}! 🎉 Treat yourself to a special skincare session. Use code BIRTHDAY20 for 20% off your next appointment. Reply STOP to opt out.`;
    
    return this.sendSMS(user.phone, message);
  }

  // Promotional SMS
  async sendPromotionalSMS(user, promotion) {
    const message = `SkinSense: ${promotion.message} Book now to take advantage of this limited-time offer! Visit our website or call us. Reply STOP to opt out.`;
    
    return this.sendSMS(user.phone, message);
  }

  // Bulk SMS for marketing campaigns
  async sendBulkSMS(phoneNumbers, message) {
    if (!this.isAvailable()) {
      return { success: false, error: 'SMS service not configured' };
    }

    const results = [];
    const maxConcurrent = 5; // Limit concurrent requests
    
    for (let i = 0; i < phoneNumbers.length; i += maxConcurrent) {
      const batch = phoneNumbers.slice(i, i + maxConcurrent);
      
      const promises = batch.map(async (phone) => {
        try {
          const result = await this.sendSMS(phone, message);
          return { phone, ...result };
        } catch (error) {
          return { phone, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + maxConcurrent < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Bulk SMS completed: ${successful} successful, ${failed} failed`);
    
    return {
      success: failed === 0,
      totalSent: successful,
      totalFailed: failed,
      results: results
    };
  }

  // Check SMS delivery status
  async checkDeliveryStatus(messageId) {
    if (!this.isAvailable()) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      
      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      console.error('Error checking SMS delivery status:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle incoming SMS webhooks (for two-way messaging)
  handleIncomingSMS(req, res) {
    const { Body, From, To } = req.body;
    
    console.log(`Incoming SMS from ${From}: ${Body}`);
    
    // Handle common responses
    const body = Body.toLowerCase().trim();
    
    if (body === 'stop' || body === 'unsubscribe') {
      // Handle opt-out
      this.handleOptOut(From);
      
      const response = new twilio.twiml.MessagingResponse();
      response.message('You have been unsubscribed from SkinSense SMS notifications.');
      
      res.type('text/xml');
      return res.send(response.toString());
    }
    
    if (body === 'help' || body === 'info') {
      const response = new twilio.twiml.MessagingResponse();
      response.message('SkinSense: Reply STOP to unsubscribe. For appointments, visit our website or call us.');
      
      res.type('text/xml');
      return res.send(response.toString());
    }
    
    // Log for manual review
    console.log('SMS requires manual review:', { from: From, message: Body });
    
    res.status(200).send('OK');
  }

  // Handle SMS opt-out
  async handleOptOut(phoneNumber) {
    try {
      // Update user's SMS preference in database
      const User = require('../models/User');
      await User.updateOne(
        { phone: this.formatPhoneNumber(phoneNumber) },
        { 'preferences.smsNotifications': false }
      );
      
      console.log(`User opted out of SMS: ${phoneNumber}`);
    } catch (error) {
      console.error('Error handling SMS opt-out:', error);
    }
  }

  // Test SMS functionality
  async sendTestSMS(to) {
    const message = `SkinSense SMS Test: This is a test message sent at ${new Date().toLocaleString()}. SMS service is working correctly!`;
    
    return this.sendSMS(to, message);
  }

  // Get account info
  async getAccountInfo() {
    if (!this.isAvailable()) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      
      return {
        success: true,
        accountSid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      };
    } catch (error) {
      console.error('Error getting Twilio account info:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const smsService = new SMSService();
module.exports = smsService;
