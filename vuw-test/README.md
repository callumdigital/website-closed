# VUW Transport Ticker - Responsive Scaling

This version of the VUW Transport Ticker has been updated with responsive scaling to work properly across different platforms, including Eyemagnet on Samsung Tizen OS commercial displays.

## Key Improvements

### 1. Responsive Design
- **Viewport Units**: Replaced fixed pixel dimensions with `vw` (viewport width) and `vh` (viewport height) units
- **Dynamic Scaling**: Elements scale proportionally to screen size
- **Flexible Layouts**: Transport items adjust width and spacing based on available space

### 2. Platform Detection
The system now automatically detects different platforms and applies appropriate optimizations:

- **Eyemagnet**: Detected by Chrome user agent + high device pixel ratio or viewport mismatch
- **Tizen**: Detected by user agent containing 'tizen' or 'samsung'
- **Onelan**: Detected by non-Chrome user agent with large viewport
- **Default**: Fallback for unknown platforms

### 3. Platform-Specific Optimizations

#### Eyemagnet (Samsung Tizen OS)
- **Scale Factor**: 0.8 (conservative scaling)
- **Scroll Speed**: 0.8 (slower animation)
- **CSS Adjustments**: Smaller elements, reduced spacing

#### Tizen
- **Scale Factor**: 0.9
- **Scroll Speed**: 1.2 (moderate)
- **CSS Adjustments**: Optimized for Tizen browser quirks

#### Onelan
- **Scale Factor**: 1.0
- **Scroll Speed**: 2.5 (faster)
- **CSS Adjustments**: Standard scaling

### 4. Responsive Breakpoints
The CSS includes media queries for different screen sizes:
- **4K+ (3840px+)**: Full-size elements
- **Full HD (1920px)**: Slightly reduced elements
- **HD (1366px)**: Medium-sized elements
- **Tablet (1024px)**: Smaller elements
- **Mobile (800px and below)**: Compact layout

## Files Updated

### `index.html`
- Enhanced platform detection logic
- Dynamic scroll speed calculation
- Improved initialization timing

### `styles.css`
- Complete rewrite using viewport units
- Platform-specific media queries
- Responsive breakpoints
- Flexible layouts

### `script.js`
- Enhanced scroll speed calculation
- Responsive copy generation
- Improved resize handling
- Platform-specific optimizations

## Testing

### 1. Test Interface
Use `test-scaling.html` to test different screen sizes:
- Click size buttons to simulate different displays
- Monitor platform detection in the info panel
- Check console logs for detailed scaling calculations

### 2. Platform Testing
Test on actual devices:

#### Eyemagnet (Samsung Tizen)
```bash
# Expected behavior:
# - Conservative scaling (0.8x)
# - Slower scroll speed
# - Smaller elements
# - Platform detected as "Eyemagnet"
```

#### Onelan
```bash
# Expected behavior:
# - Standard scaling (1.0x)
# - Faster scroll speed
# - Platform detected as "Onelan"
```

#### Other Platforms
```bash
# Expected behavior:
# - Dynamic scaling based on viewport
# - Platform detected as "Unknown"
# - Responsive layout adjustments
```

### 3. Console Monitoring
Monitor the browser console for:
- Platform detection logs
- Scroll speed calculations
- Copy generation information
- Resize events

## Troubleshooting

### Common Issues

1. **Elements too small on Eyemagnet**
   - Check if platform detection is working (console logs)
   - Verify device pixel ratio detection
   - Adjust scale factor in platform config if needed

2. **Scrolling too fast/slow**
   - Monitor scroll speed calculations in console
   - Adjust base speed values for specific platforms
   - Check viewport size detection

3. **Layout breaking on certain screens**
   - Test with different viewport sizes using test interface
   - Check media query breakpoints
   - Verify viewport units are working correctly

### Debug Mode
Enable detailed logging by checking the browser console. The system logs:
- Platform detection results
- Scale factor calculations
- Scroll speed adjustments
- Copy generation details
- Resize events

## Performance Considerations

- **Hardware Acceleration**: Uses `transform: translateZ(0)` for smooth animations
- **Efficient Rendering**: Optimized copy generation based on viewport size
- **Memory Management**: Proper cleanup of animation frames
- **Responsive Updates**: Reduced delays for better responsiveness

## Browser Compatibility

- **Chrome/Chromium**: Full support (Eyemagnet, standard browsers)
- **Tizen Browser**: Full support with platform-specific optimizations
- **Other WebKit browsers**: Should work with fallback scaling
- **Firefox/Safari**: Tested with responsive design

## Future Enhancements

1. **Additional Platform Detection**: Support for more commercial display systems
2. **Custom Scale Factors**: Allow configuration per installation
3. **Performance Monitoring**: Real-time performance metrics
4. **Accessibility**: Better support for screen readers and assistive technologies

## Original README

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