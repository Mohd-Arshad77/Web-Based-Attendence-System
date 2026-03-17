function Camera({
  videoRef,
  canvasRef,
  streamReady,
  selfiePreview,
  cameraPermissionDenied,
}) {
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
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(event) => {
                event.currentTarget.play().catch(() => {});
              }}
            />
            {streamReady ? <span className="camera-scan-line" aria-hidden="true" /> : null}
            {!streamReady ? <div className="camera-overlay">Enable camera access</div> : null}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
}

export default Camera;
