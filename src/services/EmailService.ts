import { createTransport, Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

class EmailService {
  private mailer: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.mailer = createTransport({
      host: process.env.SMTP_HOST ?? "localhost",
      port: 25,
      secure: false,
    });
  }

  async sendEmail(options: Mail.Options) {
    await this.mailer.sendMail(options);
  }
}

export default new EmailService();
