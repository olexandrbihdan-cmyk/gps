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
    
    // Правий клік для контекстного меню
    map.addListener('rightclick', (event) => {
        showContextMenu(event);
    });
    
    // Лівий клік тільки для траєкторії
    map.addListener('click', async (event) => {
        // Закрити контекстне меню якщо відкрите
        hideContextMenu();
        
        // Якщо режим редагування траєкторії - тільки додавання точок
        if (isEditMode && currentTruckId) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            addTrajectoryPoint(lat, lng);
        }
        // Видалено створення вантажівки лівим кліком
    });
    
    // Завантажити існуючі вантажівки
    trucks = loadTrucks();
    trucks.forEach(truck => {
        addMarker(truck);
    });
    updateSidebar(trucks);
    
    // Автоматично підлаштувати карту під вантажівки
    fitMapToAllTrucks();
}

function addMarker(truck) {
    const marker = new google.maps.Marker({
        position: { lat: truck.lat, lng: truck.lng },
        map: map,
        draggable: true,
        icon: {
            url: 'images/truck icon.svg',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        }
    });
    
    // Клік на маркер - mobile: popup картка, desktop: повна панель
    marker.addListener('click', () => {
        if (isMobileDevice()) {
            // Mobile: показати popup картку
            showMobileCard(truck);
        } else {
            // Desktop: відкрити повну панель деталей
            openDetailPanel(truck);
        }
    });
    
    // Hover - показати картку
    marker.addListener('mouseover', (event) => {
        showHoverCard(truck, event.domEvent.clientX, event.domEvent.clientY);
    });
    
    marker.addListener('mouseout', () => {
        hideHoverCard();
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
            
            // Оновити траєкторію якщо вона показується
            if (typeof updateTrajectoryOnTruckMove !== 'undefined') {
                updateTrajectoryOnTruckMove(truck.id);
            }
            
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

// Context menu position
let contextMenuPosition = null;

// Show context menu
function showContextMenu(event) {
    const menu = document.getElementById('context-menu');
    
    // Зберегти позицію для створення вантажівки
    contextMenuPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
    };
    
    // Позиціонувати меню в точці кліку
    menu.style.left = event.domEvent.clientX + 'px';
    menu.style.top = event.domEvent.clientY + 'px';
    menu.classList.remove('hidden');
    
    // Додати listener для закриття при кліку поза меню
    setTimeout(() => {
        document.addEventListener('click', hideContextMenuOutside);
    }, 0);
}

// Hide context menu
function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    menu.classList.add('hidden');
    contextMenuPosition = null;
    document.removeEventListener('click', hideContextMenuOutside);
}

// Hide context menu when clicking outside
function hideContextMenuOutside(event) {
    const menu = document.getElementById('context-menu');
    if (!menu.contains(event.target)) {
        hideContextMenu();
    }
}

// Create truck from context menu
async function createTruckFromContextMenu() {
    if (!contextMenuPosition) return;
    
    const lat = contextMenuPosition.lat;
    const lng = contextMenuPosition.lng;
    
    hideContextMenu();
    
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
}

// Fit map to all trucks
function fitMapToAllTrucks() {
    if (trucks.length === 0) {
        // Немає вантажівок - залишити центр на Варшаві
        return;
    }
    
    if (trucks.length === 1) {
        // Одна вантажівка - центрувати на ній з помірним zoom
        map.setCenter({ lat: trucks[0].lat, lng: trucks[0].lng });
        map.setZoom(10); // Помірний zoom замість 50 метрів
        return;
    }
    
    // Кілька вантажівок - показати всі
    const bounds = new google.maps.LatLngBounds();
    trucks.forEach(truck => {
        bounds.extend({ lat: truck.lat, lng: truck.lng });
    });
    
    map.fitBounds(bounds);
    
    // Додати padding для кращого вигляду
    const padding = { top: 50, right: 50, bottom: 50, left: 350 }; // left 350 для sidebar
    map.fitBounds(bounds, padding);
}
