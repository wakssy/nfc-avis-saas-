const PLACE_ID_PATTERN = /ChIJ[a-zA-Z0-9_-]{10,}/;

function extractPlaceIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const placeidParam = parsed.searchParams.get('placeid') || parsed.searchParams.get('place_id');
    if (placeidParam) return placeidParam;
  } catch {
    // pas une URL valide, on continue avec la recherche par motif
  }

  const match = url.match(PLACE_ID_PATTERN);
  return match ? match[0] : null;
}

async function findPlaceIdByText(query) {
  if (!process.env.GOOGLE_PLACES_API_KEY) return null;

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!res.ok) {
    console.error('Text Search échoué:', res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data.places?.[0]?.id || null;
}

async function resolvePlaceId(lienGoogleAvis, nom) {
  const fromUrl = extractPlaceIdFromUrl(lienGoogleAvis);
  if (fromUrl) return fromUrl;

  try {
    return await findPlaceIdByText(nom);
  } catch (err) {
    console.error('Échec de la recherche automatique de place_id:', err);
    return null;
  }
}

async function getPlaceDetails(placeId) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Places API a répondu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    rating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? null,
  };
}

async function getPlaceReviews(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'reviews',
    },
  });

  if (!res.ok) {
    throw new Error(`Places API a répondu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const reviews = data.reviews || [];

  return reviews.map((r) => ({
    auteur: r.authorAttribution?.displayName || 'Client Google',
    note: r.rating,
    texte: r.originalText?.text || r.text?.text || null,
    dateAvis: r.publishTime,
  }));
}

const RAYON_RECHERCHE_CONCURRENTS_METRES = 1500;
const TYPES_GENERIQUES = ['point_of_interest', 'establishment', 'food', 'store'];

async function getPlaceLocationAndType(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'location,primaryType,types',
    },
  });

  if (!res.ok) {
    throw new Error(`Places API a répondu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const type = data.primaryType || (data.types || []).find((t) => !TYPES_GENERIQUES.includes(t)) || null;

  return {
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
    type,
  };
}

async function searchNearbyCompetitors({ lat, lng, type, excludePlaceId, radius = RAYON_RECHERCHE_CONCURRENTS_METRES }) {
  const body = {
    maxResultCount: 20,
    locationRestriction: {
      circle: { center: { latitude: lat, longitude: lng }, radius },
    },
  };
  if (type) body.includedTypes = [type];

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.userRatingCount',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Nearby Search a répondu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const places = data.places || [];

  return places
    .filter((p) => p.id !== excludePlaceId)
    .map((p) => ({
      placeId: p.id,
      nom: p.displayName?.text || 'Établissement',
      userRatingCount: p.userRatingCount ?? 0,
    }))
    .sort((a, b) => b.userRatingCount - a.userRatingCount)
    .slice(0, 3);
}

module.exports = {
  extractPlaceIdFromUrl,
  findPlaceIdByText,
  resolvePlaceId,
  getPlaceDetails,
  getPlaceReviews,
  getPlaceLocationAndType,
  searchNearbyCompetitors,
};
