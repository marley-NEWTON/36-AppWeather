/**
 * SKYVAULT — Weather Dashboard
 * script.js
 *
 * HOW TO GET YOUR API KEY:
 * ─────────────────────────────────────────────────────────────
 *  1. Visit https://openweathermap.org/api
 *  2. Click "Sign Up" and create a free account
 *  3. After logging in, go to: Profile → My API Keys
 *  4. Copy your key (or generate a new one)
 *  5. Paste it below where it says: YOUR_API_KEY_HERE
 * ─────────────────────────────────────────────────────────────
 * The free tier includes:
 *   • Current Weather Data  ✓
 *   • 1,000,000 calls/month ✓
 *   • No credit card needed ✓
 *
 * HOW TO RUN LOCALLY:
 * ─────────────────────────────────────────────────────────────
 *  1. Paste your API key below
 *  2. Open index.html directly in a browser  — OR —
 *     Run a local server: `npx serve .`  (requires Node.js)
 *  3. Allow location permission for auto-detection
 * ─────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════════════
   ▶▶  PASTE YOUR API KEY HERE  ◀◀
   ══════════════════════════════════════════════════════════════ */
const API_KEY = '9e8e5b82f15e967f49cb8c7e04e65fd0';
/* ═════════════════════════════════════════════════════════════ */

const DEFAULT_CITY   = 'Nairobi';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// ── State ─────────────────────────────────────────────────────
let currentTempC = 0;   // cached °C value for unit toggle
let currentUnit  = 'C'; // 'C' or 'F'

// ── DOM References ────────────────────────────────────────────
const cityInput     = document.getElementById('city-input');
const searchBtn     = document.getElementById('search-btn');
const loader        = document.getElementById('loader');
const errorCard     = document.getElementById('error-card');
const errorMsg      = document.getElementById('error-msg');
const errorRetry    = document.getElementById('error-retry');
const dashboard     = document.getElementById('dashboard');
const searchHint    = document.getElementById('search-hint');
const headerTime    = document.getElementById('header-time');
const particles     = document.getElementById('particles');

// ── Clock ──────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  headerTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

// ── Emoji icons mapped to OWM condition codes ─────────────────
function getWeatherEmoji(code, isNight) {
  if (isNight) return '🌙';
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code === 701 || code === 711 || code === 721) return '🌫️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800)               return '☀️';
  if (code === 801)               return '🌤️';
  if (code === 802)               return '⛅';
  if (code >= 803)                return '☁️';
  return '🌡️';
}

// ── Theme mapping ──────────────────────────────────────────────
function getTheme(code, isNight) {
  if (isNight)                    return 'theme-night';
  if (code >= 200 && code < 300) return 'theme-thunderstorm';
  if (code >= 300 && code < 600) return 'theme-rainy';
  if (code >= 600 && code < 700) return 'theme-snow';
  if (code >= 700 && code < 800) return 'theme-mist';
  if (code === 800)               return 'theme-sunny';
  if (code >= 801 && code <= 802) return 'theme-cloudy';
  if (code > 802)                 return 'theme-cloudy';
  return 'theme-default';
}

// ── Apply theme + particles ────────────────────────────────────
function applyTheme(code, isNight) {
  const body  = document.body;
  const theme = getTheme(code, isNight);

  // Remove all theme-* classes, keep others
  [...body.classList]
    .filter(c => c.startsWith('theme-'))
    .forEach(c => body.classList.remove(c));
  body.classList.add(theme);

  // Clear old particles
  particles.innerHTML = '';

  if (code >= 500 && code < 600 && !isNight) addRain(60);
  else if (code >= 200 && code < 300)        addRain(80);
  else if (code >= 600 && code < 700)        addSnow(40);
  else if (code >= 200 && code < 300)        addLightning();
}

function addRain(count) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'rain-drop';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      height: ${Math.random() * 60 + 40}px;
      opacity: ${Math.random() * 0.4 + 0.2};
      animation-duration: ${Math.random() * 0.6 + 0.5}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    particles.appendChild(el);
  }
}

function addSnow(count) {
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 5 + 3;
    const el = document.createElement('div');
    el.className = 'snow-flake';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px; height: ${size}px;
      animation-duration: ${Math.random() * 4 + 5}s;
      animation-delay: ${Math.random() * 6}s;
      opacity: ${Math.random() * 0.5 + 0.3};
    `;
    particles.appendChild(el);
  }
}

function addLightning() {
  const el = document.createElement('div');
  el.className = 'lightning-overlay';
  particles.appendChild(el);
}

// ── Helpers ────────────────────────────────────────────────────
function formatTime(unixSec, offsetSec) {
  const ms    = (unixSec + offsetSec) * 1000;
  const d     = new Date(ms);
  const hh    = d.getUTCHours().toString().padStart(2, '0');
  const mm    = d.getUTCMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function isNightTime(dt, sunrise, sunset) {
  return dt < sunrise || dt > sunset;
}

function degToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function uvCategory(idx) {
  if (idx <= 2)  return { label: 'Low',       pct: idx / 11 * 100 };
  if (idx <= 5)  return { label: 'Moderate',  pct: idx / 11 * 100 };
  if (idx <= 7)  return { label: 'High',      pct: idx / 11 * 100 };
  if (idx <= 10) return { label: 'Very High', pct: idx / 11 * 100 };
  return               { label: 'Extreme',   pct: 100 };
}

function toF(c) { return Math.round(c * 9 / 5 + 32); }

// ── UI State helpers ───────────────────────────────────────────
function showLoader()    { loader.classList.add('visible'); errorCard.classList.remove('visible'); dashboard.classList.remove('visible'); }
function hideLoader()    { loader.classList.remove('visible'); }
function showError(msg)  { errorMsg.textContent = msg; errorCard.classList.add('visible'); dashboard.classList.remove('visible'); }
function showDashboard() { dashboard.classList.add('visible'); }

// ── Populate dashboard ─────────────────────────────────────────
function populateDashboard(data) {
  const { name, sys, main, weather, wind, visibility, clouds, dt, timezone } = data;
  const cond  = weather[0];
  const night = isNightTime(dt, sys.sunrise, sys.sunset);

  // Cache raw °C for unit toggle
  currentTempC = Math.round(main.temp);

  // Theme & particles
  applyTheme(cond.id, night);

  // ── Location & Date ──
  const localMs = (dt + timezone) * 1000;
  const localDate = new Date(localMs);
  const dateStr = localDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
  });

  setText('city-name',    name.toUpperCase());
  setText('country-name', sys.country);
  setText('date-label',   dateStr);

  // ── Icon & Condition ──
  document.getElementById('weather-icon').textContent = getWeatherEmoji(cond.id, night);
  setText('condition-label', cond.description);

  // ── Temperature ──
  renderTemp();

  const feelC = Math.round(main.feels_like);
  const maxC  = Math.round(main.temp_max);
  const minC  = Math.round(main.temp_min);
  setText('feels-like', `Feels like ${currentUnit === 'C' ? feelC + '°C' : toF(feelC) + '°F'}`);
  setText('temp-range', `H: ${currentUnit === 'C' ? maxC + '°C' : toF(maxC) + '°F'} · L: ${currentUnit === 'C' ? minC + '°C' : toF(minC) + '°F'}`);

  // ── Stats ──
  const hum = main.humidity;
  setText('humidity-val', `${hum}%`);
  document.getElementById('humidity-bar').style.width = `${hum}%`;

  const spd = (wind.speed * 3.6).toFixed(1); // m/s → km/h
  setText('wind-val', `${spd} km/h`);
  setText('wind-dir', `Direction: ${degToCompass(wind.deg || 0)}`);

  setText('pressure-val', `${main.pressure} hPa`);
  const trend = main.pressure > 1013 ? '↑ High pressure' : main.pressure < 1000 ? '↓ Low pressure' : '→ Normal';
  setText('pressure-trend', trend);

  const vis = visibility ? (visibility / 1000).toFixed(1) : '—';
  setText('visibility-val', `${vis} km`);

  // ── Sun ──
  setText('sunrise-val', formatTime(sys.sunrise, timezone));
  setText('sunset-val',  formatTime(sys.sunset,  timezone));

  // ── UV (OWM free tier doesn't include UV in /weather — we estimate) ──
  const uvEst = estimateUV(cond.id, night);
  const uvInfo = uvCategory(uvEst);
  setText('uv-val',   uvEst);
  setText('uv-label', uvInfo.label);
  document.getElementById('uv-fill').style.left = `${Math.min(uvInfo.pct, 98)}%`;

  // ── Cloudiness ──
  const cc = clouds?.all ?? 0;
  setText('cloud-val', `${cc}%`);
  document.getElementById('cloud-visual').textContent = buildCloudVisual(cc);

  // ── Last updated ──
  const now = new Date();
  setText('updated-at', `Last updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderTemp() {
  const display = currentUnit === 'C' ? currentTempC + '°' : toF(currentTempC) + '°';
  setText('temp-value', display);
}

// Rough UV estimate from weather code (since free OWM tier omits UV)
function estimateUV(code, isNight) {
  if (isNight)              return 0;
  if (code === 800)         return 8;
  if (code === 801)         return 6;
  if (code === 802)         return 4;
  if (code >= 803)          return 2;
  if (code >= 300 && code < 700) return 1;
  return 5;
}

function buildCloudVisual(pct) {
  const count = Math.round(pct / 25);
  return '☁️'.repeat(count) || '✨';
}

// ── Fetch weather ──────────────────────────────────────────────
async function fetchWeather(query) {
  // query: { city: 'London' }  OR  { lat: 51.5, lon: -0.1 }

  // Guard: API key not set
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    hideLoader();
    showError('⚠️ API key missing! Open script.js and add your OpenWeatherMap API key at the top of the file.');
    return;
  }

  showLoader();

  try {
    let url;
    if (query.city) {
      url = `${BASE_URL}?q=${encodeURIComponent(query.city)}&appid=${API_KEY}&units=metric`;
    } else {
      url = `${BASE_URL}?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=metric`;
    }

    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(res.status === 404
        ? `City "${query.city || 'location'}" not found. Try a different search.`
        : `API error ${res.status}: ${err.message || 'Unknown error'}`
      );
    }

    const data = await res.json();

    // Persist last searched city name
    if (query.city) localStorage.setItem('sv_last_city', query.city);

    hideLoader();
    populateDashboard(data);
    showDashboard();

    // Update hint
    searchHint.textContent = `Showing weather for ${data.name}, ${data.sys.country} · Press Enter to search`;

  } catch (err) {
    hideLoader();
    showError(err.message || 'Failed to fetch weather. Check your connection.');
    console.error('[SKYVAULT]', err);
  }
}

// ── Geolocation ────────────────────────────────────────────────
function detectLocation() {
  if (!navigator.geolocation) {
    // Browser doesn't support geolocation — fall back
    fetchWeather({ city: DEFAULT_CITY });
    return;
  }

  showLoader();
  searchHint.textContent = 'Detecting your location…';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    (err) => {
      // Permission denied or unavailable — graceful fallback
      console.warn('[SKYVAULT] Geolocation denied:', err.message);
      searchHint.textContent = `Location denied — showing ${DEFAULT_CITY}`;
      fetchWeather({ city: DEFAULT_CITY });
    },
    { timeout: 8000 }
  );
}

// ── Event Listeners ────────────────────────────────────────────
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather({ city });
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchWeather({ city });
  }
});

// Restore last city input (but don't auto-fetch — let geolocation run first)
const lastCity = localStorage.getItem('sv_last_city');
if (lastCity) cityInput.value = lastCity;

// Unit toggle buttons
document.getElementById('btn-c').addEventListener('click', () => {
  currentUnit = 'C';
  document.getElementById('btn-c').classList.add('active');
  document.getElementById('btn-f').classList.remove('active');
  renderTemp();
  updateFeelsRange();
});

document.getElementById('btn-f').addEventListener('click', () => {
  currentUnit = 'F';
  document.getElementById('btn-f').classList.add('active');
  document.getElementById('btn-c').classList.remove('active');
  renderTemp();
  updateFeelsRange();
});

function updateFeelsRange() {
  // We can't re-read feels/max/min from DOM easily, so just re-trigger a gentle re-fetch isn't needed.
  // Instead we stored raw values in a closure above in populateDashboard — for simplicity we'll parse the
  // existing text values from the DOM.
  const feelsEl = document.getElementById('feels-like');
  const rangeEl = document.getElementById('temp-range');
  // The feels/range update is already handled each time populateDashboard runs.
  // For the toggle, we read the last raw API data stored in `lastData`.
  if (lastData) populateDashboard(lastData);
}

// Retry button
errorRetry.addEventListener('click', () => {
  errorCard.classList.remove('visible');
  const city = cityInput.value.trim() || lastCity || DEFAULT_CITY;
  fetchWeather({ city });
});

// ── Persist last API data for unit toggle ──────────────────────
let lastData = null;
const _origPopulate = populateDashboard;

// Wrap populateDashboard to cache the raw data
window.populateDashboard = function(data) {
  lastData = data;
  _origPopulate(data);
};

// ── Init ───────────────────────────────────────────────────────
detectLocation();
