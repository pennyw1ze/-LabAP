from flask import Blueprint, request, jsonify
from models import db, Bill, Payment
from services.order_service import OrderService
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, ValidationError
from datetime import datetime
import uuid
import secrets
import string

billing_bp = Blueprint('billing', __name__)

# Marshmallow schemas for validation
class BillSchema(Schema):
    order_id = fields.Str(required=True)
    tip_amount = fields.Float(validate=lambda x: x >= 0, missing=0)
    discount_amount = fields.Float(validate=lambda x: x >= 0, missing=0)

class PaymentSchema(Schema):
    bill_id = fields.Str(required=True)
    amount = fields.Float(required=True, validate=lambda x: x > 0)
    payment_method = fields.Str(required=True, validate=lambda x: x in ['cash', 'card', 'digital_wallet', 'bank_transfer'])
    reference_number = fields.Str(allow_none=True)
    notes = fields.Str(allow_none=True)

bill_schema = BillSchema()
payment_schema = PaymentSchema()

def generate_bill_number():
    """Generate a unique bill number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"BILL-{timestamp}-{random_suffix}"

def generate_payment_number():
    """Generate a unique payment number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"PAY-{timestamp}-{random_suffix}"

@billing_bp.route('/bills', methods=['GET'])
def get_all_bills():
    """Get all bills with optional filtering"""
    try:
        # Get query parameters
        status = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        table_number = request.args.get('table_number')
        
        # Build query
        query = Bill.query
        
        if status:
            query = query.filter(Bill.status == status)
        if table_number:
            query = query.filter(Bill.table_number == int(table_number))
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Bill.created_at >= date_from_obj)
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Bill.created_at <= date_to_obj)
        
        # Execute query and order results
        bills = query.order_by(Bill.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [bill.to_dict() for bill in bills],
            'count': len(bills)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching bills',
            'error': str(e)
        }), 500

@billing_bp.route('/bills/<string:bill_id>', methods=['GET'])
def get_bill_by_id(bill_id):
    """Get bill by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(bill_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid bill ID format'
            }), 400
        
        bill = Bill.query.get(bill_id)
        
        if not bill:
            return jsonify({
                'success': False,
                'message': 'Bill not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': bill.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching bill',
            'error': str(e)
        }), 500

@billing_bp.route('/bills/order/<string:order_id>', methods=['GET'])
def get_bill_by_order_id(order_id):
    """Get bill by order ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        bill = Bill.query.filter_by(order_id=order_id).first()
        
        if not bill:
            return jsonify({
                'success': False,
                'message': 'Bill not found for this order'
            }), 404
        
        return jsonify({
            'success': True,
            'data': bill.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching bill',
            'error': str(e)
        }), 500

@billing_bp.route('/bills', methods=['POST'])
def create_bill():
    """Create a new bill from an order"""
    try:
        # Validate request data
        try:
            data = bill_schema.load(request.json)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Check if bill already exists for this order
        existing_bill = Bill.query.filter_by(order_id=data['order_id']).first()
        if existing_bill:
            return jsonify({
                'success': False,
                'message': 'Bill already exists for this order'
            }), 400
        
        # Get order details from order service
        try:
            order = OrderService.get_order(data['order_id'])
            if not order:
                return jsonify({
                    'success': False,
                    'message': 'Order not found'
                }), 404
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error fetching order details',
                'error': str(e)
            }), 400
        
        # Calculate bill totals
        subtotal = float(order['total_amount'])
        tax_amount = float(order['tax_amount'])
        discount_amount = data.get('discount_amount', 0)
        tip_amount = data.get('tip_amount', 0)
        total_amount = subtotal + tax_amount + tip_amount - discount_amount
        
        # Create bill
        bill = Bill(
            bill_number=generate_bill_number(),
            order_id=data['order_id'],
            order_number=order['order_number'],
            customer_name=order.get('customer_name'),
            table_number=order.get('table_number'),
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            tip_amount=tip_amount,
            total_amount=total_amount
        )
        
        db.session.add(bill)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Bill created successfully',
            'data': bill.to_dict()
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database integrity error',
            'error': str(e.orig)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error creating bill',
            'error': str(e)
        }), 500

@billing_bp.route('/payments', methods=['POST'])
def process_payment():
    """Process a payment for a bill"""
    try:
        # Validate request data
        try:
            data = payment_schema.load(request.json)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Get the bill
        bill = Bill.query.get(data['bill_id'])
        if not bill:
            return jsonify({
                'success': False,
                'message': 'Bill not found'
            }), 404
        
        if bill.status in ['paid', 'refunded', 'cancelled']:
            return jsonify({
                'success': False,
                'message': f'Cannot process payment for bill with status: {bill.status}'
            }), 400
        
        # Calculate remaining amount
        paid_amount = sum(float(p.amount) for p in bill.payments if p.status == 'completed')
        remaining_amount = float(bill.total_amount) - paid_amount
        
        if data['amount'] > remaining_amount:
            return jsonify({
                'success': False,
                'message': f'Payment amount ({data["amount"]}) exceeds remaining balance ({remaining_amount})'
            }), 400
        
        # Create payment
        payment = Payment(
            bill_id=data['bill_id'],
            payment_number=generate_payment_number(),
            amount=data['amount'],
            payment_method=data['payment_method'],
            reference_number=data.get('reference_number'),
            notes=data.get('notes'),
            status='completed',  # For simplicity, assume all payments are immediately completed
            processed_at=datetime.utcnow()
        )
        
        db.session.add(payment)
        
        # Update bill status
        new_paid_amount = paid_amount + data['amount']
        if new_paid_amount >= float(bill.total_amount):
            bill.status = 'paid'
            bill.paid_at = datetime.utcnow()
        elif new_paid_amount > 0:
            bill.status = 'partially_paid'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment processed successfully',
            'data': {
                'payment': payment.to_dict(),
                'bill': bill.to_dict()
            }
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database integrity error',
            'error': str(e.orig)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error processing payment',
            'error': str(e)
        }), 500

@billing_bp.route('/payments/<string:payment_id>', methods=['GET'])
def get_payment_by_id(payment_id):
    """Get payment by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(payment_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid payment ID format'
            }), 400
        
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return jsonify({
                'success': False,
                'message': 'Payment not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': payment.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching payment',
            'error': str(e)
        }), 500

@billing_bp.route('/payments', methods=['GET'])
def get_all_payments():
    """Get all payments with optional filtering"""
    try:
        # Get query parameters
        bill_id = request.args.get('bill_id')
        payment_method = request.args.get('payment_method')
        status = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Payment.query
        
        if bill_id:
            query = query.filter(Payment.bill_id == bill_id)
        if payment_method:
            query = query.filter(Payment.payment_method == payment_method)
        if status:
            query = query.filter(Payment.status == status)
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Payment.created_at >= date_from_obj)
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Payment.created_at <= date_to_obj)
        
        # Execute query and order results
        payments = query.order_by(Payment.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [payment.to_dict() for payment in payments],
            'count': len(payments)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching payments',
            'error': str(e)
        }), 500

@billing_bp.route('/reports/daily-summary', methods=['GET'])
def get_daily_summary():
    """Get daily billing summary"""
    try:
        # Get date parameter (default to today)
        date_str = request.args.get('date')
        if date_str:
            target_date = datetime.fromisoformat(date_str).date()
        else:
            target_date = datetime.now().date()
        
        # Get all bills for the date
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        bills = Bill.query.filter(
            Bill.created_at >= start_of_day,
            Bill.created_at <= end_of_day
        ).all()
        
        # Calculate summary
        total_bills = len(bills)
        paid_bills = len([b for b in bills if b.status == 'paid'])
        pending_bills = len([b for b in bills if b.status == 'pending'])
        partially_paid_bills = len([b for b in bills if b.status == 'partially_paid'])
        
        total_revenue = sum(float(b.total_amount) for b in bills if b.status in ['paid', 'partially_paid'])
        total_tax = sum(float(b.tax_amount) for b in bills if b.status in ['paid', 'partially_paid'])
        total_tips = sum(float(b.tip_amount) for b in bills if b.status in ['paid', 'partially_paid'])
        
        # Payment method breakdown
        payments = Payment.query.join(Bill).filter(
            Bill.created_at >= start_of_day,
            Bill.created_at <= end_of_day,
            Payment.status == 'completed'
        ).all()
        
        payment_methods = {}
        for payment in payments:
            method = payment.payment_method
            if method not in payment_methods:
                payment_methods[method] = 0
            payment_methods[method] += float(payment.amount)
        
        return jsonify({
            'success': True,
            'data': {
                'date': target_date.isoformat(),
                'summary': {
                    'total_bills': total_bills,
                    'paid_bills': paid_bills,
                    'pending_bills': pending_bills,
                    'partially_paid_bills': partially_paid_bills,
                    'total_revenue': total_revenue,
                    'total_tax': total_tax,
                    'total_tips': total_tips
                },
                'payment_methods': payment_methods,
                'bills': [bill.to_dict() for bill in bills]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generating daily summary',
            'error': str(e)
        }), 500