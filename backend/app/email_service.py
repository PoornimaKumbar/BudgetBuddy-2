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

    If Resend cannot deliver the email, the OTP is logged for
    development/demo testing so the registration flow does not fail.

    IMPORTANT:
    The logged OTP fallback is intended ONLY for development/demo use.
    For real production email delivery to arbitrary recipients,
    configure a verified sending domain in Resend.
    """

    is_reset = purpose == "password_reset"
    action_label = "Password Reset" if is_reset else "Email Verification"

    logger.info(
        f"🔑 BudgetBuddy OTP generated ({action_label}) "
        f"for {to_email}. "
        f"Expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    )

    # ---------------------------------------------------------
    # RESEND API KEY CHECK
    # ---------------------------------------------------------
    if not settings.RESEND_API_KEY:
        logger.warning(
            "⚠️ RESEND_API_KEY is not configured. "
            "Using development OTP fallback."
        )

        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True

    try:
        # -----------------------------------------------------
        # RESEND CONFIGURATION
        # -----------------------------------------------------
        resend.api_key = settings.RESEND_API_KEY

        subject = (
            f"{otp_code} is your "
            f"BudgetBuddy {action_label} Code"
        )

        body_text = (
            f"BudgetBuddy {action_label}\n\n"
            f"Your 6-digit code is: {otp_code}\n\n"
            f"This code will expire in "
            f"{settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
            f"Your money. Your goals. Your future.\n\n"
            f"If you did not request this code, "
            f"please ignore this email."
        )

        # -----------------------------------------------------
        # HTML EMAIL
        # -----------------------------------------------------
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">
            <title>BudgetBuddy OTP</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f4f6f9;
            font-family: Arial, Helvetica, sans-serif;
        ">

            <div style="
                padding: 40px 20px;
            ">

                <div style="
                    max-width: 500px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 35px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                ">

                    <h2 style="
                        color: #2563eb;
                        margin-top: 0;
                        margin-bottom: 8px;
                        font-size: 28px;
                    ">
                        BudgetBuddy
                    </h2>

                    <p style="
                        font-size: 16px;
                        color: #374151;
                        margin-top: 0;
                    ">
                        Your money. Your goals. Your future.
                    </p>

                    <hr style="
                        border: 0;
                        border-top: 1px solid #e5e7eb;
                        margin: 25px 0;
                    " />

                    <p style="
                        font-size: 15px;
                        color: #4b5563;
                        line-height: 1.6;
                    ">
                        Please use the following 6-digit code
                        for
                        <strong>{action_label}</strong>:
                    </p>

                    <div style="
                        background-color: #eff6ff;
                        border: 1px dashed #3b82f6;
                        text-align: center;
                        padding: 18px;
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
                        line-height: 1.6;
                    ">
                        This code is valid for
                        {settings.OTP_EXPIRE_MINUTES}
                        minutes.
                    </p>

                    <p style="
                        font-size: 13px;
                        color: #6b7280;
                        line-height: 1.6;
                    ">
                        If you did not request this code,
                        please ignore this email.
                    </p>

                    <hr style="
                        border: 0;
                        border-top: 1px solid #e5e7eb;
                        margin: 25px 0;
                    " />

                    <p style="
                        font-size: 12px;
                        color: #9ca3af;
                        text-align: center;
                    ">
                        © BudgetBuddy
                    </p>

                </div>

            </div>

        </body>
        </html>
        """

        # -----------------------------------------------------
        # RESEND EMAIL PARAMETERS
        # -----------------------------------------------------
        params = {
            "from": "BudgetBuddy <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "text": body_text,
            "html": html,
        }

        # -----------------------------------------------------
        # SEND EMAIL
        # -----------------------------------------------------
        response = resend.Emails.send(params)

        logger.info(
            f"✅ OTP email request accepted by Resend "
            f"for {to_email}. "
            f"Response: {response}"
        )

        return True

    except Exception as e:

        # -----------------------------------------------------
        # RESEND FAILED
        # -----------------------------------------------------
        logger.error(
            f"❌ Resend email delivery failed for {to_email}: {e}"
        )

        # -----------------------------------------------------
        # DEVELOPMENT / DEMO FALLBACK
        # -----------------------------------------------------
        logger.warning(
            "⚠️ Using development OTP fallback."
        )

        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        logger.warning(
            "⚠️ This OTP fallback is for testing/demo only. "
            "For real email delivery, verify a domain in Resend."
        )

        # Return True so registration/OTP generation
        # can continue during development/demo.
        return True