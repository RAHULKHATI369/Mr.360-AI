export const processFrame = async (blob, featureType) => {
  const formData = new FormData();
  formData.append('frame', blob, 'frame.jpg');
  formData.append('feature_type', featureType);

  const response = await fetch('http://localhost:8080/process-360', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 503 || response.status === 429) {
      console.warn("Service Unavailable / Rate Limited. Backend retries exhausted.");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  return result.data;
};
