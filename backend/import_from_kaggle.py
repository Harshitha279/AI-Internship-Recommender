import os
import sys
import argparse
import pandas as pd
from dotenv import load_dotenv

# CRITICAL: Load environment variables FIRST, before any other imports
load_dotenv()

# Set Kaggle credentials from environment variables BEFORE importing kaggle
os.environ['KAGGLE_USERNAME'] = os.getenv('KAGGLE_USERNAME', '')
os.environ['KAGGLE_KEY'] = os.getenv('KAGGLE_KEY', '')

# NOW import Kaggle API
from kaggle.api.kaggle_api_extended import KaggleApi
from app import app, db, Internship

class KaggleInternshipImporter:
    def __init__(self):
        self.api = KaggleApi()
        self.api.authenticate()
        print("✅ Kaggle API authenticated successfully!")
    
    def download_dataset(self, dataset_name, download_path='./kaggle_data'):
        """
        Download dataset from Kaggle
        
        Example dataset names:
        - 'everydaycodings/internship-opportunities-dataset'
        - 'khushipitroda/internshala-internship-dataset'
        """
        
        print(f"\n📥 Downloading dataset: {dataset_name}")
        
        try:
            # Create download directory
            os.makedirs(download_path, exist_ok=True)
            
            # Download dataset
            self.api.dataset_download_files(
                dataset_name,
                path=download_path,
                unzip=True
            )
            
            print(f"✅ Downloaded to: {download_path}")
            
            # List downloaded files
            files = os.listdir(download_path)
            print(f"📂 Files: {files}")
            
            return download_path, files
        
        except Exception as e:
            print(f"❌ Error downloading: {e}")
            return None, None
    
    def read_csv_files(self, download_path):
        """Read all CSV files from download path and combine them"""
        
        csv_files = [f for f in os.listdir(download_path) if f.endswith('.csv')]
        
        if not csv_files:
            print("❌ No CSV files found!")
            return None
        
        print(f"\n📊 Found {len(csv_files)} CSV file(s)")
        
        # Read and combine all CSV files
        all_dataframes = []
        
        for csv_file in csv_files:
            csv_path = os.path.join(download_path, csv_file)
            print(f"📖 Reading: {csv_file}")
            
            try:
                df = pd.read_csv(csv_path, encoding='utf-8')
                all_dataframes.append(df)
                print(f"   ✅ Loaded {len(df)} rows")
            except Exception as e:
                print(f"   ⚠️  Skipped (error: {e})")
                continue
        
        if not all_dataframes:
            print("❌ No valid CSV files could be read!")
            return None
        
        # Combine all dataframes
        combined_df = pd.concat(all_dataframes, ignore_index=True)
        print(f"\n✅ Combined total: {len(combined_df)} rows")
        print(f"📋 Columns: {list(combined_df.columns)}")
        
        return combined_df
    
    def clean_and_map_data(self, df):
        """
        Clean the dataframe and map to our Internship model
        """
        
        print("\n🧹 Cleaning and mapping data...")
        
        # Make column names lowercase for easier matching
        df.columns = df.columns.str.lower().str.strip()
        
        # Map columns to our standard names
        column_mapping = {
            'company': 'company',
            'company_name': 'company',
            'employer': 'company',
            'organization': 'company',
            'title': 'title',
            'internship_title': 'title',
            'type_of_internship': 'title',
            'profile': 'title',
            'job_title': 'title',
            'position': 'title',
            'role': 'title',
            'job_name': 'title',
            'location': 'location',
            'city': 'location',
            'place': 'location',
            'work_location': 'location',
            'skills': 'required_skills',
            'required_skills': 'required_skills',
            'qualifications': 'required_skills',
            'requirements': 'required_skills',
            'description': 'description',
            'job_description': 'description',
            'details': 'description',
            'summary': 'description',
            'salary': 'stipend',
            'stipend': 'stipend',
            'compensation': 'stipend',
            'pay': 'stipend',
            'duration': 'duration',
            'length': 'duration',
            'period': 'duration',
            'industry': 'industry',
            'sector': 'industry',
            'category': 'industry',
            'field': 'industry',
        }
        
        # Rename columns
        for old_name, new_name in column_mapping.items():
            if old_name in df.columns:
                df = df.rename(columns={old_name: new_name})
        
        # Ensure required columns exist
        required_cols = ['company', 'title']
        for col in required_cols:
            if col not in df.columns:
                print(f"⚠️  Missing required column: {col}")
                print(f"Available columns: {list(df.columns)}")
                return None
        
        # Fill missing optional columns with defaults
        if 'description' not in df.columns:
            df['description'] = 'No description available'
        
        if 'required_skills' not in df.columns:
            df['required_skills'] = 'See description'
        
        if 'location' not in df.columns:
            df['location'] = 'Not specified'
        
        if 'stipend' not in df.columns:
            df['stipend'] = 'Not specified'
        
        if 'duration' not in df.columns:
            df['duration'] = 'Not specified'
        
        if 'industry' not in df.columns:
            df['industry'] = 'Technology'
        
        # Clean data
        df = df.fillna('Not specified')
        
        # Keep all rows - these datasets are already internship-focused
        print(f"🎯 Processing {len(df)} positions from dataset")
        
        # Limit description length
        if 'description' in df.columns:
            df['description'] = df['description'].astype(str).str[:500]
        
        # Remove duplicates
        df = df.drop_duplicates(subset=['company', 'title'], keep='first')
        print(f"🗑️  Removed duplicates, {len(df)} unique internships remain")
        
        return df
    
    def save_to_database(self, df, limit=100):
        """Save cleaned dataframe to database"""
        
        if df is None or len(df) == 0:
            print("❌ No data to save!")
            return 0
        
        with app.app_context():
            added = 0
            skipped = 0
            errors = 0
            
            # Limit number of internships to import
            df_limited = df.head(limit)
            
            print(f"\n💾 Saving {len(df_limited)} internships to database...")
            
            for idx, row in df_limited.iterrows():
                try:
                    # Check if already exists
                    exists = Internship.query.filter_by(
                        company=str(row.get('company', 'Unknown'))[:255],
                        title=str(row.get('title', 'Untitled'))[:255]
                    ).first()
                    
                    if exists:
                        skipped += 1
                        continue
                    
                    # Create internship object
                    internship = Internship(
                        company=str(row.get('company', 'Unknown'))[:255],
                        title=str(row.get('title', 'Untitled'))[:255],
                        description=str(row.get('description', 'No description'))[:500],
                        required_skills=str(row.get('required_skills', 'See description'))[:300],
                        location=str(row.get('location', 'Not specified'))[:255],
                        duration=str(row.get('duration', 'Not specified'))[:100],
                        stipend=str(row.get('stipend', 'Competitive'))[:100],
                        deadline='Rolling',
                        industry=str(row.get('industry', 'Technology'))[:100]
                    )
                    
                    db.session.add(internship)
                    added += 1
                    
                    # Show progress every 100 internships
                    if added % 100 == 0:
                        print(f"  → Added {added} internships...")
                
                except Exception as e:
                    errors += 1
                    if errors <= 3:  # Show first 3 errors only
                        print(f"⚠️  Error on row {idx}: {e}")
                    continue
            
            try:
                db.session.commit()
                
                print(f"\n{'='*60}")
                print(f"📊 KAGGLE IMPORT SUMMARY:")
                print(f"{'='*60}")
                print(f"✅ Added:   {added} new internships")
                print(f"⏭️  Skipped: {skipped} duplicates")
                print(f"❌ Errors:  {errors} failed")
                print(f"📈 Total in database: {Internship.query.count()}")
                print(f"{'='*60}\n")
                
                return added
            
            except Exception as e:
                db.session.rollback()
                print(f"❌ Database error: {e}")
                return 0
    
    def import_dataset(self, dataset_name, limit=100):
        """Main method to download and import a dataset"""
        
        print(f"\n{'='*60}")
        print(f"🎯 KAGGLE DATASET IMPORT")
        print(f"{'='*60}")
        print(f"📦 Dataset: {dataset_name}")
        print(f"🔢 Limit: {limit} internships")
        print(f"{'='*60}\n")
        
        # Step 1: Download
        download_path, files = self.download_dataset(dataset_name)
        
        if not download_path:
            return 0
        
        # Step 2: Read CSV
        df = self.read_csv_files(download_path)
        
        if df is None:
            return 0
        
        # Step 3: Clean and map
        df_cleaned = self.clean_and_map_data(df)
        
        if df_cleaned is None:
            return 0
        
        # Step 4: Save to database
        added = self.save_to_database(df_cleaned, limit=limit)
        
        return added


def main():
    """Run the Kaggle importer"""
    
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Import internship data from Kaggle')
    parser.add_argument(
        '--dataset',
        type=str,
        default='jayaantanaath/internship-opportunities-in-india-2025',
        help='Kaggle dataset name (e.g., username/dataset-name)'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=10000,
        help='Maximum number of internships to import (default: 10000)'
    )
    
    args = parser.parse_args()
    
    try:
        importer = KaggleInternshipImporter()
        
        print("\n💡 Recommended India-specific datasets:")
        print("   • jayaantanaath/internship-opportunities-in-india-2025 (default)")
        print("   • khushipitroda/internshala-internship-dataset")
        print("   • everydaycodings/internship-opportunities-dataset")
        print("\n💡 Search for more: https://www.kaggle.com/datasets?search=india+internship")
        print()
        
        added = importer.import_dataset(
            dataset_name=args.dataset,
            limit=args.limit
        )
        
        if added > 0:
            print(f"\n✅ Success! Imported {added} internships from Kaggle!")
            print(f"🌐 View them at: http://localhost:5000/api/internships")
        else:
            print("\n⚠️  No new internships were imported (might be duplicates)")
            print(f"💡 Try clearing database first:")
            print(f"   python -c \"from app import app, db; app.app_context().push(); db.drop_all(); db.create_all(); print('Database cleared!')\"")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n📝 Setup Instructions:")
        print("1. Go to: https://www.kaggle.com/settings")
        print("2. Scroll to 'API' section")
        print("3. Click 'Create New Token'")
        print("4. Add credentials to backend/.env:")
        print("   KAGGLE_USERNAME=yourusername")
        print("   KAGGLE_KEY=your_api_key")


if __name__ == '__main__':
    main()