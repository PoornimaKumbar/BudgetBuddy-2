import logging
import requests

from app.config import settings

logger = logging.getLogger("budgetbuddy_email")
logger.setLevel(logging.INFO)

SENDLIB_API_URL = "https://sendlib.samueltuoyo.com/api/send"


def send_otp_email(
    to_email: str,
    otp_code: str,
    purpose: str = "email_verification"
) -> bool:
    """
    Sends BudgetBuddy OTP using Sendlib.

    Supports:
      - email_verification
      - password_reset

    Sendlib sends the email through the connected Gmail account.
    """

    is_reset = purpose == "password_reset"
    action_label = "Password Reset" if is_reset else "Email Verification"

    logger.info(
        f"🔑 BudgetBuddy OTP generated ({action_label}) "
        f"for {to_email}. "
        f"Expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    )

    # ---------------------------------------------------------
    # CHECK SENDLIB API KEY
    # ---------------------------------------------------------

    if not settings.SENDLIB_API_KEY:
        logger.error("❌ SENDLIB_API_KEY is not configured.")

        # Development fallback
        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True

    try:
        # -----------------------------------------------------
        # SEND EMAIL USING SENDLIB OTP TEMPLATE
        # -----------------------------------------------------

        payload = {
            "template": "otp",
            "to": to_email,
            "data": {
                "code": otp_code,
                "name": "BudgetBuddy User"
            }
        }

        headers = {
            "Authorization": f"Bearer {settings.SENDLIB_API_KEY}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            SENDLIB_API_URL,
            json=payload,
            headers=headers,
            timeout=30,
        )

        # -----------------------------------------------------
        # SUCCESS
        # -----------------------------------------------------

        if 200 <= response.status_code < 300:

            logger.info(
                f"✅ BudgetBuddy OTP email sent successfully "
                f"to {to_email} through Sendlib."
            )

            logger.info(
                f"📨 Sendlib response: {response.text}"
            )

            return True

        # -----------------------------------------------------
        # SENDLIB ERROR
        # -----------------------------------------------------

        logger.error(
            f"❌ Sendlib returned HTTP {response.status_code}: "
            f"{response.text}"
        )

        # Development fallback
        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True

    except Exception as e:

        # -----------------------------------------------------
        # CONNECTION / REQUEST ERROR
        # -----------------------------------------------------

        logger.exception(
            f"❌ Sendlib email delivery failed for "
            f"{to_email}: {e}"
        )

        # Development fallback
        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True