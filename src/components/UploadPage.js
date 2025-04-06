import React, { useState } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';


pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const App = () => {
  const [jd, setJd] = useState('');
  const [resumes, setResumes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [results, setResults] = useState([]);

  const MAX_RESUMES = 50;

  const handleResumeUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    if (resumes.length + newFiles.length > MAX_RESUMES) {
      alert(`Max ${MAX_RESUMES} resumes allowed`);
      return;
    }
    setResumes([...resumes, ...newFiles]);
  };

  const removeResume = (index) => {
    const updated = [...resumes];
    updated.splice(index, 1);
    setResumes(updated);
  };

  const extractTextFromPDF = async (pdfFile) => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      text += strings.join(' ') + '\n';
    }
    return { name: pdfFile.name, text, size: pdfFile.size };
  };

  const handleReview = async () => {
    if (!jd || resumes.length === 0) {
      alert("Upload JD & Resumes");
      return;
    }
    setIsSubmitting(true);
    setConversionProgress(0);

    const extractedResumes = [];
    for (let i = 0; i < resumes.length; i++) {
      const data = await extractTextFromPDF(resumes[i]);
      extractedResumes.push(data);
      setConversionProgress(Math.round(((i + 1) / resumes.length) * 100));
    }

    const formData = new FormData();
    formData.append('jd', jd);
    formData.append('resumesData', JSON.stringify(extractedResumes));

    try {
      const response = await axios.post('http://localhost:8000/review', formData);
      setResults(response.data.results);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setIsSubmitting(false);
    setConversionProgress(0);
  };

  return (
    <div className="App">
      <h1>AI Resume Matcher</h1>

      <textarea
        placeholder="Paste Job Description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={6}
      />

      <input type="file" multiple accept="application/pdf" onChange={handleResumeUpload} />

      {resumes.map((file, idx) => (
        <div key={idx}>
          {file.name}
          <button onClick={() => removeResume(idx)}>Remove</button>
        </div>
      ))}

      <button onClick={handleReview} disabled={isSubmitting}>
        {isSubmitting ? `Processing ${conversionProgress}%` : 'Match Resumes'}
      </button>

      {results.length > 0 && (
        <div>
          <h2>Results:</h2>
          {results.map((res, idx) => (
            <div key={idx}>
              {res.name} - Score: {res.score}%
            </div>
          ))}
        </div>
      )}
    



      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .app-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
        }

        .card {
          width: 100%;
          max-width: 850px;
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 32px;
          background: linear-gradient(135deg, #4a6cf7 0%, #2b3fd9 100%);
          color: white;
          text-align: center;
        }

        .app-title {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 32px;
          font-weight: 700;
        }

        .app-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }

        .form-section {
          padding: 32px;
        }

        .form-group {
          margin-bottom: 28px;
        }

        .form-label {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
          color: #222;
          font-size: 15px;
        }

        .label-icon {
          display: flex;
          align-items: center;
          margin-right: 8px;
          color: #4a6cf7;
        }

        .limit-text {
          margin-left: 8px;
          font-weight: normal;
          font-size: 14px;
          color: #6b7280;
        }

        .textarea-wrapper {
          position: relative;
        }

        .jd-textarea {
          width: 100%;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          transition: all 0.3s;
          resize: vertical;
          min-height: 180px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }

        .jd-textarea:focus {
          outline: none;
          border-color: #4a6cf7;
          box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.15);
        }

        .input-checkmark {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .input-checkmark:after {
          content: '';
          width: 6px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          position: relative;
          top: -1px;
        }

        .form-divider {
          position: relative;
          text-align: center;
          margin: 32px 0;
        }

        .form-divider:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background-color: #e4e7ec;
        }

        .form-divider span {
          position: relative;
          display: inline-block;
          padding: 0 16px;
          background-color: white;
          color: #6b7280;
          font-size: 14px;
        }

        .file-upload-area {
          position: relative;
          height: 160px;
          margin-bottom: 16px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed #e4e7ec;
          border-radius: 12px;
          transition: all 0.3s;
          background-color: #f9fafb;
        }

        .file-upload-area:hover {
          border-color: #4a6cf7;
          background-color: #f0f4ff;
        }

        .file-input {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
          transition: transform 0.2s;
        }

        .file-upload-area:hover .upload-content {
          transform: translateY(-5px);
        }

        .upload-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #f0f4ff;
          color: #4a6cf7;
          margin-bottom: 16px;
          transition: all 0.3s;
        }

        .file-upload-area:hover .upload-icon {
          background-color: #4a6cf7;
          color: white;
          transform: scale(1.1);
        }

        .upload-title {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .upload-subtitle {
          display: block;
          font-size: 14px;
          color: #6b7280;
        }

        .resume-progress {
          margin-top: 24px;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .progress-label {
          font-weight: 500;
          color: #374151;
        }

        .progress-count {
          font-weight: 500;
          color: #4a6cf7;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background-color: #f0f4ff;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(to right, #4a6cf7, #2b3fd9);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .conversion-progress {
          margin-bottom: 20px;
          padding: 16px;
          background-color: #f0f4ff;
          border-radius: 12px;
        }

        .conversion-progress p {
          margin-bottom: 8px;
          font-weight: 500;
          color: #4a6cf7;
        }

        .resume-list-container {
          margin-bottom: 28px;
          background-color: #f9fafb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .resume-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: #f0f4ff;
          border-bottom: 1px solid #e5e7eb;
        }

        .resume-list-title {
          margin: 0;
          font-size: 16px;
          color: #4a6cf7;
        }

        .clear-all-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .clear-all-button:hover {
          color: #ef4444;
        }

        .resume-list {
          max-height: 280px;
          overflow-y: auto;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .resume-list::-webkit-scrollbar {
          width: 8px;
        }

        .resume-list::-webkit-scrollbar-track {
          background: #f9fafb;
        }

        .resume-list::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
          border: 2px solid #f9fafb;
        }

        .resume-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .resume-item:hover {
          background-color: #f0f4ff;
        }

        .resume-item:last-child {
          border-bottom: none;
        }

        .resume-name {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #333;
          flex: 1;
          min-width: 0;
        }

        .resume-name span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .resume-name svg {
          flex-shrink: 0;
          color: #4a6cf7;
        }

        .resume-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-size {
          font-size: 13px;
          color: #6b7280;
          white-space: nowrap;
        }

        .remove-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-button:hover {
          background-color: #fee2e2;
          color: #ef4444;
        }

        .review-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #4a6cf7 0%, #2b3fd9 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(74, 108, 247, 0.25);
        }

        .review-button:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(74, 108, 247, 0.4);
        }

        .review-button:active:not(.disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(74, 108, 247, 0.3);
        }

        .review-button.disabled {
          background: #d1d5db;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* For smaller screens */
        @media (max-width: 768px) {
          .card-header {
            padding: 24px;
          }
          
          .app-title {
            font-size: 24px;
          }
          
          .form-section {
            padding: 20px;
          }
          
          .file-upload-area {
            height: 140px;
          }
        }
      `}</style>
      </div>
    );
  };
  
  

export default App;