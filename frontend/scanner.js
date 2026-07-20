const apiHost = window.location.hostname || "127.0.0.1";
const apiBaseUrl = `http://${apiHost}:8000`;

const resultDiv = document.getElementById("result");
const readerContainer = document.getElementById("reader-container");
const userCard = document.getElementById("user-card");
const userName = document.getElementById("user-name");
const userToken = document.getElementById("user-token");
const userAction = document.getElementById("user-action");
const attendanceLogs = document.querySelector("#attendance-logs tbody");
const inButton = document.getElementById("in-button");
const outButton = document.getElementById("out-button");
const retryButton = document.getElementById("retry-button");
const cameraContainer = document.getElementById("camera-container");
const cameraStatus = document.getElementById("camera-status");
const cameraVideo = document.getElementById("camera");
const cameraControls = document.getElementById("camera-controls");
const captureButton = document.getElementById("capture-button");
const cancelCameraButton = document.getElementById("cancel-camera-button");

let currentToken = null;
let currentStream = null;
let scanner = null;
let currentActionType = null;

function setStatus(message, color = "#333") {
    resultDiv.innerText = message;
    resultDiv.style.color = color;
}

function show(element) {
    element.style.display = "block";
}

function hide(element) {
    element.style.display = "none";
}

function initializeScanner() {
    if (scanner) {
        try {
            scanner.clear();
        } catch (error) {
            console.warn("Unable to clear previous scanner instance", error);
        }
    }

    scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
    );

    scanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText) {
    scanner.clear().then(() => {
        currentToken = decodedText;
        hide(readerContainer);
        setStatus("✅ QR scanned successfully. Loading user details...", "#0056b3");
        loadUserDetails(decodedText);
    }).catch((error) => {
        console.error("Scanner clear failed:", error);
        setStatus("❌ QR scanner error. Please refresh the page.", "#dc3545");
    });
}

function onScanFailure(error) {
    // intentionally ignore scanning failures
}

function loadUserDetails(token) {
    fetch(`${apiBaseUrl}/scan-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    })
        .then((response) => response.json().then((data) => ({ status: response.status, body: data })))
        .then((result) => {
            if (result.status !== 200) {
                const message = result.body.detail || "Unable to load user details.";
                setStatus(`❌ ${message}`, "#dc3545");
                return;
            }

            currentToken = result.body.token;
            userName.innerText = result.body.name;
            userToken.innerText = `Token: ${result.body.token}`;
            userAction.innerText = `Next action: ${result.body.next_action}`;
            renderLogs(result.body.logs);
            show(userCard);
            show(retryButton.parentElement);
            hide(cameraContainer);
            hide(cameraControls);
        })
        .catch((error) => {
            console.error("API error:", error);
            setStatus("❌ Backend unreachable. Please start the backend server.", "#dc3545");
            hide(readerContainer);
        });
}

function renderLogs(logs) {
    attendanceLogs.innerHTML = "";
    if (!logs || logs.length === 0) {
        attendanceLogs.innerHTML = "<tr><td colspan='6'>No attendance records found.</td></tr>";
        return;
    }

    logs.forEach((log) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${log.scan_date}</td><td>${log.in_time}</td><td>${log.in_status}</td><td>${log.out_time}</td><td>${log.out_status}</td><td>${log.duration_status}</td>`;
        attendanceLogs.appendChild(row);
    });
}

function startFaceVerification(actionType) {
    currentActionType = actionType;
    if (!currentToken) {
        setStatus("❌ No user selected. Scan a QR code first.", "#dc3545");
        return;
    }

    setStatus("📷 Requesting camera access...", "#0056b3");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
            currentStream = stream;
            cameraVideo.srcObject = stream;
            cameraVideo.play();
            show(cameraContainer);
            show(cameraControls);
            setStatus("✅ Camera is active. Align your face and click Capture Face.", "#28a745");
            cameraStatus.innerText = "📷 Camera active. Ready to capture.";
            captureButton.disabled = false;
        })
        .catch((error) => {
            console.error("Camera error:", error);
            setStatus("❌ Camera access denied or unavailable.", "#dc3545");
            cameraStatus.innerText = "🚫 Camera unavailable.";
            captureButton.disabled = true;
        });
}

function stopCurrentStream() {
    if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        currentStream = null;
    }
}

function captureFace() {
    if (!currentStream) {
        setStatus("❌ Camera is not active. Please start verification again.", "#dc3545");
        return;
    }

    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
        setStatus("❌ Unable to capture the camera frame. Try again.", "#dc3545");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    stopCurrentStream();
    hide(cameraControls);
    cameraStatus.innerText = "📷 Image captured. Verifying...";
    setStatus("⏳ Sending face capture for verification...", "#0056b3");

    fetch(`${apiBaseUrl}/verify-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentToken, image_data: imageData, action_type: currentActionType }),
    })
        .then((response) => response.json().then((data) => ({ status: response.status, body: data })))
        .then((result) => {
            if (result.status !== 200) {
                const message = result.body.detail || result.body.message || "Face verification failed.";
                setStatus(`❌ ${message}`, "#dc3545");
                cameraStatus.innerText = "🚨 Verification failed.";
                return;
            }

            setStatus(`✅ ${result.body.message}`, "#28a745");
            cameraStatus.innerText = "✅ Verification complete.";
            renderLogs(result.body.logs);
            userAction.innerText = `Next action: ${result.body.next_action}`;
        })
        .catch((error) => {
            console.error("API error:", error);
            setStatus("❌ Backend unreachable. Please start the backend server.", "#dc3545");
            cameraStatus.innerText = "🚨 Verification service unavailable.";
        });
}

function resetApp() {
    stopCurrentStream();
    currentToken = null;
    hide(cameraContainer);
    hide(cameraControls);
    hide(userCard);
    setStatus("Waiting for QR scan...", "#333");
    initializeScanner();
}

function checkBackendHealth() {
    setStatus("⏳ Checking backend status...", "#0056b3");
    fetch(apiBaseUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Backend responded with error");
            }
            setStatus("✅ Backend is running. Scan QR code to start.", "#28a745");
            show(readerContainer);
            initializeScanner();
        })
        .catch((error) => {
            console.error("Backend health check failed:", error);
            setStatus(`❌ Backend unreachable at ${apiBaseUrl}. Start the backend server.`, "#dc3545");
            hide(readerContainer);
        });
}

inButton.addEventListener("click", () => startFaceVerification("IN"));
outButton.addEventListener("click", () => startFaceVerification("OUT"));
captureButton.addEventListener("click", captureFace);
retryButton.addEventListener("click", resetApp);
cancelCameraButton.addEventListener("click", () => {
    stopCurrentStream();
    hide(cameraControls);
    hide(cameraContainer);
    setStatus("Verification canceled. Scan QR code or press Retry.", "#333");
});

setStatus("Loading application...");
checkBackendHealth();
