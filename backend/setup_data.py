"""
Complete data setup script
Uses both Kaggle (bulk) and Adzuna (fresh data)
"""

from import_from_kaggle import KaggleInternshipImporter
from fetch_internships import InternshipFetcher

print("="*60)
print("🚀 COMPLETE DATA SETUP")
print("="*60)

# Step 1: Import from Kaggle (bulk data)
print("\n📦 Step 1: Importing from Kaggle...")
try:
    kaggle_importer = KaggleInternshipImporter()
    kaggle_added = kaggle_importer.import_dataset(
        'baptistabarros/internship-dataset',
        limit=50
    )
    print(f"✅ Kaggle: Added {kaggle_added} internships")
except Exception as e:
    print(f"⚠️  Kaggle import failed: {e}")
    kaggle_added = 0

# Step 2: Fetch from Adzuna (fresh data)
print("\n🔄 Step 2: Fetching fresh data from Adzuna...")
try:
    adzuna_fetcher = InternshipFetcher()
    adzuna_added = adzuna_fetcher.fetch_and_save(country='us')
    print(f"✅ Adzuna: Added {adzuna_added} internships")
except Exception as e:
    print(f"⚠️  Adzuna fetch failed: {e}")
    adzuna_added = 0

# Summary
total = kaggle_added + adzuna_added
print(f"\n{'='*60}")
print(f"🎉 SETUP COMPLETE!")
print(f"{'='*60}")
print(f"📊 Total new internships: {total}")
print(f"  - From Kaggle: {kaggle_added}")
print(f"  - From Adzuna: {adzuna_added}")
print(f"{'='*60}\n")