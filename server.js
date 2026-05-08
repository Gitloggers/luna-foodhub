require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const hasPlaces = !!PLACES_KEY && PLACES_KEY !== 'your_google_places_api_key_here';
  const hasGemini = !!GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here';
  res.json({
    status: 'ok',
    hasPlacesKey: hasPlaces,
    demoMode: !hasPlaces,
    geminiKey: hasGemini ? GEMINI_KEY : null,
  });
});

// ─── Nearby Search (Places API New) ─────────────────────────────────────────
app.get('/api/places/nearby', async (req, res) => {
  if (!PLACES_KEY || PLACES_KEY === 'your_google_places_api_key_here') {
    return res.status(503).json({ error: 'no_key', message: 'No API key configured' });
  }

  const { lat, lng, radius = 3000, type = 'restaurant' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'Missing lat/lng parameters' });

  try {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const typeMapping = { 'restaurant': 'restaurant', 'cafe': 'cafe', 'bar': 'bar', 'bakery': 'bakery' };
    
    const body = {
      includedTypes: [typeMapping[type] || 'restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          radius: parseFloat(radius)
        }
      }
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.primaryType,places.shortFormattedAddress,places.photos,places.regularOpeningHours'
    };

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json();

    if (data.error) {
      console.error('Places API error:', data.error.status, data.error.message);
      return res.status(500).json({ error: data.error.status, message: data.error.message });
    }

    // Map new API format to old API format for frontend compatibility
    const results = (data.places || []).map(p => {
      const priceMap = { 'PRICE_LEVEL_INEXPENSIVE': 1, 'PRICE_LEVEL_MODERATE': 2, 'PRICE_LEVEL_EXPENSIVE': 3, 'PRICE_LEVEL_VERY_EXPENSIVE': 4 };
      let photo_reference = null;
      if (p.photos && p.photos.length > 0) photo_reference = p.photos[0].name; // e.g. places/123/photos/456
      
      return {
        place_id: p.id,
        name: p.displayName ? p.displayName.text : '',
        rating: p.rating || 0,
        user_ratings_total: p.userRatingCount || 0,
        price_level: priceMap[p.priceLevel] || 0,
        types: p.primaryType ? [p.primaryType] : [],
        vicinity: p.shortFormattedAddress || '',
        photos: photo_reference ? [{ photo_reference }] : [],
        open_now: p.regularOpeningHours ? p.regularOpeningHours.openNow : undefined
      };
    });

    const filtered = results.filter(p => p.rating >= 4.0).sort((a, b) => b.rating - a.rating);
    res.json({ results: filtered, status: 'OK' });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ─── Text Search (For AI Cravings) ──────────────────────────────────────────
app.get('/api/places/search', async (req, res) => {
  if (!PLACES_KEY || PLACES_KEY === 'your_google_places_api_key_here') return res.status(503).json({ error: 'no_key' });

  const { lat, lng, q, radius = 3000 } = req.query;
  if (!lat || !lng || !q) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const body = {
      textQuery: q,
      locationBias: {
        circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) }
      },
      maxResultCount: 15
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.primaryType,places.shortFormattedAddress,places.photos,places.regularOpeningHours,places.nationalPhoneNumber'
    };

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    const results = (data.places || []).map(p => {
      const priceMap = { 'PRICE_LEVEL_INEXPENSIVE': 1, 'PRICE_LEVEL_MODERATE': 2, 'PRICE_LEVEL_EXPENSIVE': 3, 'PRICE_LEVEL_VERY_EXPENSIVE': 4 };
      let photo_reference = null;
      if (p.photos && p.photos.length > 0) photo_reference = p.photos[0].name;
      
      return {
        place_id: p.id,
        name: p.displayName ? p.displayName.text : '',
        rating: p.rating || 0,
        user_ratings_total: p.userRatingCount || 0,
        price_level: priceMap[p.priceLevel] || 0,
        types: p.primaryType ? [p.primaryType] : [],
        vicinity: p.shortFormattedAddress || '',
        photos: photo_reference ? [{ photo_reference }] : [],
        open_now: p.regularOpeningHours ? p.regularOpeningHours.openNow : undefined,
        phone: p.nationalPhoneNumber || ''
      };
    });

    // Better sorting: rating first, then number of reviews as tie-breaker
    const filtered = results.filter(p => p.rating >= 3.5).sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.user_ratings_total - a.user_ratings_total;
    });
    res.json({ results: filtered, status: 'OK' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Place Details (Places API New) ───────────────────────────────────────────
app.get('/api/places/details', async (req, res) => {
  if (!PLACES_KEY || PLACES_KEY === 'your_google_places_api_key_here') return res.status(503).json({ error: 'no_key' });

  const { place_id } = req.query;
  if (!place_id) return res.status(400).json({ error: 'Missing place_id' });

  try {
    const url = `https://places.googleapis.com/v1/places/${place_id}`;
    const headers = {
      'X-Goog-Api-Key': PLACES_KEY,
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,regularOpeningHours,websiteUri,reviews,nationalPhoneNumber,editorialSummary'
    };
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // Map to legacy format
    const legacyResult = {
      opening_hours: { weekday_text: data.regularOpeningHours ? data.regularOpeningHours.weekdayDescriptions : [] },
      website: data.websiteUri || '',
      formatted_phone_number: data.nationalPhoneNumber || '',
      editorial_summary: data.editorialSummary ? data.editorialSummary.text : '',
      reviews: (data.reviews || []).map(r => ({
        author_name: r.authorAttribution ? r.authorAttribution.displayName : 'Anonymous',
        rating: r.rating || 0,
        text: r.text ? r.text.text : '',
        time_description: r.relativePublishTimeDescription || ''
      }))
    };
    res.json({ result: legacyResult, status: 'OK' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Place Photo (Places API New) ─────────────────────────────────────────────
app.get('/api/places/photo', async (req, res) => {
  if (!PLACES_KEY || PLACES_KEY === 'your_google_places_api_key_here') return res.status(503).json({ error: 'no_key' });

  const { photo_reference, maxwidth = 800 } = req.query;
  if (!photo_reference) return res.status(400).json({ error: 'Missing photo_reference' });

  try {
    let url;
    if (photo_reference.startsWith('places/')) {
       url = `https://places.googleapis.com/v1/${photo_reference}/media?maxWidthPx=${maxwidth}&key=${PLACES_KEY}`;
    } else {
       url = `${PLACES_BASE}/photo?maxwidth=${maxwidth}&photo_reference=${photo_reference}&key=${PLACES_KEY}`;
    }
    const response = await fetch(url);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    response.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Catch-all → serve index.html ───────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    const hasKey = PLACES_KEY && PLACES_KEY !== 'your_google_places_api_key_here';
    console.log(`\n🌙 LUNA Foodhub running at http://localhost:${PORT}`);
    console.log(`📡 Mode: ${hasKey ? '🟢 Live (Google Places connected)' : '🟡 Demo (no API key)'}`);
    console.log(`\nTo enable live data, add your keys to the .env file.\n`);
  });
}
