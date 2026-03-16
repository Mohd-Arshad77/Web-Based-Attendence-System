import { useEffect, useRef, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import {
  fetchAttendanceHistory,
  fetchShopInfo,
  submitAttendanceRequest,
} from "./services/api.js";

const DEFAULT_SHOP_LOCATION = {
  latitude: 11.1215,
  longitude: 76.12,
};

const DEFAULT_MAX_DISTANCE_METERS = 1000;
const ATTENDANCE_PERMISSION_MESSAGE =
  "Please allow location and camera permissions to mark attendance.";
const getTodayDateString = () => new Date().toISOString().split("T")[0];

const calculateDistanceInMeters = (from, to) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

function App() {
  const [form, setForm] = useState({ userId: "", userName: "" });
  const [shopLocation, setShopLocation] = useState(DEFAULT_SHOP_LOCATION);
  const [maxDistanceMeters, setMaxDistanceMeters] = useState(DEFAULT_MAX_DISTANCE_METERS);
  const [position, setPosition] = useState(null);
  const [distance, setDistance] = useState(null);
  const [streamReady, setStreamReady] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [history, setHistory] = useState([]);
  const [cameraMessage, setCameraMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [toast, setToast] = useState(null);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);
  const [needsCameraPermission, setNeedsCameraPermission] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    startCamera({ silent: true });
    requestLocation({ silent: true });
    loadShopInfo();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!position) {
      return;
    }

    const currentDistance = calculateDistanceInMeters(position, shopLocation);
    setDistance(Number(currentDistance.toFixed(2)));
  }, [position, shopLocation]);

  useEffect(() => {
    if (form.userId.trim()) {
      fetchHistory(form.userId.trim());
    } else {
      setHistory([]);
    }
  }, [form.userId]);

  useEffect(() => {
    if (!videoRef.current || !streamRef.current || selfiePreview) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setStreamReady(false);
    });
  }, [streamReady, selfiePreview]);

  const attachStreamToVideo = async (stream) => {
    if (!videoRef.current) {
      return false;
    }

    videoRef.current.srcObject = stream;
    await videoRef.current.play().catch(() => {});
    return true;
  };

  const setVideoElement = (element) => {
    videoRef.current = element;

    if (!element || !streamRef.current || selfiePreview) {
      return;
    }

    element.srcObject = streamRef.current;
    element.play().catch(() => {
      setStreamReady(false);
    });
  };

  const stopCamera = () => {
    if (!streamRef.current) {
      return;
    }

    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreamReady(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const hasActiveCameraStream = () =>
    Boolean(
      streamRef.current &&
        streamRef.current.active &&
        streamRef.current.getVideoTracks().some((track) => track.readyState === "live")
    );

  const showToast = (kind, text) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ kind, text });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const getPermissionState = async (name) => {
    if (!navigator.permissions?.query) {
      return "prompt";
    }

    try {
      const status = await navigator.permissions.query({ name });
      return status.state;
    } catch (_error) {
      return "prompt";
    }
  };

  const startCamera = async ({ silent = false } = {}) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStreamReady(false);
      setNeedsCameraPermission(true);
      setCameraPermissionDenied(true);
      if (!silent) {
        showToast("error", "Camera access is unavailable. Please enable camera permission in your browser.");
        setCameraError("Camera access is not supported on this device/browser.");
      }
      return false;
    }

    if (hasActiveCameraStream()) {
      await attachStreamToVideo(streamRef.current);

      setStreamReady(true);
      return true;
    }

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      await attachStreamToVideo(stream);

      setStreamReady(true);
      setNeedsCameraPermission(false);
      setCameraPermissionDenied(false);
      if (!silent) {
        setCameraError("");
      }
      return true;
    } catch (cameraError) {
      stopCamera();
      setNeedsCameraPermission(true);
      setCameraPermissionDenied(
        cameraError?.name === "NotAllowedError" || cameraError?.name === "SecurityError"
      );
      if (!silent) {
        showToast("error", "Camera permission was denied. Please enable camera access in your browser.");
        setCameraError("Camera access was denied. A selfie is required for attendance.");
      }
      return false;
    }
  };

  const requestLocation = async ({ silent = false } = {}) => {
    if (!navigator.geolocation) {
      setNeedsLocationPermission(true);
      setLocationPermissionDenied(true);
      if (!silent) {
        showToast("error", "Location access is unavailable. Please enable location permission in your browser.");
        setLocationError("Geolocation is not supported on this device.");
      }
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          setPosition({
            latitude: geoPosition.coords.latitude,
            longitude: geoPosition.coords.longitude,
          });
          setNeedsLocationPermission(false);
          setLocationPermissionDenied(false);
          if (!silent) {
            setLocationMessage("GPS refreshed successfully.");
            setLocationError("");
          }
          resolve(true);
        },
        (geoError) => {
          setNeedsLocationPermission(true);
          setLocationPermissionDenied(geoError?.code === 1);
          if (!silent) {
            showToast("error", "Location permission was denied. Please enable location access in your browser.");
            setLocationError("Location access was denied. GPS is required for attendance.");
          }
          resolve(false);
        },
        {
          enableHighAccuracy: true,
        }
      );
    });
  };

  const fetchHistory = async (userId) => {
    try {
      const data = await fetchAttendanceHistory(userId);
      setHistory(data);
    } catch (historyError) {
      setAttendanceError(historyError.message);
    }
  };

  const loadShopInfo = async () => {
    try {
      const data = await fetchShopInfo();
      if (data?.shopLocation) {
        setShopLocation(data.shopLocation);
      }
      if (typeof data?.maxDistanceMeters === "number") {
        setMaxDistanceMeters(data.maxDistanceMeters);
      }
    } catch (_shopInfoError) {
      // Keep frontend defaults if the API is temporarily unavailable.
    }
  };

  const validateAttendanceBeforeSubmit = () => {
    if (!form.userId.trim() || !form.userName.trim()) {
      setAttendanceError("Please enter both user ID and user name.");
      return false;
    }

    if (!position) {
      setAttendanceError("Current location is unavailable. Please allow GPS access.");
      return false;
    }

    if (!isNearShop) {
      setAttendanceError("You are not near the shop. Please move closer to check.");
      return false;
    }

    if (!selfieBlob) {
      setAttendanceError("Please capture a selfie first.");
      return false;
    }

    return true;
  };

  const ensureAttendancePermissions = async () => {
    const locationPermission = await getPermissionState("geolocation");
    const cameraPermission = await getPermissionState("camera");

    let hasLocation = Boolean(position);
    let hasCamera = hasActiveCameraStream();

    if (locationPermission === "denied" || !hasLocation) {
      hasLocation = await requestLocation();
    }

    if (cameraPermission === "denied" || !hasCamera) {
      hasCamera = await startCamera();
    }

    if (!hasLocation) {
      setNeedsLocationPermission(true);
    }

    if (!hasCamera) {
      setNeedsCameraPermission(true);
    }

    if (!hasLocation || !hasCamera) {
      setNeedsLocationPermission(true);
      setNeedsCameraPermission(true);
      setAttendanceError(ATTENDANCE_PERMISSION_MESSAGE);
    }

    return hasLocation && hasCamera;
  };

  const captureSelfie = async () => {
    const cameraStarted = await startCamera();
    if (!cameraStarted || !hasActiveCameraStream()) {
      setCameraError("Camera preview is not active yet. Please allow access and wait for the live preview.");
      return;
    }

    if (
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Unable to access the camera canvas.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture selfie image.");
          return;
        }

        if (selfiePreview) {
          URL.revokeObjectURL(selfiePreview);
        }

        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        setCameraMessage("Selfie captured. You can now continue.");
        setCameraError("");
      },
      "image/jpeg",
      0.9
    );
  };

  const resetSelfie = async () => {
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
    }

    setSelfieBlob(null);
    setSelfiePreview("");
    setCameraMessage("You can capture a new selfie now.");
    setCameraError("");
    await startCamera();
  };

  const getAttendanceAction = () => {
    const todayRecord = history.find((entry) => entry.date === getTodayDateString());

    if (todayRecord?.checkInTime && !todayRecord?.checkOutTime) {
      return "checkout";
    }

    return "checkin";
  };

  const submitAttendance = async (action) => {
    const permissionsReady = await ensureAttendancePermissions();
    if (!permissionsReady) {
      return;
    }

    if (!validateAttendanceBeforeSubmit()) {
      return;
    }

    setLoadingAction(action);
    setAttendanceError("");
    setAttendanceMessage("");

    try {
      const formData = new FormData();
      formData.append("userId", form.userId.trim());
      formData.append("userName", form.userName.trim());
      formData.append("latitude", String(position.latitude));
      formData.append("longitude", String(position.longitude));
      formData.append("timestamp", new Date().toISOString());
      formData.append("image", selfieBlob, `${action}-selfie.jpg`);

      const data = await submitAttendanceRequest(action, formData);

      setAttendanceMessage(data.message);
      setSelfieBlob(null);
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
      setSelfiePreview("");
      setCameraMessage("");
      fetchHistory(form.userId.trim());
      requestLocation();
    } catch (attendanceError) {
      setAttendanceError(attendanceError.message);
    } finally {
      setLoadingAction("");
    }
  };

  const isNearShop = distance !== null && distance <= maxDistanceMeters;
  const attendanceAction = getAttendanceAction();
  const hasCheckedOutToday = history.some(
    (entry) => entry.date === getTodayDateString() && entry.checkOutTime
  );

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <main className="layout">
        <Dashboard
          form={form}
          onFormChange={(field, value) =>
            setForm((current) => ({ ...current, [field]: value }))
          }
          position={position}
          shopLocation={shopLocation}
          distance={distance}
          isNearShop={isNearShop}
          maxDistanceMeters={maxDistanceMeters}
          requestLocation={requestLocation}
          startCamera={startCamera}
          captureSelfie={captureSelfie}
          resetSelfie={resetSelfie}
          submitAttendance={submitAttendance}
          attendanceAction={attendanceAction}
          hasCheckedOutToday={hasCheckedOutToday}
          loadingAction={loadingAction}
          cameraMessage={cameraMessage}
          cameraError={cameraError}
          locationMessage={locationMessage}
          locationError={locationError}
          attendanceMessage={attendanceMessage}
          attendanceError={attendanceError}
          toast={toast}
          videoRef={videoRef}
          setVideoElement={setVideoElement}
          canvasRef={canvasRef}
          streamReady={streamReady}
          selfiePreview={selfiePreview}
          locationPermissionDenied={locationPermissionDenied}
          cameraPermissionDenied={cameraPermissionDenied}
        />
        <History history={history} />
      </main>
    </div>
  );
}

export default App;
