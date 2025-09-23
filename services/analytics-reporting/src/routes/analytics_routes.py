from flask import Blueprint, request, jsonify
from services.analytics_service import analytics_service
from services.data_service import DataService
from datetime import datetime, timedelta
import pandas as pd
from collections import defaultdict, Counter

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard_summary():
    """Get dashboard summary with key metrics"""
    try:
        # Try to get cached data first
        cached_data = analytics_service.get_cached_data('dashboard_summary')
        if cached_data:
            return jsonify({
                'success': True,
                'data': cached_data,
                'cached': True
            })
        
        # Get data from services
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        
        today_str = today.isoformat()
        yesterday_str = yesterday.isoformat()
        week_ago_str = week_ago.isoformat()
        
        # Get orders and bills
        today_orders = DataService.get_orders(date_from=today_str, date_to=today_str)
        today_bills = DataService.get_bills(date_from=today_str, date_to=today_str)
        week_orders = DataService.get_orders(date_from=week_ago_str, date_to=today_str)
        week_bills = DataService.get_bills(date_from=week_ago_str, date_to=today_str)
        
        # Calculate metrics
        dashboard_data = {
            'today': {
                'orders_count': len(today_orders),
                'revenue': sum(float(bill['total_amount']) for bill in today_bills if bill['status'] == 'paid'),
                'average_order_value': 0,
                'pending_orders': len([o for o in today_orders if o['status'] in ['pending', 'confirmed', 'preparing']])
            },
            'week': {
                'orders_count': len(week_orders),
                'revenue': sum(float(bill['total_amount']) for bill in week_bills if bill['status'] == 'paid'),
                'average_order_value': 0
            },
            'status_breakdown': {},
            'popular_items': [],
            'hourly_orders': []
        }
        
        # Calculate average order value
        if dashboard_data['today']['orders_count'] > 0:
            dashboard_data['today']['average_order_value'] = dashboard_data['today']['revenue'] / dashboard_data['today']['orders_count']
        
        if dashboard_data['week']['orders_count'] > 0:
            dashboard_data['week']['average_order_value'] = dashboard_data['week']['revenue'] / dashboard_data['week']['orders_count']
        
        # Status breakdown
        status_count = Counter(order['status'] for order in today_orders)
        dashboard_data['status_breakdown'] = dict(status_count)
        
        # Popular items (from today's orders)
        item_counter = Counter()
        for order in today_orders:
            for item in order['items']:
                item_counter[item['menu_item_name']] += item['quantity']
        
        dashboard_data['popular_items'] = [
            {'name': name, 'quantity': count}
            for name, count in item_counter.most_common(10)
        ]
        
        # Hourly orders breakdown
        hourly_orders = defaultdict(int)
        for order in today_orders:
            hour = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00')).hour
            hourly_orders[hour] += 1
        
        dashboard_data['hourly_orders'] = [
            {'hour': f"{hour:02d}:00", 'orders': count}
            for hour, count in sorted(hourly_orders.items())
        ]
        
        # Cache the result for 5 minutes
        analytics_service.cache_data('dashboard_summary', dashboard_data, 300)
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generating dashboard summary',
            'error': str(e)
        }), 500

@analytics_bp.route('/sales-report', methods=['GET'])
def get_sales_report():
    """Get sales report with filtering options"""
    try:
        # Get query parameters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        group_by = request.args.get('group_by', 'day')  # day, week, month
        
        # Default to last 30 days if no dates provided
        if not date_from or not date_to:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
            date_from = start_date.isoformat()
            date_to = end_date.isoformat()
        
        # Get bills data
        bills = DataService.get_bills(status='paid', date_from=date_from, date_to=date_to)
        
        # Process data with pandas for better analysis
        if bills:
            df = pd.DataFrame(bills)
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['total_amount'] = df['total_amount'].astype(float)
            df['tax_amount'] = df['tax_amount'].astype(float)
            df['tip_amount'] = df['tip_amount'].astype(float)
            
            # Group by time period
            if group_by == 'day':
                df['period'] = df['created_at'].dt.date
            elif group_by == 'week':
                df['period'] = df['created_at'].dt.to_period('W').astype(str)
            elif group_by == 'month':
                df['period'] = df['created_at'].dt.to_period('M').astype(str)
            
            # Calculate sales metrics
            sales_data = df.groupby('period').agg({
                'total_amount': ['sum', 'mean', 'count'],
                'tax_amount': 'sum',
                'tip_amount': 'sum'
            }).round(2)
            
            # Flatten column names
            sales_data.columns = ['total_revenue', 'average_bill', 'bill_count', 'total_tax', 'total_tips']
            sales_data = sales_data.reset_index()
            
            # Convert to list of dictionaries
            sales_summary = sales_data.to_dict('records')
            
            # Overall summary
            total_summary = {
                'total_revenue': float(df['total_amount'].sum()),
                'total_bills': len(df),
                'average_bill_value': float(df['total_amount'].mean()),
                'total_tax': float(df['tax_amount'].sum()),
                'total_tips': float(df['tip_amount'].sum()),
                'date_range': {
                    'from': date_from,
                    'to': date_to
                }
            }
        else:
            sales_summary = []
            total_summary = {
                'total_revenue': 0,
                'total_bills': 0,
                'average_bill_value': 0,
                'total_tax': 0,
                'total_tips': 0,
                'date_range': {
                    'from': date_from,
                    'to': date_to
                }
            }
        
        return jsonify({
            'success': True,
            'data': {
                'summary': total_summary,
                'time_series': sales_summary,
                'group_by': group_by
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generating sales report',
            'error': str(e)
        }), 500

@analytics_bp.route('/menu-performance', methods=['GET'])
def get_menu_performance():
    """Get menu item performance analytics"""
    try:
        # Get query parameters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Default to last 30 days
        if not date_from or not date_to:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
            date_from = start_date.isoformat()
            date_to = end_date.isoformat()
        
        # Get orders data
        orders = DataService.get_orders(date_from=date_from, date_to=date_to)
        menu_items = DataService.get_menu_items()
        
        # Create menu items lookup
        menu_lookup = {item['id']: item for item in menu_items}
        
        # Analyze menu performance
        menu_performance = defaultdict(lambda: {
            'name': '',
            'category': '',
            'price': 0,
            'orders_count': 0,
            'total_quantity': 0,
            'total_revenue': 0,
            'average_quantity_per_order': 0
        })
        
        for order in orders:
            for item in order['items']:
                menu_item_id = item['menu_item_id']
                menu_info = menu_lookup.get(menu_item_id, {})
                
                perf = menu_performance[menu_item_id]
                perf['name'] = item['menu_item_name']
                perf['category'] = menu_info.get('category', 'Unknown')
                perf['price'] = float(menu_info.get('price', 0))
                perf['orders_count'] += 1
                perf['total_quantity'] += item['quantity']
                perf['total_revenue'] += float(item['total_price'])
        
        # Calculate averages and sort
        menu_performance_list = []
        for menu_id, perf in menu_performance.items():
            if perf['orders_count'] > 0:
                perf['average_quantity_per_order'] = round(perf['total_quantity'] / perf['orders_count'], 2)
            
            perf['menu_item_id'] = menu_id
            menu_performance_list.append(perf)
        
        # Sort by total revenue (most popular first)
        menu_performance_list.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        # Category breakdown
        category_performance = defaultdict(lambda: {
            'total_revenue': 0,
            'total_quantity': 0,
            'orders_count': 0,
            'items_count': 0
        })
        
        for perf in menu_performance_list:
            category = perf['category']
            category_performance[category]['total_revenue'] += perf['total_revenue']
            category_performance[category]['total_quantity'] += perf['total_quantity']
            category_performance[category]['orders_count'] += perf['orders_count']
            category_performance[category]['items_count'] += 1
        
        return jsonify({
            'success': True,
            'data': {
                'date_range': {
                    'from': date_from,
                    'to': date_to
                },
                'menu_items': menu_performance_list[:50],  # Top 50 items
                'categories': dict(category_performance),
                'summary': {
                    'total_items_sold': sum(perf['total_quantity'] for perf in menu_performance_list),
                    'total_unique_items': len(menu_performance_list),
                    'total_revenue': sum(perf['total_revenue'] for perf in menu_performance_list)
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generating menu performance report',
            'error': str(e)
        }), 500

@analytics_bp.route('/order-trends', methods=['GET'])
def get_order_trends():
    """Get order trends and patterns"""
    try:
        # Get query parameters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Default to last 30 days
        if not date_from or not date_to:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
            date_from = start_date.isoformat()
            date_to = end_date.isoformat()
        
        # Get orders data
        orders = DataService.get_orders(date_from=date_from, date_to=date_to)
        
        if not orders:
            return jsonify({
                'success': True,
                'data': {
                    'daily_trends': [],
                    'hourly_patterns': {},
                    'order_type_distribution': {},
                    'average_preparation_time': 0,
                    'date_range': {'from': date_from, 'to': date_to}
                }
            })
        
        # Process with pandas
        df = pd.DataFrame(orders)
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['final_amount'] = df['final_amount'].astype(float)
        
        # Daily trends
        df['date'] = df['created_at'].dt.date
        daily_trends = df.groupby('date').agg({
            'id': 'count',
            'final_amount': ['sum', 'mean']
        }).round(2)
        daily_trends.columns = ['orders_count', 'total_revenue', 'average_order_value']
        daily_trends = daily_trends.reset_index()
        daily_trends['date'] = daily_trends['date'].astype(str)
        daily_trends_list = daily_trends.to_dict('records')
        
        # Hourly patterns
        df['hour'] = df['created_at'].dt.hour
        hourly_counts = df['hour'].value_counts().sort_index()
        hourly_patterns = {f"{hour:02d}:00": count for hour, count in hourly_counts.items()}
        
        # Order type distribution
        order_type_dist = df['order_type'].value_counts().to_dict()
        
        # Calculate average preparation time
        preparation_times = []
        for order in orders:
            if order.get('estimated_completion_time') and order.get('created_at'):
                created = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
                estimated = datetime.fromisoformat(order['estimated_completion_time'].replace('Z', '+00:00'))
                prep_time = (estimated - created).total_seconds() / 60  # in minutes
                preparation_times.append(prep_time)
        
        avg_prep_time = sum(preparation_times) / len(preparation_times) if preparation_times else 0
        
        return jsonify({
            'success': True,
            'data': {
                'daily_trends': daily_trends_list,
                'hourly_patterns': hourly_patterns,
                'order_type_distribution': order_type_dist,
                'average_preparation_time': round(avg_prep_time, 2),
                'date_range': {
                    'from': date_from,
                    'to': date_to
                },
                'summary': {
                    'total_orders': len(orders),
                    'total_revenue': float(df['final_amount'].sum()),
                    'average_order_value': float(df['final_amount'].mean()),
                    'peak_hour': max(hourly_patterns.items(), key=lambda x: x[1])[0] if hourly_patterns else None
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generating order trends report',
            'error': str(e)
        }), 500

@analytics_bp.route('/financial-summary', methods=['GET'])
def get_financial_summary():
    """Get comprehensive financial summary"""
    try:
        # Get query parameters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Default to current month
        if not date_from or not date_to:
            today = datetime.now().date()
            start_of_month = today.replace(day=1)
            date_from = start_of_month.isoformat()
            date_to = today.isoformat()
        
        # Get financial data
        bills = DataService.get_bills(date_from=date_from, date_to=date_to)
        payments = DataService.get_payments(date_from=date_from, date_to=date_to)
        
        # Calculate financial metrics
        total_revenue = sum(float(bill['total_amount']) for bill in bills if bill['status'] in ['paid', 'partially_paid'])
        total_tax = sum(float(bill['tax_amount']) for bill in bills if bill['status'] in ['paid', 'partially_paid'])
        total_tips = sum(float(bill['tip_amount']) for bill in bills if bill['status'] in ['paid', 'partially_paid'])
        total_discounts = sum(float(bill['discount_amount']) for bill in bills)
        
        # Payment method breakdown
        payment_methods = defaultdict(float)
        for payment in payments:
            if payment['status'] == 'completed':
                payment_methods[payment['payment_method']] += float(payment['amount'])
        
        # Outstanding amounts
        outstanding_amount = sum(float(bill['total_amount']) - sum(float(p['amount']) for p in bill['payments'] if p['status'] == 'completed')
                                for bill in bills if bill['status'] in ['pending', 'partially_paid'])
        
        # Bill status breakdown
        bill_statuses = defaultdict(int)
        for bill in bills:
            bill_statuses[bill['status']] += 1
        
        return jsonify({
            'success': True,
            'data': {
                'date_range': {
                    'from': date_from,
                    'to': date_to
                },
                'revenue': {
                    'total_revenue': round(total_revenue, 2),
                    'total_tax': round(total_tax, 2),
                    'total_tips': round(total_tips, 2),
                    'total_discounts': round(total_discounts, 2),
                    'net_revenue': round(total_revenue - total_discounts, 2)
                },
                'payment_methods': dict(payment_methods),
                'outstanding': {
                    'amount': round(outstanding_amount, 2),
                    'bills_count': bill_statuses['pending'] + bill_statuses['partially_paid']
                },
                'bill_statuses': dict(bill_statuses),
                'summary': {
                    'total_bills': len(bills),
                    'total_payments': len([p for p in payments if p['status'] == 'completed']),
                    'average_bill_amount': round(total_revenue / len(bills), 2) if bills else 0
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error generating financial summary',
            'error': str(e)
        }), 500