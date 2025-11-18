import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app import app, Internship

# Set visual style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)

def analyze_algorithm():
    with app.app_context():
        print("🔄 Fetching data...")
        internships = Internship.query.all()
        
        if len(internships) < 50:
            print("⚠️ Not enough data! Please add at least 50 internships to get good graphs.")
            return

        # Prepare data
        df = pd.DataFrame([i.to_dict() for i in internships])
        
        # 1. Re-create the algorithm's "Combined Features"
        df['combined_text'] = (
            df['title'].fillna('') + " " + 
            df['required_skills'].fillna('') + " " + 
            df['description'].fillna('') + " " + 
            df['industry'].fillna('')
        )

        print("⚙️  Running Vectorization (The 'Brain' of your AI)...")
        vectorizer = CountVectorizer(max_features=1000, stop_words='english')
        matrix = vectorizer.fit_transform(df['combined_text'])
        
        # ==========================================
        # GRAPH 1: Similarity Distribution (The "Confidence" Graph)
        # ==========================================
        print("📊 Generating Graph 1: Similarity Distribution...")
        # Calculate cosine similarity for the first 500 items (to save memory)
        sim_matrix = cosine_similarity(matrix[:500])
        
        # Flatten matrix and remove self-comparisons (1.0)
        flat_sim = sim_matrix.flatten()
        flat_sim = flat_sim[flat_sim < 0.99] 
        
        plt.figure(figsize=(10, 6))
        sns.histplot(flat_sim, bins=50, kde=True, color="#4F46E5")
        plt.title("Algorithm Confidence: Distribution of Cosine Similarity Scores")
        plt.xlabel("Similarity Score (0 = No Match, 1 = Perfect Match)")
        plt.ylabel("Frequency")
        plt.axvline(x=0.2, color='red', linestyle='--', label='Weak Match Threshold')
        plt.legend()
        plt.savefig('algo_1_similarity_distribution.png')
        print("   -> Saved 'algo_1_similarity_distribution.png'")

        # ==========================================
        # GRAPH 2: t-SNE Cluster Map (The "AI Map" Graph)
        # ==========================================
        print("📊 Generating Graph 2: Internship Clusters (t-SNE)...")
        # Reduce dimensions to 2D so we can plot it
        # This shows how the AI "groups" similar internships together
        tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(df)-1))
        vis_dims = tsne.fit_transform(matrix.toarray())
        
        vis_df = pd.DataFrame(vis_dims, columns=['x', 'y'])
        vis_df['industry'] = df['industry']
        
        plt.figure(figsize=(12, 8))
        sns.scatterplot(
            x='x', y='y', 
            hue='industry', 
            data=vis_df, 
            palette='viridis', 
            alpha=0.7,
            s=100
        )
        plt.title("How the AI Groups Internships (t-SNE Projection)")
        plt.xlabel("Vector Dimension 1")
        plt.ylabel("Vector Dimension 2")
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig('algo_2_clusters.png')
        print("   -> Saved 'algo_2_clusters.png'")

        # ==========================================
        # GRAPH 3: Skill-to-Job Correlation Heatmap
        # ==========================================
        print("📊 Generating Graph 3: Skill Correlation...")
        # Let's pick top 20 most common words to see how they relate
        sum_words = matrix.sum(axis=0) 
        words_freq = [(word, sum_words[0, idx]) for word, idx in vectorizer.vocabulary_.items()]
        words_freq = sorted(words_freq, key = lambda x: x[1], reverse=True)[:15]
        top_words = [w[0] for w in words_freq]
        
        # Create a mini correlation matrix for these top terms
        # This simulates "if a job has Python, does it also have Data?"
        subset_matrix = pd.DataFrame(matrix.toarray(), columns=vectorizer.get_feature_names_out())
        corr = subset_matrix[top_words].corr()
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f")
        plt.title("Correlation Between Top Keywords in Database")
        plt.savefig('algo_3_correlation.png')
        print("   -> Saved 'algo_3_correlation.png'")

        print("\n✅ All Algorithm Analysis Graphs Generated!")

if __name__ == "__main__":
    analyze_algorithm()