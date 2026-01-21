/**
 * rider_logic.js
 * Handles Multiple Offers & Active Ride
 */

let listeningRideId = null;

// 1. WATCHER: Checks if main file has set a ride ID
setInterval(() => {
    // We access 'window.currentRideId' which you set to 'var' in the main file
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

        // Hide Loading Spinner if it exists
        if(document.getElementById('screen-loading')) {
            document.getElementById('screen-loading').classList.add('hidden');
        }

        // --- STATE MACHINE ---

        // A. CONFIRMED (Active Ride)
        if (ride.status === 'confirmed') {
            hideOffersList(); // Remove the offers list
            ensureActiveScreenExists();
            updateDriverInfo(ride);
            switchToActiveScreen();
        }

        // B. PENDING (Waiting for offers)
        else if (ride.status === 'pending') {
            // CRITICAL CHECK: Are there offers?
            if (ride.offers) {
                // Yes! Show the list
                showOffersList(ride.offers);
            } else {
                // No offers yet -> Show Waiting Screen
                showScreen('screen-pending');
                hideOffersList();
            }
        }

        // C. COMPLETED
        else if (ride.status === 'completed') {
            alert("✅ Ride Completed!");
            rideRef.off();
            window.location.reload();
        }
        
        // D. CANCELLED
        else if (ride.status === 'cancelled') {
            alert("❌ Ride Cancelled.");
            window.location.reload();
        }
    });
}

// 3. OFFERS UI (The List)
function showOffersList(offersObj) {
    // 1. Hide the "Waiting" screen
    document.getElementById('screen-pending').classList.add('hidden');
    
    // 2. Build the List Container if it doesn't exist
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
    list.innerHTML = ""; // Clear old list

    // 3. Loop through offers and make HTML cards
    Object.keys(offersObj).forEach(driverId => {
        const offer = offersObj[driverId];
        const item = `
            <div style="background:#f8f9fa; border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="text-align:left;">
                        <strong style="font-size:16px;">${offer.driverName}</strong><br>
                        <span style="font-size:12px; color:#666;">${offer.vehicleModel} (${offer.vehiclePlate})</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px; font-weight:bold; color:#28a745;">Rs. ${offer.price}</div>
                    </div>
                </div>
                <button onclick="confirmOffer('${driverId}')" style="width:100%; margin-top:10px; background:#28a745; color:white; border:none; padding:10px; border-radius:5px; font-weight:bold; cursor:pointer;">
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

// 4. CONFIRM OFFER ACTION
// This function runs when Rider clicks "Accept This Offer"
window.confirmOffer = function(driverId) {
    if(!confirm("Confirm this driver?")) return;

    const rideId = window.currentRideId;
    
    // 1. Get the specific offer details
    firebase.database().ref(`requests/${rideId}/offers/${driverId}`).once('value').then(snap => {
        const offer = snap.val();
        
        // 2. Lock the ride: Update status to 'confirmed' and save driver info
        firebase.database().ref(`requests/${rideId}`).update({
            status: 'confirmed',
            driverId: driverId,
            driverName: offer.driverName,
            driverPhone: offer.driverPhone,
            vehicleModel: offer.vehicleModel,
            vehiclePlate: offer.vehiclePlate,
            price: offer.price
        });
    });
};

// 5. ACTIVE SCREEN HELPERS
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
    ['screen-form', 'screen-pending', 'screen-loading'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    const active = document.getElementById('screen-active');
    if(active) active.classList.remove('hidden');
}

function showScreen(id) {
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
}
