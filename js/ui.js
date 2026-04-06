let currentTruckId = null;

// Визначення мобільного пристрою
function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Toggle sidebar для мобільних
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Закрити sidebar при кліку на вантажівку (мобільні)
function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
    }
}

function closeDetailPanel() {
    document.getElementById('detail-panel').classList.add('hidden');
    currentTruckId = null;
}

function openDetailPanel(truck) {
    currentTruckId = truck.id;
    
    document.getElementById('detail-title').textContent = truck.truck_name;
    document.getElementById('truck_name').value = truck.truck_name;
    document.getElementById('address').value = truck.address || '';
    document.getElementById('latitude').value = truck.lat;
    document.getElementById('longitude').value = truck.lng;
    document.getElementById('datetime').value = truck.datetime || '';
    document.getElementById('speed').value = truck.speed || '0';
    document.getElementById('driving_status').value = truck.driving_status || '00:00:00';
    document.getElementById('odometer').value = truck.odometer || '0';
    document.getElementById('rpm').value = truck.rpm || '0';
    document.getElementById('voltage').value = truck.voltage || '24.5';
    document.getElementById('satellites').value = truck.satellites || '0';
    document.getElementById('fuel').value = truck.fuel || '150';
    document.getElementById('driver_info').value = truck.driver_info || '';
    
    document.getElementById('detail-panel').classList.remove('hidden');
}

function updateDateTime() {
    const now = new Date();
    const formatted = formatDateTime(now);
    document.getElementById('datetime').value = formatted;
}

function confirmDelete() {
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

function showHoverCard(truck, x, y) {
    const card = document.getElementById('hover-card');
    
    const content = `
        <div class="hover-card-header">${truck.truck_name}</div>
        <div class="hover-card-content">
            <div class="hover-card-row">
                <span class="hover-card-label">Adres:</span>
                <span class="hover-card-value">${truck.address || 'N/A'}</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Data/Czas:</span>
                <span class="hover-card-value">${truck.datetime || 'N/A'}</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Prędkość:</span>
                <span class="hover-card-value">${truck.speed} km/h</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Licznik:</span>
                <span class="hover-card-value">${truck.odometer} km</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Napięcie:</span>
                <span class="hover-card-value">${truck.voltage} V</span>
            </div>
        </div>
    `;
    
    card.innerHTML = content;
    card.style.left = (x + 15) + 'px';
    card.style.top = (y + 15) + 'px';
    card.classList.remove('hidden');
}

function hideHoverCard() {
    const card = document.getElementById('hover-card');
    
    // Не ховати якщо це mobile popup
    if (card.classList.contains('mobile-popup')) {
        return;
    }
    
    card.classList.add('hidden');
}

// Показати mobile popup картку
function showMobileCard(truck) {
    const card = document.getElementById('hover-card');
    const backdrop = document.getElementById('mobile-card-backdrop');
    
    // Очистити inline стилі від hover
    card.style.left = '';
    card.style.top = '';
    
    const content = `
        <button class="close-mobile-card" onclick="closeMobileCard()">&times;</button>
        <div class="hover-card-header">${truck.truck_name}</div>
        <div class="hover-card-content">
            <div class="hover-card-row">
                <span class="hover-card-label">Adres:</span>
                <span class="hover-card-value">${truck.address || 'N/A'}</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Data/Czas:</span>
                <span class="hover-card-value">${truck.datetime || 'N/A'}</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Prędkość:</span>
                <span class="hover-card-value">${truck.speed} km/h</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Licznik:</span>
                <span class="hover-card-value">${truck.odometer} km</span>
            </div>
            <div class="hover-card-row">
                <span class="hover-card-label">Napięcie:</span>
                <span class="hover-card-value">${truck.voltage} V</span>
            </div>
        </div>
    `;
    
    card.innerHTML = content;
    card.classList.add('mobile-popup');
    card.classList.remove('hidden');
    
    // Показати backdrop
    backdrop.classList.add('active');
}

// Закрити mobile popup картку
function closeMobileCard() {
    const card = document.getElementById('hover-card');
    const backdrop = document.getElementById('mobile-card-backdrop');
    
    card.classList.remove('mobile-popup');
    card.classList.add('hidden');
    backdrop.classList.remove('active');
}

function updateSidebar(trucks) {
    const list = document.getElementById('truck-list');
    list.innerHTML = '';
    
    if (trucks.length === 0) {
        list.innerHTML = '<div class="no-trucks">Brak pojazdów. Kliknij na mapę, aby dodać.</div>';
        return;
    }
    
    trucks.forEach(truck => {
        const item = document.createElement('div');
        item.className = 'truck-item';
        item.onclick = () => {
            focusTruck(truck.id);
            closeSidebarOnMobile();
        };
        
        item.innerHTML = `
            <div class="truck-item-name">${truck.truck_name}</div>
            <div class="truck-item-address">${truck.address || 'Brak adresu'}</div>
            <div class="truck-item-details">
                Prędkość: ${truck.speed} km/h | Licznik: ${truck.odometer} km
            </div>
        `;
        
        list.appendChild(item);
    });
}

// Оновити маркер при зміні координат вручну
function updateMarkerFromCoords() {
    if (!currentTruckId) return;
    
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    
    if (isNaN(lat) || isNaN(lng)) {
        alert('Nieprawidłowe współrzędne!');
        return;
    }
    
    // Оновити позицію маркера на карті
    updateMarkerPosition(currentTruckId, lat, lng);
    
    // Отримати нову адресу через reverse geocoding
    reverseGeocodeAndUpdate(lat, lng, currentTruckId);
}

// Закрити модальні вікна при кліку поза ними
document.addEventListener('click', function(event) {
    const modal = document.getElementById('confirm-modal');
    if (event.target === modal) {
        closeConfirmModal();
    }
});

// Адаптивність: закрити sidebar при зміні розміру вікна
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
});
