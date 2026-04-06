# 🚚 GPS Truck Tracker Demo

Демонстраційний веб-сайт для системи GPS-трекінгу вантажівок з інтеграцією Google Maps.

**Frontend-Only версія** - працює без сервера, опублікована на GitHub Pages!

## 🌐 Live Demo

**[Відкрити демо](https://yourusername.github.io/gps-truck-tracker/)**

*(Замініть на ваш GitHub Pages URL після публікації)*

## ✨ Функціональність

- ✅ **Миттєве створення вантажівок**: Клікніть на карту для додавання
- ✅ **Draggable маркери**: Перетягуйте вантажівки для зміни локації
- ✅ **Ручне редагування координат**: Latitude/Longitude поля
- ✅ **Автоматичне визначення адреси**: Reverse geocoding через Google Maps API
- ✅ **Редагування деталей**: Всі параметри можна змінювати
- ✅ **Стилізована hover-картка**: Наведіть курсор для перегляду деталей
- ✅ **Бічна панель**: Список всіх вантажівок
- ✅ **Мобільна адаптивність**: Працює на телефонах та планшетах
- ✅ **LocalStorage**: Дані зберігаються в браузері
- ✅ **Польський інтерфейс**: Всі мітки польською мовою

## 🚀 Швидкий Старт

### Варіант 1: Відкрити локально

1. Завантажте проект:
```bash
git clone https://github.com/yourusername/gps-truck-tracker.git
cd gps-truck-tracker
```

2. Відкрийте `index.html` в браузері
   - Подвійний клік на файл
   - Або використайте Live Server (VS Code extension)

**Готово!** Сервер не потрібен.

### Варіант 2: GitHub Pages

1. Fork цей репозиторій
2. Перейдіть в Settings → Pages
3. Source: main branch, folder: / (root)
4. Збережіть та зачекайте 1-2 хвилини
5. Ваш сайт доступний за адресою: `https://yourusername.github.io/repository-name/`

## 📱 Використання

### Desktop

#### Додавання вантажівки
- Клікніть на будь-яке місце на карті
- Вантажівка створюється миттєво
- Назва генерується автоматично (Pojazd 001, 002...)
- Адреса визначається через Google Maps

#### Переміщення вантажівки
- **Dragging**: Перетягніть маркер на нове місце
- **Ручне**: Відкрийте деталі → змініть Latitude/Longitude
- Адреса оновиться автоматично в обох випадках

#### Редагування деталей
- Клікніть на маркер вантажівки
- Відредагуйте потрібні поля
- Натисніть **"Zapisz"** для збереження

#### Перегляд деталей
- Наведіть курсор на маркер
- З'явиться стилізована картка з інформацією

#### Видалення вантажівки
- Відкрийте панель деталей
- Натисніть **"Usuń"**
- Підтвердіть видалення

### Mobile

#### Відкриття списку вантажівок
- Натисніть кнопку ☰ (hamburger menu) у верхньому лівому куті
- Sidebar виїде зліва

#### Додавання вантажівки
- Клікніть на карту (touch)
- Вантажівка створюється миттєво

#### Переміщення вантажівки
- Затисніть та перетягніть маркер (touch & drag)

## 🛠 Технології

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Maps**: Google Maps JavaScript API
- **Storage**: LocalStorage API
- **Responsive**: CSS Media Queries
- **Hosting**: GitHub Pages

**Без backend, без залежностей, без npm!**

## 📂 Структура Проекту

```
GPS_traker/
├── index.html          # Головна сторінка
├── css/
│   └── style.css      # Стилі + мобільна адаптивність
├── js/
│   ├── app.js         # Головний файл додатку
│   ├── map.js         # Google Maps інтеграція
│   ├── storage.js     # LocalStorage управління
│   └── ui.js          # UI функції
├── README.md          # Документація
└── .gitignore         # Git конфігурація
```

## 🎨 Дефолтні Значення

При створенні нової вантажівки:

| Поле | Значення |
|------|----------|
| **Nazwa pojazdu** | Pojazd 001, 002, 003... |
| **Adres/Lokacja** | Автоматично (Google Maps) |
| **Latitude/Longitude** | Координати кліку |
| **Data/Czas** | Поточний час |
| **Prędkość** | 0 km/h |
| **Status Jazdy** | 00:00:00 |
| **Licznik** | 0 km |
| **Obroty** | 0 r/min |
| **Napięcie** | 24.5 V |
| **Satelity** | 0 |
| **Paliwo** | 150 L |
| **Informacje** | Порожнє |

## 💾 LocalStorage

### Як це працює?
- Дані зберігаються в браузері (LocalStorage)
- Вантажівки залишаються після перезавантаження сторінки
- Кожен браузер має свої дані
- Різні пристрої = різні дані

### Обмеження
- Ліміт: ~5-10 MB (залежить від браузера)
- Очищення кешу = втрата даних
- Немає синхронізації між пристроями

### Debug Команди
Відкрийте консоль браузера (F12) та використовуйте:

```javascript
debugGPS.showTrucks()      // Показати всі вантажівки
debugGPS.clearAll()        // Видалити всі дані
debugGPS.export()          // Експорт в JSON
debugGPS.storageSize()     // Розмір LocalStorage
debugGPS.addTestTruck()    // Додати тестову вантажівку
```

## 🌍 Google Maps API

API ключ вже включений для демонстрації.

**Для власного проекту:**
1. Отримайте свій API ключ: [Google Cloud Console](https://console.cloud.google.com/)
2. Замініть ключ в `index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=ВАШ_КЛЮЧ&callback=initMap&libraries=places"></script>
```

## 📱 Мобільна Адаптивність

### Breakpoints
- **Desktop**: > 768px (sidebar завжди видимий)
- **Tablet**: 769px - 1024px (зменшений sidebar)
- **Mobile**: ≤ 768px (sidebar згортається, hamburger menu)

### Touch Optimizations
- Мінімальний розмір кнопок: 44x44px
- Touch-friendly інтерфейс
- Draggable маркери працюють через touch
- Responsive панель деталей

## 🚀 Публікація на GitHub Pages

### Крок 1: Створіть репозиторій на GitHub
```bash
git init
git add .
git commit -m "Initial commit: GPS Truck Tracker"
git branch -M main
git remote add origin https://github.com/yourusername/gps-truck-tracker.git
git push -u origin main
```

### Крок 2: Налаштуйте GitHub Pages
1. Відкрийте ваш репозиторій на GitHub
2. Settings → Pages
3. Source: **main** branch
4. Folder: **/ (root)**
5. Save

### Крок 3: Зачекайте 1-2 хвилини
GitHub автоматично опублікує ваш сайт.

### Крок 4: Відкрийте ваш сайт
URL: `https://yourusername.github.io/repository-name/`

## 🎯 Використання для Презентацій

Цей проект ідеально підходить для демонстрації GPS-системи:

1. ✅ Працює по прямому посиланню
2. ✅ Не потрібен сервер
3. ✅ Працює на мобільних
4. ✅ Інтерактивний
5. ✅ Професійний вигляд

**Просто відкрийте посилання та показуйте!**

## 📄 Ліцензія

MIT License - використовуйте вільно для ваших проектів.

## 🤝 Підтримка

Якщо виникли питання або проблеми:
1. Перевірте консоль браузера (F12)
2. Перевірте підключення до інтернету (Google Maps потребує інтернет)
3. Спробуйте очистити кеш браузера

---

**Зроблено з ❤️ для демонстрації GPS-трекінгу вантажівок**
