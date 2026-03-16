import { useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
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
const infoToastStyle = {
  border: "1px solid rgba(88, 214, 255, 0.2)",
  background: "rgba(13, 27, 39, 0.95)",
  color: "#dff6ff",
  boxShadow: "0 18px 34px rgba(0, 0, 0, 0.24)",
};
const showErrorToast = (message, id = "app-error") => {
  toast.error(message, { id });
};
const showSuccessToast = (message, id = "app-success") => {
  toast.success(message, { id });
};
const showInfoToast = (message, id = "app-info") => {
  toast(message, {
    id,
    icon: "i",
    style: infoToastStyle,
  });
};
const formatWorkingDuration = (startTime, endTime) => {
  const durationMs = Math.max(endTime.getTime() - startTime.getTime(), 0);
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");

  return `${hours}h ${minutes}m`;
};
const upsertAttendanceRecord = (records, nextRecord) => {
  const existingIndex = records.findIndex((entry) => entry._id === nextRecord._id);

  if (existingIndex === -1) {
    return [nextRecord, ...records];
  }

  return records.map((entry, index) => (index === existingIndex ? nextRecord : entry));
};

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
  const [loadingAction, setLoadingAction] = useState("");
  const [workingNow, setWorkingNow] = useState(() => Date.now());
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);
  const [needsCameraPermission, setNeedsCameraPermission] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const initializePermissions = async () => {
      const [locationPermission, cameraPermission] = await Promise.all([
        getPermissionState("geolocation"),
        getPermissionState("camera"),
      ]);

      if (locationPermission === "denied") {
        setNeedsLocationPermission(true);
        setLocationPermissionDenied(true);
      } else if (locationPermission === "granted") {
        requestLocation({ silent: true });
      } else {
        setNeedsLocationPermission(true);
        setLocationPermissionDenied(false);
      }

      if (cameraPermission === "denied") {
        setNeedsCameraPermission(true);
        setCameraPermissionDenied(true);
      } else if (cameraPermission === "granted") {
        startCamera({ silent: true });
      } else {
        setNeedsCameraPermission(true);
        setCameraPermissionDenied(false);
      }

      loadShopInfo();
    };

    initializePermissions();

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
      setForm((current) => ({ ...current, userName: "" }));
    }
  }, [form.userId]);

  useEffect(() => {
    if (!form.userId.trim() || !history.length) {
      return;
    }

    const latestNamedRecord = history.find((entry) => entry.userName?.trim());
    if (!latestNamedRecord?.userName) {
      return;
    }

    setForm((current) => {
      if (current.userName === latestNamedRecord.userName) {
        return current;
      }

      return {
        ...current,
        userName: latestNamedRecord.userName,
      };
    });
  }, [history, form.userId]);

  useEffect(() => {
    if (!videoRef.current || !streamRef.current || selfiePreview) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setStreamReady(false);
    });
  }, [streamReady, selfiePreview]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setWorkingNow(Date.now());
    }, 60000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

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
        showErrorToast("Camera access is not supported on this device/browser.", "camera-permission");
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
      return true;
    } catch (cameraError) {
      stopCamera();
      setNeedsCameraPermission(true);
      setCameraPermissionDenied(
        cameraError?.name === "NotAllowedError" || cameraError?.name === "SecurityError"
      );
      if (!silent) {
        showErrorToast("Camera access denied. A selfie is required for attendance.", "camera-permission");
      }
      return false;
    }
  };

  const requestLocation = async ({ silent = false } = {}) => {
    if (!navigator.geolocation) {
      setNeedsLocationPermission(true);
      setLocationPermissionDenied(true);
      if (!silent) {
        showErrorToast("Geolocation is not supported on this device.", "location-permission");
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
            showSuccessToast("GPS refreshed successfully.", "location-permission");
          }
          resolve(true);
        },
        (geoError) => {
          setNeedsLocationPermission(true);
          setLocationPermissionDenied(geoError?.code === 1);
          if (!silent) {
            showErrorToast("Location access denied. GPS is required for attendance.", "location-permission");
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
      showErrorToast(historyError.message, "history");
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
      showErrorToast("Please enter both user ID and user name.", "attendance-validation");
      return false;
    }

    if (!position) {
      showErrorToast("Current location is unavailable. Please allow GPS access.", "attendance-validation");
      return false;
    }

    if (!isNearShop) {
      showErrorToast("You are not near the shop. Please move closer to check.", "attendance-validation");
      return false;
    }

    if (!selfieBlob) {
      showErrorToast("Please capture a selfie first.", "attendance-validation");
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
      hasLocation = await requestLocation({ silent: true });
    }

    if (cameraPermission === "denied" || !hasCamera) {
      hasCamera = await startCamera({ silent: true });
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
      if (!hasLocation && !hasCamera) {
        showErrorToast(ATTENDANCE_PERMISSION_MESSAGE, "permissions");
      } else if (!hasLocation) {
        showErrorToast("Location access denied. GPS is required for attendance.", "permissions");
      } else {
        showErrorToast("Camera access denied. A selfie is required for attendance.", "permissions");
      }
    }

    return hasLocation && hasCamera;
  };

  const requestAllPermissions = async () => {
    const [locationPermission, cameraPermission] = await Promise.all([
      getPermissionState("geolocation"),
      getPermissionState("camera"),
    ]);

    const hasCamera = await startCamera({ silent: true });
    const hasLocation = await requestLocation({ silent: true });

    if (!hasLocation || !hasCamera) {
      setNeedsLocationPermission(!hasLocation);
      setNeedsCameraPermission(!hasCamera);

      if (locationPermission === "denied" || cameraPermission === "denied") {
        showErrorToast(
          "Permission was blocked in the browser. Please allow camera and location in site settings.",
          "permissions"
        );
      } else if (!hasLocation && !hasCamera) {
        showErrorToast(ATTENDANCE_PERMISSION_MESSAGE, "permissions");
      } else if (!hasLocation) {
        showErrorToast("Location access denied. GPS is required for attendance.", "permissions");
      } else {
        showErrorToast("Camera access denied. A selfie is required for attendance.", "permissions");
      }
      return;
    }

    showSuccessToast("Camera and location permissions are ready.", "permissions");
  };

  const captureSelfie = async () => {
    const cameraStarted = await startCamera({ silent: true });
    if (!cameraStarted || !hasActiveCameraStream()) {
      if (cameraPermissionDenied) {
        showErrorToast("Camera access denied. A selfie is required for attendance.", "camera-preview");
      } else {
        showErrorToast("Camera preview is not active yet. Please allow access and wait for the live preview.", "camera-preview");
      }
      return;
    }

    if (
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      showErrorToast("Camera preview is not ready yet.", "camera-preview");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (!context) {
      showErrorToast("Unable to access the camera canvas.", "camera-preview");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showErrorToast("Unable to capture selfie image.", "camera-preview");
          return;
        }

        if (selfiePreview) {
          URL.revokeObjectURL(selfiePreview);
        }

        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        showInfoToast("Selfie captured. You can now continue.", "selfie-info");
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
    showInfoToast("You can capture a new selfie now.", "selfie-info");
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

    try {
      const formData = new FormData();
      formData.append("userId", form.userId.trim());
      formData.append("userName", form.userName.trim());
      formData.append("latitude", String(position.latitude));
      formData.append("longitude", String(position.longitude));
      formData.append("timestamp", new Date().toISOString());
      formData.append("image", selfieBlob, `${action}-selfie.jpg`);

      const data = await submitAttendanceRequest(action, formData);

      showSuccessToast(data.message, "attendance-status");
      if (data.attendance) {
        setHistory((current) => upsertAttendanceRecord(current, data.attendance));
      }
      setSelfieBlob(null);
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
      setSelfiePreview("");
      fetchHistory(form.userId.trim());
      requestLocation();
    } catch (attendanceError) {
      showErrorToast(attendanceError.message, "attendance-status");
    } finally {
      setLoadingAction("");
    }
  };

  const isNearShop = distance !== null && distance <= maxDistanceMeters;
  const attendanceAction = getAttendanceAction();
  const hasCheckedOutToday = history.some(
    (entry) => entry.date === getTodayDateString() && entry.checkOutTime
  );
  const todayRecord = history.find((entry) => entry.date === getTodayDateString());
  const activeCheckInTime =
    todayRecord?.checkInTime && !todayRecord?.checkOutTime ? new Date(todayRecord.checkInTime) : null;
  const formattedCheckInTime = activeCheckInTime
    ? activeCheckInTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const workingDuration = activeCheckInTime
    ? formatWorkingDuration(activeCheckInTime, new Date(workingNow))
    : "";

  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "16px",
            padding: "14px 16px",
            background: "rgba(12, 23, 34, 0.95)",
            color: "#edf6fb",
            border: "1px solid rgba(88, 214, 255, 0.16)",
            boxShadow: "0 18px 34px rgba(0, 0, 0, 0.24)",
          },
          success: {
            style: {
              border: "1px solid rgba(35, 211, 177, 0.22)",
              background: "rgba(10, 31, 32, 0.96)",
              color: "#dcfff5",
              boxShadow: "0 18px 34px rgba(0, 0, 0, 0.24)",
            },
          },
          error: {
            style: {
              border: "1px solid rgba(255, 109, 126, 0.22)",
              background: "rgba(45, 17, 24, 0.96)",
              color: "#ffe1e7",
              boxShadow: "0 18px 34px rgba(0, 0, 0, 0.24)",
            },
          },
        }}
      />
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
          requestAllPermissions={requestAllPermissions}
          captureSelfie={captureSelfie}
          resetSelfie={resetSelfie}
          submitAttendance={submitAttendance}
          attendanceAction={attendanceAction}
          hasCheckedOutToday={hasCheckedOutToday}
          formattedCheckInTime={formattedCheckInTime}
          workingDuration={workingDuration}
          loadingAction={loadingAction}
          videoRef={videoRef}
          setVideoElement={setVideoElement}
          canvasRef={canvasRef}
          streamReady={streamReady}
          selfiePreview={selfiePreview}
          needsLocationPermission={needsLocationPermission}
          needsCameraPermission={needsCameraPermission}
          locationPermissionDenied={locationPermissionDenied}
          cameraPermissionDenied={cameraPermissionDenied}
        />
        <History history={history} />
      </main>
    </div>
  );
}

export default App;
