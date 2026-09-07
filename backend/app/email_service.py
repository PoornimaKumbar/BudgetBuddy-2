import logging
import resend

from app.config import settings

logger = logging.getLogger("budgetbuddy_email")
logger.setLevel(logging.INFO)


def send_otp_email(
    to_email: str,
    otp_code: str,
    purpose: str = "email_verification"
) -> bool:
    """
    Sends a 6-digit OTP email using Resend.
    Supports:
      - email_verification
      - password_reset
    """

    is_reset = purpose == "password_reset"
    action_label = "Password Reset" if is_reset else "Email Verification"

    logger.info(
        f"🔑 BudgetBuddy OTP generated ({action_label}) "
        f"for {to_email}. Expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    )

    if not settings.RESEND_API_KEY:
        logger.error("❌ RESEND_API_KEY is not configured.")
        return False

    try:
        resend.api_key = settings.RESEND_API_KEY

        subject = f"{otp_code} is your BudgetBuddy {action_label} Code"

        body_text = (
            f"BudgetBuddy {action_label}\n\n"
            f"Your 6-digit code is: {otp_code}\n\n"
            f"This code will expire in "
            f"{settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
            f"Your money. Your goals. Your future."
        )

        html = f"""
        <html>
          <body style="
            font-family: Arial, sans-serif;
            background-color: #f4f6f9;
            padding: 20px;
          ">
            <div style="
              max-width: 500px;
              margin: 0 auto;
              background: #ffffff;
              padding: 30px;
              border-radius: 12px;
            ">

              <h2 style="
                color: #2563eb;
                margin-top: 0;
              ">
                BudgetBuddy
              </h2>

              <p style="
                font-size: 16px;
                color: #374151;
              ">
                Your money. Your goals. Your future.
              </p>

              <hr style="
                border: 0;
                border-top: 1px solid #e5e7eb;
                margin: 20px 0;
              " />

              <p style="
                font-size: 15px;
                color: #4b5563;
              ">
                Please use the following 6-digit code for
                <strong>{action_label}</strong>:
              </p>

              <div style="
                background-color: #eff6ff;
                border: 1px dashed #3b82f6;
                text-align: center;
                padding: 15px;
                border-radius: 8px;
                margin: 25px 0;
              ">
                <span style="
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 6px;
                  color: #1d4ed8;
                ">
                  {otp_code}
                </span>
              </div>

              <p style="
                font-size: 13px;
                color: #6b7280;
              ">
                This code is valid for
                {settings.OTP_EXPIRE_MINUTES} minutes.
                If you did not request this code, please ignore this email.
              </p>

            </div>
          </body>
        </html>
        """

        params = {
            "from": "BudgetBuddy <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "text": body_text,
            "html": html,
        }

        response = resend.Emails.send(params)

        logger.info(
            f"✅ OTP email successfully sent to {to_email}. "
            f"Resend response: {response}"
        )

        return True

    except Exception as e:
        logger.exception(f"❌ Resend email delivery failed: {e}")
        return False