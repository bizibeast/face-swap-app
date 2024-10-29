'use client';

import React, { useState } from 'react';

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e1e1e1',
    height: '350px', // Reduced height since buttons are now outside
  },
  buttonRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
    marginTop: '20px',
  },
  generateButtonContainer: {
    gridColumn: '1 / span 2',
  },
  downloadButtonContainer: {
    gridColumn: '3',
  },
  uploadBox: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '20px',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    minHeight: '250px',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  preview: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  downloadButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  error: {
    color: 'red',
    textAlign: 'center' as const,
    fontSize: '14px',
    marginTop: '10px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  placeholderText: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '14px',
  },
  resultPreviewContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    overflow: 'hidden',
  }
};

export default function Home() {
  const [selectedFace, setSelectedFace] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFace(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFacePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFace || !selectedVideo) {
      setError("Please select both a face image and a video");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('face', selectedFace);
      formData.append('video', selectedVideo);

      const response = await fetch('http://localhost:3001/api/swap-face', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Face swap failed');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Face Swap App</h1>
        <p>Upload a face image and a video to create your face swap</p>
      </div>

      <div style={styles.mainGrid}>
        {/* Face Upload Column */}
        <div style={styles.column}>
          <h2 style={styles.sectionTitle}>Face Image</h2>
          <div 
            style={styles.uploadBox}
            onClick={() => document.getElementById('face-upload')?.click()}
          >
            {facePreview ? (
              <div style={styles.previewContainer}>
                <img 
                  src={facePreview} 
                  alt="Face Preview" 
                  style={styles.preview}
                />
              </div>
            ) : (
              <div style={styles.placeholderText}>
                <div>👤</div>
                <p>Click to upload face image</p>
                <p>Supports JPG, PNG</p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFaceChange}
            style={{ display: 'none' }}
            id="face-upload"
          />
        </div>

        {/* Video Upload Column */}
        <div style={styles.column}>
          <h2 style={styles.sectionTitle}>Target Video</h2>
          <div 
            style={styles.uploadBox}
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            {videoPreview ? (
              <div style={styles.previewContainer}>
                <video 
                  src={videoPreview}
                  style={styles.preview}
                  controls
                />
              </div>
            ) : (
              <div style={styles.placeholderText}>
                <div>🎥</div>
                <p>Click to upload video</p>
                <p>Supports MP4, MOV</p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            style={{ display: 'none' }}
            id="video-upload"
          />
        </div>

        {/* Result Column */}
        <div style={styles.column}>
          <h2 style={styles.sectionTitle}>Result</h2>
          <div style={styles.resultPreviewContainer}>
            {result ? (
              <div style={styles.previewContainer}>
                <video 
                  controls 
                  src={result}
                  style={styles.preview}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div style={styles.placeholderText}>
                <p>Generated video will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons Row */}
      <div style={styles.buttonRow}>
        <div style={styles.generateButtonContainer}>
          <button
            onClick={handleSubmit}
            disabled={!selectedFace || !selectedVideo || loading}
            style={{
              ...styles.button,
              ...((!selectedFace || !selectedVideo || loading) && styles.disabledButton),
            }}
          >
            {loading ? 'Processing...' : 'Generate Face Swap'}
          </button>
          {error && <div style={styles.error}>{error}</div>}
        </div>
        <div style={styles.downloadButtonContainer}>
          {result && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = result;
                link.download = 'face-swap-result.mp4';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              style={styles.downloadButton}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#218838';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
              }}
            >
              Download Result
            </button>
          )}
        </div>
      </div>
    </div>
  );
}