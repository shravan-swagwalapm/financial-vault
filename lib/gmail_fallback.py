#!/usr/bin/env python3
"""
Gmail fallback: fetch transaction emails via Gmail API, parse with Claude, write JSON.
Usage: python lib/gmail_fallback.py
"""

import json
import hashlib
import base64
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import anthropic

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
DATA_PATH = Path(__file__).parent.parent / "data" / "transactions.json"
TOKEN_PATH = Path(__file__).parent / ".gmail_token.json"
CREDENTIALS_PATH = Path(__file__).parent / "credentials.json"

RATES_TO_INR = {
    "INR": 1, "USD": 84.5, "EUR": 92.0, "GBP": 107.0,
    "AED": 23.0, "SGD": 63.0, "JPY": 0.56,
}

SEARCH_QUERY = "subject:(charged OR debited OR payment OR transaction OR receipt OR invoice) newer_than:90d"

PARSE_PROMPT = """Extract transaction details from this email. Return ONLY valid JSON:
{{
  "merchant_name": "string",
  "amount": number,
  "currency": "INR|USD|EUR|GBP|AED|SGD|JPY",
  "date": "YYYY-MM-DD",
  "category": "Food|Shopping|Subscriptions|Travel|Bills|Entertainment|Health|Other"
}}

If this is NOT a transaction email, return: {{"skip": true}}

Email subject: {subject}
Email body:
{body}"""


def get_gmail_service():
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def fetch_emails(service, max_results=100):
    results = service.users().messages().list(
        userId="me", q=SEARCH_QUERY, maxResults=max_results
    ).execute()
    messages = results.get("messages", [])
    emails = []
    for msg in messages:
        full = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
        subject = headers.get("Subject", "")
        body = ""
        if "parts" in full["payload"]:
            for part in full["payload"]["parts"]:
                if part["mimeType"] == "text/plain" and "data" in part.get("body", {}):
                    body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
                    break
        elif "body" in full["payload"] and "data" in full["payload"]["body"]:
            body = base64.urlsafe_b64decode(full["payload"]["body"]["data"]).decode("utf-8", errors="replace")
        date_str = headers.get("Date", "")
        emails.append({"subject": subject, "body": body[:3000], "date": date_str})
    return emails


def parse_with_claude(emails):
    client = anthropic.Anthropic()
    transactions = []
    for email in emails:
        prompt = PARSE_PROMPT.format(subject=email["subject"], body=email["body"])
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            continue
        if parsed.get("skip"):
            continue
        tx_id = hashlib.md5(
            f"{parsed['date']}-{parsed['merchant_name']}-{parsed['amount']}-{parsed['currency']}".encode()
        ).hexdigest()[:12]
        rate = RATES_TO_INR.get(parsed["currency"], 1)
        transactions.append({
            "id": tx_id,
            "merchant_name": parsed["merchant_name"],
            "amount": parsed["amount"],
            "currency": parsed["currency"],
            "amount_inr": round(parsed["amount"] * rate, 2),
            "date": parsed["date"],
            "category": parsed["category"],
            "original_subject": email["subject"],
        })
    return transactions


def main():
    print("Authenticating with Gmail...")
    service = get_gmail_service()
    print("Fetching transaction emails (last 90 days)...")
    emails = fetch_emails(service)
    print(f"Found {len(emails)} potential transaction emails")
    print("Parsing with Claude...")
    transactions = parse_with_claude(emails)
    existing = []
    if DATA_PATH.exists():
        existing = json.loads(DATA_PATH.read_text())
    all_tx = {t["id"]: t for t in existing}
    for t in transactions:
        all_tx[t["id"]] = t
    final = sorted(all_tx.values(), key=lambda t: t["date"], reverse=True)
    DATA_PATH.parent.mkdir(exist_ok=True)
    DATA_PATH.write_text(json.dumps(final, indent=2))
    categories = set(t["category"] for t in final)
    total = sum(t["amount_inr"] for t in final)
    print(f"Done! {len(final)} transactions, {len(categories)} categories, total: INR {total:,.0f}")


if __name__ == "__main__":
    main()
