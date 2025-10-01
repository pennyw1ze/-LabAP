from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import json


db = SQLAlchemy()


class MenuItem(db.Model):
    __tablename__ = 'menu_items'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(20), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    preparation_time = db.Column(db.Integer, nullable=False)
    allergens = db.Column(db.Text)  # Stored as JSON string
    nutritional_info = db.Column(db.Text)  # Stored as JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price else 0,
            'category': self.category,
            'is_available': self.is_available,
            'preparation_time': self.preparation_time,
            'allergens': json.loads(self.allergens) if self.allergens else [],
            'nutritional_info': json.loads(self.nutritional_info) if self.nutritional_info else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
