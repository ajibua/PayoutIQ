import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Batch, Payee

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payouts/webhook", tags=["webhooks"])

@router.post("")
async def monnify_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Listens to real-time disbursement callbacks from Monnify.
    Updates the transaction and batch records accordingly.
    """
    try:
        payload = await request.json()
        logger.info(f"Received Webhook from Monnify: {payload}")
    except Exception as e:
        logger.error(f"Failed to parse webhook JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_type = payload.get("eventType")
    if event_type != "DISBURSEMENT_STATUS":
        # We only handle disbursement status events
        return {"status": "ignored", "reason": f"Unhandled event type: {event_type}"}

    event_data = payload.get("eventData", {})
    txn_ref = event_data.get("reference")
    status = event_data.get("status")  # SUCCESSFUL, FAILED, REJECTED
    fail_reason = event_data.get("failedPaymentReason")

    if not txn_ref:
        raise HTTPException(status_code=400, detail="Missing reference in webhook payload.")

    # Find the payee
    payee = db.query(Payee).filter(Payee.reference == txn_ref).first()
    if not payee:
        logger.warning(f"Webhook transaction reference {txn_ref} not found in database.")
        return {"status": "ignored", "reason": "Reference not found."}

    # Update payee status
    if status == "SUCCESSFUL":
        payee.status = "SUCCESS"
        payee.failure_reason = None
    elif status in ["FAILED", "REJECTED"]:
        payee.status = "FAILED"
        payee.failure_reason = fail_reason or "Disbursement failed at bank processing."

    db.commit()

    # Re-evaluate entire batch status
    batch_id = payee.batch_id
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if batch:
        all_payees = db.query(Payee).filter(Payee.batch_id == batch_id).all()
        
        pending_count = sum(1 for p in all_payees if p.status in ["PENDING_VERIFICATION", "VERIFYING", "PROCESSING"])
        failed_count = sum(1 for p in all_payees if p.status == "FAILED")
        success_count = sum(1 for p in all_payees if p.status == "SUCCESS")
        
        if pending_count == 0:
            if failed_count == len(all_payees):
                batch.status = "FAILED"
            else:
                batch.status = "COMPLETED"
            db.commit()
            logger.info(f"Batch {batch_id} marked as {batch.status} via webhook update.")
        else:
            batch.status = "PROCESSING"
            db.commit()

    return {"status": "success", "message": "Record updated."}
