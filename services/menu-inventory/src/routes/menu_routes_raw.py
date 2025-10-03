from flask import Blueprint, request, jsonify
import psycopg2
import uuid
import json
import os
from datetime import datetime

menu_raw_bp = Blueprint('menu_raw', __name__)

def get_db_connection():
    """Get database connection using environment variables"""
    return psycopg2.connect(
        host=os.getenv('DATABASE_HOST', 'localhost'),
        port=os.getenv('DATABASE_PORT', '5432'),
        database=os.getenv('DATABASE_NAME', 'menu_db'),
        user=os.getenv('DATABASE_USER', 'postgres'),
        password=os.getenv('DATABASE_PASSWORD', 'password')
    )

@menu_raw_bp.route('/<string:menu_id>', methods=['PUT'])
def update_menu_item_raw(menu_id):
    """Update menu item using raw SQL"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(menu_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid menu item ID format'
            }), 400
        
        # Get request data
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check if item exists
            cursor.execute("SELECT id FROM menu_items WHERE id = %s", (menu_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Menu item not found'
                }), 404
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            if 'name' in data:
                update_fields.append("name = %s")
                update_values.append(data['name'])
            if 'description' in data:
                update_fields.append("description = %s")
                update_values.append(data['description'])
            if 'price' in data:
                update_fields.append("price = %s")
                update_values.append(float(data['price']))
            if 'category' in data:
                update_fields.append("category = %s")
                update_values.append(data['category'])
            if 'is_available' in data:
                update_fields.append("is_available = %s")
                update_values.append(bool(data['is_available']))
            if 'preparation_time' in data:
                update_fields.append("preparation_time = %s")
                update_values.append(int(data['preparation_time']))
            if 'allergens' in data:
                update_fields.append("allergens = %s")
                update_values.append(json.dumps(data['allergens']) if data['allergens'] is not None else None)
            if 'nutritional_info' in data:
                update_fields.append("nutritional_info = %s")
                update_values.append(json.dumps(data['nutritional_info']) if data['nutritional_info'] is not None else None)
            
            if update_fields:
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                update_query = f"UPDATE menu_items SET {', '.join(update_fields)} WHERE id = %s"
                update_values.append(menu_id)
                
                cursor.execute(update_query, update_values)
                conn.commit()
            
            # Get updated item
            cursor.execute("SELECT * FROM menu_items WHERE id = %s", (menu_id,))
            result = cursor.fetchone()
            
            if result:
                columns = [desc[0] for desc in cursor.description]
                row_dict = dict(zip(columns, result))
                
                updated_item = {
                    'id': row_dict['id'],
                    'name': row_dict['name'],
                    'description': row_dict['description'],
                    'price': float(row_dict['price']) if row_dict['price'] else 0,
                    'category': row_dict['category'],
                    'is_available': row_dict['is_available'],
                    'preparation_time': row_dict['preparation_time'],
                    'allergens': json.loads(row_dict['allergens']) if row_dict['allergens'] else [],
                    'nutritional_info': json.loads(row_dict['nutritional_info']) if row_dict['nutritional_info'] else {},
                    'created_at': row_dict['created_at'].isoformat() if row_dict['created_at'] else None,
                    'updated_at': row_dict['updated_at'].isoformat() if row_dict['updated_at'] else None
                }
                
                return jsonify({
                    'success': True,
                    'message': 'Menu item updated successfully',
                    'data': updated_item
                })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error updating menu item',
            'error': str(e)
        }), 500