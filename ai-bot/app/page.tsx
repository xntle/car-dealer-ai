'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Audio recording is not supported in this browser.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
      })
      .catch(err => console.error('Error accessing microphone:', err));
  }, []);

  const startRecording = () => {
    if (!mediaRecorder) return;

    setRecording(true);
    mediaRecorder.start();

    const audioChunks: Blob[] = [];
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');

        const res = await fetch('/api/chat/route.js', {
          method: 'POST',
          body: audioBlob, // Send the raw binary data
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setResponse(data.text);
      } catch (error) {
        console.error('Error starting chat:', error);
      } finally {
        setLoading(false);
      }
    };
  };

  const stopRecording = () => {
    if (!mediaRecorder || !recording) return;

    setRecording(false);
    mediaRecorder.stop();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AI-Powered Voice Chat</h1>
      <div className="mb-4">
        <button
          className="bg-blue-500 text-white p-2 rounded mr-2"
          onClick={startRecording}
          disabled={recording || loading}
        >
          Start Recording
        </button>
        <button
          className="bg-red-500 text-white p-2 rounded"
          onClick={stopRecording}
          disabled={!recording || loading}
        >
          Stop Recording
        </button>
      </div>
      {response && (
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <h2 className="font-semibold">AI Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
