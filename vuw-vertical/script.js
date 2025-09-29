// Load configuration (same as horizontal version)
const config = window.VUW_CONFIG || {
    METLINK_API_KEY: 'ciFUCbyIQP8lt6Cylk9yn953L6eHYxAnEkaIU8d0',
    STOP_A: '4915',
    STOP_B: '5915',
    EXCLUDED_ROUTES: ['740', '739', '769']
};

const API_KEY = config.METLINK_API_KEY;
const STOP_A = config.STOP_A;
const STOP_B = config.STOP_B;

let transportData = [];
let retryCount = 0;
const MAX_RETRIES = config.MAX_RETRIES || 3;

// Excluded bus routes (same as horizontal version)
const EXCLUDED_ROUTES = config.EXCLUDED_ROUTES || ['740', '739', '769'];

// Initialize the application
async function initialize() {
    console.log('Starting initialization...');
    // Show loading state immediately
    const departuresScroll = document.getElementById('departuresScroll');
    if (departuresScroll) {
        departuresScroll.innerHTML = `
            <div class="departure-item">
                <div class="route-column">
                    <div class="route-number">...</div>
                </div>
                <div class="destination-column">
                    <div class="route-destination">Loading Bus Times</div>
                </div>
                <div class="stop-column">
                    <div class="stop-info">Please wait...</div>
                </div>
                <div class="time-column">
                    <div class="departure-times">
                        <div class="next-departure">--</div>
                        <div class="following-departure"></div>
                    </div>
                </div>
                <div class="status-column">
                    <div class="status-badge">Loading</div>
                </div>
                <div class="direction-column">
                    <div class="direction-info">
                        <span class="direction-text">Loading</span>
                        <span class="direction-arrow">⏳</span>
                    </div>
                </div>
            </div>
        `;
    }

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
    } catch (error) {
        console.error('Initialization failed:', error);
        setTimeout(initialize, 5000);
    }
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

// Automatic refresh for digital display - no user interaction needed
setInterval(() => {
    console.log('Automatic refresh triggered...');
    updateTransportData();
}, 30000); // Refresh every 30 seconds

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-NZ', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        currentTimeElement.textContent = timeString;
    }
}


async function fetchStopData(stopId) {
    try {
        console.log(`Fetching data for stop ${stopId}...`);
        console.log(`Using API key: ${API_KEY.substring(0, 10)}...`);
        
        const response = await fetch(`https://api.opendata.metlink.org.nz/v1/stop-predictions?stop_id=${stopId}`, {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error for stop ${stopId}:`, response.status, response.statusText);
            console.error('Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched data for stop ${stopId}:`, data);
        return data;
    } catch (error) {
        console.error(`Error fetching stop ${stopId} data:`, error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return { error: true, message: error.message };
    }
}


// Group departures by service (same as horizontal version)
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

// Format time function (same as horizontal version)
function formatTime(timestamp) {
    if (!timestamp) return "N/A";
    
    const now = new Date();
    const departureTime = new Date(timestamp);
    const diffMinutes = Math.round((departureTime - now) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Due now";
    return `${diffMinutes} mins away`;
}

// Check if departure is valid (same as horizontal version)
function isValidDeparture(departure) {
    // Skip excluded bus routes
    if (EXCLUDED_ROUTES.includes(departure.service_id)) return false;
    
    // Skip services with "School Bus" in the destination name
    if (departure.destination && departure.destination.name && 
        departure.destination.name.toLowerCase().includes('school bus')) {
        return false;
    }

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

// Update transport data
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
            console.error('Stop A error:', stopAData?.error ? stopAData.message : 'No data');
            console.error('Stop B error:', stopBData?.error ? stopBData.message : 'No data');
            
            const errorMessage = stopAData?.message || stopBData?.message || 'Network error';
            transportData = [{
                route: 'alert',
                destination: `Unable to Load Bus Times: ${errorMessage}`,
                stop: 'Error',
                nextDepartures: ['Check console for details'],
                status: 'system-message',
                rawTimestamps: []
            }];
            populateDepartures();
            
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
                destination: 'No departures available',
                stop: 'Info',
                nextDepartures: ['Check back later'],
                status: 'system-message',
                rawTimestamps: []
            }];
        } else {
            // Sort by next departure time
            transportData = processedData.sort((a, b) => {
                if (!a.rawTimestamps || !a.rawTimestamps[0]) return 1;
                if (!b.rawTimestamps || !b.rawTimestamps[0]) return -1;
                return new Date(a.rawTimestamps[0]) - new Date(b.rawTimestamps[0]);
            });
        }

        console.log('Updated transport data:', transportData.length, 'departures');
        
        populateDepartures();
        retryCount = 0; // Reset retry count on success
        
    } catch (error) {
        console.error('Error updating transport data:', error);
        retryCount++;
        
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying in 5 seconds... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(updateTransportData, 5000);
        } else {
            console.error('Max retries reached, giving up');
        }
    }
}

// Populate departures display
function populateDepartures() {
    const departuresScroll = document.getElementById('departuresScroll');
    if (!departuresScroll) {
        console.error('Departures scroll element not found');
        return;
    }
    
    let html = '';
    
    if (!transportData || transportData.length === 0) {
        html = `
            <div class="departure-item">
                <div class="route-column">
                    <div class="route-number">...</div>
                </div>
                <div class="destination-column">
                    <div class="route-destination">Checking Bus Times</div>
                </div>
                <div class="stop-column">
                    <div class="stop-info">Stop A</div>
                </div>
                <div class="time-column">
                    <div class="departure-times">
                        <div class="next-departure">--</div>
                        <div class="following-departure"></div>
                    </div>
                </div>
                <div class="status-column">
                    <div class="status-badge">Loading</div>
                </div>
                <div class="direction-column">
                    <div class="direction-info">
                        <span class="direction-text">To City</span>
                        <span class="direction-arrow">⬆</span>
                    </div>
                </div>
            </div>
        `;
    } else if (transportData.length === 1 && transportData[0].route === 'alert') {
        // Show error message
        html = `
            <div class="departure-item">
                <div class="route-column">
                    <div class="route-number">⚠</div>
                </div>
                <div class="destination-column">
                    <div class="route-destination">${transportData[0].destination}</div>
                </div>
                <div class="stop-column">
                    <div class="stop-info">Error</div>
                </div>
                <div class="time-column">
                    <div class="departure-times">
                        <div class="next-departure">Check Console</div>
                        <div class="following-departure">F12 for details</div>
                    </div>
                </div>
                <div class="status-column">
                    <div class="status-badge system-message">System</div>
                </div>
                <div class="direction-column">
                    <div class="direction-info">
                        <span class="direction-text">Debug</span>
                        <span class="direction-arrow">🔧</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        transportData.forEach((departure, index) => {
            const nextTime = departure.nextDepartures[0] || '--';
            const followingTime = departure.nextDepartures[1] || '';
            
            
            const statusMap = {
                'delayed': 'Delayed',
                'ontime': 'On time',
                'cancelled': 'Cancelled',
                'on time': 'On time',
                'system-message': 'System'
            };

            const statusClass = departure.status === 'delayed' ? 'delayed' : 
                               departure.status === 'cancelled' ? 'cancelled' : 
                               departure.status === 'system-message' ? 'system-message' : '';
            
            const mappedStatus = statusMap[departure.status.toLowerCase()] || departure.status;
            
            const isTowardsCity = departure.stop === "Stop A";
            const directionArrow = isTowardsCity ? "⬆" : "⬇";
            const directionText = isTowardsCity ? "To City" : "From City";
            
            html += `
                <div class="departure-item">
                    <div class="route-column">
                        <div class="route-number route-${departure.route}">${departure.route}</div>
                    </div>
                    <div class="destination-column">
                        <div class="route-destination">${departure.destination}</div>
                    </div>
                    <div class="stop-column">
                        <div class="stop-info">${departure.stop}</div>
                    </div>
                    <div class="time-column">
                        <div class="departure-times">
                            <div class="next-departure">Next: ${nextTime}</div>
                            ${followingTime ? `<div class="following-departure">Then: ${followingTime}</div>` : ''}
                        </div>
                    </div>
                    <div class="status-column">
                        <div class="status-badge ${statusClass}">${mappedStatus}</div>
                    </div>
                    <div class="direction-column">
                        <div class="direction-info">
                            <span class="direction-text">${directionText}</span>
                            <span class="direction-arrow">${directionArrow}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    departuresScroll.innerHTML = html;
    console.log('Departures populated:', transportData.length, 'items');
}

function updateTimingsOnly() {
    const now = new Date();
    document.querySelectorAll('.departure-item').forEach(item => {
        const timingDiv = item.querySelector('.time');
        if (timingDiv && timingDiv.dataset && timingDiv.dataset.timestamps) {
            try {
                const timestamps = JSON.parse(timingDiv.dataset.timestamps);
                const timeHTML = formatTimeWithWeight(timestamps);
                timingDiv.innerHTML = timeHTML;
            } catch (e) {
                // Ignore JSON parsing errors for timing updates
            }
        }
    });
}

function formatTimeWithWeight(timestamps) {
    if (!timestamps || timestamps.length === 0) return "N/A";
    
    const times = timestamps.map(ts => {
        const now = new Date();
        const departureTime = new Date(ts);
        const diffMinutes = Math.round((departureTime - now) / (1000 * 60));
        
        if (diffMinutes <= 0) return "Due now";
        return `${diffMinutes} mins away`;
    });
    
    if (times.length === 1) {
        return `<span class="next-time">${times[0]}</span>`;
    } else {
        return `<span class="next-time">${times[0]}</span>, then <span class="subsequent-time">${times[1]}</span>`;
    }
}