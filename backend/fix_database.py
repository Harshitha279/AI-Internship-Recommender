from app import app, db, Internship

def fix_corrupted_data():
    """Fix corrupted internship data in database"""
    
    with app.app_context():
        print("\n🔍 Checking database for corrupted data...")
        
        all_internships = Internship.query.all()
        total = len(all_internships)
        fixed = 0
        deleted = 0
        
        print(f"📊 Total internships: {total}")
        
        for internship in all_internships:
            corrupted = False
            
            # Check for corrupted data patterns
            if any([
                'dtype: object' in str(internship.title),
                'dtype: object' in str(internship.company),
                'dtype: object' in str(internship.description),
                'dtype: object' in str(internship.location),
                'Name:' in str(internship.title),
                'Name:' in str(internship.company),
                internship.title == 'Not specified',
                internship.company == 'Not specified',
                internship.company == 'Indecimal company',
                len(str(internship.title)) > 200,
                len(str(internship.company)) > 200,
            ]):
                corrupted = True
            
            if corrupted:
                db.session.delete(internship)
                deleted += 1
            else:
                # Clean up any remaining issues
                try:
                    internship.title = str(internship.title)[:255]
                    internship.company = str(internship.company)[:255]
                    internship.description = str(internship.description)[:500]
                    internship.location = str(internship.location)[:255]
                    fixed += 1
                except:
                    db.session.delete(internship)
                    deleted += 1
        
        try:
            db.session.commit()
            print(f"\n{'='*60}")
            print(f"✅ Database cleaned!")
            print(f"{'='*60}")
            print(f"🗑️  Deleted corrupted: {deleted}")
            print(f"✅ Fixed/kept valid: {fixed}")
            print(f"📈 Remaining internships: {Internship.query.count()}")
            print(f"{'='*60}\n")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")

def show_sample_data():
    """Show sample internships to verify data quality"""
    
    with app.app_context():
        print("\n📋 Sample Internships (First 5):\n")
        internships = Internship.query.limit(5).all()
        
        for i, internship in enumerate(internships, 1):
            print(f"{i}. {internship.title}")
            print(f"   Company: {internship.company}")
            print(f"   Location: {internship.location}")
            print(f"   Skills: {internship.required_skills}")
            print(f"   Stipend: {internship.stipend}")
            print()

if __name__ == '__main__':
    fix_corrupted_data()
    show_sample_data()