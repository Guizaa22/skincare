const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.templates = new Map();
  }

  createTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async loadTemplate(templateName) {
    try {
      if (this.templates.has(templateName)) {
        return this.templates.get(templateName);
      }

      const templatePath = path.join(__dirname, '../views/emails', `${templateName}.html`);
      const template = await fs.readFile(templatePath, 'utf8');
      this.templates.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      // Return basic template if file doesn't exist
      return this.getBasicTemplate();
    }
  }

  getBasicTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>{{subject}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{businessName}}</h1>
          </div>
          <div class="content">
            {{content}}
          </div>
          <div class="footer">
            <p>{{businessName}} | {{businessAddress}}</p>
            <p>{{businessPhone}} | {{businessEmail}}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  replaceVariables(template, variables) {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    return result;
  }

  async sendEmail({ to, subject, template, variables = {}, attachments = [] }) {
    try {
      const htmlTemplate = await this.loadTemplate(template);
      
      const defaultVariables = {
        businessName: process.env.BUSINESS_NAME || 'SkinSense',
        businessEmail: process.env.BUSINESS_EMAIL || 'info@skinsense.com',
        businessPhone: process.env.BUSINESS_PHONE || '+1234567890',
        businessAddress: process.env.BUSINESS_ADDRESS || '123 Beauty Street, Skincare City',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        subject: subject
      };

      const allVariables = { ...defaultVariables, ...variables };
      const html = this.replaceVariables(htmlTemplate, allVariables);

      const mailOptions = {
        from: `"${defaultVariables.businessName}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        attachments: attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Welcome email after registration
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to SkinSense - Your Journey to Beautiful Skin Begins!',
      template: 'welcome',
      variables: {
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    });
  }

  // Email verification
  async sendEmailVerification(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address - SkinSense',
      template: 'email-verification',
      variables: {
        firstName: user.firstName,
        verificationUrl: verificationUrl,
        token: token
      }
    });
  }

  // Password reset email
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password - SkinSense',
      template: 'password-reset',
      variables: {
        firstName: user.firstName,
        resetUrl: resetUrl,
        token: token
      }
    });
  }

  // Appointment confirmation
  async sendAppointmentConfirmation(booking) {
    const appointmentDate = booking.appointmentDate.toLocaleDateString();
    const appointmentTime = booking.appointmentTime;
    
    return this.sendEmail({
      to: booking.clientInfo.email,
      subject: 'Appointment Confirmed - SkinSense',
      template: 'appointment-confirmation',
      variables: {
        firstName: booking.clientInfo.firstName,
        serviceName: booking.service.name,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        duration: booking.duration,
        totalAmount: booking.formattedAmount,
        invoiceNumber: booking.invoiceNumber,
        notes: booking.notes.client || '',
        manageBookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking._id}`
      }
    });
  }

  // Appointment reminder
  async sendAppointmentReminder(booking) {
    const appointmentDate = booking.appointmentDate.toLocaleDateString();
    const appointmentTime = booking.appointmentTime;
    
    return this.sendEmail({
      to: booking.clientInfo.email,
      subject: 'Appointment Reminder - SkinSense Tomorrow',
      template: 'appointment-reminder',
      variables: {
        firstName: booking.clientInfo.firstName,
        serviceName: booking.service.name,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        duration: booking.duration,
        totalAmount: booking.formattedAmount,
        notes: booking.notes.client || '',
        rescheduleUrl: `${process.env.FRONTEND_URL}/bookings/${booking._id}/reschedule`,
        cancelUrl: `${process.env.FRONTEND_URL}/bookings/${booking._id}/cancel`
      }
    });
  }

  // Appointment cancellation
  async sendAppointmentCancellation(booking) {
    const appointmentDate = booking.appointmentDate.toLocaleDateString();
    const appointmentTime = booking.appointmentTime;
    
    return this.sendEmail({
      to: booking.clientInfo.email,
      subject: 'Appointment Cancelled - SkinSense',
      template: 'appointment-cancellation',
      variables: {
        firstName: booking.clientInfo.firstName,
        serviceName: booking.service.name,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        cancellationReason: booking.cancellation.reason || 'No reason provided',
        refundAmount: booking.cancellation.refundAmount > 0 ? `$${booking.cancellation.refundAmount.toFixed(2)}` : '0',
        rebookUrl: `${process.env.FRONTEND_URL}/booking`
      }
    });
  }

  // Appointment rescheduled
  async sendAppointmentRescheduled(booking) {
    const newDate = booking.appointmentDate.toLocaleDateString();
    const newTime = booking.appointmentTime;
    const originalDate = booking.rescheduling.originalDate.toLocaleDateString();
    const originalTime = booking.rescheduling.originalTime;
    
    return this.sendEmail({
      to: booking.clientInfo.email,
      subject: 'Appointment Rescheduled - SkinSense',
      template: 'appointment-rescheduled',
      variables: {
        firstName: booking.clientInfo.firstName,
        serviceName: booking.service.name,
        originalDate: originalDate,
        originalTime: originalTime,
        newDate: newDate,
        newTime: newTime,
        reason: booking.rescheduling.reason || 'Schedule conflict',
        manageBookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking._id}`
      }
    });
  }

  // Treatment completion follow-up
  async sendTreatmentFollowUp(booking) {
    return this.sendEmail({
      to: booking.clientInfo.email,
      subject: 'How was your SkinSense treatment?',
      template: 'treatment-followup',
      variables: {
        firstName: booking.clientInfo.firstName,
        serviceName: booking.service.name,
        treatmentDate: booking.appointmentDate.toLocaleDateString(),
        reviewUrl: `${process.env.FRONTEND_URL}/review/${booking._id}`,
        rebookUrl: `${process.env.FRONTEND_URL}/booking`,
        aftercareInstructions: booking.treatmentPlan.homecarePlan?.join(', ') || 'Follow general skincare routine'
      }
    });
  }

  // Newsletter subscription confirmation
  async sendNewsletterConfirmation(email, name) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to SkinSense Newsletter!',
      template: 'newsletter-confirmation',
      variables: {
        firstName: name,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`
      }
    });
  }

  // Contact form submission acknowledgment
  async sendContactConfirmation(contactData) {
    return this.sendEmail({
      to: contactData.email,
      subject: 'We received your message - SkinSense',
      template: 'contact-confirmation',
      variables: {
        name: contactData.name,
        subject: contactData.subject,
        message: contactData.message
      }
    });
  }

  // Admin notification for new contact form
  async sendContactNotification(contactData) {
    return this.sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.BUSINESS_EMAIL,
      subject: `New Contact Form Submission: ${contactData.subject}`,
      template: 'contact-notification',
      variables: {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || 'Not provided',
        subject: contactData.subject,
        message: contactData.message,
        submittedAt: new Date().toLocaleString()
      }
    });
  }

  // Test email functionality
  async sendTestEmail(to) {
    return this.sendEmail({
      to: to,
      subject: 'SkinSense Email Service Test',
      template: 'test',
      variables: {
        testTime: new Date().toLocaleString(),
        message: 'This is a test email to verify the email service is working correctly.'
      }
    });
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
