import { useEffect } from "react";

function Camera({
  startCamera,
  setVideoElement,
  canvasRef,
  streamReady,
  selfiePreview,
  cameraPermissionDenied,
}) {
  useEffect(() => {
    startCamera({ silent: true });
  }, []);

  useEffect(() => {
    if (!selfiePreview) {
      startCamera({ silent: true });
    }
  }, [selfiePreview]);

  return (
    <div className="camera-section">
      <div className="camera-frame">
        {selfiePreview ? (
          <img src={selfiePreview} alt="Latest captured selfie preview" className="selfie-preview-image" />
        ) : cameraPermissionDenied ? (
          <div className="camera-state-message">Please enable camera access to capture selfie</div>
        ) : (
          <>
            <video
              ref={setVideoElement}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(event) => {
                event.currentTarget.play().catch(() => {});
              }}
            />
            {!streamReady ? <div className="camera-overlay">Enable camera access</div> : null}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
}

export default Camera;
