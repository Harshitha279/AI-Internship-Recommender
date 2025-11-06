from app import app, db, Internship
import re

def clean_text(text):
    """Remove pandas artifacts and clean text"""
    if not text:
        return None
    
    text = str(text).strip()
    
    # Remove pandas artifacts like "Name: 871, dtype: object"
    text = re.sub(r'\s*Name:\s*\d+,\s*dtype:\s*object\s*', '', text)
    
    # Remove "title" prefix if it appears
    text = re.sub(r'^title\s+', '', text, flags=re.IGNORECASE)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    # If text becomes empty or is just "Not specified", return None
    if not text or text.lower() in ['not specified', 'none', 'nan']:
        return None
    
    return text

def is_corrupted(text):
    """Check if text contains corruption markers"""
    if not text:
        return False
    
    text_str = str(text).lower()
    
    corruption_markers = [
        'dtype: object',
        'name:',
        'not specified name:',
        'series(',
        'index(',
    ]
    
    return any(marker in text_str for marker in corruption_markers)

def clean_all_internships():
    """Clean all internships in database"""
    
    with app.app_context():
        print("\n🔍 Starting database cleanup...")
        
        all_internships = Internship.query.all()
        total = len(all_internships)
        cleaned = 0
        deleted = 0
        
        print(f"📊 Total internships: {total}")
        
        for internship in all_internships:
            # Check if any field is corrupted
            if (is_corrupted(internship.title) or 
                is_corrupted(internship.company) or
                is_corrupted(internship.description) or
                is_corrupted(internship.location)):
                
                # Try to clean
                try:
                    internship.title = clean_text(internship.title)
                    internship.company = clean_text(internship.company)
                    internship.description = clean_text(internship.description)
                    internship.location = clean_text(internship.location)
                    internship.required_skills = clean_text(internship.required_skills)
                    internship.stipend = clean_text(internship.stipend)
                    internship.duration = clean_text(internship.duration)
                    
                    # If title or company is still None after cleaning, delete
                    if not internship.title or not internship.company:
                        db.session.delete(internship)
                        deleted += 1
                    else:
                        cleaned += 1
                        
                except Exception as e:
                    print(f"⚠️  Error cleaning internship {internship.id}: {e}")
                    db.session.delete(internship)
                    deleted += 1
        
        try:
            db.session.commit()
            
            print(f"\n{'='*60}")
            print(f"✅ DATABASE CLEANUP COMPLETE!")
            print(f"{'='*60}")
            print(f"🧹 Cleaned: {cleaned} internships")
            print(f"🗑️  Deleted: {deleted} corrupted entries")
            print(f"📈 Remaining: {Internship.query.count()} internships")
            print(f"{'='*60}\n")
            
            # Show sample of cleaned data
            print("\n📋 Sample cleaned internships:\n")
            samples = Internship.query.limit(5).all()
            for i, sample in enumerate(samples, 1):
                print(f"{i}. {sample.title}")
                print(f"   Company: {sample.company}")
                print(f"   Location: {sample.location}")
                print(f"   Skills: {sample.required_skills[:50]}...")
                print()
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error committing changes: {e}")

if __name__ == '__main__':
    clean_all_internships()