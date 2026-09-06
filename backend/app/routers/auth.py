from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Profile, EmailOTP
from app import schemas, security
from app.email_service import send_otp_email
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check existing user
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        if not existing_user.is_email_verified:
            # Re-send OTP for unverified account
            otp_code = security.generate_otp_code()
            otp_hash = security.hash_otp(otp_code)
            expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

            new_otp = EmailOTP(
                user_id=existing_user.id,
                otp_hash=otp_hash,
                expires_at=expires_at,
                purpose="email_verification"
            )
            db.add(new_otp)
            db.commit()

            send_otp_email(existing_user.email, otp_code, purpose="email_verification")

            return {
                "message": "Account registered previously but unverified. Verification code sent to email.",
                "email": existing_user.email,
                "is_email_verified": False
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered and verified. Please login instead."
            )

    # Password strength check
    strength, missing = security.evaluate_password_strength(user_in.password)
    if strength == "Weak":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password is too weak. Missing requirements: {', '.join(missing)}"
        )

    # Create new user
    hashed_pwd = security.get_password_hash(user_in.password)
    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        is_email_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create profile
    new_profile = Profile(
        user_id=new_user.id,
        full_name=new_user.full_name,
        currency="INR (₹)"
    )
    db.add(new_profile)

    # Generate 6-digit OTP
    otp_code = security.generate_otp_code()
    otp_hash = security.hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp = EmailOTP(
        user_id=new_user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        purpose="email_verification"
    )
    db.add(new_otp)
    db.commit()

    # Send OTP
    send_otp_email(user_in.email, otp_code, purpose="email_verification")

    return {
        "message": "User registered successfully. Verification code sent to email.",
        "email": user_in.email,
        "is_email_verified": False
    }

@router.post("/admin/register", status_code=status.HTTP_201_CREATED)
def admin_register(admin_in: schemas.AdminRegister, db: Session = Depends(get_db)):
    if admin_in.admin_key != settings.ADMIN_REGISTRATION_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Admin Registration Key."
        )

    # Check existing user
    existing_user = db.query(User).filter(User.email == admin_in.email).first()
    if existing_user:
        if not existing_user.is_email_verified:
            # Re-send OTP for unverified account
            otp_code = security.generate_otp_code()
            otp_hash = security.hash_otp(otp_code)
            expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

            new_otp = EmailOTP(
                user_id=existing_user.id,
                otp_hash=otp_hash,
                expires_at=expires_at,
                purpose="email_verification"
            )
            db.add(new_otp)
            db.commit()

            send_otp_email(existing_user.email, otp_code, purpose="email_verification")

            return {
                "message": "Account registered previously but unverified. Verification code sent to email.",
                "email": existing_user.email,
                "is_email_verified": False
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered and verified. Please login instead."
            )

    # Password strength check
    strength, missing = security.evaluate_password_strength(admin_in.password)
    if strength == "Weak":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password is too weak. Missing requirements: {', '.join(missing)}"
        )

    # Create new admin user
    hashed_pwd = security.get_password_hash(admin_in.password)
    new_user = User(
        full_name=admin_in.full_name,
        email=admin_in.email,
        hashed_password=hashed_pwd,
        is_email_verified=False,
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create profile
    new_profile = Profile(
        user_id=new_user.id,
        full_name=new_user.full_name,
        currency="INR (₹)"
    )
    db.add(new_profile)

    # Generate 6-digit OTP
    otp_code = security.generate_otp_code()
    otp_hash = security.hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp = EmailOTP(
        user_id=new_user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        purpose="email_verification"
    )
    db.add(new_otp)
    db.commit()

    # Send OTP
    send_otp_email(admin_in.email, otp_code, purpose="email_verification")

    return {
        "message": "Admin user registered successfully. Verification code sent to email.",
        "email": admin_in.email,
        "is_email_verified": False
    }



@router.post("/send-otp")
def send_otp(payload: schemas.OTPResend, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email was not found")

    if user.is_email_verified and payload.purpose == "email_verification":
        return {"message": "Email is already verified"}

    otp_code = security.generate_otp_code()
    otp_hash = security.hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp = EmailOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        purpose=payload.purpose
    )
    db.add(new_otp)
    db.commit()

    send_otp_email(user.email, otp_code, purpose=payload.purpose)
    return {"message": "Verification code sent to email"}


@router.post("/verify-otp")
def verify_otp(payload: schemas.OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_email_verified and payload.purpose == "email_verification":
        access_token = security.create_access_token(data={"sub": user.email})
        return {
            "message": "Email is already verified",
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserOut.model_validate(user)
        }

    # Fetch latest OTP for this purpose
    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.user_id == user.id, EmailOTP.purpose == payload.purpose)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not latest_otp:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")

    if latest_otp.verified_at is not None:
        raise HTTPException(status_code=400, detail="OTP has already been used")

    if latest_otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")

    if latest_otp.attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

    latest_otp.attempts += 1
    db.commit()

    # Verify code
    if not security.verify_otp_hash(payload.otp, latest_otp.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Mark verified
    latest_otp.verified_at = datetime.utcnow()
    if payload.purpose == "email_verification":
        user.is_email_verified = True
        
        # Transform email if user is admin
        if user.role == "admin":
            base_email = user.email.split('@')[0]
            new_email = f"{base_email}@budgetbuddy.com"
            # Ensure no conflict
            conflict = db.query(User).filter(User.email == new_email).first()
            if not conflict:
                user.email = new_email
            
    db.commit()
    db.refresh(user)

    # Create JWT
    access_token = security.create_access_token(data={"sub": user.email})
    return {
        "message": "Email verified successfully!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserOut.model_validate(user)
    }


@router.post("/resend-otp")
def resend_otp(payload: schemas.OTPResend, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_email_verified and payload.purpose == "email_verification":
        return {"message": "Email is already verified"}

    # Cooldown check: max 1 per 30 sec
    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.user_id == user.id, EmailOTP.purpose == payload.purpose)
        .order_by(EmailOTP.created_at.desc())
        .first()
    )
    if latest_otp and (datetime.utcnow() - latest_otp.created_at) < timedelta(seconds=30):
        raise HTTPException(status_code=429, detail="Please wait 30 seconds before requesting another code.")

    otp_code = security.generate_otp_code()
    otp_hash = security.hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp = EmailOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        purpose=payload.purpose
    )
    db.add(new_otp)
    db.commit()

    send_otp_email(user.email, otp_code, purpose=payload.purpose)
    return {"message": "A new verification code has been sent to your email."}


@router.post("/forgot-password/send-otp")
@router.post("/forgot-password")
def forgot_password_send_otp(payload: schemas.ForgotPasswordSendOTP, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email was not found")

    if not user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="unverified_email")

    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "password_reset")
        .order_by(EmailOTP.created_at.desc())
        .first()
    )
    if latest_otp and (datetime.utcnow() - latest_otp.created_at) < timedelta(seconds=30):
        raise HTTPException(status_code=429, detail="Please wait 30 seconds before requesting another code.")

    otp_code = security.generate_otp_code()
    otp_hash = security.hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp = EmailOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        purpose="password_reset"
    )
    db.add(new_otp)
    db.commit()

    send_otp_email(user.email, otp_code, purpose="password_reset")
    return {"message": "OTP sent to your registered email.", "email": user.email}


@router.post("/forgot-password/verify-otp")
def forgot_password_verify_otp(payload: schemas.ForgotPasswordVerifyOTP, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email was not found")

    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "password_reset")
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not latest_otp:
        raise HTTPException(status_code=400, detail="No password reset OTP requested for this email")

    if latest_otp.verified_at is not None:
        return {"message": "OTP already verified. You may proceed to reset password.", "verified": True}

    if latest_otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")

    if latest_otp.attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

    latest_otp.attempts += 1
    db.commit()

    if not security.verify_otp_hash(payload.otp, latest_otp.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    latest_otp.verified_at = datetime.utcnow()
    db.commit()

    return {"message": "OTP verified successfully. You may now reset your password.", "verified": True}


@router.post("/forgot-password/reset")
def forgot_password_reset(payload: schemas.ForgotPasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "password_reset")
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not latest_otp or latest_otp.verified_at is None:
        raise HTTPException(status_code=400, detail="OTP verification required before resetting password.")

    if (datetime.utcnow() - latest_otp.verified_at) > timedelta(minutes=15):
        raise HTTPException(status_code=400, detail="Password reset session expired. Please request a new OTP.")

    # Validate new password strength
    strength, missing = security.evaluate_password_strength(payload.new_password)
    if strength == "Weak":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"New password is too weak. Missing requirements: {', '.join(missing)}"
        )

    # Hash & save new password
    user.hashed_password = security.get_password_hash(payload.new_password)
    db.query(EmailOTP).filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "password_reset").delete()
    db.commit()

    return {"message": "Password reset successfully. Please login with your new password."}


@router.put("/change-password")
@router.put("/me/password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    strength, missing = security.evaluate_password_strength(payload.new_password)
    if strength == "Weak":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"New password is too weak. Missing requirements: {', '.join(missing)}"
        )

    current_user.hashed_password = security.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.delete("/me")
@router.delete("/me/account")
def delete_account(
    payload: schemas.AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    if not payload.password and not payload.otp:
        raise HTTPException(status_code=400, detail="Password or OTP is required for account deletion.")

    if payload.password:
        if not security.verify_password(payload.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password. Account deletion canceled."
            )
    elif payload.otp:
        latest_otp = (
            db.query(EmailOTP)
            .filter(EmailOTP.user_id == current_user.id, EmailOTP.purpose == "password_reset")
            .order_by(EmailOTP.created_at.desc())
            .first()
        )
        if not latest_otp or not latest_otp.verified_at:
            raise HTTPException(status_code=400, detail="Verified OTP required to delete account.")
            
        if (datetime.utcnow() - latest_otp.verified_at) > timedelta(minutes=15):
            raise HTTPException(status_code=400, detail="OTP session expired. Please request a new OTP.")

    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully."}


@router.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email with OTP before logging in."
        )

    access_token = security.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserOut.model_validate(user)
    }


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: User = Depends(security.get_current_user)):
    return current_user

@router.post("/upgrade-premium")
def upgrade_premium(db: Session = Depends(get_db), current_user: User = Depends(security.get_current_user)):
    if current_user.role == "admin":
        return {"message": "Admin already has premium features."}
    
    current_user.role = "premium"
    db.commit()
    return {"message": "Upgraded to Premium"}
