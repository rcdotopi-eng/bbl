/**
 * rider_logic.js
 * Handles the Real-Time State Machine for the Rider App
 */

// Global variable to track the listener so we can turn it off later
let rideListener = null;

// 1. REAL-TIME AUTOMATION (The Brain)
// This function watches the database 24/7 for changes to the specific ride.
function startRideListener(rideId) {
    console.log("🎧 Starting Real-Time Listener for Ride:", rideId);
    
    const rideRef = db.ref('requests/' + rideId);
    
    // Detach old listener if exists to prevent double-firing
    if (rideListener) rideRef.off();

    rideListener = rideRef.on('value', (snapshot) => {
        const ride = snapshot.val();
        
        // Hide global loading spinner whenever we get data
        if(document.getElementById('screen-loading')) {
            document.getElementById('screen-loading').classList.add('hidden');
        }

        // Case: Ride deleted from database manually
        if (!ride) {
            console.warn("Ride data is null. Resetting app.");
            resetApp(); 
            return;
        }

        // --- STATE MACHINE ---
        
        // A. WAITING STATE
        if (ride.status === 'pending') {
            showScreen('screen-pending');
        } 
        
        // B. ACTIVE RIDE STATE (Driver Accepted)
        else if (ride.status === 'accepted' || ride.status === 'confirmed') {
            // 1. Update the UI with Driver Details
            updateDriverUI(ride);
            // 2. Switch to Active Screen
            showScreen('screen-active');
        } 
        
        // C. COMPLETED STATE
        else if (ride.status === 'completed') {
            alert("✅ Ride Completed! \n\nThank you for using RideLink.");
            rideRef.off(); // Stop listening
            resetApp();    // Go back to home
        } 
        
        // D. CANCELLED STATE
        else if (ride.status === 'cancelled') {
            alert("❌ Ride was cancelled.");
            rideRef.off();
            resetApp();
        }
    });
}

// 2. ACTIVE RIDE SCREEN UI
// Fills the "Captain Found" card with data from the database
function updateDriverUI(ride) {
    // Safety check: Ensure elements exist before trying to set them
    const elName = document.getElementById('d-name');
    const elVehicle = document.getElementById('d-vehicle');
    const elPlate = document.getElementById('d-plate');
    const elPrice = document.getElementById('d-price');
    const btnCall = document.getElementById('btn-call');

    if(elName) elName.innerText = ride.driverName || "Unknown Captain";
    if(elVehicle) elVehicle.innerText = ride.vehicleModel || ride.vehicle || "Vehicle";
    if(elPlate) elPlate.innerText = ride.vehiclePlate || "---";
    if(elPrice) elPrice.innerText = ride.price || "Meter";
    
    // Link the "Call" button dynamically
    if(ride.driverPhone && btnCall) {
        btnCall.href = "tel:" + ride.driverPhone;
    }
}

// 3. COMPLETION HANDLING & RESET
// Cleans up the app state to prepare for a new booking
function resetApp() {
    console.log("🔄 Resetting App State...");
    
    // Clear the global ride ID
    currentRideId = null;
    
    // Clear Input Forms
    if(document.getElementById('pickup')) document.getElementById('pickup').value = "";
    if(document.getElementById('drop')) document.getElementById('drop').value = "";
    
    // Go back to the Request Form
    showScreen('screen-form');
    
    // Re-trigger GPS fetch so the user is ready to book again
    if(typeof getGPS === "function") {
        getGPS(true);
    }
}

// Helper: Toggles visibility of screens
function showScreen(screenId) {
    const screens = ['screen-loading', 'screen-form', 'screen-pending', 'screen-active'];
    
    screens.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });

    const target = document.getElementById(screenId);
    if(target) target.classList.remove('hidden');
}
