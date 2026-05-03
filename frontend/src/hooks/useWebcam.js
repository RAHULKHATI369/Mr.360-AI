import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebcam(intervalMs = 3000) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [error, setError] = useState(null);

  // Start the webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please allow permissions.");
    }
  }, []);

  // Stop the webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
  }, []);

  // Capture a frame from the video
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isRecording) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure canvas dimensions match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return base64 JPEG or a Blob
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
    });
  }, [isRecording]);

  return {
    videoRef,
    canvasRef,
    isRecording,
    startWebcam,
    stopWebcam,
    captureFrame,
    latestResult,
    setLatestResult,
    error
  };
}
