import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  verificationEmailTemplate,
  passwordResetOtpTemplate,
} from './template/mail.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  async sendVerificationOtp(email: string, username: string, otp: string) {
    const { subject, html } = verificationEmailTemplate(username, otp);
    await this.send(email, subject, html);
  }

  async sendPasswordResetOtp(email: string, username: string, otp: string) {
    const { subject, html } = passwordResetOtpTemplate(username, otp);
    await this.send(email, subject, html);
  }
}