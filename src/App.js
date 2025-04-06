import React, { useState } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

import worker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = worker;

function App() {
  const [jd, setJd] = useState('');
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleResumeUpload = async (e) => {
    const files = Array.from(e.target.files);
    const resumesData = [];
    let processedCount = 0;
    
    if (files.length === 0) return;
    
    setUploadProgress(0);
    
    const updateResumes = (name, text) => {
      resumesData.push({ name, text });
      processedCount++;
      
      // Update progress percentage
      setUploadProgress(Math.floor((processedCount / files.length) * 100));
      
      if (processedCount === files.length) {
        setResumes(resumesData);
        setUploadProgress(0); // Reset progress when done
      }
    };

    for (const file of files) {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const typedarray = new Uint8Array(reader.result);
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items.map(item => item.str).join(' ');
              text += pageText + ' ';
            }
            updateResumes(file.name, text);
          } catch (error) {
            console.error(`Error processing PDF ${file.name}:`, error);
            updateResumes(file.name, `Error extracting text: ${error.message}`);
          }
        };
        reader.onerror = () => {
          console.error(`Error reading file ${file.name}`);
          updateResumes(file.name, "Error reading file");
        };
        reader.readAsArrayBuffer(file);
      } else {
        try {
          const text = await file.text();
          updateResumes(file.name, text);
        } catch (error) {
          console.error(`Error reading text file ${file.name}:`, error);
          updateResumes(file.name, `Error reading file: ${error.message}`);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (jd.trim() === '' || resumes.length === 0) {
      alert('Please enter a job description and upload at least one resume.');
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('jd', jd);
      formData.append('resumesData', JSON.stringify(resumes));

      const response = await axios.post('http://localhost:8000/review', formData);
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>AI Job Matcher</h1>

      <textarea
        placeholder="Paste Job Description here..."
        rows={10}
        cols={80}
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />

      <br /><br />

      <input type="file" multiple onChange={handleResumeUpload} />
      
      {uploadProgress > 0 && (
        <div>
          <p>Processing files: {uploadProgress}%</p>
          <div style={{
            height: '10px',
            width: '300px',
            backgroundColor: '#e0e0e0',
            borderRadius: '5px',
            marginTop: '5px'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              backgroundColor: '#4CAF50',
              borderRadius: '5px',
              transition: 'width 0.3s ease'
            }}/>
          </div>
        </div>
      )}
      
      <p>{resumes.length > 0 ? `${resumes.length} resume(s) uploaded` : 'No resumes uploaded yet'}</p>

      <br />

      <button 
        onClick={handleSubmit} 
        disabled={isLoading || jd.trim() === '' || resumes.length === 0}
        style={{
          padding: '10px 20px',
          backgroundColor: isLoading ? '#cccccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Processing...' : 'Match Resumes'}
      </button>

      <h2>Results:</h2>
      {isLoading ? (
        <p>Analyzing resumes, please wait...</p>
      ) : results.length > 0 ? (
        <ul>
          {results.map((res, idx) => (
            <li key={idx}>{res.Resume} → Score: {(res.Score * 100).toFixed(2)}%</li>
          ))}
        </ul>
      ) : (
        <p>No Results yet.</p>
      )}
    </div>
  );
}

export default App;