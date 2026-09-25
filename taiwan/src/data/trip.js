// Trip settings. The day-by-day itinerary lives in ./itinerary.csv (date, city, country per row).
export default {
  title: 'Taiwan 2026',
  travellers: 'Callum', // one name → "Where in the world is Cal?"; "A & B" → "…are A & B?"
  // Cut-out of the traveller's head(s), shown as the "you are here" marker on the map.
  // Save it as a PNG with a transparent background in img/ and set the path, e.g. 'img/cal.png'.
  // Until then the initials show in a bubble.
  avatar: 'img/callumherman.png',
  // Which time zone decides what "today" is on the site.
  todayTimeZone: 'Pacific/Auckland',
  // Fallback departure time on day 1 for the countdown, if the CSV has no Depart time for day 1.
  takeoffTime: '00:00',
  // Daily photo uploads (see SETUP-PHOTOS.md). Paste these from Supabase → Project Settings → API.
  // Both are safe to publish: what people can do is locked down by the rules in supabase/setup.sql.
  photos: { supabaseUrl: 'https://axnfhpyiwgiokiyhrnek.supabase.co', supabaseKey: 'sb_publishable_g3MO-Ha6S2RnprHM54o4fA_PUP7i3W6', trip: 'taiwan' }, // trip: this tracker's photos, if the Supabase project is shared
  // Where the trip starts and ends: drawn on the map, not counted as a stop.
  home: { city: 'Wellington', country: 'New Zealand', ll: [174.7762, -41.2865] },
  // The zoomed-in map view. bounds: what counts as "in" the region; show: the area always in view;
  // pad: breathing room in degrees; center/parallels: the map projection (longitude, and two latitudes).
  region: {
    name: 'Taiwan', flag: '🇹🇼',
    bounds: [[118, 21], [123, 26.5]], show: [[120.0, 21.9], [122.0, 25.3]], pad: [0.35, 0.25],
    center: 121, parallels: [22, 25.5],
  },
};
