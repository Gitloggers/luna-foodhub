/* ══════════════════════════════════════════════
   LUNA FOODHUB — app.js
   ══════════════════════════════════════════════ */

// Gemini key injected from server at runtime
window.__GEMINI_KEY__ = null;

// ─── Mock Data (Demo Mode) ──────────────────────────────────────────────────
const MOCK_VENUES = [
  { place_id:'m1', name:'Hapag ni Lola', rating:4.9, user_ratings_total:832, price_level:2, vicinity:'Brgy. Batong Malake, Los Baños', types:['restaurant'], emoji:'🍚', open_now:true, tags:['Filipino','Traditional','Comfort Food'], description:'Heritage Filipino cuisine with slow-cooked classics and family recipes passed down for generations.' },
  { place_id:'m2', name:'Tres Marias Café', rating:4.8, user_ratings_total:614, price_level:2, vicinity:'Real St., Los Baños', types:['cafe'], emoji:'☕', open_now:true, tags:['Café','Pastries','Specialty Coffee'], description:'Cozy corner café with artisanal brews, homemade pastries, and a warm ambiance perfect for study or dates.' },
  { place_id:'m3', name:'Isda & Kanin', rating:4.7, user_ratings_total:509, price_level:2, vicinity:'Crossing, Los Baños', types:['restaurant'], emoji:'🐟', open_now:true, tags:['Seafood','Filipino','Grilled'], description:'Fresh seafood straight from Laguna de Bay, grilled to perfection with native spices.' },
  { place_id:'m4', name:'Sweet Tooth PH', rating:4.8, user_ratings_total:417, price_level:1, vicinity:'UPLB Area, Los Baños', types:['dessert'], emoji:'🍰', open_now:true, tags:['Desserts','Cakes','Milkshakes'], description:'Indulgent dessert haven featuring signature cakes, ice cream sundaes, and Instagram-worthy milkshakes.' },
  { place_id:'m5', name:'The Brewhouse LB', rating:4.6, user_ratings_total:388, price_level:3, vicinity:'National Hwy, Los Baños', types:['bar'], emoji:'🍺', open_now:false, tags:['Bar','Craft Beer','Grill'], description:'Laid-back bar featuring local craft beers, smoky BBQ platters, and live music on weekends.' },
  { place_id:'m6', name:'Kafe Batangas', rating:4.8, user_ratings_total:721, price_level:2, vicinity:'JP Rizal Ave, Los Baños', types:['cafe'], emoji:'☕', open_now:true, tags:['Café','Kapeng Barako','Silog'], description:'Authentic Batangas barako coffee paired with hearty silog meals all day long.' },
  { place_id:'m7', name:'Ramen Nakamura', rating:4.7, user_ratings_total:463, price_level:2, vicinity:'Makiling Road, Los Baños', types:['restaurant'], emoji:'🍜', open_now:true, tags:['Japanese','Ramen','Tonkotsu'], description:'Rich tonkotsu and shoyu ramens with hand-pulled noodles and premium toppings.' },
  { place_id:'m8', name:'La Masa Grill', rating:4.6, user_ratings_total:340, price_level:2, vicinity:'Batong Malake, Los Baños', types:['restaurant'], emoji:'🥩', open_now:true, tags:['Grill','Steaks','Filipino BBQ'], description:'Premium grill house serving USDA steaks alongside classic Filipino BBQ favorites.' },
  { place_id:'m9', name:'Panaderya Artisano', rating:4.7, user_ratings_total:292, price_level:1, vicinity:'Real St., Los Baños', types:['bakery'], emoji:'🥐', open_now:true, tags:['Bakery','Bread','Pastries'], description:'Artisan sourdoughs, ensaymadas, and fresh-baked pandesal from a wood-fired oven every morning.' },
  { place_id:'m10', name:'Cloud Nine Café', rating:4.6, user_ratings_total:518, price_level:2, vicinity:'UPLB Gate, Los Baños', types:['cafe'], emoji:'☁️', open_now:true, tags:['Café','Matcha','Brunch'], description:'Aesthetic sky-themed café with matcha lattes, avocado toasts, and dreamy study corners.' },
  { place_id:'m11', name:'Balay Dako', rating:4.9, user_ratings_total:1042, price_level:3, vicinity:'National Hwy, Los Baños', types:['restaurant'], emoji:'🏡', open_now:true, tags:['Filipino','Fine Dining','Heritage'], description:'Elegant ancestral house turned restaurant serving the finest Filipino heirloom dishes.' },
  { place_id:'m12', name:'Sizzle Republic', rating:4.5, user_ratings_total:611, price_level:1, vicinity:'Crossing, Los Baños', types:['fastfood'], emoji:'🍔', open_now:true, tags:['Fast Food','Burgers','Fries'], description:'Smash burgers, loaded fries, and crispy chicken — fast, fresh, and dangerously good.' },
];

const CATEGORY_MAP = {
  all: null,
  restaurant: ['restaurant'],
  cafe: ['cafe','coffee_shop'],
  bar: ['bar','night_club'],
  bakery: ['bakery'],
  dessert: ['dessert'],
  fastfood: ['fastfood','meal_takeaway'],
};

const CATEGORY_EMOJI = {
  restaurant:'🍽️', cafe:'☕', bar:'🍺', bakery:'🥐',
  dessert:'🍰', fastfood:'🍔', default:'🌟'
};

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  demoMode: true,
  venues: [],
  filtered: [],
  activeCategory: 'all',
  userLat: null, userLng: null,
  geminiKey: null,
  aiActive: false,
};

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 120 }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,200,66,${p.opacity})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
}

// ─── Navbar Scroll ────────────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ─── Location Search ──────────────────────────────────────────────────────────
function initLocationSearch() {
  const box = document.getElementById('btn-change-location');
  const dropdown = document.getElementById('location-dropdown');
  const input = document.getElementById('location-search-input');

  box.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    if (dropdown.style.display === 'block') input.focus();
  });

  input.addEventListener('click', e => e.stopPropagation());
  
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const city = input.value.trim();
      if (!city) return;
      
      dropdown.style.display = 'none';
      document.getElementById('location-label').textContent = 'Finding ' + city + '...';
      
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        const d = await r.json();
        if (d && d.length > 0) {
          state.userLat = parseFloat(d[0].lat);
          state.userLng = parseFloat(d[0].lon);
          document.getElementById('location-label').textContent = d[0].display_name.split(',')[0];
          loadVenues();
        } else {
          document.getElementById('location-label').textContent = 'City not found';
        }
      } catch {
        document.getElementById('location-label').textContent = 'Search failed';
      }
    }
  });

  document.addEventListener('click', () => dropdown.style.display = 'none');
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
function detectLocation() {
  const label = document.getElementById('location-label');
  label.textContent = 'Detecting…';
  if (!navigator.geolocation) {
    label.textContent = 'Location unavailable';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async pos => {
      state.userLat = pos.coords.latitude;
      state.userLng = pos.coords.longitude;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${state.userLat}&lon=${state.userLng}&format=json`);
        const d = await r.json();
        const city = d.address.city || d.address.town || d.address.village || d.address.municipality || 'Your area';
        label.textContent = city;
      } catch { label.textContent = 'Location found'; }
      loadVenues();
    },
    () => {
      label.textContent = 'Los Baños, Laguna';
      state.userLat = 14.1667; state.userLng = 121.2417;
      loadVenues();
    },
    { timeout: 8000 }
  );
}

// ─── Load Venues ──────────────────────────────────────────────────────────────
async function loadVenues() {
  showSkeletons();
  try {
    const statusRes = await fetch('/api/status');
    const status = await statusRes.json();
    state.demoMode = status.demoMode;
    if (status.geminiKey) window.__GEMINI_KEY__ = status.geminiKey;

    if (state.demoMode) {
      showDemoBanner();
      state.venues = MOCK_VENUES;
    } else {
      const types = ['restaurant','cafe','bar','bakery'];
      const allResults = [];
      for (const type of types) {
        try {
          const res = await fetch(`/api/places/nearby?lat=${state.userLat}&lng=${state.userLng}&radius=3000&type=${type}`);
          const data = await res.json();
          if (data.results) allResults.push(...data.results);
        } catch {}
      }
      const seen = new Set();
      const getScore = (v) => v.rating * (1 - (1 / (v.user_ratings_total + 1)));
      state.venues = allResults
        .filter(v => { if (seen.has(v.place_id)) return false; seen.add(v.place_id); return true; })
        .sort((a, b) => getScore(b) - getScore(a));
    }
  } catch {
    state.demoMode = true;
    showDemoBanner();
    state.venues = MOCK_VENUES;
  }

  applyFilter();
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function applyFilter() {
  const cat = state.activeCategory;
  if (cat === 'all' || state.aiActive) {
    state.filtered = [...state.venues];
  } else {
    state.filtered = state.venues.filter(v => {
      const types = v.types || [];
      return CATEGORY_MAP[cat]?.some(c => types.includes(c));
    });
  }
  renderVenues();
}

// ─── Render ───────────────────────────────────────────────────────────────────
function showSkeletons() {
  const grid = document.getElementById('venue-grid');
  grid.innerHTML = Array.from({ length: 8 }, () => `
    <div class="skeleton">
      <div class="skeleton-photo"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w60"></div>
        <div class="skeleton-line w40"></div>
      </div>
    </div>`).join('');
}

function renderVenues() {
  const grid = document.getElementById('venue-grid');
  const count = document.getElementById('venue-count');
  const empty = document.getElementById('empty-state');
  const venues = state.filtered;

  count.textContent = `${venues.length} venues`;

  if (!venues.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = venues.map((v, i) => buildCard(v, i)).join('');

  grid.querySelectorAll('.venue-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

function buildCard(v, i) {
  const stars = buildStars(v.rating);
  const priceStr = v.price_level ? '₱'.repeat(v.price_level) : '₱₱';
  const cat = guessCategory(v.types || []);
  const catEmoji = CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.default;
  const openBadge = v.open_now !== undefined
    ? `<span class="card-open ${v.open_now ? 'open' : 'closed'}">${v.open_now ? '● Open' : '● Closed'}</span>`
    : '';
  const tags = (v.tags || []).slice(0,2).map(t => `<span class="craving-chip" style="font-size:0.7rem;padding:3px 10px;pointer-events:none">${t}</span>`).join('');

  let photoHtml = `<div class="card-photo-emoji">${v.emoji || catEmoji}</div>`;
  if (!state.demoMode && v.photos?.[0]) {
    const ref = v.photos[0].photo_reference;
    photoHtml = `<img class="card-photo" src="/api/places/photo?photo_reference=${ref}&maxwidth=600" alt="${v.name}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  return `
    <div class="venue-card" data-id="${v.place_id}" role="listitem" style="animation-delay:${i * 0.05}s">
      <div class="card-photo-wrap">
        ${photoHtml}
        <div class="card-photo-overlay"></div>
        <span class="card-rating-badge">⭐ ${v.rating}</span>
        <span class="card-category-tag">${catEmoji} ${cat}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${v.name}</div>
        <div class="card-address">📍 ${v.vicinity || 'Nearby'}</div>
        <div class="card-meta">
          <div>
            <span class="card-stars">${stars}</span>
            <span class="card-reviews"> (${(v.user_ratings_total || 0).toLocaleString()})</span>
          </div>
          <span class="card-price">${priceStr}</span>
          ${openBadge}
        </div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${tags}</div>
      </div>
    </div>`;
}

function buildStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '★'.repeat(full);
  if (half) s += '½';
  return s;
}

function guessCategory(types) {
  if (types.includes('cafe') || types.includes('coffee_shop')) return 'cafe';
  if (types.includes('bar') || types.includes('night_club')) return 'bar';
  if (types.includes('bakery')) return 'bakery';
  if (types.includes('dessert')) return 'dessert';
  if (types.includes('fastfood') || types.includes('meal_takeaway')) return 'fastfood';
  return 'restaurant';
}

// ─── Modal ────────────────────────────────────────────────────────────────────
async function openModal(id) {
  const venue = state.venues.find(v => v.place_id === id);
  if (!venue) return;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const cat = guessCategory(venue.types || []);
  const catEmoji = CATEGORY_EMOJI[cat] || '🌟';
  const priceStr = venue.price_level ? '₱'.repeat(venue.price_level) : '';

  document.getElementById('modal-venue-name').textContent = venue.name;
  document.getElementById('modal-address').textContent = '📍 ' + (venue.vicinity || 'Nearby');
  document.getElementById('modal-rating-badge').textContent = `⭐ ${venue.rating} (${(venue.user_ratings_total||0).toLocaleString()} reviews)`;
  document.getElementById('modal-category-badge').textContent = `${catEmoji} ${cat}`;

  // Photo
  const photo = document.getElementById('modal-photo');
  if (!state.demoMode && venue.photos?.[0]) {
    photo.src = `/api/places/photo?photo_reference=${venue.photos[0].photo_reference}&maxwidth=800`;
    photo.alt = venue.name;
    photo.style.display = 'block';
  } else {
    photo.style.display = 'none';
    photo.parentElement.style.background = `linear-gradient(135deg,#141c30,#0f1525)`;
    photo.parentElement.querySelector('.modal-photo-overlay').innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:5rem;opacity:0.4">${venue.emoji || catEmoji}</div>`;
  }

  // Phone
  const phoneEl = document.getElementById('modal-phone');
  if (phoneEl) {
    phoneEl.textContent = venue.phone || '';
    phoneEl.style.display = venue.phone ? 'flex' : 'none';
  }

  // Description
  const descEl = document.getElementById('modal-description');
  if (descEl) {
    descEl.textContent = venue.description || '';
    descEl.style.display = venue.description ? 'block' : 'none';
  }

  // Meta
  const metaEl = document.getElementById('modal-meta');
  metaEl.innerHTML = [
    priceStr ? `<span class="modal-meta-item">💰 ${priceStr}</span>` : '',
    venue.open_now !== undefined ? `<span class="modal-meta-item ${venue.open_now ? '' : 'closed'}">${venue.open_now ? '🟢 Open Now' : '🔴 Closed'}</span>` : '',
    ...(venue.tags || []).map(t => `<span class="modal-meta-item">${t}</span>`),
  ].join('');

  // Hours
  const hoursEl = document.getElementById('modal-hours');
  hoursEl.innerHTML = '';

  // Actions
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}&query_place_id=${venue.place_id}`;
  document.getElementById('modal-actions').innerHTML = `
    <a class="btn-modal-action btn-modal-primary" href="${mapUrl}" target="_blank" rel="noopener">🗺️ Open in Maps</a>
    <button class="btn-modal-action btn-modal-secondary" onclick="shareVenue('${venue.name}','${mapUrl}')">📤 Share</button>`;

  // Reviews (demo)
  const reviewsEl = document.getElementById('modal-reviews');
  if (state.demoMode && venue.tags) {
    reviewsEl.innerHTML = `<div class="review-title">What people say</div>
      <div class="review-item"><div class="review-author">Maria S.</div><div class="review-stars">★★★★★</div><div class="review-text">Absolutely love this place! The food is authentic and the staff are so friendly. A must-visit!</div></div>
      <div class="review-item"><div class="review-author">Juan P.</div><div class="review-stars">★★★★☆</div><div class="review-text">Great food, great ambiance. Will definitely come back with the whole family.</div></div>`;
  } else {
    reviewsEl.innerHTML = '';
  }

  // Fetch live details
  if (!state.demoMode) {
    try {
      const res = await fetch(`/api/places/details?place_id=${id}`);
      const data = await res.json();
      const r = data.result;
      if (r?.opening_hours?.weekday_text) {
        hoursEl.innerHTML = `<div class="modal-hours-title">🕐 Hours</div><ul class="modal-hours-list">${r.opening_hours.weekday_text.map(d=>`<li>${d}</li>`).join('')}</ul>`;
      }
      if (r?.reviews?.length) {
        reviewsEl.innerHTML = `<div class="review-title">Top Reviews</div>` + r.reviews.slice(0,3).map(rv=>`
          <div class="review-item">
            <div class="review-author">${rv.author_name}</div>
            <div class="review-stars">${'★'.repeat(rv.rating)}</div>
            <div class="review-text">${rv.text}</div>
          </div>`).join('');
      }
      if (r?.website) {
        document.getElementById('modal-actions').innerHTML += `<a class="btn-modal-action btn-modal-secondary" href="${r.website}" target="_blank" rel="noopener">🍴 Website / Menu</a>`;
      }
      if (r?.formatted_phone_number && phoneEl) {
        phoneEl.textContent = r.formatted_phone_number;
        phoneEl.style.display = 'flex';
      }
      if (r?.editorial_summary && descEl) {
        descEl.textContent = r.editorial_summary;
        descEl.style.display = 'block';
      }
    } catch {}
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function shareVenue(name, url) {
  if (navigator.share) {
    navigator.share({ title: name, url });
  } else {
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  }
}

// ─── Demo Banner ──────────────────────────────────────────────────────────────
function showDemoBanner() {
  document.getElementById('demo-banner').classList.add('show');
}

// ─── Setup Modal ──────────────────────────────────────────────────────────────
function openSetupModal() {
  document.getElementById('setup-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSetupModal() {
  document.getElementById('setup-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Typing Placeholder ───────────────────────────────────────────────────────
function initTypingPlaceholder() {
  const input = document.getElementById('craving-input');
  const phrases = [
    'I\'m craving something spicy and cozy…',
    'Show me the best cafes nearby…',
    'I want authentic Filipino comfort food…',
    'Find me a romantic dinner spot…',
    'Something sweet and indulgent tonight…',
  ];
  let i = 0, j = 0, deleting = false;
  function type() {
    const phrase = phrases[i];
    if (!document.activeElement.isSameNode(input)) {
      input.placeholder = deleting
        ? phrase.slice(0, j--)
        : phrase.slice(0, j++);
      if (!deleting && j > phrase.length) { deleting = true; setTimeout(type, 1800); return; }
      if (deleting && j < 0) { deleting = false; i = (i+1) % phrases.length; j = 0; }
    }
    setTimeout(type, deleting ? 40 : 80);
  }
  type();
}

// ─── AI Craving (Gemini) ──────────────────────────────────────────────────────
async function handleCraving() {
  const input = document.getElementById('craving-input');
  const query = input.value.trim();
  if (!query) return;

  const btn = document.getElementById('btn-ask-luna');
  btn.classList.add('loading');

  const GEMINI_KEY = window.__GEMINI_KEY__;
  if (!GEMINI_KEY) {
    showAIBanner(`🔑 Add your Gemini API key to enable AI recommendations. Click "Setup Guide" in the demo banner.`);
    btn.classList.remove('loading');
    return;
  }

  try {
    const prompt = `You are LUNA, an AI food discovery assistant. A user said: "${query}"
Analyze this craving and respond with a JSON object (no markdown, just raw JSON):
{
  "summary": "one short sentence explaining what you found for them",
  "searchQuery": "A concise search query to send to Google Maps to find exactly this food (e.g. 'ramen', 'sweet desserts', 'cozy cafe', 'spicy seafood')",
  "categories": ["restaurant"|"cafe"|"bar"|"bakery"|"dessert"|"fastfood"]
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const json = JSON.parse(raw.replace(/```json|```/g, '').trim());

    showAIBanner(`✨ ${json.summary}`);
    state.aiActive = true;

    // Fetch new highly specific venues from Google Places based on AI's query
    if (json.searchQuery && !state.demoMode) {
      document.getElementById('venue-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">Searching the area...</div>';
      try {
        const searchRes = await fetch(`/api/places/search?lat=${state.userLat}&lng=${state.userLng}&q=${encodeURIComponent(json.searchQuery)}`);
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          state.filtered = searchData.results;
          // Merge AI results into venues so the modal can find them
          const newVenues = searchData.results.filter(rv => !state.venues.some(v => v.place_id === rv.place_id));
          state.venues.push(...newVenues);
        } else {
          state.filtered = [];
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Fallback to local filter if in demo mode
      const kws = [...(json.categories||[])].map(k => k.toLowerCase());
      if (kws.length) {
        state.filtered = state.venues.filter(v => {
          const haystack = [v.name, ...(v.tags||[]), ...(v.types||[]), v.description||''].join(' ').toLowerCase();
          return kws.some(k => haystack.includes(k));
        });
      }
    }

    document.getElementById('section-title').textContent = `LUNA found for you`;
    renderVenues();
    document.getElementById('main-content').scrollIntoView({ behavior:'smooth' });

  } catch (e) {
    showAIBanner('Hmm, I had trouble connecting to AI. Showing top-rated spots instead!');
    state.filtered = [...state.venues];
    renderVenues();
  }

  btn.classList.remove('loading');
}

function showAIBanner(text) {
  const banner = document.getElementById('ai-banner');
  document.getElementById('ai-banner-text').textContent = text;
  banner.style.display = 'block';
}

function clearAI() {
  state.aiActive = false;
  document.getElementById('ai-banner').style.display = 'none';
  document.getElementById('section-title').textContent = 'Top Rated Near You';
  applyFilter();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  initParticles();
  initNavbar();
  initTypingPlaceholder();
  initLocationSearch();
  detectLocation();

  // Filter chips
  document.getElementById('filter-chips').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeCategory = chip.dataset.category;
    state.aiActive = false;
    document.getElementById('ai-banner').style.display = 'none';
    document.getElementById('section-title').textContent = 'Top Rated Near You';
    applyFilter();
  });

  // Craving chips
  document.querySelectorAll('.craving-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('craving-input').value = chip.dataset.craving || chip.textContent.replace(/^[^ ]+ /,'');
      handleCraving();
    });
  });

  // Ask LUNA button
  document.getElementById('btn-ask-luna').addEventListener('click', handleCraving);
  document.getElementById('craving-input').addEventListener('keydown', e => { if (e.key === 'Enter') handleCraving(); });

  // Locate me
  document.getElementById('btn-detect-location').addEventListener('click', detectLocation);

  // Refresh
  document.getElementById('btn-refresh').addEventListener('click', loadVenues);

  // Clear AI
  document.getElementById('btn-clear-ai').addEventListener('click', clearAI);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('setup-modal-close').addEventListener('click', closeSetupModal);
  document.getElementById('setup-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeSetupModal(); });

  // Demo banner
  document.getElementById('demo-banner-close').addEventListener('click', () => {
    document.getElementById('demo-banner').classList.remove('show');
  });
  document.getElementById('demo-setup-link').addEventListener('click', e => { e.preventDefault(); openSetupModal(); });

  // Keyboard
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeSetupModal(); } });
}

document.addEventListener('DOMContentLoaded', init);
