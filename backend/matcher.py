import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def match_resumes(jd_text, resumes, threshold=0.27, interview_slots=5):
    documents = [jd_text] + [resume['text'] for resume in resumes]

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(documents)

    jd_vector = tfidf_matrix[0:1]
    resume_vectors = tfidf_matrix[1:]

    similarity_scores = cosine_similarity(jd_vector, resume_vectors).flatten()

    data = []
    for idx, resume in enumerate(resumes):
        data.append({
            'Resume': resume['name'],
            'Score': similarity_scores[idx]
        })

    df = pd.DataFrame(data)
    df = df.sort_values(by='Score', ascending=False)

    shortlisted = df[df['Score'] >= threshold].head(interview_slots)

    return shortlisted.to_dict(orient='records')
