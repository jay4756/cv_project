import { useEffect, useRef, useState } from 'react'
import './App.css'

const defaultPalette = ['#C96D5F', '#F4E1D2', '#6B7E8A', '#F6F2EE', '#1F1B1A']

const defaultAnalysis = {
  primary_color: '#C96D5F',
  accent_color: '#F4E1D2',
  palette: defaultPalette,
  dominant_colors: defaultPalette,
  recommendations: {
    primary: ['Warm romantic'],
    complements: ['Soft ivory', 'Classic denim', 'Warm taupe'],
    styling: ['Balance the outfit with neutral layers and a clean accessory.'],
  },
}

async function analyzeImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Backend analysis failed')
  }

  return response.json()
}

function App() {
  const [selectedImage, setSelectedImage] = useState('')
  const [analysis, setAnalysis] = useState(defaultAnalysis)
  const [loading, setLoading] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const cameraRequestRef = useRef(0)

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }

    return () => cameraStream?.getTracks().forEach((track) => track.stop())
  }, [cameraStream])

  const processImage = async (file) => {
    setLoading(true)
    setSelectedImage(URL.createObjectURL(file))

    try {
      const result = await analyzeImage(file)
      setAnalysis({
        primary_color: result.primary_color,
        accent_color: result.accent_color,
        palette: result.palette,
        dominant_colors: result.dominant_colors,
        recommendations: result.recommendations,
      })
    } catch (error) {
      console.error(error)
      alert('Could not analyze the image. Please make sure the Python backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processImage(file)
    event.target.value = ''
  }

  const openCamera = async () => {
    const requestId = ++cameraRequestRef.current
    setCameraError('')
    setCameraOpen(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'environment' },
      })
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      setCameraStream(stream)
    } catch (error) {
      console.error(error)
      setCameraError('Camera access was blocked or no camera is available. Check your browser permissions.')
    }
  }

  const closeCamera = () => {
    cameraRequestRef.current += 1
    setCameraOpen(false)
    setCameraStream(null)
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video.videoHeight) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    const photo = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!photo) {
      setCameraError('Could not capture this photo. Please try again.')
      return
    }

    closeCamera()
    await processImage(new File([photo], 'outfit-camera.jpg', { type: 'image/jpeg' }))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">J</span>
          <div>
            <small>Fashion </small>
            <h2>Jay Outfit</h2>
          </div>
        </div>

        <label className="upload-btn">
          <input type="file" accept="image/*" onChange={handleUpload} />
          Upload outfit
        </label>
        <button className="camera-btn" type="button" onClick={openCamera}>
          Use camera
        </button>
      </header>

      <main className="layout">
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">Smart outfit color coordinator</span>
            <h1>Dress in colors that really work together.</h1>
            <p>
              Upload a clothing photo and get a quick outfit palette suggestion with a
              refined look in seconds.
            </p>
          </div>

          <div className="photo-box">
            {selectedImage ? (
              <img src={selectedImage} alt="Uploaded outfit" />
            ) : (
              <div className="placeholder">No image yet</div>
            )}
          </div>
        </section>

        <section className="panel-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>Suggested palette</h3>
              <span>{analysis.recommendations?.primary?.[0] || 'Smart match'}</span>
            </div>

            <div className="color-list">
              {analysis.palette.map((color) => (
                <div key={color} className="color-item">
                  <div className="swatch" style={{ background: color }} />
                  <span>{color}</span>
                </div>
              ))}
            </div>

            <div className="values">
              <div>
                <label>Primary</label>
                <strong>{analysis.primary_color}</strong>
              </div>
              <div>
                <label>Accent</label>
                <strong>{analysis.accent_color}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Style match</h3>
            </div>

            <div className="tip-box">
              <p>{analysis.recommendations?.styling?.[0] || 'Balance the outfit with neutral layers.'}</p>
            </div>

            <ul className="matches">
              {(analysis.recommendations?.complements || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </main>

      {loading && <div className="loader">Analyzing outfit colors...</div>}

      {cameraOpen && (
        <div className="camera-backdrop" onClick={closeCamera}>
          <section
            className="camera-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="camera-dialog-head">
              <h2 id="camera-title">Capture your outfit</h2>
              <button className="camera-close" type="button" onClick={closeCamera} aria-label="Close camera">
                Close
              </button>
            </div>
            {cameraStream ? (
              <video ref={videoRef} autoPlay playsInline aria-label="Live camera preview" />
            ) : (
              <div className="camera-status">{cameraError || 'Waiting for camera permission...'}</div>
            )}
            {cameraError && cameraStream && <p className="camera-error">{cameraError}</p>}
            <div className="camera-actions">
              <button className="camera-btn" type="button" onClick={closeCamera}>Cancel</button>
              <button className="upload-btn" type="button" onClick={capturePhoto} disabled={!cameraStream}>
                Take photo
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
