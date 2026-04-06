// Головний файл додатку GPS Truck Tracker
// Ініціалізація та глобальні налаштування

// Перевірка підтримки LocalStorage
function checkLocalStorageSupport() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.error('LocalStorage не підтримується:', e);
        alert('Ваш браузер не підтримує LocalStorage. Дані не будуть зберігатися.');
        return false;
    }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    // Перевірка LocalStorage
    checkLocalStorageSupport();
    
    // Вивести інформацію в консоль
    console.log('GPS Truck Tracker - Frontend Only Version');
    console.log('Дані зберігаються в LocalStorage вашого браузера');
    
    // Показати кількість збережених вантажівок
    const trucks = loadTrucks();
    console.log(`Завантажено вантажівок: ${trucks.length}`);
    
    // Додати обробник для закриття sidebar при кліку поза ним (мобільні)
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    // Попередження при закритті сторінки якщо є незбережені зміни
    // (опціонально, можна видалити якщо не потрібно)
    // window.addEventListener('beforeunload', function(e) {
    //     // Тут можна додати логіку перевірки незбережених змін
    // });
});

// Глобальні утиліти

// Показати повідомлення користувачу
function showMessage(message, type = 'info') {
    // Можна додати toast notifications якщо потрібно
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Перевірка розміру LocalStorage
function checkStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    const sizeInMB = (total / 1024 / 1024).toFixed(2);
    console.log(`LocalStorage використано: ${sizeInMB} MB`);
    
    if (sizeInMB > 4) {
        console.warn('LocalStorage майже заповнений!');
    }
    
    return sizeInMB;
}

// Debug функції (доступні через консоль)
window.debugGPS = {
    showTrucks: function() {
        console.table(loadTrucks());
    },
    clearAll: function() {
        clearAllData();
    },
    export: function() {
        exportData();
    },
    storageSize: function() {
        return checkStorageSize();
    },
    addTestTruck: function() {
        const testTruck = addTruckToStorage({
            lat: 52.2297 + (Math.random() - 0.5) * 2,
            lng: 21.0122 + (Math.random() - 0.5) * 2,
            address: 'Test Address ' + Date.now()
        });
        console.log('Test truck added:', testTruck);
        location.reload();
    }
};

console.log('Debug команди доступні через window.debugGPS');
console.log('Приклад: debugGPS.showTrucks()');
