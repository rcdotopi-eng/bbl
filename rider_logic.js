/**
 * rider_logic.js
 * Handles Multiple Offers & Active Ride
 * FIXED: Matches 'screen-status' ID from your HTML
 */

let listeningRideId = null;

// 1. WATCHER
setInterval(() => {
    if (window.currentRideId && window.currentRideId !== listeningRideId) {
        listeningRideId = window.currentRideId;
        startRideListener(listeningRideId);
    }
}, 1000);

// 2. MAIN LISTENER
function startRideListener(rideId) {
    console.log("⚡ Logic connected to ride:", rideId);
    const rideRef = firebase.database().ref('requests/' + rideId);

    rideRef.on('value', (snapshot) => {
        const ride = snapshot.val();
        if (!ride) return; 

        // Hide Loading
        const loader = document.getElementById('screen-loading');
        if(loader) loader.classList.add('hidden');

        // --- STATE MACHINE ---

        // A. CONFIRMED (Active Ride)
        if (ride.status === 'confirmed') {
            hideOffersList();
            ensureActiveScreenExists();
            updateDriverInfo(ride);
            switchToActiveScreen();
        }

        // B. PENDING (Waiting for offers)
        else if (ride.status === 'pending') {
            if (ride.offers) {
                // Show Offers List
                showOffersList(ride.offers);
            } else {
                // No offers yet -> Show "Request Sent" Status Screen
                showScreen('screen-status'); 
                hideOffersList();
            }
        }

        // C. COMPLETED
        else if (ride.status === 'completed') {
    alert("✅ Ride Completed!");
    rideRef.off();
    window.currentRideId = null;
    showFormScreen();
}

else if (
    ride.status === 'cancelled_by_rider' ||
    ride.status === 'cancelled_by_driver'
) {
    alert("❌ Ride Cancelled.");
    rideRef.off();
    window.currentRideId = null;
    showFormScreen();
}
    });
}

// 3. OFFERS UI
function showOffersList(offersObj) {
    // Hide the 'Status/Pending' screen using the correct ID
    const pendingScreen = document.getElementById('screen-status');
    if (pendingScreen) pendingScreen.classList.add('hidden');
    
    // Create/Show List
    let listContainer = document.getElementById('offers-list-container');
    if (!listContainer) {
        const mainContainer = document.querySelector('.container');
        const html = `
            <div id="offers-list-container" class="card">
                <h3 style="color:#007bff; margin-top:0;">Select a Captain</h3>
                <p style="font-size:12px; color:#666;">Tap 'Accept' to confirm a driver.</p>
                <div id="offers-list-items"></div>
            </div>
        `;
        mainContainer.insertAdjacentHTML('beforeend', html);
        listContainer = document.getElementById('offers-list-container');
    }

    listContainer.classList.remove('hidden');
    const list = document.getElementById('offers-list-items');
    list.innerHTML = ""; 

    Object.keys(offersObj).forEach(driverId => {
        const offer = offersObj[driverId];
        const item = `
            <div style="background:#f8f9fa; border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="font-size:16px;">${offer.driverName}</strong><br>
                        <span style="font-size:12px; color:#666;">${offer.vehicleModel} (${offer.vehiclePlate})</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px; font-weight:bold; color:#28a745;">Rs. ${offer.price}</div>
                    </div>
                </div>
                <button onclick="confirmOffer('${driverId}')" style="width:100%; margin-top:10px; background:#28a745; color:white; border:none; padding:10px; border-radius:5px; font-weight:bold;">
                    Accept This Offer
                </button>
            </div>
        `;
        list.innerHTML += item;
    });
}

function hideOffersList() {
    const el = document.getElementById('offers-list-container');
    if(el) el.classList.add('hidden');
}

// 4. CONFIRM ACTION
window.confirmOffer = function(driverId) {
    if(!confirm("Confirm this driver?")) return;

    const rideId = window.currentRideId;
    firebase.database().ref(`requests/${rideId}/offers/${driverId}`).once('value').then(snap => {
        const offer = snap.val();
        
        firebase.database().ref(`requests/${rideId}`).update({
    status: 'confirmed',
    driverId: driverId,
    driverName: offer.driverName,
    driverPhone: offer.driverPhone,
    vehicleModel: offer.vehicleModel,
    vehiclePlate: offer.vehiclePlate,
    price: offer.price,
    confirmedAt: firebase.database.ServerValue.TIMESTAMP
});

    });
};

// 5. HELPER FUNCTIONS
function ensureActiveScreenExists() {
    if (document.getElementById('screen-active')) return;
    const container = document.querySelector('.container');
    const html = `
        <div id="screen-active" class="card hidden" style="text-align: center;">
            <h2 style="color: #28a745; margin-top: 0;">Captain Confirmed!</h2>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
                <h3 style="margin: 0;" id="d-name">Driver Name</h3>
                <p style="margin: 5px 0 0 0; color: #555;">
                    <span id="d-vehicle">Vehicle</span> • <span id="d-plate" style="font-weight:bold;">---</span>
                </p>
                <p style="margin-top: 10px; font-weight: bold; color: #28a745;">Fare: Rs. <span id="d-price">0</span></p>
            </div>
            <div style="display: flex; gap: 10px;">
                <a id="btn-call" href="#" style="flex: 1;"><button class="btn-primary" style="width:100%;">📞 Call</button></a>
                <button class="btn-danger" style="flex: 1;" onclick="cancelCurrentRide()">Cancel</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function updateDriverInfo(ride) {
    if(document.getElementById('d-name')) document.getElementById('d-name').innerText = ride.driverName;
    if(document.getElementById('d-vehicle')) document.getElementById('d-vehicle').innerText = ride.vehicleModel;
    if(document.getElementById('d-plate')) document.getElementById('d-plate').innerText = ride.vehiclePlate;
    if(document.getElementById('d-price')) document.getElementById('d-price').innerText = ride.price;
    if(document.getElementById('btn-call')) document.getElementById('btn-call').href = "tel:" + ride.driverPhone;
}

function switchToActiveScreen() {
    // Hide all other screens using ID array
    ['screen-form', 'screen-status', 'screen-loading'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    // Show active screen
    const active = document.getElementById('screen-active');
    if(active) active.classList.remove('hidden');
}

function showScreen(id) {
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
}
