// Trajectory management for GPS Truck Tracker
// Handles drawing, editing, and displaying truck trajectories

// Global state
let trajectories = {}; // { truckId: { polyline, points: [] } }
let isEditMode = false;
let visibleTrajectoryId = null;
let currentEditingPoint = null;

// Initialize trajectory system
function initTrajectories() {
    // Add ESC key handler for exiting edit mode
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isEditMode) {
            exitEditMode();
        }
    });
}

// Toggle edit trajectory mode
function toggleEditTrajectory() {
    if (!currentTruckId) return;
    
    if (isEditMode) {
        exitEditMode();
    } else {
        enterEditMode();
    }
}

// Enter edit mode
function enterEditMode() {
    if (!currentTruckId) return;
    
    isEditMode = true;
    
    // Change cursor to crosshair
    if (map) {
        map.setOptions({ draggableCursor: 'crosshair' });
    }
    
    // Show hint
    document.getElementById('trajectory-hint').classList.remove('hidden');
    
    // Update button style
    const editBtn = document.querySelector('.btn-trajectory-edit');
    if (editBtn) {
        editBtn.classList.add('active');
        editBtn.textContent = '📍 Exit Edit Mode';
    }
    
    // Render trajectory with editable points
    const truck = getTruckById(currentTruckId);
    if (truck) {
        renderTrajectory(truck, true);
    }
}

// Exit edit mode
function exitEditMode() {
    isEditMode = false;
    
    // Restore cursor
    if (map) {
        map.setOptions({ draggableCursor: null });
    }
    
    // Hide hint
    document.getElementById('trajectory-hint').classList.add('hidden');
    
    // Update button style
    const editBtn = document.querySelector('.btn-trajectory-edit');
    if (editBtn) {
        editBtn.classList.remove('active');
        editBtn.textContent = '📍 Edit Trajectory';
    }
    
    // Re-render trajectory without editable points
    const truck = getTruckById(currentTruckId);
    if (truck) {
        renderTrajectory(truck, false);
    }
}

// Render trajectory for a truck
function renderTrajectory(truck, showPoints = false) {
    if (!truck || !map) return;
    
    // Clear existing trajectory
    clearTrajectoryFromMap(truck.id);
    
    // Get full path (truck position + user points)
    const fullPath = getFullTrajectoryPath(truck);
    
    if (fullPath.length < 2) return; // Need at least 2 points
    
    // Create polyline
    const polyline = new google.maps.Polyline({
        path: fullPath,
        geodesic: false,
        strokeColor: truck.trajectoryColor || '#2196F3',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: map
    });
    
    // Add hover effect
    polyline.addListener('mouseover', () => {
        polyline.setOptions({ strokeWeight: 5, strokeOpacity: 0.9 });
    });
    
    polyline.addListener('mouseout', () => {
        polyline.setOptions({ strokeWeight: 3, strokeOpacity: 0.7 });
    });
    
    // Add click listener to open minimal edit panel
    polyline.addListener('click', () => {
        openTrajectoryEditPanel(truck);
    });
    
    // Store trajectory
    trajectories[truck.id] = {
        polyline: polyline,
        points: []
    };
    
    // Create point markers if in edit mode
    if (showPoints && truck.trajectory) {
        truck.trajectory.forEach((point, index) => {
            const marker = createPointMarker(truck, point, index);
            trajectories[truck.id].points.push(marker);
        });
    }
}

// Create editable point marker
function createPointMarker(truck, point, index) {
    const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        draggable: true,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#2196F3',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        },
        zIndex: 1000
    });
    
    // Hover effect
    marker.addListener('mouseover', (event) => {
        marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2196F3',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        });
        
        // Show tooltip if datetime exists
        if (point.datetime) {
            showTooltip(point.datetime, event.domEvent.clientX, event.domEvent.clientY);
        }
    });
    
    marker.addListener('mouseout', () => {
        marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#2196F3',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        });
        hideTooltip();
    });
    
    // Click to edit time
    marker.addListener('click', (event) => {
        if (isEditMode) {
            openPointTimeEditor(truck, index, event.domEvent.clientX, event.domEvent.clientY);
        }
    });
    
    // Right-click to delete
    marker.addListener('rightclick', () => {
        if (isEditMode) {
            deleteTrajectoryPoint(truck, index);
        }
    });
    
    // Drag to move
    marker.addListener('dragend', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        
        truck.trajectory[index].lat = newLat;
        truck.trajectory[index].lng = newLng;
        
        updateTruckInStorage(truck.id, { trajectory: truck.trajectory });
        updatePolyline(truck);
    });
    
    return marker;
}

// Add trajectory point
function addTrajectoryPoint(lat, lng) {
    if (!isEditMode || !currentTruckId) return;
    
    const truck = getTruckById(currentTruckId);
    if (!truck) return;
    
    if (!truck.trajectory) {
        truck.trajectory = [];
    }
    
    // Add point with current datetime
    const now = new Date();
    const datetime = formatDateTime(now);
    
    truck.trajectory.push({ lat, lng, datetime: datetime });
    updateTruckInStorage(currentTruckId, { trajectory: truck.trajectory });
    
    renderTrajectory(truck, true);
}

// Delete trajectory point
function deleteTrajectoryPoint(truck, index) {
    if (confirm('Видалити цю точку траєкторії?')) {
        truck.trajectory.splice(index, 1);
        updateTruckInStorage(truck.id, { trajectory: truck.trajectory });
        renderTrajectory(truck, true);
    }
}

// Update polyline after point changes
function updatePolyline(truck) {
    if (!trajectories[truck.id]) return;
    
    const fullPath = getFullTrajectoryPath(truck);
    trajectories[truck.id].polyline.setPath(fullPath);
}

// Get full trajectory path (truck position + user points)
function getFullTrajectoryPath(truck) {
    if (!truck.trajectory || truck.trajectory.length === 0) {
        return [];
    }
    
    return [
        { lat: truck.lat, lng: truck.lng },
        ...truck.trajectory
    ];
}

// Clear trajectory from map
function clearTrajectoryFromMap(truckId) {
    if (trajectories[truckId]) {
        // Remove polyline
        if (trajectories[truckId].polyline) {
            trajectories[truckId].polyline.setMap(null);
        }
        
        // Remove point markers
        if (trajectories[truckId].points) {
            trajectories[truckId].points.forEach(marker => marker.setMap(null));
        }
        
        delete trajectories[truckId];
    }
}

// Clear all trajectory data
function clearTrajectory() {
    if (!currentTruckId) return;
    
    if (confirm('Видалити всю траєкторію? Цю дію не можна скасувати.')) {
        const truck = getTruckById(currentTruckId);
        if (truck) {
            truck.trajectory = [];
            updateTruckInStorage(currentTruckId, { trajectory: [] });
            clearTrajectoryFromMap(currentTruckId);
            
            if (isEditMode) {
                exitEditMode();
            }
        }
    }
}

// Toggle trajectory visibility
function toggleTrajectoryVisibility() {
    if (!currentTruckId) return;
    
    const truck = getTruckById(currentTruckId);
    if (!truck) return;
    
    if (visibleTrajectoryId === truck.id) {
        // Hide current trajectory
        clearTrajectoryFromMap(truck.id);
        visibleTrajectoryId = null;
    } else {
        // Hide all trajectories
        hideAllTrajectories();
        
        // Show this trajectory
        visibleTrajectoryId = truck.id;
        renderTrajectory(truck, false);
        
        // Fit map to trajectory (only when showing)
        fitMapToTrajectory(truck);
    }
}

// Hide all trajectories
function hideAllTrajectories() {
    Object.keys(trajectories).forEach(truckId => {
        clearTrajectoryFromMap(parseInt(truckId));
    });
    visibleTrajectoryId = null;
}

// Fit map to trajectory
function fitMapToTrajectory(truck) {
    const path = getFullTrajectoryPath(truck);
    if (path.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => {
        bounds.extend(new google.maps.LatLng(point.lat, point.lng));
    });
    
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    map.fitBounds(bounds, padding);
}

// Show tooltip
function showTooltip(time, x, y) {
    const tooltip = document.getElementById('trajectory-tooltip');
    document.getElementById('tooltip-time').textContent = time;
    tooltip.style.left = (x + 15) + 'px';
    tooltip.style.top = (y + 15) + 'px';
    tooltip.classList.remove('hidden');
}

// Hide tooltip
function hideTooltip() {
    document.getElementById('trajectory-tooltip').classList.add('hidden');
}

// Open point time editor
function openPointTimeEditor(truck, pointIndex, x, y) {
    currentEditingPoint = { truck, pointIndex };
    
    const point = truck.trajectory[pointIndex];
    const editor = document.getElementById('point-time-editor');
    const input = document.getElementById('point-datetime-input');
    
    // Convert to datetime-local format or use current datetime
    input.value = toDateTimeLocal(point.datetime) || toDateTimeLocal(formatDateTime(new Date()));
    
    // Position near click
    editor.style.left = (x + 10) + 'px';
    editor.style.top = (y + 10) + 'px';
    editor.classList.remove('hidden');
}

// Save point time
function savePointTime() {
    if (!currentEditingPoint) return;
    
    const { truck, pointIndex } = currentEditingPoint;
    const input = document.getElementById('point-datetime-input');
    
    // Convert from datetime-local format
    truck.trajectory[pointIndex].datetime = fromDateTimeLocal(input.value);
    updateTruckInStorage(truck.id, { trajectory: truck.trajectory });
    
    closePointTimeEditor();
}

// Clear point time
function clearPointTime() {
    if (!currentEditingPoint) return;
    
    const { truck, pointIndex } = currentEditingPoint;
    truck.trajectory[pointIndex].datetime = null;
    updateTruckInStorage(truck.id, { trajectory: truck.trajectory });
    
    closePointTimeEditor();
}

// Close point time editor
function closePointTimeEditor() {
    document.getElementById('point-time-editor').classList.add('hidden');
    currentEditingPoint = null;
}

// Update trajectory when truck moves
function updateTrajectoryOnTruckMove(truckId) {
    if (trajectories[truckId]) {
        const truck = getTruckById(truckId);
        if (truck) {
            updatePolyline(truck);
        }
    }
}

// Format datetime as HH:MM DD.MM.YYYY
function formatDateTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes} ${day}.${month}.${year}`;
}

// Convert to datetime-local format for input
function toDateTimeLocal(datetimeStr) {
    if (!datetimeStr) return '';
    
    // Parse "HH:MM DD.MM.YYYY"
    const parts = datetimeStr.split(' ');
    if (parts.length !== 2) return '';
    
    const timePart = parts[0]; // "HH:MM"
    const datePart = parts[1]; // "DD.MM.YYYY"
    
    const [day, month, year] = datePart.split('.');
    
    return `${year}-${month}-${day}T${timePart}`;
}

// Convert from datetime-local format
function fromDateTimeLocal(datetimeLocal) {
    if (!datetimeLocal) return null;
    
    const date = new Date(datetimeLocal);
    return formatDateTime(date);
}

// Open minimal trajectory edit panel
function openTrajectoryEditPanel(truck) {
    // Close detail panel if open
    closeDetailPanel();
    
    // Set current truck
    currentTruckId = truck.id;
    
    // Show truck name
    document.getElementById('trajectory-truck-name').textContent = truck.truck_name;
    
    // Show panel
    document.getElementById('trajectory-edit-panel').classList.remove('hidden');
    
    // Auto enter edit mode
    enterEditMode();
}

// Close trajectory edit panel
function closeTrajectoryEditPanel() {
    document.getElementById('trajectory-edit-panel').classList.add('hidden');
    
    // Exit edit mode if active
    if (isEditMode) {
        exitEditMode();
    }
    
    currentTruckId = null;
}

// Save and exit edit mode
function saveAndExitEditMode() {
    // Changes are already auto-saved
    exitEditMode();
    closeTrajectoryEditPanel();
}

// Export all data to JSON
function exportAllData() {
    const trucks = loadTrucks();
    
    const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        trucks: trucks
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    a.download = `gps-tracker-data-${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Дані успішно експортовані!');
}

// Import data from JSON
function importAllData() {
    document.getElementById('import-file-input').click();
}

// Handle import file
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('Будь ласка, виберіть JSON файл');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (!importData.trucks || !Array.isArray(importData.trucks)) {
                throw new Error('Невірна структура даних');
            }
            
            const confirmMsg = `Імпортувати ${importData.trucks.length} вантажівок?\n\nУВАГА: Це замінить всі поточні дані!`;
            if (!confirm(confirmMsg)) {
                return;
            }
            
            // Migrate old data if needed
            importData.trucks.forEach(truck => {
                if (truck.trajectory) {
                    truck.trajectory = truck.trajectory.map(point => {
                        // Convert old 'time' field to 'datetime'
                        if (point.time && !point.datetime) {
                            const now = new Date();
                            const day = String(now.getDate()).padStart(2, '0');
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const year = now.getFullYear();
                            point.datetime = `${point.time} ${day}.${month}.${year}`;
                            delete point.time;
                        }
                        return point;
                    });
                }
            });
            
            saveTrucksToStorage(importData.trucks);
            location.reload();
            
        } catch (error) {
            alert('Помилка при імпорті даних: ' + error.message);
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', initTrajectories);
}
