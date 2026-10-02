import "dotenv/config";
import nodemailer from "nodemailer";
import type { SendMailOptions, Transporter } from "nodemailer";
import type React from "react";
import { render } from "@react-email/render";

export interface SendEmailOptions extends Omit<SendMailOptions, 'html' | 'text'> {
  template: React.ReactElement; // accepts react components as mail body
  fallbackText?: string;        // if not then use regular string 
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Universal method to send emails that use TSX components in the body
  async send(options: SendEmailOptions) {
    const { template, fallbackText, ...nodemailerOptions } = options;

    try {
      // Render the React template into an HTML string
      const html = await render(template);
  
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"My App" <no-reply@yourapp.com>', // Default sender if not provided
        ...nodemailerOptions,
        html,
        ...(fallbackText && { text: fallbackText }), // add text body if provided
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }
  }
}

// 1. Export a SINGLETON INSTANCE to reuse the same SMTP connection pool globally
export const emailService = new EmailService();

// 2. Export a HELPER FUNCTION for simple drop-in usage anywhere in your controllers
export const sendEmail = async (options: SendEmailOptions) => {
  return await emailService.send(options);
};