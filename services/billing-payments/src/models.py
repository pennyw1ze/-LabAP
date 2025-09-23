from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

db = SQLAlchemy()

class Bill(db.Model):
    __tablename__ = 'bills'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_number = db.Column(db.String(50), unique=True, nullable=False)
    order_id = db.Column(UUID(as_uuid=True), nullable=False, unique=True)  # Reference to order service
    order_number = db.Column(db.String(50), nullable=False)  # Cached for performance
    customer_name = db.Column(db.String(100))
    table_number = db.Column(db.Integer)
    
    # Amounts
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    tip_amount = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Status
    status = db.Column(db.Enum('pending', 'paid', 'partially_paid', 'refunded', 'cancelled', name='bill_status'), 
                      default='pending', nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    
    # Relationship with payments
    payments = db.relationship('Payment', backref='bill', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': str(self.id),
            'bill_number': self.bill_number,
            'order_id': str(self.order_id),
            'order_number': self.order_number,
            'customer_name': self.customer_name,
            'table_number': self.table_number,
            'subtotal': float(self.subtotal),
            'tax_amount': float(self.tax_amount),
            'discount_amount': float(self.discount_amount),
            'tip_amount': float(self.tip_amount),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'payments': [payment.to_dict() for payment in self.payments],
            'paid_amount': sum(float(p.amount) for p in self.payments if p.status == 'completed'),
            'remaining_amount': float(self.total_amount) - sum(float(p.amount) for p in self.payments if p.status == 'completed'),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bills.id'), nullable=False)
    payment_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Payment details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.Enum('cash', 'card', 'digital_wallet', 'bank_transfer', name='payment_method'), nullable=False)
    status = db.Column(db.Enum('pending', 'completed', 'failed', 'cancelled', 'refunded', name='payment_status'), 
                      default='pending', nullable=False)
    
    # Transaction details
    transaction_id = db.Column(db.String(100))  # External payment processor transaction ID
    reference_number = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'payment_number': self.payment_number,
            'amount': float(self.amount),
            'payment_method': self.payment_method,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }