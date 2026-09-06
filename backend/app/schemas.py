import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator

# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str

    @field_validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values.data and v != values.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class AdminRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str
    admin_key: str = Field(..., description="Secret key required to register as admin")


    @field_validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values.data and v != values.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    purpose: str = Field(default="email_verification")


class OTPResend(BaseModel):
    email: EmailStr
    purpose: str = Field(default="email_verification")


class ForgotPasswordSendOTP(BaseModel):
    email: EmailStr


class ForgotPasswordVerifyOTP(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ForgotPasswordReset(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)
    confirm_password: str

    @field_validator("confirm_password")
    def passwords_match(cls, v, values):
        if "new_password" in values.data and v != values.data["new_password"]:
            raise ValueError("New password and confirm password do not match")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
    confirm_password: str

    @field_validator("confirm_password")
    def passwords_match(cls, v, values):
        if "new_password" in values.data and v != values.data["new_password"]:
            raise ValueError("New password and confirm password do not match")
        return v


class AccountDeleteRequest(BaseModel):
    password: Optional[str] = None
    otp: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    is_email_verified: bool
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str = Field(..., description="user, premium, admin")


class ProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    currency: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None


# --- Account Schemas ---
class AccountCreate(BaseModel):
    bank_name: str = Field(..., min_length=2, max_length=100)
    account_name: Optional[str] = Field(default=None, max_length=100)
    account_type: str = Field(..., description="Bank Account, Savings Account, Current Account, UPI, Wallet, Cash")
    opening_balance: float = Field(default=0.0, ge=0.0)
    last4: Optional[str] = Field(default=None, max_length=10)


class AccountUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    opening_balance: Optional[float] = Field(default=None, ge=0.0)
    last4: Optional[str] = None


class AccountOut(BaseModel):
    id: int
    user_id: int
    bank_name: str
    account_name: str
    account_type: str
    opening_balance: float
    current_balance: float
    last4: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Income Schemas ---
class IncomeCreate(BaseModel):
    account_id: int
    source: str = Field(..., description="Salary, Freelancing, Scholarship, Business, Gift, Other")
    amount: float = Field(..., gt=0.0, description="Amount must be greater than 0")
    date: Optional[datetime.datetime] = None
    notes: str = Field(..., min_length=1, description="Description/notes are required")


class IncomeUpdate(BaseModel):
    account_id: Optional[int] = None
    source: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0.0)
    date: Optional[datetime.datetime] = None
    notes: Optional[str] = Field(default=None, min_length=1)


class IncomeOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    source: str
    amount: float
    date: datetime.datetime
    notes: Optional[str] = None
    created_at: datetime.datetime
    account_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Expense Schemas ---
class ExpenseCreate(BaseModel):
    account_id: int
    title: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., description="Food, Travel, Shopping, Education, Entertainment, Bills, Healthcare, Rent, Groceries, Transportation, Other")
    amount: float = Field(..., gt=0.0, description="Amount must be greater than 0")
    payment_method: str = Field(..., description="UPI, Debit Card, Credit Card, Bank Transfer, Cash, Wallet")
    card_type: Optional[str] = None
    card_last4: Optional[str] = Field(default=None, max_length=10)
    date: Optional[datetime.datetime] = None
    description: str = Field(..., min_length=1, description="Description/notes are required")


class ExpenseUpdate(BaseModel):
    account_id: Optional[int] = None
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0.0)
    payment_method: Optional[str] = None
    card_type: Optional[str] = None
    card_last4: Optional[str] = None
    date: Optional[datetime.datetime] = None
    description: Optional[str] = Field(default=None, min_length=1)


class ExpenseOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    title: str
    category: str
    amount: float
    payment_method: str
    card_type: Optional[str] = None
    card_last4: Optional[str] = None
    date: datetime.datetime
    description: Optional[str] = None
    created_at: datetime.datetime
    account_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Budget Schemas ---
class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float = Field(..., gt=0.0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    monthly_limit: Optional[float] = Field(default=None, gt=0.0)
    month: Optional[int] = Field(default=None, ge=1, le=12)
    year: Optional[int] = Field(default=None, ge=2000, le=2100)


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    spent_amount: float = 0.0
    remaining_amount: float = 0.0
    utilization_percentage: float = 0.0
    is_exceeded: bool = False
    month: int
    year: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Savings Goal Schemas ---
class SavingsGoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    target_amount: float = Field(..., gt=0.0)
    current_amount: float = Field(default=0.0, ge=0.0)
    target_date: datetime.datetime
    goal_type: str = Field(default="other")
    status: str = Field(default="in_progress")


class SavingsGoalCreate(SavingsGoalBase):
    account_id: Optional[int] = Field(default=None, description="Account ID to deduct the initial saved amount from")
class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    target_amount: Optional[float] = Field(default=None, gt=0.0)
    target_date: Optional[datetime.datetime] = None
    goal_type: Optional[str] = None
    status: Optional[str] = None


class ContributionRequest(BaseModel):
    amount: float = Field(..., gt=0.0, description="Contribution amount must be greater than 0")
    account_id: int = Field(..., description="ID of the bank account to contribute from")


class GoalContributionOut(BaseModel):
    id: int
    user_id: int
    goal_id: int
    account_id: int
    amount: float
    previous_amount: float
    new_amount: float
    date: datetime.datetime
    description: Optional[str] = None
    created_at: datetime.datetime
    account_name: Optional[str] = None
    progress: float = 0.0

    class Config:
        from_attributes = True


class SavingsGoalOut(BaseModel):
    id: int
    user_id: int
    title: str
    target_amount: float
    current_amount: float
    remaining_amount: float = 0.0
    progress_percentage: float = 0.0
    target_date: datetime.datetime
    status: str
    goal_type: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    last_contribution_amount: Optional[float] = None
    last_contribution_date: Optional[datetime.datetime] = None
    contributions: List[GoalContributionOut] = []

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    message: str
    rich_text: Optional[str] = None
    type: str
    is_read: bool
    created_at: datetime.datetime
    formatted_date: Optional[str] = None

    class Config:
        from_attributes = True

    @field_validator('formatted_date', mode='before')
    def default_formatted_date(cls, v, values):
        if 'created_at' in values.data:
            dt = values.data['created_at']
            # created_at is naive UTC from DB usually.
            import pytz
            utc_dt = dt.replace(tzinfo=pytz.utc) if dt.tzinfo is None else dt
            ist_tz = pytz.timezone('Asia/Kolkata')
            ist_dt = utc_dt.astimezone(ist_tz)
            return ist_dt.strftime("%d %B %Y, %I:%M %p IST")
        return v
class ContributionResponse(BaseModel):
    goal: SavingsGoalOut
    notification: Optional[NotificationOut] = None

class BulkDeleteRequest(BaseModel):
    notification_ids: List[int]


# --- Analytics & Summary Schemas ---
class AnalyticsSummaryOut(BaseModel):
    total_income: float
    total_expenses: float
    remaining_balance: float
    total_savings: float
    savings_rate: float
    active_goals_count: int
    completed_goals_count: int
    total_budget: float
    total_budget_spent: float
    budget_usage_percentage: float

