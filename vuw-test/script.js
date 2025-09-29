// Load configuration
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

// Scrolling variables for optimized animation
let scrollPosition = 0;
let scrollWidth = 0;
let animationId = null;
let scrollSpeed = 2.0; // Base scroll speed

// Excluded bus routes
const EXCLUDED_ROUTES = config.EXCLUDED_ROUTES || ['740', '739', '769'];

// Enhanced scroll speed calculation for responsive design
function calculateScrollSpeed() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Base speed varies by platform - more conservative values
    let baseSpeed = 1.5; // Balanced speed for good readability
    
    if (window.PLATFORM_CONFIG) {
        if (window.PLATFORM_CONFIG.isEyemagnet) {
            baseSpeed = 0.8; // Moderate speed for Eyemagnet
        } else if (window.PLATFORM_CONFIG.isTizen) {
            baseSpeed = 1.2; // Good speed for Tizen
        } else if (window.PLATFORM_CONFIG.isOnelan) {
            baseSpeed = 2.0; // Full speed for Onelan
        }
    }
    
    // Scale based on viewport width and height - using fixed pixel baseline
    const widthRatio = viewportWidth / 3840; // Use 3840 as baseline for 4K
    const heightRatio = viewportHeight / 360; // Use 360 as baseline height
    const sizeMultiplier = Math.min(widthRatio, heightRatio);
    
    // Calculate final speed with balanced bounds
    scrollSpeed = Math.max(0.5, Math.min(2.5, baseSpeed * sizeMultiplier)); // Balanced speed range
    
    console.log(`Scroll speed calculated: ${scrollSpeed} (viewport: ${viewportWidth}x${viewportHeight}, platform: ${window.PLATFORM_CONFIG?.isEyemagnet ? 'Eyemagnet' : window.PLATFORM_CONFIG?.isTizen ? 'Tizen' : window.PLATFORM_CONFIG?.isOnelan ? 'Onelan' : 'Unknown'})`);
    
    return scrollSpeed;
}

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

function formatTime(timestamp) {
    if (!timestamp) return "N/A";
    
    const now = new Date();
    const departureTime = new Date(timestamp);
    const diffMinutes = Math.round((departureTime - now) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Due now";
    return `${diffMinutes} mins away`;
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

    const timeHTML = formatTimeWithWeight(data.rawTimestamps);

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
                <div class="time" data-timestamps='${JSON.stringify(data.rawTimestamps)}'>${timeHTML}</div>
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
                    <div class="time">Just a moment please...</div>
                </div>
            </div>`;
        return;
    }
    
    let html = '';
    
    // Calculate number of copies based on fixed pixel dimensions
    const viewportWidth = window.innerWidth;
    const itemWidth = 650; // Fixed pixel width of transport items
    const itemMargin = 48; // Fixed pixel margin
    const totalItemWidth = itemWidth + itemMargin;
    const copies = Math.ceil((viewportWidth * 2) / totalItemWidth) + 2; // Ensure seamless scrolling
    
    console.log(`Creating ${copies} copies for viewport ${viewportWidth}px (item width: ${totalItemWidth}px)`);
    
    for (let i = 0; i < copies; i++) {
        transportData.forEach(item => {
            html += createTransportItem(item);
        });
    }
    
    tickerScroll.innerHTML = html;
    
    // Reset scroll position and recalculate width
    scrollPosition = 0;
    setTimeout(() => {
        scrollWidth = tickerScroll.scrollWidth;
        calculateScrollSpeed(); // Recalculate scroll speed for current viewport
        startScrollAnimation();
    }, 50); // Reduced delay for better responsiveness
}

// Optimized scrolling animation using requestAnimationFrame
function startScrollAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    function animate() {
        const tickerScroll = document.getElementById('tickerScroll');
        if (!tickerScroll) return;
        
        scrollPosition += scrollSpeed;
        
        // Calculate reset point based on fixed pixel dimensions
        const viewportWidth = window.innerWidth;
        const itemWidth = 650; // Fixed pixel width of transport items
        const itemMargin = 48; // Fixed pixel margin
        const totalItemWidth = itemWidth + itemMargin;
        const copies = Math.ceil((viewportWidth * 2) / totalItemWidth) + 2;
        const resetPoint = scrollWidth / copies;
        
        if (scrollPosition >= resetPoint) {
            scrollPosition = 0;
        }
        
        // Use transform for better performance
        tickerScroll.style.transform = `translateX(-${scrollPosition}px)`;
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
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

function updateTimingsOnly() {
    const now = new Date();
    document.querySelectorAll('.transport-item').forEach(item => {
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

// Enhanced resize handler for responsive design
function handleResize() {
    console.log('Window resized, recalculating parameters...');
    
    // Update platform config if needed
    if (window.PLATFORM_CONFIG) {
        window.PLATFORM_CONFIG.viewportWidth = window.innerWidth;
        window.PLATFORM_CONFIG.viewportHeight = window.innerHeight;
    }
    
    calculateScrollSpeed();
    
    // Restart animation with new parameters
    setTimeout(() => {
        if (document.getElementById('tickerScroll')) {
            scrollWidth = document.getElementById('tickerScroll').scrollWidth;
            if (scrollWidth > 0) {
                startScrollAnimation();
            }
        }
    }, 100);
}

// Initialize the application
async function initialize() {
    console.log('Starting initialization...');
    // Show loading state immediately
    const tickerScroll = document.getElementById('tickerScroll');
    if (tickerScroll) {
        tickerScroll.innerHTML = `
            <div class="transport-item">
                <div class="bus-section">
                    <div class="bus-badge">...</div>
                </div>
                <div class="transport-info">
                    <div class="destination">Loading Bus Times</div>
                    <div class="time">Please wait...</div>
                </div>
            </div>`;
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
        schedulePageRefresh();
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

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page visibility changed to visible, updating data...');
        updateTransportData();
    }
});

// Handle page focus/blur for animation optimization
window.addEventListener('blur', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

window.addEventListener('focus', () => {
    if (scrollWidth > 0) {
        startScrollAnimation();
    }
});

// Handle window resize
window.addEventListener('resize', handleResize);

// Add message handler for test interface
window.addEventListener('message', function(event) {
    if (event.data.type === 'getPlatformInfo') {
        event.source.postMessage({
            type: 'platformInfo',
            config: window.PLATFORM_CONFIG || {
                isEyemagnet: false,
                isOnelan: false,
                isTizen: false,
                scaleFactor: 1
            }
        }, event.origin);
    }
});