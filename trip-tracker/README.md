# Trip Tracker

Where in the world are Annalisa & Mitchell today? This is a static site that shows the travellers' location on any day of the trip. It's built from the Claude Design prototype in `design-handoff/`.

It runs with **no build step**, so classic GitHub Pages ("Deploy from a branch") serves it as-is.

## Publish (classic GitHub Pages)

Go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then pick **main** and **/ (root)**.

## Update the itinerary

Edit `src/data/itinerary.csv`. Put one row per day: `date,city,country`, e.g. `2026-10-03,Rome,Italy`. Commit, and the site updates within a few minutes.

Leave a date out to mark a travel day ("in transit"). If a city isn't in `src/lib/places.js`, the site looks it up on OpenStreetMap when the page loads. Adding it to that file is faster and more reliable.

Trip title, travellers and home city are set in `src/data/trip.js`.

## Develop

```sh
npm install
npm run dev     # local server (any static server works)
npm test        # parser tests + checks the committed CSV parses
npm run vendor  # only when upgrading d3/topojson/world-atlas: rebuilds vendor/
```
