const html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", 
    { fps: 10, qrbox: {width: 250, height: 250} }, 
    false
);

function onScanSuccess(decodedText, decodedResult) {
    // 1. Stop scanning instantly
    html5QrcodeScanner.clear();
    
    // 2. Update screen to tell user to look at the camera
    const resultDiv = document.getElementById('result');
    resultDiv.innerText = "⏳ Processing token... Please look at the camera.";
    resultDiv.style.color = "#0056b3"; 
    
    // 3. Send token to Python
    fetch("http://127.0.0.1:8000/verify-qr", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText }) 
    })
    .then(response => response.json()) 
    .then(data => {
        // 4. Handle Python's reply
        if(data.status === "success") {
            resultDiv.innerText = "✅ " + data.message;
            resultDiv.style.color = "#28a745"; 
        } else {
            resultDiv.innerText = "❌ Error: " + data.message;
            resultDiv.style.color = "#dc3545"; 
        }
    })
    .catch(error => {
        resultDiv.innerText = "❌ Connection failed. Is the server running?";
        resultDiv.style.color = "#dc3545";
        console.error("API Error:", error);
    });
}

function onScanFailure(error) {
    // Ignore empty frames
}

html5QrcodeScanner.render(onScanSuccess, onScanFailure);