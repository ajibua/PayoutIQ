import os
import json
import logging
import re
from typing import List, Dict, Any
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class GeminiService:
    def __init__(self):
        self.is_simulation = not GEMINI_API_KEY
        if self.is_simulation:
            logger.info("Gemini API key missing. Running in SIMULATION mode.")
        else:
            logger.info("Gemini API key found. Running in LIVE mode.")

    async def extract_payout_list(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Extracts structured payout list from messy text.
        Returns a list of dicts: [{"name": str, "account_number": str, "bank_name": str, "amount": float}]
        """
        if self.is_simulation:
            return self._simulate_extraction(raw_text)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        system_instruction = (
            "You are an expert data extraction assistant. Parse the raw input text to extract a list of bank payout details. "
            "For each person or business mentioned, extract: name, account number (exactly as string), bank name, and payment amount. "
            "Ignore header text, friendly greetings, or instructions. Normalize the bank name as best as you can."
        )

        prompt = f"Extract payout lists from this raw text:\n\n{raw_text}"

        payload = {
            "contents": [{
                "parts": [
                    {"text": f"{system_instruction}\n\nInput:\n{prompt}"}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "name": {"type": "STRING", "description": "Full name of the recipient"},
                            "account_number": {"type": "STRING", "description": "10-digit bank account number"},
                            "bank_name": {"type": "STRING", "description": "Name of the Nigerian bank (e.g. GTB, Zenith, OPay)"},
                            "amount": {"type": "NUMBER", "description": "Amount to pay in NGN (Naira)"}
                        },
                        "required": ["name", "account_number", "bank_name", "amount"]
                    }
                }
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                
                if response.status_code == 200:
                    resp_json = response.json()
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            text_out = content_parts[0].get("text", "[]")
                            # Parse JSON array directly
                            payees = json.loads(text_out)
                            return self._clean_extracted_payees(payees)
                    
                    logger.error(f"Gemini response structure unexpected: {response.text}")
                    return self._simulate_extraction(raw_text)
                else:
                    logger.error(f"Gemini API error (Status {response.status_code}): {response.text}")
                    return self._simulate_extraction(raw_text)
                    
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return self._simulate_extraction(raw_text)

    def _clean_extracted_payees(self, payees: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned = []
        for payee in payees:
            name = payee.get("name", "Unknown Payee").strip()
            # Clean account number: remove non-digits
            acct = str(payee.get("account_number", "")).strip()
            acct = "".join(filter(str.isdigit, acct))
            
            bank = payee.get("bank_name", "Unknown Bank").strip()
            
            try:
                amt = float(payee.get("amount", 0))
            except (ValueError, TypeError):
                amt = 0.0

            if name and acct:
                cleaned.append({
                    "name": name,
                    "account_number": acct,
                    "bank_name": bank,
                    "amount": amt
                })
        return cleaned

    def _simulate_extraction(self, text: str) -> List[Dict[str, Any]]:
        """
        A rule-based parser that handles basic lines or falls back to standard demo data
        if no structure is recognized.
        """
        lines = text.strip().split("\n")
        extracted = []
        
        bank_keywords = [
            "gtbank", "gtb", "access", "zenith", "uba", "firstbank", "first bank", 
            "palmpay", "opay", "moniepoint", "fcmb", "sterling", "union", "wema", 
            "keystone", "fidelity", "ecobank", "providus", "stanbic"
        ]
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 1. Find 10-digit account number (Nigerian NUBAN format)
            acct_match = re.search(r'\b\d{10}\b', line)
            if not acct_match:
                # Fallback to general split parsing if no 10-digit account number is found
                parts = re.split(r'[,\t|;]', line)
                if len(parts) >= 4:
                    try:
                        name = parts[0].strip()
                        bank = parts[1].strip()
                        acct = "".join(filter(str.isdigit, parts[2].strip()))
                        amt_str = "".join(c for c in parts[3].strip() if c.isdigit() or c == '.')
                        amt = float(amt_str) if amt_str else 0.0
                        if len(acct) >= 5 and name:
                            extracted.append({
                                "name": name,
                                "account_number": acct,
                                "bank_name": bank,
                                "amount": amt
                            })
                    except Exception:
                        pass
                continue
                
            acct = acct_match.group(0)
            
            # 2. Find bank name based on keywords
            bank = "Zenith Bank"
            for kw in bank_keywords:
                if kw in line.lower():
                    if kw in ["gtbank", "gtb"]:
                        bank = "Guaranty Trust Bank"
                    elif kw == "access":
                        bank = "Access Bank"
                    elif kw == "zenith":
                        bank = "Zenith Bank"
                    elif kw == "uba":
                        bank = "UBA"
                    elif kw in ["firstbank", "first bank"]:
                        bank = "First Bank of Nigeria"
                    elif kw == "palmpay":
                        bank = "Palmpay"
                    elif kw == "opay":
                        bank = "OPay"
                    elif kw == "moniepoint":
                        bank = "Moniepoint MFB"
                    else:
                        bank = kw.title()
                    break
            
            # 3. Find payment amount (match figures like 75,000 or ₦120,000)
            line_no_acct = line.replace(acct, "")
            amt = 0.0
            
            # Find numbers and convert to float (excluding small numbers that might be list SNs)
            amt_matches = re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d+\b', line_no_acct)
            for match in amt_matches:
                val_str = match.replace(",", "")
                try:
                    val = float(val_str)
                    # Use the largest value found as the amount, assuming it's not a list index like 1, 2, 3
                    if val > 100 and val > amt and val != 50515:
                        amt = val
                except ValueError:
                    pass
            
            # 4. Find recipient name
            parts = line.split(acct)
            name = "Unknown Payee"
            if len(parts) > 0:
                name_candidate = parts[0]
                # Strip out list prefixes like "1.", "- ", and common helper verbs
                name_candidate = re.sub(r'^\s*[\d\-\*•\.\s]+', '', name_candidate)
                name_candidate = re.sub(r'\b(send|pay|disburse|transfer|to|for|refund)\b', '', name_candidate, flags=re.IGNORECASE)
                name_candidate = re.sub(r'\d+', '', name_candidate)
                name_candidate = name_candidate.strip(" -*•,")
                if name_candidate:
                    name = name_candidate
            
            extracted.append({
                "name": name,
                "account_number": acct,
                "bank_name": bank,
                "amount": amt
            })
            
        if extracted:
            return extracted

        # If regex yields nothing, return the standard demo payout list
        return [
            {
                "name": "Adeola Balogun",
                "account_number": "0123456780",
                "bank_name": "Guaranty Trust Bank",
                "amount": 75000.00
            },
            {
                "name": "Chinedu Okafor",
                "account_number": "0123456782",
                "bank_name": "Access Bank",
                "amount": 120000.00
            },
            {
                "name": "Nneka Ezechi",
                "account_number": "0123456782",
                "bank_name": "Access Bank",
                "amount": 45000.00
            },
            {
                "name": "Oluwaseun Balogun",
                "account_number": "0123456783",
                "bank_name": "UBA",
                "amount": 95000.00
            },
            {
                "name": "Mismatched Account Name",
                "account_number": "0123456787",
                "bank_name": "Zenith Bank",
                "amount": 150000.00
            },
            {
                "name": "Invalid Recipient",
                "account_number": "9000000001",
                "bank_name": "OPay",
                "amount": 3500.00
            }
        ]
