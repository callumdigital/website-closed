const API_KEY = 'ciFUCbyIQP8lt6Cylk9yn953L6eHYxAnEkaIU8d0';
const STOP_A = '4915';
const STOP_B = '5915';

let transportData = [];
let retryCount = 0;
const MAX_RETRIES = 3;

function isValidDeparture(departure) {
    // Skip school buses (typically numbered 600-699)
    const routeNum = parseInt(departure.service_id);
    if (routeNum >= 600 && routeNum <= 699) return false;

    // Check if departure is today
    const now = new Date();
    const departureTime = new Date(departure.departure.expected || departure.departure.aimed);
    
    // If departure is tomorrow or after midnight, skip it
    if (departureTime.getDate() !== now.getDate() || 
        (departureTime.getHours() >= 0 && departureTime.getHours() < 5)) {
        return false;
    }

    return true;
}

function formatTime(timestamp) {
    if (!timestamp) return "N/A";
    
    const now = new Date();
    const departureTime = new Date(timestamp);
    const diffMinutes = Math.round((departureTime - now) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Due now";
    return `${diffMinutes} mins away`;
}

async function fetchStopData(stopId) {
    try {
        console.log(`Fetching data for stop ${stopId}...`);
        const response = await fetch(`https://api.opendata.metlink.org.nz/v1/stop-predictions?stop_id=${stopId}`, {
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`HTTP error for stop ${stopId}:`, response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched data for stop ${stopId}:`, data);
        return data;
    } catch (error) {
        console.error(`Error fetching stop ${stopId} data:`, error);
        return { error: true, message: error.message };
    }
}

async function updateTransportData() {
    try {
        console.log('Starting transport data update...');
        const [stopAData, stopBData] = await Promise.all([
            fetchStopData(STOP_A),
            fetchStopData(STOP_B)
        ]);

        console.log('Stop A Data:', stopAData);
        console.log('Stop B Data:', stopBData);

        if ((!stopAData || stopAData.error) && (!stopBData || stopBData.error)) {
            console.error('Failed to fetch data for both stops');
            transportData = [{
                route: 'alert',
                destination: 'Temporarily Unable to Load Bus Times',
                stop: 'Info',
                nextDepartures: ['Please check back in a moment'],
                status: 'system-message',
                rawTimestamps: []
            }];
            populateTicker();
            
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);
                setTimeout(updateTransportData, 5000);
            }
            return;
        }

        retryCount = 0;
        
        // Process data immediately
        const processedData = [];
        
        if (stopAData && stopAData.departures) {
            processedData.push(...groupDepartures(stopAData.departures, "Stop A"));
        }

        if (stopBData && stopBData.departures) {
            processedData.push(...groupDepartures(stopBData.departures, "Stop B"));
        }

        if (processedData.length === 0) {
            transportData = [{
                route: 'alert',
                destination: 'No Bus Times Available',
                stop: 'Info',
                nextDepartures: ['Check back during service hours'],
                status: 'system-message',
                rawTimestamps: []
            }];
        } else {
            // Sort by next departure time
            transportData = processedData.sort((a, b) => {
                if (!a.rawTimestamps[0]) return 1;
                if (!b.rawTimestamps[0]) return -1;
                return new Date(a.rawTimestamps[0]) - new Date(b.rawTimestamps[0]);
            });
        }

        // Update display immediately
        requestAnimationFrame(() => {
            populateTicker();
            console.log('Display updated with new data');
        });

    } catch (error) {
        console.error('Error updating transport data:', error);
        transportData = [{
            route: 'alert',
            destination: 'Temporarily Unable to Load Bus Times',
            stop: 'Info',
            nextDepartures: ['Please check back in a moment'],
            status: 'system-message',
            rawTimestamps: []
        }];
        populateTicker();
        
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(updateTransportData, 5000);
        }
    }
}

function groupDepartures(departures, stop) {
    const grouped = {};
    if (!departures) return [];
    
    departures
        .filter(isValidDeparture)
        .forEach(departure => {
            const key = `${departure.service_id}-${stop}`;
            if (!grouped[key]) {
                grouped[key] = {
                    route: departure.service_id,
                    destination: departure.destination.name,
                    stop: stop,
                    nextDepartures: [],
                    status: departure.status || "On time",
                    rawTimestamps: []
                };
            }
            const aimed = departure.departure.aimed;
            const expected = departure.departure.expected;
            const ts = expected || aimed;
            const timeStr = formatTime(ts);
            if (!grouped[key].nextDepartures.includes(timeStr)) {
                grouped[key].nextDepartures.push(timeStr);
                grouped[key].rawTimestamps.push(ts);
                if (grouped[key].nextDepartures.length > 2) {
                    grouped[key].nextDepartures = grouped[key].nextDepartures.slice(0, 2);
                    grouped[key].rawTimestamps = grouped[key].rawTimestamps.slice(0, 2);
                }
            }
        });
    return Object.values(grouped);
}

function createTransportItem(data) {
    const statusMap = {
        'delayed': 'Delayed',
        'ontime': 'On time',
        'cancelled': 'Cancelled',
        'on time': 'On time'
    };

    const statusClass = data.status.toLowerCase() === "delayed" ? "delayed" : 
                      data.status.toLowerCase() === "cancelled" ? "cancelled" : 
                      data.status.toLowerCase() === "system-message" ? "system-message" : "";

    const mappedStatus = statusMap[data.status.toLowerCase()] || data.status;

    const isTowardsCity = data.stop === "Stop A";
    const directionArrow = isTowardsCity ? "⬆" : "⬇";
    const directionText = isTowardsCity ? "To City" : "From City";

    return `
        <div class="transport-item">
            <div class="bus-section">
                <div class="bus-badge route-${data.route}">${data.route}</div>
            </div>
            <div class="transport-info">
                <div class="destination">${data.destination}</div>
                <div class="info-row">
                    <div class="stop-badge">${data.stop}</div>
                    <span class="status ${statusClass}">${mappedStatus}</span>
                    <span class="direction-info">
                        <span class="direction-text">${directionText}</span>
                        <span class="direction-arrow">${directionArrow}</span>
                    </span>
                </div>
                <div class="time">${data.nextDepartures.join(", then ")}</div>
            </div>
        </div>
    `;
}

function populateTicker() {
    const tickerScroll = document.getElementById('tickerScroll');
    if (!transportData || transportData.length === 0) {
        tickerScroll.innerHTML = `
            <div class="transport-item">
                <div class="bus-section">
                    <div class="bus-badge">...</div>
                </div>
                <div class="transport-info">
                    <div class="destination">Checking Bus Times</div>
                    <div class="timing">Just a moment please...</div>
                </div>
            </div>`;
        return;
    }
    
    let html = '';
    for (let i = 0; i < 3; i++) {
        transportData.forEach(item => {
            html += createTransportItem(item);
        });
    }
    
    tickerScroll.innerHTML = html;
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-NZ', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

function schedulePageRefresh() {
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-out';
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }, 60 * 60 * 1000);
}

async function initialize() {
    console.log('Starting initialization...');
    // Show loading state immediately
    document.getElementById('tickerScroll').innerHTML = `
        <div class="transport-item">
            <div class="bus-section">
                <div class="bus-badge">...</div>
            </div>
            <div class="transport-info">
                <div class="destination">Loading Bus Times</div>
                <div class="timing">Please wait...</div>
            </div>
        </div>`;

    // Start time updates
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    try {
        // Immediate first fetch with minimal delay
        console.log('Fetching initial data...');
        await updateTransportData();
        
        // Shorter initial interval for the first few updates
        setTimeout(updateTransportData, 15000); // Quick first refresh
        setTimeout(() => {
            // Then switch to normal 60s updates
            setInterval(updateTransportData, 60000);
        }, 15000);
        
        // Update timings more frequently
        setInterval(updateTimingsOnly, 1000);
        schedulePageRefresh();
    } catch (error) {
        console.error('Initialization failed:', error);
        setTimeout(initialize, 5000);
    }
}

function updateTimingsOnly() {
    const now = new Date();
    document.querySelectorAll('.transport-item').forEach(item => {
        const timingDiv = item.querySelector('.timing');
        if (timingDiv && timingDiv.dataset && timingDiv.dataset.timestamps) {
            const timestamps = JSON.parse(timingDiv.dataset.timestamps);
            const times = timestamps.map(ts => {
                const departureTime = new Date(ts);
                const diffMinutes = Math.round((departureTime - now) / (1000 * 60));
                if (diffMinutes <= 0) return "Due now";
                return `${diffMinutes} mins away`;
            });
            timingDiv.textContent = times.join(", then ");
        }
    });
}

// Start immediately when DOM is ready
console.log('Script loaded, checking document state...');
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired, initializing...');
        initialize();
    });
} else {
    console.log('Document already loaded, initializing immediately...');
    initialize();
}

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page visibility changed to visible, updating data...');
        updateTransportData();
    }
}); 
