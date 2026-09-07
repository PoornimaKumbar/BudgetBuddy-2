import logging
import requests

from app.config import settings


logger = logging.getLogger("budgetbuddy_email")
logger.setLevel(logging.INFO)

SENDLIB_API_URL = "https://sendlib.samueltuoyo.com/api/send"


def send_otp_email(
    to_email: str,
    otp_code: str,
    purpose: str = "email_verification",
) -> bool:
    """
    Send an OTP email through Sendlib.

    Sendlib uses a connected Gmail account, so users can receive
    OTP emails without BudgetBuddy needing its own email domain.

    Returns:
        True  -> email request succeeded or development fallback is used
        False -> reserved for future strict failure handling
    """

    is_reset = purpose == "password_reset"

    if is_reset:
        action_label = "Password Reset"
    else:
        action_label = "Email Verification"

    logger.info(
        f"📧 Preparing {action_label} OTP email for {to_email}"
    )

    # ---------------------------------------------------------
    # Get API key and remove accidental spaces/newlines
    # ---------------------------------------------------------
    sendlib_api_key = (settings.SENDLIB_API_KEY or "").strip()

    if not sendlib_api_key:
        logger.error("❌ SENDLIB_API_KEY is not configured.")
        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )
        return True

    # ---------------------------------------------------------
    # Send OTP through Sendlib
    # ---------------------------------------------------------
    try:
        payload = {
            "template": "otp",
            "to": to_email,
            "data": {
                "code": otp_code,
                "name": "BudgetBuddy User",
            },
        }

        headers = {
            "Authorization": f"Bearer {sendlib_api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            SENDLIB_API_URL,
            json=payload,
            headers=headers,
            timeout=30,
        )

        # -----------------------------------------------------
        # Successful Sendlib response
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
        # Sendlib returned an error
        # -----------------------------------------------------
        logger.error(
            f"❌ Sendlib returned HTTP {response.status_code}: "
            f"{response.text}"
        )

        # Development fallback so registration itself doesn't fail
        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True

    except requests.exceptions.RequestException as e:
        logger.exception(
            f"❌ Sendlib email delivery failed for {to_email}: {e}"
        )

        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True

    except Exception as e:
        logger.exception(
            f"❌ Unexpected email delivery error for {to_email}: {e}"
        )

        logger.warning(
            f"🔐 DEVELOPMENT OTP for {to_email}: {otp_code}"
        )

        return True