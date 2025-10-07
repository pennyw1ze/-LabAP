from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import pytz

db = SQLAlchemy()

# Timezone italiana
ITALY_TZ = pytz.timezone('Europe/Rome')

def italy_now():
    """Restituisce l'ora corrente nel fuso orario italiano"""
    return datetime.now(ITALY_TZ).replace(tzinfo=None)

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    table_number = db.Column(db.Integer)
    customer_name = db.Column(db.String(100))
    status = db.Column(db.Enum('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'payed', 'cancelled', name='order_status'), 
                      default='pending', nullable=False)
    order_type = db.Column(db.Enum('dine_in', 'takeout', 'delivery', name='order_type'), default='dine_in', nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), default=0)
    tax_amount = db.Column(db.Numeric(10, 2), default=0)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    final_amount = db.Column(db.Numeric(10, 2), default=0)
    special_instructions = db.Column(db.Text)
    estimated_completion_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=italy_now)
    updated_at = db.Column(db.DateTime, default=italy_now, onupdate=italy_now)
    
    # Relationship with order items
    items = db.relationship('OrderItem', backref='order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': str(self.id),
            'order_number': self.order_number,
            'table_number': self.table_number,
            'customer_name': self.customer_name,
            'status': self.status,
            'order_type': self.order_type,
            'total_amount': float(self.total_amount),
            'tax_amount': float(self.tax_amount),
            'discount_amount': float(self.discount_amount),
            'final_amount': float(self.final_amount),
            'special_instructions': self.special_instructions,
            'estimated_completion_time': self.estimated_completion_time.isoformat() if self.estimated_completion_time else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    menu_item_id = db.Column(db.String(36), nullable=False)  # Reference to menu service
    menu_item_name = db.Column(db.String(100), nullable=False)  # Cached for performance
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    special_instructions = db.Column(db.Text)
    status = db.Column(db.Enum('pending', 'preparing', 'ready', 'served', 'cancelled', name='order_item_status'), 
                      default='pending', nullable=False)
    created_at = db.Column(db.DateTime, default=italy_now)
    updated_at = db.Column(db.DateTime, default=italy_now, onupdate=italy_now)

    def to_dict(self):
        return {
            'id': str(self.id),
            'menu_item_id': str(self.menu_item_id),
            'menu_item_name': self.menu_item_name,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_price': float(self.total_price),
            'special_instructions': self.special_instructions,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }