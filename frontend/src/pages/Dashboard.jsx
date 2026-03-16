import Camera from "../components/Camera.jsx";
import LocationMap from "../components/LocationMap.jsx";

function Dashboard({
  form,
  onFormChange,
  position,
  shopLocation,
  distance,
  isNearShop,
  maxDistanceMeters,
  requestLocation,
  startCamera,
  captureSelfie,
  resetSelfie,
  submitAttendance,
  attendanceAction,
  hasCheckedOutToday,
  loadingAction,
  cameraMessage,
  cameraError,
  locationMessage,
  locationError,
  attendanceMessage,
  attendanceError,
  toast,
  videoRef,
  setVideoElement,
  canvasRef,
  streamReady,
  selfiePreview,
  locationPermissionDenied,
  cameraPermissionDenied,
}) {
  const showPermissionHelp = locationPermissionDenied || cameraPermissionDenied;
  const attendanceButtonText =
    loadingAction === "checkin"
      ? "Checking In..."
      : loadingAction === "checkout"
        ? "Checking Out..."
        : hasCheckedOutToday
          ? "Checked Out"
          : attendanceAction === "checkout"
            ? "Check Out"
            : "Check In";

  return (
    <section className="hero-card">
      {toast ? <div className={`toast-banner toast-${toast.kind}`}>{toast.text}</div> : null}

      {showPermissionHelp ? (
        <div className="dashboard-permission-help">
          <span className="permission-inline-text">Did you allow permissions?</span>
          <div className="permission-tooltip-wrap">
            <button type="button" className="button secondary permission-help-button">
              How to enable
            </button>
            <div className="permission-tooltip-card">
              <img
                src="/permission.gif"
                alt="Tutorial showing how to allow camera and location permissions"
                className="permission-gif"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="eyebrow">GPS Verified Attendance</div>
      <h1>Check in only when you are really at the shop.</h1>
      <p>
        This dashboard combines live location validation, selfie capture, and
        attendance history in one mobile-friendly flow.
      </p>

      <div className="dashboard-symmetric-grid">
        <div className="dashboard-grid-cell field-cell user-id-cell">
          <label>User ID</label>
          <input
            value={form.userId}
            onChange={(event) => onFormChange("userId", event.target.value)}
            placeholder="EMP001"
          />
        </div>

        <div className="dashboard-grid-cell status-card shop-location-cell">
          <span>Shop Location</span>
          <strong>
            {shopLocation.latitude}, {shopLocation.longitude}
          </strong>
        </div>

        <div className="dashboard-grid-cell field-cell user-name-cell">
          <label>User Name</label>
          <input
            value={form.userName}
            onChange={(event) => onFormChange("userName", event.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div
          className={`dashboard-grid-cell status-card distance-cell ${isNearShop ? "status-ok" : "status-warning"}`}
        >
          <span>Distance from Shop</span>
          <strong>{distance !== null ? `${distance} m / ${maxDistanceMeters} m` : "Locating..."}</strong>
        </div>

        <div className="dashboard-grid-cell media-cell camera-media-cell">
          <Camera
            startCamera={startCamera}
            setVideoElement={setVideoElement}
            canvasRef={canvasRef}
            streamReady={streamReady}
            selfiePreview={selfiePreview}
            cameraPermissionDenied={cameraPermissionDenied}
          />
        </div>

        <div className="dashboard-grid-cell media-cell map-media-cell">
          <div className="map-frame">
            <LocationMap shopLocation={shopLocation} userLocation={position} />
          </div>
        </div>

        <div className="dashboard-grid-cell action-cell camera-action-cell">
          <button
            type="button"
            className={`button secondary section-action-button ${selfiePreview ? "camera-retake-button" : "camera-capture-button"}`}
            onClick={selfiePreview ? resetSelfie : captureSelfie}
          >
            {selfiePreview ? "Retake Selfie" : "Capture Selfie"}
          </button>

          {cameraMessage ? <p className="feedback success section-feedback">{cameraMessage}</p> : null}
          {cameraError ? <p className="feedback error section-feedback">{cameraError}</p> : null}
        </div>

        <div className="dashboard-grid-cell action-cell map-action-cell">
          <button
            type="button"
            className="button secondary section-action-button location-refresh-button"
            onClick={requestLocation}
          >
            Refresh GPS
          </button>

          {locationMessage ? <p className="feedback success section-feedback">{locationMessage}</p> : null}
          {locationError ? <p className="feedback error section-feedback">{locationError}</p> : null}
        </div>
      </div>

      <div className="attendance-action-row">
        <button
          type="button"
          className={`button ${attendanceAction === "checkout" ? "accent" : "primary"} attendance-button`}
          onClick={() => submitAttendance(attendanceAction)}
          disabled={Boolean(loadingAction) || hasCheckedOutToday}
        >
          {attendanceButtonText}
        </button>
      </div>

      {attendanceMessage ? <p className="feedback success">{attendanceMessage}</p> : null}
      {attendanceError ? <p className="feedback error">{attendanceError}</p> : null}
    </section>
  );
}

export default Dashboard;
