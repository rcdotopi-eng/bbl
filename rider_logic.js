/**
 * rider_logic.js
 * Drop-in logic to handle Active Ride & Completion without modifying existing HTML.
 */

let listenerActive = false;
let listeningRideId = null;

// 1. THE WATCHER
// Checks every second to see if a ride has been started by your main file
setInterval(() => {
    // Access the global variable 'currentRideId' from your main script
    if (window.currentRideId && window.currentRideId !== listeningRideId) {
        listeningRideId = window.currentRideId;
        startRideListener(listeningRideId);
    }
}, 1000);

// 2. FIREBASE LISTENER
function startRideListener(rideId) {
    console.log("⚡ Logic connected to ride:", rideId);
    const rideRef = firebase.database().ref('requests/' + rideId);

    rideRef.on('value', (snapshot) => {
        const ride = snapshot.val();
        
        if (!ride) return; // Ride deleted or null

        // --- STATUS HANDLER ---
        
        // A. ACCEPTED / ON THE WAY
        if (ride.status === 'accepted' || ride.status === 'confirmed') {
            ensureActiveScreenExists(); // Create the UI if missing
            updateDriverInfo(ride);     // Fill data
            switchToActiveScreen();     // Show it
        }

        // B. COMPLETED
        else if (ride.status === 'completed') {
            alert("✅ Ride Completed! \n\nThank you for using RideLink.");
            rideRef.off(); // Stop listening
            window.location.reload(); // Refresh to clear state
        }

        // C. CANCELLED
        else if (ride.status === 'cancelled') {
            // Your main HTML handles user cancellation, 
            // but if driver cancels, we catch it here:
            if(document.getElementById('screen-active') && !document.getElementById('screen-active').classList.contains('hidden')) {
                alert("❌ The driver cancelled the ride.");
                window.location.reload();
            }
        }
    });
}

// 3. DYNAMIC UI BUILDER
// Since your HTML is missing the 'Active Ride' screen, we inject it here.
function ensureActiveScreenExists() {
    if (document.getElementById('screen-active')) return;

    const container = document.querySelector('.container');
    
    const activeScreenHTML = `
        <div id="screen-active" class="card hidden" style="text-align: center;">
            <h2 style="color: #007bff; margin-top: 0;">Captain Found!</h2>
            <p style="color: #666;">Your ride is on the way.</p>

            <div style="background: #e3f2fd; border-left: 5px solid #007bff; padding: 15px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;" id="d-name">Driver Name</h3>
                <p style="margin: 0; color: #555;">
                    <span id="d-vehicle">Vehicle</span> • 
                    <span style="background: #000; color: #fff; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: bold;" id="d-plate">---</span>
                </p>
                <p style="margin-top: 10px; font-weight: bold; color: #28a745;">
                    Price: Rs. <span id="d-price">0</span>
                </p>
            </div>

            <div style="display: flex; gap: 10px;">
                <a id="btn-call" href="#" style="flex: 1; text-decoration: none;">
                    <button class="btn-primary" style="background-color: #28a745; width: 100%;">📞 Call</button>
                </a>
                <button class="btn-danger" style="flex: 1;" onclick="cancelCurrentRide()">Cancel</button>
            </div>
        </div>
    `;

    // Append this new screen to your container
    container.insertAdjacentHTML('beforeend', activeScreenHTML);
}

// 4. UI UPDATERS
function updateDriverInfo(ride) {
    if(document.getElementById('d-name')) document.getElementById('d-name').innerText = ride.driverName || "Captain";
    if(document.getElementById('d-vehicle')) document.getElementById('d-vehicle').innerText = ride.vehicleModel || "Vehicle";
    if(document.getElementById('d-plate')) document.getElementById('d-plate').innerText = ride.vehiclePlate || "---";
    if(document.getElementById('d-price')) document.getElementById('d-price').innerText = ride.price || "Meter";
    if(document.getElementById('btn-call') && ride.driverPhone) document.getElementById('btn-call').href = "tel:" + ride.driverPhone;
}

function switchToActiveScreen() {
    // Hide your existing screens
    if(document.getElementById('screen-form')) document.getElementById('screen-form').classList.add('hidden');
    if(document.getElementById('screen-status')) document.getElementById('screen-status').classList.add('hidden');
    if(document.getElementById('screen-loading')) document.getElementById('screen-loading').classList.add('hidden');

    // Show the new active screen
    const active = document.getElementById('screen-active');
    if(active) active.classList.remove('hidden');
}
