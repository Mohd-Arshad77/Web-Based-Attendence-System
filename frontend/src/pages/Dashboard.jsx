import { useEffect, useRef, useState } from "react";
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
  requestAllPermissions,
  captureSelfie,
  resetSelfie,
  submitAttendance,
  attendanceAction,
  hasCheckedOutToday,
  formattedCheckInTime,
  workingDuration,
  loadingAction,
  videoRef,
  canvasRef,
  streamReady,
  selfiePreview,
  needsLocationPermission,
  needsCameraPermission,
  locationPermissionDenied,
  cameraPermissionDenied,
}) {
  const userNameInputRef = useRef(null);
  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false
  );
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || navigator.vendor || "" : "";
  const isAndroid = /Android/i.test(userAgent);
  const isIPhone = /iPhone|iPad|iPod/i.test(userAgent);
  const showPermissionHelp =
    needsLocationPermission ||
    needsCameraPermission ||
    locationPermissionDenied ||
    cameraPermissionDenied;
  const locationHelpMessage =
    isSmallScreen && (needsLocationPermission || locationPermissionDenied)
      ? isAndroid
        ? "Location is off. Turn it on in Android Settings."
        : isIPhone
          ? "Location is off. Enable it in iPhone Settings."
          : "Location is off. Enable location access."
      : "";
  const showWorkingSummary =
    attendanceAction === "checkout" && formattedCheckInTime && workingDuration && !hasCheckedOutToday;
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleScreenChange = (event) => {
      setIsSmallScreen(event.matches);
    };

    setIsSmallScreen(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  return (
    <section className="hero-card">
      <div className="hero-topbar">
        <div className="brand-mark" aria-label="Attendify">
          <span className="brand-icon" aria-hidden="true">
            <span className="brand-pin-head" />
            <span className="brand-pin-tail" />
            <span className="brand-check" />
          </span>
          <span className="brand-copy">
            <span className="brand-text">Attendify</span>
            <span className="brand-underline" />
          </span>
        </div>
      </div>

      {!isSmallScreen && showPermissionHelp ? (
        <div className="hero-status-strip">
          <div className="dashboard-permission-help">
            <span className="permission-inline-text">Permission required to continue</span>
            <button type="button" className="button primary permission-allow-button" onClick={requestAllPermissions}>
              Ask Permission
            </button>
          </div>

          {locationHelpMessage ? (
            <div className="permission-inline-note" role="status">
              <strong>Location:</strong>
              <span>{locationHelpMessage}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="hero-content">
        <div className="eyebrow">GPS VERIFIED ATTENDANCE</div>
        <div className="hero-heading-group">
          <div className="hero-title-row">
            <h1>
              Welcome to <span className="hero-accent">Attendify</span>
            </h1>
          </div>
          <h2 className="hero-subheading">Secure GPS-Verified Attendance System</h2>
        </div>
      </div>

      {isSmallScreen && showPermissionHelp ? (
        <div className="hero-status-strip">
          <div className="dashboard-permission-help">
            <span className="permission-inline-text">Permission required to continue</span>
            <button type="button" className="button primary permission-allow-button" onClick={requestAllPermissions}>
              Ask Permission
            </button>
          </div>

          {locationHelpMessage ? (
            <div className="permission-inline-note" role="status">
              <strong>Location:</strong>
              <span>{locationHelpMessage}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="dashboard-symmetric-grid">
        <div className="dashboard-grid-cell field-cell user-id-cell">
          <label>User ID</label>
          <input
            value={form.userId}
            onChange={(event) => onFormChange("userId", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                userNameInputRef.current?.focus();
              }
            }}
            placeholder="EMP001"
          />
        </div>

        <div className="dashboard-grid-cell metric-card shop-location-cell">
          <div className="metric-content">
            <span className="metric-label">Shop Location</span>
            <strong className="metric-value">
              {shopLocation.latitude}, {shopLocation.longitude}
            </strong>
          </div>
        </div>

        <div className="dashboard-grid-cell field-cell user-name-cell">
          <label>User Name</label>
          <input
            ref={userNameInputRef}
            value={form.userName}
            onChange={(event) => onFormChange("userName", event.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div
          className={`dashboard-grid-cell metric-card distance-cell ${isNearShop ? "status-ok" : "status-warning"}`}
        >
          <div className="metric-content">
            <div className="metric-heading-row">
              <span className="metric-label">Distance from Shop</span>
              <span className={`metric-status-dot ${isNearShop ? "in-range" : "out-range"}`} />
            </div>
            <strong className="metric-value">
              {distance !== null ? `${distance} m / ${maxDistanceMeters} m` : "Locating..."}
            </strong>
          </div>
        </div>

        <div className="dashboard-grid-cell media-cell camera-media-cell">
          <Camera
            videoRef={videoRef}
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
          {!hasCheckedOutToday ? (
            <button
              type="button"
              className={`button secondary section-action-button ${selfiePreview ? "camera-retake-button" : "camera-capture-button"}`}
              onClick={selfiePreview ? resetSelfie : captureSelfie}
            >
              {selfiePreview ? "Retake Selfie" : "Capture Selfie"}
            </button>
          ) : null}
        </div>

        <div className="dashboard-grid-cell action-cell map-action-cell">
          {!hasCheckedOutToday ? (
            <button
              type="button"
              className="button secondary section-action-button location-refresh-button"
              onClick={requestLocation}
            >
              Refresh GPS
            </button>
          ) : null}
        </div>
      </div>

      <div className="attendance-action-row">
        {showWorkingSummary ? (
          <div className="working-summary-card">
            <div className="working-summary-row">
              <span>Check-In Time</span>
              <strong>{formattedCheckInTime}</strong>
            </div>
            <div className="working-summary-row">
              <span>Working Time</span>
              <strong>{workingDuration}</strong>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className={`button ${attendanceAction === "checkout" ? "accent" : "primary"} attendance-button`}
          onClick={() => submitAttendance(attendanceAction)}
          disabled={Boolean(loadingAction) || hasCheckedOutToday}
        >
          {hasCheckedOutToday ? "Attendance completed for today" : attendanceButtonText}
        </button>
      </div>
    </section>
  );
}

export default Dashboard;
