import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random

# --- ACADEMIC STYLE ---
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 12

def generate_line_analysis():
    print("⚙️  Simulating Recommendation Ranking Data...")

    # 1. MOCK DATA SETUP
    skill_pool = ['Python', 'Java', 'React', 'SQL', 'ML', 'AWS', 'Docker', 'Figma', 'Node', 'Excel']
    
    # Create 500 random internships
    internships = [" ".join(random.sample(skill_pool, k=random.randint(3, 5))) for _ in range(500)]
    
    # Create 1 Sample User with specific skills
    user_input = "Python React SQL AWS"
    
    # 2. RUN ALGORITHM
    vectorizer = CountVectorizer()
    # Fit on everything to ensure vocabulary matches
    all_data = internships + [user_input]
    matrix = vectorizer.fit_transform(all_data)
    
    job_matrix = matrix[:-1]
    user_vector = matrix[-1]
    
    # Calculate scores
    scores = cosine_similarity(user_vector, job_matrix)[0] * 100
    
    # Sort scores descending (Rank 1 to Rank N)
    scores_sorted = sorted(scores, reverse=True)
    
    # Take top 20 for the "Ranking" graph
    top_20_scores = scores_sorted[:20]
    ranks = range(1, 21)

    # ==========================================
    # GRAPH A: Rank-Score Distribution (Line Plot)
    # ==========================================
    plt.figure(figsize=(10, 6))
    
    # Plot the line
    plt.plot(ranks, top_20_scores, marker='o', linestyle='-', color='#2E86C1', linewidth=2, markersize=8, label='Recommendation Score')
    
    # Add a "Threshold" line
    plt.axhline(y=50, color='r', linestyle='--', alpha=0.5, label='Relevance Threshold (50%)')
    
    # Fill area under curve
    plt.fill_between(ranks, top_20_scores, alpha=0.1, color='#2E86C1')

    plt.title('A. Relevance Decay Curve (Rank vs. Score)', fontweight='bold', pad=15)
    plt.xlabel('Recommendation Rank (1 = Top Result)', fontweight='bold')
    plt.ylabel('Cosine Similarity Score (%)', fontweight='bold')
    plt.xticks(ranks) # Show all numbers 1-20
    plt.ylim(0, 105)
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.7)
    
    filename_a = 'paper_line_graph_ranking.png'
    plt.savefig(filename_a, dpi=300, bbox_inches='tight')
    print(f"✅ Generated Ranking Graph: {filename_a}")

    # ==========================================
    # GRAPH B: Sensitivity Analysis (Line Plot)
    # ==========================================
    # Question: "How does adding more skills improve the score?"
    print("⚙️  Running Sensitivity Analysis...")
    
    input_sizes = range(1, 11) # User enters 1 skill, then 2, ... up to 10
    avg_scores = []
    
    for size in input_sizes:
        # Simulate 50 users for *each* size to get a stable average
        batch_scores = []
        for _ in range(50):
            u_skills = " ".join(random.sample(skill_pool, k=size))
            # Vectorize just this user and the jobs
            # (In real code we'd use the pre-fitted vectorizer, simplified here)
            mat = vectorizer.transform(internships + [u_skills])
            u_vec = mat[-1]
            j_mat = mat[:-1]
            s = cosine_similarity(u_vec, j_mat)[0].max() * 100 # Best score found
            batch_scores.append(s)
        avg_scores.append(np.mean(batch_scores))

    plt.figure(figsize=(10, 6))
    plt.plot(input_sizes, avg_scores, marker='s', color='#27AE60', linewidth=2, markersize=8)
    
    plt.title('B. System Sensitivity: Input Granularity vs. Performance', fontweight='bold', pad=15)
    plt.xlabel('Number of Skills in User Profile', fontweight='bold')
    plt.ylabel('Average Best Match Score (%)', fontweight='bold')
    plt.xticks(input_sizes)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    filename_b = 'paper_line_graph_sensitivity.png'
    plt.savefig(filename_b, dpi=300, bbox_inches='tight')
    print(f"✅ Generated Sensitivity Graph: {filename_b}")

if __name__ == "__main__":
    generate_line_analysis()