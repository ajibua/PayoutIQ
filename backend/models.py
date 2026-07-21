import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Numeric, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

# We will use UUID stored as String or Dialect UUID for flexibility (SQLAlchemy supports standard UUID representation)
# String(36) is highly compatible with SQLite and Postgres
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    organization_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    created_batches = relationship("Batch", back_populates="created_by", foreign_keys="Batch.created_by_id")
    approved_batches = relationship("Batch", back_populates="approved_by", foreign_keys="Batch.approved_by_id")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    reference = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), default="DRAFT")  # DRAFT, VERIFYING, PENDING_APPROVAL, PENDING_OTP, PROCESSING, COMPLETED, FAILED
    total_amount = Column(Numeric(15, 2), default=0.0)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by = relationship("User", back_populates="created_batches", foreign_keys=[created_by_id])
    approved_by = relationship("User", back_populates="approved_batches", foreign_keys=[approved_by_id])
    payees = relationship("Payee", back_populates="batch", cascade="all, delete-orphan")

class Payee(Base):
    __tablename__ = "payees"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # Name extracted from the raw input
    verified_name = Column(String(255), nullable=True)  # Name verified from Monnify Name Enquiry
    account_number = Column(String(50), nullable=False)
    bank_name = Column(String(255), nullable=False)
    bank_code = Column(String(50), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), default="PENDING_VERIFICATION")  # PENDING_VERIFICATION, VERIFIED, FLAGGED, INVALID, SUCCESS, FAILED
    warning_details = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)
    reference = Column(String(100), unique=True, nullable=False, index=True)  # Unique reference for Monnify disbursements

    # Relationships
    batch = relationship("Batch", back_populates="payees")
