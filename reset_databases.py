import os
import sys

def reset_menu_service():
    """Reset del database del menu service"""
    print("\n🔄 Resetting Menu Service Database...")
    
    # Rimuovi il database esistente
    db_path = 'services/menu/menu_inventory.db'
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"  ✅ Removed old database: {db_path}")
    
    # Cambia directory
    original_dir = os.getcwd()
    try:
        os.chdir('services/menu/src')
        
        # Importa e inizializza
        from app import create_app, add_sample_data
        from models import db
        
        app = create_app('development')
        
        with app.app_context():
            db.create_all()
            print("  ✅ Created menu tables")
            
            add_sample_data()
            print("  ✅ Added sample menu data")
        
        print("✅ Menu Service database reset complete!")
        
    except Exception as e:
        print(f"❌ Error resetting menu service: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        os.chdir(original_dir)


def reset_order_service():
    """Reset del database dell'order service"""
    print("\n🔄 Resetting Order Management Service Database...")
    
    # Rimuovi il database esistente
    db_path = 'services/order-management/order_management.db'
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"  ✅ Removed old database: {db_path}")
    
    # Cambia directory
    original_dir = os.getcwd()
    try:
        os.chdir('services/order-management/src')
        
        # Importa e inizializza
        from app import create_app
        from models import db
        
        app = create_app('development')
        
        with app.app_context():
            db.create_all()
            print("  ✅ Created order tables")
        
        print("✅ Order Management Service database reset complete!")
        
    except Exception as e:
        print(f"❌ Error resetting order service: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        os.chdir(original_dir)


def main():
    print("="*60)
    print("🍴 ByteRisto - Database Reset Script")
    print("="*60)
    
    # Conferma dall'utente
    response = input("\n⚠️  This will DELETE all existing data. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    # Reset dei servizi
    reset_menu_service()
    reset_order_service()
    
    print("\n" + "="*60)
    print("✨ All databases have been reset successfully!")
    print("="*60)
    print("\n📝 Next steps:")
    print("1. Start Menu Service: cd services/menu/src && python app.py")
    print("2. Start Order Service: cd services/order-management/src && python app.py")
    print("3. Start Frontend: cd frontend && npm start")
    print("\n")


if __name__ == '__main__':
    main()