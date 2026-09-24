# Trip Tracker

Where in the world are Annalisa & Mitchell today? This is a static site that shows the travellers' location on any day of the trip. It's built from the Claude Design prototype in `design-handoff/`.

## Update the itinerary

1. Edit `src/data/itinerary.csv`. Put one row per day: `date,city,country`, e.g. `2026-10-03,Rome,Italy`.
2. Push to `main`. GitHub Actions runs the tests, builds the site and deploys it to Pages.

Leave a date out to mark a travel day ("in transit"). If a city isn't in `src/lib/places.js`, the site looks it up on OpenStreetMap when the page loads. Adding it to that file is faster and more reliable.

Trip title, travellers and home city are set in `src/data/trip.js`.

## Develop

```sh
npm install
npm run dev    # local server
npm test       # parser tests + checks the committed CSV parses
npm run build  # outputs dist/
```

## First-time GitHub Pages setup

In the repo, go to **Settings → Pages → Source** and pick **GitHub Actions**.
