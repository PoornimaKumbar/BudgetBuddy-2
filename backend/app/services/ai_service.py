import json
from typing import Dict, Any

from google import genai
from google.genai import types

from app.config import settings


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_API_KEY = getattr(settings, "GEMINI_API_KEY", None)

# Stable Gemini model currently supported by Google.
GEMINI_MODEL = "gemini-1.5-flash"

_client = None

if GEMINI_API_KEY:
    try:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        _client = None


# ============================================================
# COMMON AI CALL
# ============================================================

def _get_gemini_response(prompt: str) -> str:
    """
    Send a prompt to Gemini and return plain text.

    This function intentionally keeps all Gemini communication
    in one place so every AI feature behaves consistently.
    """

    if not GEMINI_API_KEY:
        return (
            "AI features require a valid GEMINI_API_KEY in the "
            "backend .env file."
        )

    if _client is None:
        return "Unable to initialize the Gemini AI client."

    try:
        response = _client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=4096,
            ),
        )

        text = getattr(response, "text", None)

        if not text:
            return "The AI service returned an empty response."

        return text.strip()

    except Exception as e:
        return f"Error communicating with AI service: {str(e)}"


# ============================================================
# DATA FORMATTER
# ============================================================

def _format_financial_data(financial_data: Dict[str, Any]) -> str:
    """
    Convert financial data into safe JSON for the AI prompt.
    """

    try:
        return json.dumps(
            financial_data,
            indent=2,
            ensure_ascii=False,
            default=str,
        )
    except Exception:
        return str(financial_data)


# ============================================================
# BUDGET SUGGESTIONS
# ============================================================

def generate_budget_suggestions(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI, a personal budgeting assistant.

Analyze ONLY the financial data supplied below.

IMPORTANT RULES:
1. Never invent income, expenses, balances, budgets, goals,
   transactions, or spending patterns.
2. If the financial data contains no income and no expenses,
   clearly say that personalized monetary budget limits cannot
   currently be calculated.
3. Do not pretend that ₹0 means the user has no real-world income.
   It only means there are no records in BudgetBuddy.
4. Do not fabricate recommendations such as ₹5,000 for food,
   ₹10,000 for rent, etc.
5. You may explain general budgeting principles, but clearly label
   them as general guidance rather than personalized calculations.
6. Use INR (₹) when the currency is INR.
7. Keep the report professional and easy to read.
8. This is budgeting guidance, not professional financial advice.

Return the following structure:

# BudgetBuddy AI Financial Advisory Report

## Financial Overview
- User
- Currency
- Total account balance
- Total income
- Total expenses
- Current surplus
- Number of income records
- Number of expense records
- Number of budgets
- Number of savings goals

## Spending Analysis
Explain the actual spending data.

## Recommended Budgets
If sufficient income and spending data exists:
- Recommend reasonable category budgets.
- Explain the reasoning.

If insufficient data exists:
- Clearly state why exact personalized budgets cannot yet
  be calculated.
- Do NOT invent monetary amounts.

## Savings Recommendation
Use actual financial data only.

## Actionable Recommendations
Give practical next steps based on the available data.

## Important Note
State that this is AI-generated budgeting guidance and not
professional financial advice.

Financial Data:
{data}
"""

    return _get_gemini_response(prompt)


# ============================================================
# EXPENSE INSIGHTS
# ============================================================

def generate_expense_insights(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI, an expense-analysis assistant.

Analyze ONLY the financial data below.

Identify:
1. Highest spending categories.
2. Total spending.
3. Unusual or unusually high expenses.
4. Potential areas for improvement.
5. Useful spending-management recommendations.

IMPORTANT:
- Never invent transactions.
- Never invent amounts.
- If there are zero expense records, explicitly say that
  there is currently no spending data to analyze.
- Do not call any transaction fraud.
- Use INR (₹) where applicable.
- Keep recommendations concise and practical.

Financial Data:
{data}

Return a clean Markdown report.
"""

    return _get_gemini_response(prompt)


# ============================================================
# MONTHLY SUMMARY
# ============================================================

def generate_monthly_summary(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI.

Create a short monthly financial summary based ONLY on the
provided financial data.

Include:
- Income
- Expenses
- Savings/surplus
- Important observations
- One practical financial tip

IMPORTANT:
Do not invent missing information.

If there is no financial data, say that BudgetBuddy currently
does not have enough recorded financial activity to calculate
a personalized monthly summary.

Keep the response to approximately 3-5 sentences.

Financial Data:
{data}
"""

    return _get_gemini_response(prompt)


# ============================================================
# SAVING ADVISOR
# ============================================================

def generate_saving_advisor(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI, a savings planning assistant.

Analyze the user's savings goals, income, expenses, and accounts.

If savings goals contain:
- target amount
- current saved amount
- deadline

calculate a reasonable daily, weekly, and monthly saving amount
where enough information exists.

IMPORTANT:
- Never invent a savings goal.
- Never invent income.
- Never invent dates.
- Never claim a saving amount is possible if the financial data
  does not support it.
- If there are no savings goals, clearly explain that the user
  needs to create a savings goal first.

Financial Data:
{data}

Return a clear Markdown response.
"""

    return _get_gemini_response(prompt)


# ============================================================
# EXPENSE FORECAST
# ============================================================

def generate_forecast(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI.

Forecast next month's expenses using ONLY the historical expense
data supplied below.

Requirements:
- Use actual historical spending patterns.
- Identify categories with sufficient history.
- Do not invent categories.
- Do not invent transactions.
- Clearly label all predictions as AI estimates.
- If there is insufficient historical data, return exactly:

"Not enough data to generate a reliable forecast yet."

Financial Data:
{data}
"""

    return _get_gemini_response(prompt)


# ============================================================
# CHAT ASSISTANT
# ============================================================

def chat_with_assistant(
    financial_data: Dict[str, Any],
    question: str
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI Chat Assistant.

You are ONLY allowed to help with:
- budgeting
- income
- expenses
- savings goals
- accounts
- financial reports
- spending analysis
- financial insights
- BudgetBuddy features related to personal finance

The user has asked:

{question}

IMPORTANT:

1. Answer using ONLY the authorized financial data supplied below.
2. Never invent financial information.
3. Never reveal information belonging to another user.
4. Never provide unrelated general knowledge.
5. If the question is unrelated to BudgetBuddy finance,
   respond EXACTLY with:

This question is not related to BudgetBuddy. I can only help with budgeting, income, expenses, savings goals, reports, and financial insights.

6. If the question is financial but the answer cannot be determined
   from the supplied data, say that the information is not available
   in the user's BudgetBuddy data.
7. Do not fabricate amounts.
8. Be concise and helpful.
9. Financial guidance is informational and not professional financial advice.

Authorized Financial Data:
{data}

User Question:
{question}
"""

    return _get_gemini_response(prompt)


# ============================================================
# OVERSPENDING PREDICTION
# ============================================================

def generate_overspending_prediction(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI.

Analyze actual spending against actual budgets.

Estimate whether the user may exceed their budget by the end
of the current month.

IMPORTANT:
- Clearly label the result as an AI estimate.
- Use only supplied data.
- Never invent budgets.
- Never invent expenses.
- If there are no budgets or expenses, explain that there is
  insufficient data for an overspending prediction.

Financial Data:
{data}

Return a concise Markdown report.
"""

    return _get_gemini_response(prompt)


# ============================================================
# PERSONALIZED TIPS
# ============================================================

def generate_personalized_tips(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI.

Give 2-3 personalized financial tips based ONLY on the user's
actual financial data.

IMPORTANT:
- Do not invent information.
- Do not create fictional spending amounts.
- If there is no financial data, provide useful setup/tracking
  tips instead of pretending they are personalized financial
  recommendations.

Financial Data:
{data}

Keep the response short and actionable.
"""

    return _get_gemini_response(prompt)


# ============================================================
# BUDGET HEALTH
# ============================================================

def generate_budget_health(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI.

Evaluate the user's budgeting health using actual:
- income
- expenses
- budget utilization
- savings
- account information

If enough information exists, provide a score out of 100.

Use this format:

# Budget Health

Score: X/100

Status: Good / Fair / Needs Attention

Positive:
- ...

Needs Attention:
- ...

IMPORTANT:
- Never invent financial values.
- If there is insufficient data, say that a reliable score
  cannot yet be calculated.
- Do not call this a credit score.
- Do not present it as an official financial score.

Financial Data:
{data}
"""

    return _get_gemini_response(prompt)


# ============================================================
# TRANSACTION CATEGORIZATION
# ============================================================

def categorize_transaction(description: str) -> str:

    prompt = f"""
Classify this transaction description into EXACTLY ONE of these
categories:

Food
Travel
Shopping
Education
Entertainment
Bills
Healthcare
Rent
Groceries
Transportation
Other

Transaction description:
"{description}"

Return ONLY the category name.

Do not return explanations.
Do not return Markdown.
"""

    result = _get_gemini_response(prompt)

    if not result:
        return "Other"

    if result.startswith("Error communicating"):
        return "Other"

    if "API_KEY" in result:
        return "Other"

    valid_categories = {
        "Food",
        "Travel",
        "Shopping",
        "Education",
        "Entertainment",
        "Bills",
        "Healthcare",
        "Rent",
        "Groceries",
        "Transportation",
        "Other",
    }

    cleaned = result.strip()

    for category in valid_categories:
        if cleaned.lower() == category.lower():
            return category

    return "Other"


# ============================================================
# ANOMALY DETECTION
# ============================================================

def generate_anomaly_detection(
    financial_data: Dict[str, Any]
) -> str:

    data = _format_financial_data(financial_data)

    prompt = f"""
You are BudgetBuddy AI.

Analyze the user's expense history and identify unusually high
transactions compared with the user's normal spending patterns.

IMPORTANT:
- Compare transactions against the user's own historical data.
- Do not invent normal spending levels.
- Do not call anything fraud.
- If there are no expenses, clearly say there are no transactions
  available for anomaly analysis.
- Clearly distinguish observations from AI estimates.

Financial Data:
{data}

Return a concise Markdown report.
"""

    return _get_gemini_response(prompt)

