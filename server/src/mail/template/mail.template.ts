export function verificationEmailTemplate(username: string, otp: string) {
  return {
    subject: 'Verify your email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome, ${username} 👋</h2>
        <p>Thanks for signing up. Use the code below to verify your email address.</p>
        <p style="text-align:center; margin: 32px 0;">
          <span style="display:inline-block; background:#F3F4F6; color:#111827;
             font-size:32px; font-weight:700; letter-spacing:8px; padding:16px 24px;
             border-radius:8px;">
            ${otp}
          </span>
        </p>
        <p style="color:#888;font-size:12px;">This code expires in 10 minutes. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  };
}

export function passwordResetOtpTemplate(username: string, otp: string) {
  return {
    subject: 'Reset your password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Hi ${username},</h2>
        <p>We received a request to reset your password. Use the code below to continue.</p>
        <p style="text-align:center; margin: 32px 0;">
          <span style="display:inline-block; background:#F3F4F6; color:#111827;
             font-size:32px; font-weight:700; letter-spacing:8px; padding:16px 24px;
             border-radius:8px;">
            ${otp}
          </span>
        </p>
        <p style="color:#888;font-size:12px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}