# Trip Tracker

Where in the world are Annalisa & Mitchell today? This is a static site that shows the travellers' location on any day of the trip. It's built from the Claude Design prototype in `design-handoff/`.

It runs with **no build step**, so classic GitHub Pages ("Deploy from a branch") serves it as-is.

## Publish (classic GitHub Pages)

Go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then pick **main** and **/ (root)**.

## Update the itinerary

Export the itinerary spreadsheet as CSV and replace `src/data/itinerary.csv` (columns `Date`, `Country`, `City`; dates like `Sat 03 Oct`). Commit, and the site updates within a few minutes.

- Travel days: `London > Paris` (the last place is where they end up that day).
- In the air: `The sky`. Unknown: `???`. Days back in the home city end the trip.
- Optional `Arrive` column: the local time they land on a travel day (e.g. `21:30`). Until then the site shows them in the air.

Leave a date out and it shows as "in the air". If a city isn't in `src/lib/places.js`, the site looks it up on OpenStreetMap when the page loads. Adding it to that file is faster and more reliable.

Trip title, travellers and home city are set in `src/data/trip.js`.

## Develop

```sh
npm install
npm run dev     # local server (any static server works)
npm test        # parser tests + checks the committed CSV parses
npm run vendor  # only when upgrading d3/topojson/world-atlas: rebuilds vendor/
```

## Travellers' photo on the map

The "you are here" marker shows the travellers' initials until you add a photo:

1. Add a square photo to `img/`, e.g. `img/travellers.jpg`. Crop it tight on the faces; about 300×300px is plenty.
2. In `src/data/trip.js`, set `avatar: 'img/travellers.jpg'`.
