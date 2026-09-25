// Taiwan's counties grouped into the regions people talk about. The map highlights the regions they've reached.
// labels: spots for the region's name out in the sea beside it (first one that's free wins), and which way the text runs.
export const REGIONS = {
  north:   { name: 'North',   labels: [[121.25, 25.52, 'middle'], [120.75, 25.35, 'end']] },
  central: { name: 'Central', labels: [[120.5, 24.75, 'end'], [120.3, 24.2, 'end']] },
  south:   { name: 'South',   labels: [[120.12, 22.55, 'end'], [120.3, 22.05, 'end']] },
  east:    { name: 'East',    labels: [[121.78, 23.15, 'start'], [121.5, 22.35, 'start']] },
  islands: { name: 'Islands', labels: [] },
};

// County (COUNTYENG in vendor/taiwan-counties.json) → region.
const COUNTY_REGION = {
  'Taipei City': 'north', 'New Taipei City': 'north', 'Keelung City': 'north', 'Taoyuan City': 'north',
  'Hsinchu City': 'north', 'Hsinchu County': 'north', 'Yilan County': 'north',
  'Miaoli County': 'central', 'Taichung City': 'central', 'Changhua County': 'central', 'Nantou County': 'central', 'Yunlin County': 'central',
  'Chiayi City': 'south', 'Chiayi County': 'south', 'Tainan City': 'south', 'Kaohsiung City': 'south', 'Pingtung County': 'south',
  'Hualien County': 'east', 'Taitung County': 'east',
  'Penghu County': 'islands', 'Kinmen County': 'islands', 'Lienchiang County': 'islands',
};
export const regionOf = county => COUNTY_REGION[county?.properties?.COUNTYENG] || null;

// A little picture for each stop's tile until it has photos. Anything not listed gets a pin.
const EMOJI = {
  taipei: '🏙️', 'taipei 101': '🏙️', jiufen: '🏮', keelung: '🦑', tamsui: '🌅', yilan: '♨️', taoyuan: '✈️', hsinchu: '🍜',
  taichung: '🌈', 'sun moon lake': '🛶', alishan: '🌲', chiayi: '🍵',
  tainan: '🏯', kaohsiung: '⚓', kenting: '🏖️',
  hualien: '⛰️', taroko: '🏞️', 'taroko gorge': '🏞️', taitung: '🎈', 'green island': '🐢',
};
export const stopEmoji = city => EMOJI[String(city).trim().toLowerCase()] || '📍';
