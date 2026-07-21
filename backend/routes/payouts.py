import re
import uuid
import logging
import asyncio
from typing import List, Optional, Dict, Any
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal
from database import get_db
from models import User, Batch, Payee
from routes.auth import get_current_user
from services.gemini_service import GeminiService
from services.monnify_service import MonnifyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payouts", tags=["payouts"])

gemini_service = GeminiService()
monnify_service = MonnifyService()

# Schemas
class ParseRequest(BaseModel):
    text: str

class PayeeEdit(BaseModel):
    name: str
    account_number: str
    bank_name: str
    bank_code: str
    amount: float

class CreateBatchRequest(BaseModel):
    title: str
    narration: Optional[str] = "PayoutIQ bulk pay"
    payees: List[PayeeEdit]

class OtpConfirmRequest(BaseModel):
    otp: str

# Helpers
def clean_account(acct: str) -> str:
    return "".join(filter(str.isdigit, acct))

def check_name_match(extracted_name: str, verified_name: str) -> bool:
    if not extracted_name or not verified_name:
        return False
    # Clean and split into words
    words1 = set(re.findall(r'\w+', extracted_name.lower()))
    words2 = set(re.findall(r'\w+', verified_name.lower()))
    # Remove common short words or corporate suffixes
    ignore_words = {"ltd", "limited", "and", "sons", "plc", "ventures", "enterprises", "corp", "inc", "co", "mfb"}
    words1 = {w for w in words1 if len(w) > 2 and w not in ignore_words}
    words2 = {w for w in words2 if len(w) > 2 and w not in ignore_words}
    
    if not words1 or not words2:
        # If words list is empty, fallback to basic subset match
        return extracted_name.lower() in verified_name.lower() or verified_name.lower() in extracted_name.lower()
        
    return len(words1.intersection(words2)) > 0

# Async Background Runner for Payout Batches (Simulation / Webhook mimic)
async def process_batch_payments(batch_id: str, db_session_factory):
    """
    Simulates the background payment execution.
    For each payee, we update their status sequentially to show real-time progress on UI.
    """
    # Sleep to simulate queue delay
    await asyncio.sleep(2.0)
    
    # We open a new database session inside the thread/task
    db = db_session_factory()
    try:
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not batch:
            return
            
        batch.status = "PROCESSING"
        db.commit()
        
        payees = db.query(Payee).filter(Payee.batch_id == batch_id).all()
        
        for payee in payees:
            if payee.status in ["SUCCESS", "FAILED"]:
                continue
                
            # Simulate execution time per payment
            await asyncio.sleep(1.5)
            
            if payee.account_number.startswith("9"):
                payee.status = "FAILED"
                payee.failure_reason = "INVALID_ACCOUNT: Recipient bank account number does not exist."
            elif payee.account_number.startswith("8") or payee.amount > 1000000:
                payee.status = "FAILED"
                payee.failure_reason = "LIMIT_EXCEEDED: Transfer amount exceeds wallet limit or daily caps."
            else:
                payee.status = "SUCCESS"
                payee.failure_reason = None
                
            db.commit()
            
        # Update overall batch status
        all_payees = db.query(Payee).filter(Payee.batch_id == batch_id).all()
        failed_count = sum(1 for p in all_payees if p.status == "FAILED")
        
        if failed_count == len(all_payees):
            batch.status = "FAILED"
        else:
            batch.status = "COMPLETED"
            
        db.commit()
        logger.info(f"Batch {batch_id} execution completed in background.")
    except Exception as e:
        logger.error(f"Error executing batch {batch_id} in background: {str(e)}")
        if batch:
            batch.status = "FAILED"
            db.commit()
    finally:
        db.close()

# Routes
@router.get("/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    res = await monnify_service.get_wallet_balance()
    if res["success"]:
        return {"balance": res["balance"], "currency": res["currency"]}
    raise HTTPException(status_code=500, detail=res.get("error_message", "Failed to retrieve balance"))

@router.get("/banks")
async def get_banks(current_user: User = Depends(get_current_user)):
    banks = await monnify_service.get_banks()
    return {"banks": banks}

class SingleVerifyRequest(BaseModel):
    name: str
    account_number: str
    bank_code: str

@router.post("/verify")
async def verify_single_account(payload: SingleVerifyRequest, current_user: User = Depends(get_current_user)):
    """
    Validates a single account number and checks name match for in-line edits.
    """
    acct = clean_account(payload.account_number)
    enquiry = await monnify_service.validate_account(acct, payload.bank_code)
    
    status_flag = "VERIFIED"
    warning_details = None
    verified_name = enquiry.get("account_name")
    
    if not enquiry["valid"]:
        status_flag = "INVALID"
        warning_details = enquiry.get("error_message", "Invalid Account Number.")
    else:
        matched = check_name_match(payload.name, verified_name)
        if not matched:
            status_flag = "FLAGGED"
            warning_details = f"NAME_MISMATCH: Extracted name '{payload.name}' does not match bank record '{verified_name}'."

    return {
        "verified_name": verified_name,
        "status": status_flag,
        "warning_details": warning_details
    }

@router.post("/parse")
async def parse_messy_payouts(payload: ParseRequest, current_user: User = Depends(get_current_user)):
    """
    Parses messy text using Gemini, then automatically calls Monnify Name Enquiry
    for every account to verify it and flag warnings/mismatches.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Payout text cannot be empty.")
        
    # 1. AI extraction
    extracted_payees = await gemini_service.extract_payout_list(payload.text)
    
    # 2. Get official bank code map
    banks = await monnify_service.get_banks()
    bank_map = {b["name"].lower(): b["code"] for b in banks}
    
    # Simple bank name fuzzy lookup
    def find_bank_code(bank_name: str) -> tuple:
        b_clean = bank_name.lower().strip()
        # Direct matches
        if b_clean in bank_map:
            return bank_map[b_clean], bank_name
            
        # Common aliases mapping
        aliases = {
            "gtb": "guaranty trust bank",
            "gt bank": "guaranty trust bank",
            "access": "access bank",
            "uba": "united bank for africa (uba)",
            "first bank": "first bank of nigeria",
            "fbn": "first bank of nigeria",
            "fcmb": "first city monument bank (fcmb)",
            "zenith": "zenith bank",
            "sterling": "sterling bank",
            "union": "union bank of nigeria",
            "wema": "wema bank",
            "opay": "opay digital services (opay)",
            "palmpay": "palmpay",
            "moniepoint": "moniepoint mfb"
        }
        for alias, formal_name in aliases.items():
            if alias in b_clean or b_clean in alias:
                formal_code = bank_map.get(formal_name.lower())
                if formal_code:
                    return formal_code, formal_name
                    
        # Substring fuzzy match
        for formal_name, code in bank_map.items():
            if formal_name in b_clean or b_clean in formal_name:
                return code, formal_name
                
        # Defaults to Zenith Bank if not found during sandbox
        return "057", "Zenith Bank"

    # 3. Verify accounts and generate warnings
    verified_results = []
    account_counts = {}
    
    # Pre-count occurrences of each account number to detect duplicates
    for p in extracted_payees:
        acct = clean_account(p["account_number"])
        account_counts[acct] = account_counts.get(acct, 0) + 1

    for p in extracted_payees:
        raw_name = p["name"]
        acct = clean_account(p["account_number"])
        bank_name_extracted = p["bank_name"]
        amount = p["amount"]
        
        bank_code, bank_formal_name = find_bank_code(bank_name_extracted)
        
        # Name Enquiry
        enquiry = await monnify_service.validate_account(acct, bank_code)
        
        status_flag = "VERIFIED"
        warning_details = None
        verified_name = enquiry.get("account_name")
        
        if not enquiry["valid"]:
            status_flag = "INVALID"
            warning_details = enquiry.get("error_message", "Invalid Account Number.")
        else:
            # Check name match
            matched = check_name_match(raw_name, verified_name)
            
            # Check duplicate
            is_duplicate = account_counts.get(acct, 0) > 1
            
            warnings = []
            if not matched:
                warnings.append(f"NAME_MISMATCH: Extracted name '{raw_name}' does not match bank record '{verified_name}'.")
            if is_duplicate:
                warnings.append("DUPLICATE_ACCOUNT: This account number appears multiple times in this batch.")
                
            if warnings:
                status_flag = "FLAGGED"
                warning_details = " | ".join(warnings)

        verified_results.append({
            "name": raw_name,
            "verified_name": verified_name,
            "account_number": acct,
            "bank_name": bank_formal_name,
            "bank_code": bank_code,
            "amount": amount,
            "status": status_flag,
            "warning_details": warning_details
        })

    return {"payees": verified_results}

@router.post("/batches")
def create_batch(payload: CreateBatchRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Saves the payout batch and payee details to the database under DRAFT state.
    """
    if not payload.payees:
        raise HTTPException(status_code=400, detail="Cannot create an empty payout batch.")

    batch_ref = f"BCH-{uuid.uuid4().hex[:10].upper()}"
    total_amount = sum(p.amount for p in payload.payees)
    
    batch = Batch(
        title=payload.title,
        reference=batch_ref,
        status="PENDING_APPROVAL",  
        total_amount=Decimal(total_amount),
        created_by_id=current_user.id
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    for idx, p in enumerate(payload.payees):
        txn_ref = f"TXN-{batch.reference}-{idx:03d}"
        payee = Payee(
            batch_id=batch.id,
            name=p.name,
            account_number=clean_account(p.account_number),
            bank_name=p.bank_name,
            bank_code=p.bank_code,
            amount=Decimal(p.amount),
            reference=txn_ref,
            status="PENDING_VERIFICATION"
        )
        db.add(payee)
        
    db.commit()
    return {"batch_id": batch.id, "reference": batch.reference, "total_amount": float(batch.total_amount)}

@router.get("/batches")
def get_batches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Lists the audit log of previous payment batches.
    """
    batches = db.query(Batch).order_by(Batch.created_at.desc()).all()
    results = []
    for b in batches:
        results.append({
            "id": b.id,
            "title": b.title,
            "reference": b.reference,
            "status": b.status,
            "total_amount": float(b.total_amount),
            "created_at": b.created_at.isoformat(),
            "created_by": f"{b.created_by.first_name} {b.created_by.last_name}" if b.created_by else "Unknown"
        })
    return results

@router.get("/batches/{batch_id}/status")
def get_batch_status(batch_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns real-time status of batch progress, total amounts, and transaction log.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Payout batch not found.")

    payees = db.query(Payee).filter(Payee.batch_id == batch_id).all()
    
    completed_count = sum(1 for p in payees if p.status == "SUCCESS")
    failed_count = sum(1 for p in payees if p.status == "FAILED")
    total_count = len(payees)

    payee_list = []
    for p in payees:
        payee_list.append({
            "id": p.id,
            "name": p.name,
            "account_number": p.account_number,
            "bank_name": p.bank_name,
            "amount": float(p.amount),
            "status": p.status,
            "failure_reason": p.failure_reason,
            "reference": p.reference
        })

    return {
        "id": batch.id,
        "title": batch.title,
        "reference": batch.reference,
        "status": batch.status,
        "total_amount": float(batch.total_amount),
        "total_count": total_count,
        "completed_count": completed_count,
        "failed_count": failed_count,
        "payees": payee_list
    }

@router.post("/batches/{batch_id}/confirm")
async def confirm_batch_disbursement(
    batch_id: str, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Triggers payment execution.
    Calls Monnify bulk transfer; pauses if OTP required.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    if batch.status not in ["PENDING_APPROVAL", "DRAFT"]:
        raise HTTPException(status_code=400, detail=f"Batch cannot be processed from its current state: {batch.status}")

    payees = db.query(Payee).filter(Payee.batch_id == batch_id).all()
    txns = [
        {
            "amount": float(p.amount),
            "reference": p.reference,
            "bank_code": p.bank_code,
            "account_number": p.account_number,
            "destination_account_name": p.verified_name or p.name
        }
        for p in payees
    ]

    # Initialize disbursement
    init_res = await monnify_service.init_bulk_transfer(
        batch_reference=batch.reference,
        title=batch.title,
        narration=f"PayoutIQ batch {batch.reference}",
        transactions=txns
    )

    if not init_res["success"]:
        batch.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail=init_res.get("error_message", "Monnify rejected the transaction"))

    batch.approved_by_id = current_user.id
    db.commit()

    if init_res["otp_required"]:
        batch.status = "PENDING_OTP"
        db.commit()
        return {"status": "PENDING_OTP", "message": init_res["message"]}
    batch.status = "PROCESSING"
   
    db.commit()
    
    background_tasks.add_task(process_batch_payments, batch.id, SessionLocal)
    
    return {"status": "PROCESSING", "message": "Disbursement successfully sent to queue."}

@router.post("/batches/{batch_id}/authorize")
async def authorize_batch_otp(
    batch_id: str,
    payload: OtpConfirmRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits OTP code to release the disbursement batch.
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    if batch.status != "PENDING_OTP":
        raise HTTPException(status_code=400, detail="This batch does not require OTP authorization.")

    # Call Monnify to authorize
    auth_res = await monnify_service.authorize_bulk_transfer(batch.reference, payload.otp)

    if not auth_res["success"]:
        raise HTTPException(status_code=400, detail=auth_res.get("error_message", "Invalid OTP code"))

    # Begin execution in background
    batch.status = "PROCESSING"
    db.commit()

    from database import SessionLocal
    background_tasks.add_task(process_batch_payments, batch.id, SessionLocal)

    return {"status": "PROCESSING", "message": "OTP verified. Processing bulk payouts."}
