from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

db = SQLAlchemy()

# Association table for menu items and inventory items (many-to-many)
menu_inventory_association = db.Table('menu_inventory_items',
    db.Column('menu_item_id', UUID(as_uuid=True), db.ForeignKey('menu_items.id'), primary_key=True),
    db.Column('inventory_item_id', UUID(as_uuid=True), db.ForeignKey('inventory_items.id'), primary_key=True),
    db.Column('quantity', db.Float, nullable=False),
    db.Column('unit', db.String(20), nullable=False)
)

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.Enum('appetizer', 'main', 'dessert', 'beverage', 'side', name='menu_category'), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    preparation_time = db.Column(db.Integer, nullable=False)  # in minutes
    allergens = db.Column(db.JSON)  # List of allergens
    nutritional_info = db.Column(db.JSON)  # Nutritional information
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Many-to-many relationship with InventoryItem
    ingredients = db.relationship('InventoryItem', 
                                secondary=menu_inventory_association, 
                                backref=db.backref('menu_items', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'category': self.category,
            'is_available': self.is_available,
            'preparation_time': self.preparation_time,
            'allergens': self.allergens,
            'nutritional_info': self.nutritional_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    current_stock = db.Column(db.Float, nullable=False, default=0)
    minimum_stock = db.Column(db.Float, nullable=False, default=0)
    maximum_stock = db.Column(db.Float, nullable=False, default=100)
    unit = db.Column(db.String(20), nullable=False)  # e.g., 'kg', 'liters', 'pieces'
    cost_per_unit = db.Column(db.Numeric(10, 2), nullable=False)
    supplier = db.Column(db.String(100))
    expiry_date = db.Column(db.Date)
    is_perishable = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'current_stock': float(self.current_stock),
            'minimum_stock': float(self.minimum_stock),
            'maximum_stock': float(self.maximum_stock),
            'unit': self.unit,
            'cost_per_unit': float(self.cost_per_unit),
            'supplier': self.supplier,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'is_perishable': self.is_perishable,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @property
    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock

    @property
    def is_out_of_stock(self):
        return self.current_stock <= 0