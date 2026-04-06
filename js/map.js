let map;
let markers = {};
let geocoder;
let trucks = [];

async function initMap() {
    const defaultCenter = { lat: 52.2297, lng: 21.0122 }; // Warsaw, Poland
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultCenter,
        zoom: 6,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
    });
    
    geocoder = new google.maps.Geocoder();
    
    // Клік на карту для створення вантажівки
    map.addListener('click', async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        const address = await reverseGeocode(lat, lng);
        
        const truckData = {
            lat: lat,
            lng: lng,
            address: address
        };
        
        const truck = addTruckToStorage(truckData);
        
        if (truck) {
            trucks.push(truck);
            addMarker(truck);
            updateSidebar(trucks);
        }
    });
    
    // Завантажити існуючі вантажівки
    trucks = loadTrucks();
    trucks.forEach(truck => {
        addMarker(truck);
    });
    updateSidebar(trucks);
}

function addMarker(truck) {
    const marker = new google.maps.Marker({
        position: { lat: truck.lat, lng: truck.lng },
        map: map,
        title: truck.truck_name,
        draggable: true,
        icon: {
            url: 'images/truck icon.svg',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        }
    });
    
    // Клік на маркер - відкрити панель деталей
    marker.addListener('click', () => {
        openDetailPanel(truck);
    });
    
    // Dragging - оновити координати та адресу
    marker.addListener('dragend', async (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        
        const newAddress = await reverseGeocode(newLat, newLng);
        
        // Оновити в LocalStorage
        const updatedTruck = updateTruckInStorage(truck.id, {
            lat: newLat,
            lng: newLng,
            address: newAddress
        });
        
        if (updatedTruck) {
            // Оновити локальний об'єкт
            Object.assign(truck, updatedTruck);
            
            // Оновити sidebar
            trucks = loadTrucks();
            updateSidebar(trucks);
            
            // Якщо панель деталей відкрита для цієї вантажівки, оновити координати
            if (currentTruckId === truck.id) {
                document.getElementById('latitude').value = newLat;
                document.getElementById('longitude').value = newLng;
                document.getElementById('address').value = newAddress;
            }
        }
    });
    
    markers[truck.id] = marker;
}

function removeMarker(truckId) {
    if (markers[truckId]) {
        markers[truckId].setMap(null);
        delete markers[truckId];
    }
}

function updateMarkerPosition(truckId, lat, lng) {
    if (markers[truckId]) {
        const newPos = { lat: lat, lng: lng };
        markers[truckId].setPosition(newPos);
        map.panTo(newPos);
    }
}

function focusTruck(truckId) {
    const truck = trucks.find(t => t.id === truckId);
    if (truck && markers[truckId]) {
        map.panTo({ lat: truck.lat, lng: truck.lng });
        map.setZoom(12);
        
        setTimeout(() => {
            openDetailPanel(truck);
        }, 300);
    }
}

async function reverseGeocode(lat, lng) {
    return new Promise((resolve) => {
        geocoder.geocode(
            { location: { lat, lng } },
            (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                }
            }
        );
    });
}

async function reverseGeocodeAndUpdate(lat, lng, truckId) {
    const address = await reverseGeocode(lat, lng);
    document.getElementById('address').value = address;
    
    // Оновити в LocalStorage
    updateTruckInStorage(truckId, { lat, lng, address });
    
    // Оновити локальний масив
    const truck = trucks.find(t => t.id === truckId);
    if (truck) {
        truck.lat = lat;
        truck.lng = lng;
        truck.address = address;
    }
    
    // Оновити sidebar
    trucks = loadTrucks();
    updateSidebar(trucks);
}

function saveTruck() {
    if (!currentTruckId) return;
    
    const updatedData = {
        truck_name: document.getElementById('truck_name').value,
        lat: parseFloat(document.getElementById('latitude').value),
        lng: parseFloat(document.getElementById('longitude').value),
        address: document.getElementById('address').value,
        datetime: document.getElementById('datetime').value,
        speed: document.getElementById('speed').value,
        driving_status: document.getElementById('driving_status').value,
        odometer: document.getElementById('odometer').value,
        rpm: document.getElementById('rpm').value,
        voltage: document.getElementById('voltage').value,
        satellites: document.getElementById('satellites').value,
        fuel: document.getElementById('fuel').value,
        driver_info: document.getElementById('driver_info').value
    };
    
    // Оновити в LocalStorage
    const updatedTruck = updateTruckInStorage(currentTruckId, updatedData);
    
    if (updatedTruck) {
        // Оновити маркер
        const truck = trucks.find(t => t.id === currentTruckId);
        if (truck) {
            Object.assign(truck, updatedTruck);
            
            // Оновити позицію маркера якщо координати змінились
            if (markers[currentTruckId]) {
                markers[currentTruckId].setPosition({ 
                    lat: updatedTruck.lat, 
                    lng: updatedTruck.lng 
                });
                markers[currentTruckId].setTitle(updatedTruck.truck_name);
            }
        }
        
        // Оновити sidebar
        trucks = loadTrucks();
        updateSidebar(trucks);
        
        closeDetailPanel();
    }
}

function deleteTruck() {
    if (!currentTruckId) return;
    
    // Видалити з LocalStorage
    deleteTruckFromStorage(currentTruckId);
    
    // Видалити маркер з карти
    removeMarker(currentTruckId);
    
    // Оновити локальний масив
    trucks = loadTrucks();
    updateSidebar(trucks);
    
    closeConfirmModal();
    closeDetailPanel();
}
