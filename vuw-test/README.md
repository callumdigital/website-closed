# VUW Kelburn Transport Ticker

A real-time display of bus arrivals and departures at Victoria University of Wellington's Kelburn campus (Stops A & B).

## Features

- Real-time bus arrival information from Metlink API
- Automatic updates every minute
- Smooth scrolling display
- Direction indicators (To City/From City)
- Status indicators (On Time, Delayed, Cancelled)
- Responsive design (supports 1080p and 4K displays)
- Automatic page refresh every hour to prevent memory leaks

## Setup

1. Clone this repository
2. Replace the `API_KEY` in `script.js` with your Metlink API key
   - Get your API key from [Metlink's Developer Portal](https://opendata.metlink.org.nz/)
3. Open `index.html` in a web browser

## Stop Information

- Stop A (ID: 4915): To City
- Stop B (ID: 5915): From City

## Development

The project is structured into three main files:
- `index.html`: Main HTML structure and inline styles
- `script.js`: JavaScript functionality and API integration
- `styles.css`: Additional styles (if separated from index.html)

## License

MIT License - Feel free to use and modify as needed. 