// Trip settings. The day-by-day itinerary lives in ./itinerary.csv (date, city, country per row).
export default {
  title: 'The Big Europe Trip',
  travellers: 'Annalisa & Mitchell',
  // Cut-out of the travellers' heads, shown as the "you are here" marker on the map.
  // Save it as a PNG with a transparent background in img/ and set the path, e.g. 'img/travellers.png'.
  // Until then their initials show in a bubble.
  avatar: '',
  // Which time zone decides what "today" is on the site.
  todayTimeZone: 'Pacific/Auckland',
  // Departure time (in todayTimeZone) on day 1, for the countdown over the map. e.g. '14:35' for the flight time.
  takeoffTime: '00:00',
  // Daily photo uploads (see SETUP-PHOTOS.md). Paste these from Supabase → Project Settings → API.
  // Both are safe to publish: what people can do is locked down by the rules in supabase/setup.sql.
  photos: { supabaseUrl: '', supabaseKey: '' },
  // Where the trip starts and ends: drawn on the map, not counted as a stop.
  home: { city: 'Wellington', country: 'New Zealand', ll: [174.7762, -41.2865] },
};
