// LocalStorage управління для GPS Truck Tracker

const STORAGE_KEY = 'gps_trucks';

// Завантажити всі вантажівки з LocalStorage
function loadTrucks() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        let trucks = data ? JSON.parse(data) : [];
        
        // Міграція старих даних: time -> datetime
        let needsSave = false;
        trucks = trucks.map(truck => {
            if (truck.trajectory && Array.isArray(truck.trajectory)) {
                truck.trajectory = truck.trajectory.map(point => {
                    // Конвертувати старе поле 'time' в 'datetime'
                    if (point.time && !point.datetime) {
                        const now = new Date();
                        const day = String(now.getDate()).padStart(2, '0');
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const year = now.getFullYear();
                        point.datetime = `${point.time} ${day}.${month}.${year}`;
                        delete point.time;
                        needsSave = true;
                    }
                    return point;
                });
            }
            return truck;
        });
        
        // Зберегти мігровані дані
        if (needsSave) {
            saveTrucksToStorage(trucks);
        }
        
        return trucks;
    } catch (error) {
        console.error('Error loading trucks from LocalStorage:', error);
        return [];
    }
}

// Зберегти всі вантажівки в LocalStorage
function saveTrucksToStorage(trucks) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trucks));
        return true;
    } catch (error) {
        console.error('Error saving trucks to LocalStorage:', error);
        if (error.name === 'QuotaExceededError') {
            alert('LocalStorage заповнений! Видаліть деякі вантажівки.');
        }
        return false;
    }
}

// Згенерувати назву вантажівки у форматі WG + літера + 3 цифри + літера
function generateTruckName() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter1 = letters[Math.floor(Math.random() * 26)];
    const letter2 = letters[Math.floor(Math.random() * 26)];
    const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WG${letter1}${numbers}${letter2}`;
}

// Додати нову вантажівку
function addTruckToStorage(truckData) {
    const trucks = loadTrucks();
    
    // Генеруємо ID (максимальний ID + 1)
    const maxId = trucks.length > 0 ? Math.max(...trucks.map(t => t.id)) : 0;
    const newTruck = {
        id: maxId + 1,
        truck_name: truckData.truck_name || generateTruckName(),
        lat: truckData.lat,
        lng: truckData.lng,
        address: truckData.address || '',
        datetime: truckData.datetime || formatDateTime(new Date()),
        speed: truckData.speed || '0',
        driving_status: truckData.driving_status || '00:00:00',
        odometer: truckData.odometer || String(Math.floor(Math.random() * 130001) + 120000),
        rpm: truckData.rpm || '0',
        voltage: truckData.voltage || '24.5',
        satellites: truckData.satellites || '0',
        fuel: truckData.fuel || '150',
        driver_info: truckData.driver_info || '',
        trajectory: truckData.trajectory || [],
        trajectoryColor: truckData.trajectoryColor || '#2196F3'
    };
    
    trucks.push(newTruck);
    saveTrucksToStorage(trucks);
    
    return newTruck;
}

// Оновити вантажівку
function updateTruckInStorage(id, updatedData) {
    const trucks = loadTrucks();
    const index = trucks.findIndex(t => t.id === id);
    
    if (index !== -1) {
        trucks[index] = { ...trucks[index], ...updatedData };
        saveTrucksToStorage(trucks);
        return trucks[index];
    }
    
    return null;
}

// Видалити вантажівку
function deleteTruckFromStorage(id) {
    let trucks = loadTrucks();
    trucks = trucks.filter(t => t.id !== id);
    saveTrucksToStorage(trucks);
    return true;
}

// Отримати вантажівку за ID
function getTruckById(id) {
    const trucks = loadTrucks();
    return trucks.find(t => t.id === id);
}

// Форматування дати/часу
function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Очистити всі дані (для тестування)
function clearAllData() {
    if (confirm('Видалити всі вантажівки? Цю дію не можна скасувати!')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// Експорт даних в JSON (опціонально)
function exportData() {
    const trucks = loadTrucks();
    const dataStr = JSON.stringify(trucks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gps-trucks-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Імпорт даних з JSON (опціонально)
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const trucks = JSON.parse(e.target.result);
            if (Array.isArray(trucks)) {
                saveTrucksToStorage(trucks);
                location.reload();
            } else {
                alert('Невірний формат файлу!');
            }
        } catch (error) {
            alert('Помилка читання файлу!');
            console.error(error);
        }
    };
    reader.readAsText(file);
}
