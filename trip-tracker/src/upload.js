import TRIP from './data/trip.js';
import { createClient } from '../vendor/supabase.js';
import { base, photosEnabled, publicUrl, resizeImage, tripId } from './lib/photos.js';
import { parseCSV, buildTrip } from './lib/trip.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const views = ['loading', 'oops', 'notSetUp', 'signin', 'notAllowed', 'post', 'recent'];
const show = (...ids) => views.forEach(v => { $(v).hidden = !ids.includes(v); });
const status = (id, msg, ok) => { $(id).textContent = msg; $(id).classList.toggle('ok', !!ok); };
// Anything unexpected goes on screen, so a traveller can screenshot it rather than see a blank page.
const oops = err => { $('oopsText').textContent = String(err?.message || err); show('oops'); };
const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(msg)), ms))]);

if (!photosEnabled) {
  show('notSetUp');
} else {
  // Implicit flow: the sign-in link works even if the email app opens it in a different browser.
  let sb;
  try {
    sb = createClient(base, TRIP.photos.supabaseKey.trim(), { auth: { flowType: 'implicit', persistSession: true, detectSessionInUrl: true } });
  } catch (err) { oops(`Couldn't connect to the photo service: ${err.message}. Check photos in src/data/trip.js.`); throw err; }

  // Which city a date is, from the itinerary, so they can see they've picked the right day (loads in the background).
  let trip = null;
  fetch('src/data/itinerary.csv', { cache: 'no-cache' }).then(r => r.text()).then(t => { trip = buildTrip(parseCSV(t).rows, {}, TRIP.home); updateWhere(); }).catch(() => {});
  const whereOn = iso => {
    if (!trip) return '';
    const t = Date.parse(iso), s = trip.byDay.get(t);
    return s ? (s.mystery ? `Somewhere in ${s.country}` : s.city) : trip.homeDays.has(t) ? TRIP.home.city : t >= trip.start && t <= trip.end ? 'In the air' : '';
  };
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  $('day').value = localToday(); // their phone's date = the date where they are
  const updateWhere = () => { $('where').textContent = whereOn($('day').value); };
  $('day').addEventListener('input', updateWhere); updateWhere();

  let lastUser = null;
  async function render(session) {
    const email = session?.user?.email;
    if (email === lastUser) return; lastUser = email;
    if (!email) return show('signin');
    const { data: allowed, error } = await sb.rpc('can_upload', { p_trip: tripId });
    if (error) return oops(`Couldn't check your access: ${error.message}`);
    if (!allowed) { $('whoami').textContent = email; return show('notAllowed'); }
    show('post', 'recent');
    loadRecent();
  }
  sb.auth.onAuthStateChange((_e, session) => { setTimeout(() => render(session)); }); // not inside the auth callback's lock
  // Show sign-in straight away if there's no saved session; some phone browsers stall the session check,
  // so give up on it after 8 seconds rather than leave a blank page.
  show('signin');
  withTimeout(sb.auth.getSession(), 8000, 'Timed out checking your sign-in.')
    .then(({ data }) => render(data.session))
    .catch(() => { if (lastUser === null) render(null); }); // only if nothing has signed in meanwhile

  $('signin').addEventListener('submit', async e => {
    e.preventDefault();
    status('signinStatus', 'Sending…');
    // shouldCreateUser: false → only accounts made in Supabase (Authentication → Users) get a link,
    // and they get the Magic Link email rather than "Confirm your email address".
    const { error } = await sb.auth.signInWithOtp({ email: $('email').value.trim(), options: { emailRedirectTo: location.href.split('#')[0], shouldCreateUser: false } });
    const notSetUp = error && /signup|not allowed|not found/i.test(error.message);
    status('signinStatus', !error ? '✉️ Check your email and tap the link (on this phone). If you haven’t recieved it, check your spam folder.'
      : notSetUp ? 'That email isn’t set up for photo uploads. Ask the site owner to add you.'
      : `Couldn't send the link: ${error.message}`, !error);
  });
  document.querySelectorAll('[data-signout]').forEach(b => b.addEventListener('click', () => sb.auth.signOut()));

  const MAX = 10; // photos per post
  const resetPicker = () => { $('previews').innerHTML = ''; $('previews').hidden = true; $('pickText').textContent = '📷 Choose photos'; $('postBtn').textContent = 'Post'; $('capHint').textContent = '(optional)'; };
  $('file').addEventListener('change', () => {
    const files = [...$('file').files].slice(0, MAX);
    if (!files.length) return resetPicker();
    $('previews').innerHTML = files.map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join('');
    $('previews').hidden = false;
    $('previews').dataset.n = Math.min(files.length, 4);
    const n = files.length, extra = $('file').files.length > MAX ? ` (first ${MAX} only)` : '';
    $('pickText').textContent = `${n} photo${n > 1 ? 's' : ''}${extra} · tap to change`;
    $('postBtn').textContent = n > 1 ? `Post ${n} photos` : 'Post';
    $('capHint').textContent = n > 1 ? '(optional, goes with the first photo)' : '(optional)';
  });

  // One photo: shrink on the phone, upload the file, then add its row (removing the file if the row fails).
  async function postOne(file, day, caption) {
    let blob;
    try { blob = await resizeImage(file); } catch { throw new Error(`“${file.name}” can’t be read here. Try a JPEG, or a screenshot of it.`); }
    const path = `${tripId}/${day}/${crypto.randomUUID()}.jpg`; // grouped by trip in storage
    const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (up.error) throw up.error;
    const ins = await sb.from('photos').insert({ trip: tripId, day, path, caption });
    if (ins.error) { await sb.storage.from('photos').remove([path]); throw ins.error; }
  }

  $('post').addEventListener('submit', async e => {
    e.preventDefault();
    const files = [...$('file').files].slice(0, MAX), day = $('day').value, caption = $('caption').value.trim() || null;
    if (!files.length || !day) return;
    $('postBtn').disabled = true;
    // Posted last-to-first so the first photo (the captioned one) is the newest: it's the one the site shows.
    const order = files.map((f, i) => [f, i]).reverse();
    let done = 0; const failed = [];
    for (const [f, i] of order) {
      status('postStatus', files.length > 1 ? `Uploading ${done + 1} of ${files.length}…` : 'Uploading…');
      try { await postOne(f, day, i === 0 ? caption : null); done++; } catch (err) { failed.push(err.message || String(err)); }
    }
    const where = whereOn(day) || day;
    if (!failed.length) {
      status('postStatus', `✅ Posted ${done > 1 ? done + ' photos' : ''} to ${where}!`.replace('  ', ' '), true);
      $('post').reset(); $('day').value = day; updateWhere(); resetPicker();
    } else {
      status('postStatus', `${done ? `Posted ${done}, but ` : ''}${failed.length} didn't post: ${failed[0]}`);
    }
    $('postBtn').disabled = false;
    loadRecent();
  });

  async function loadRecent() {
    const { data, error } = await sb.from('photos').select('id,day,path,caption').eq('trip', tripId).order('created_at', { ascending: false }).limit(12);
    if (error) { $('recentList').innerHTML = `<li class="up-note">Couldn't load recent photos.</li>`; return; }
    $('recentList').innerHTML = data.length ? data.map(p => `<li>
      <img src="${esc(publicUrl(p.path))}" alt="" loading="lazy">
      <span><b>${esc(new Date(p.day).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }))}</b> · ${esc(whereOn(p.day))}${p.caption ? `<br>${esc(p.caption)}` : ''}</span>
      <button class="btn icon" type="button" data-del="${esc(p.id)}" data-path="${esc(p.path)}" aria-label="Delete this photo">🗑</button></li>`).join('')
      : '<li class="up-note">Nothing yet. Your first postcard goes here.</li>';
  }
  $('recentList').addEventListener('click', async e => {
    const b = e.target.closest('[data-del]');
    if (!b || !confirm('Delete this photo from the site?')) return;
    b.disabled = true;
    const { error } = await sb.from('photos').delete().eq('id', b.dataset.del);
    if (!error) await sb.storage.from('photos').remove([b.dataset.path]);
    loadRecent();
  });
}
