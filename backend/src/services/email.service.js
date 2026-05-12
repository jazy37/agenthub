const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);


async function sendVerificationEmail(email, verificationToken, firstName) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  try {
    await resend.emails.send({
      from: 'AgentHub Account Verification <no-reply@agenthub.pl>',
      to: [email],
      subject: 'Zweryfikuj swoje konto AgentHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weryfikacja konta</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #111827; padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">AgentHub</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">
                        Witaj ${firstName}!
                      </h2>
                      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Dziękujemy za rejestrację w AgentHub. Aby aktywować swoje konto i rozpocząć korzystanie z naszej platformy, kliknij poniższy przycisk:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <a href="${verificationUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Zweryfikuj swoje konto
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Jeśli nie zakładałeś konta w AgentHub, zignoruj tę wiadomość.
                      </p>

                      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Link weryfikacyjny wygasa po 12 godzinach.
                      </p>

                      <!-- Alternative link -->
                      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                          Jeśli przycisk nie działa, skopiuj i wklej poniższy link w przeglądarce:
                        </p>
                        <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        © ${new Date().getFullYear()} AgentHub. Wszelkie prawa zastrzeżone.
                      </p>
                      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                        Platforma do tworzenia AI agentów
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`✉️ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email to user
 */
async function sendPasswordResetEmail(email, resetToken, firstName) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: 'AgentHub Password Recovery <no-reply@agenthub.pl>',
      to: [email],
      subject: 'Zresetuj swoje hasło w AgentHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resetowanie hasła</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #111827; padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">AgentHub</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">
                        Witaj ${firstName}!
                      </h2>
                      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Otrzymaliśmy prośbę o reset hasła dla Twojego konta w AgentHub. Aby ustawić nowe hasło, kliknij poniższy przycisk:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Zresetuj hasło
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Jeśli to nie Ty prosiłeś o reset hasła, możesz zignorować tę wiadomość. Twoje hasło pozostanie bez zmian.
                      </p>

                      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Link wygasa po 1 godzinie.
                      </p>

                      <!-- Alternative link -->
                      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                          Jeśli przycisk nie działa, skopiuj i wklej poniższy link w przeglądarce:
                        </p>
                        <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all;">
                          ${resetUrl}
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        © ${new Date().getFullYear()} AgentHub. Wszelkie prawa zastrzeżone.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`✉️ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
