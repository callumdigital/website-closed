import TRIP from '../data/trip.js';

// Daily photos live in Supabase (table `photos` + public storage bucket `photos`; see supabase/setup.sql).
const cfg = TRIP.photos || {};
// Just the project address: tolerate a pasted API endpoint like https://x.supabase.co/rest/v1/
export const base = (cfg.supabaseUrl || '').trim().replace(/\/(rest|auth|storage)\/v1.*$/, '').replace(/\/+$/, '');
export const photosEnabled = !!(base && cfg.supabaseKey);
// Which trip these photos belong to, so several trackers can share one Supabase project.
export const tripId = (cfg.trip || 'europe').trim().toLowerCase();

export const publicUrl = path => `${base}/storage/v1/object/public/photos/${path.split('/').map(encodeURIComponent).join('/')}`;

// Everyone can read: a plain REST call with the public key, no library needed on the main page.
// Returns Map of 'YYYY-MM-DD' → [{ id, url, caption, created_at }], oldest first.
export async function loadPhotos() {
  const r = await fetch(`${base}/rest/v1/photos?select=id,day,path,caption,created_at&trip=eq.${encodeURIComponent(tripId)}&order=created_at.asc`, {
    headers: { apikey: cfg.supabaseKey }, // works with both the legacy anon key and the newer publishable key
  });
  if (!r.ok) throw new Error(`Photos: ${r.status}`);
  const byDay = new Map();
  for (const p of await r.json()) {
    if (!byDay.has(p.day)) byDay.set(p.day, []);
    byDay.get(p.day).push({ ...p, url: publicUrl(p.path) });
  }
  return byDay;
}

// Shrinks a phone photo to at most `max` px on its longest side as a JPEG, so uploads are quick on hotel wifi.
export async function resizeImage(file, max = 1600, quality = 0.82) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return new Promise((ok, fail) => c.toBlob(b => b ? ok(b) : fail(new Error('Could not encode image')), 'image/jpeg', quality));
}
