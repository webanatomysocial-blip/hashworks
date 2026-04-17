/**
 * Parses a Nominatim address object into a clean { neighbourhood, suburb, city } structure.
 * Handles edge cases like HITEC City being tagged as a 'quarter' or 'suburb'.
 */
export function parseNominatimAddress(addr = {}) {
    const neighbourhood =
        addr.neighbourhood ||
        addr.quarter ||
        addr.hamlet ||
        '';

    const suburb =
        addr.suburb ||
        addr.residential ||
        addr.commercial ||
        addr.industrial ||
        '';

    const city =
        addr.city ||
        addr.town ||
        addr.county ||     // fallback: some Indian cities appear as county
        addr.village ||
        '';

    const country = addr.country || '';

    return { neighbourhood, suburb, city, country };
}

/**
 * Returns a human-readable, hierarchical location string.
 * Format: "Neighbourhood, Suburb, City" — omitting empty parts.
 *
 * Examples:
 *   HITEC City → "HITEC City, Madhapur, Hyderabad"
 *   Generic suburb → "Banjara Hills, Hyderabad"
 *   Just city → "Bangalore"
 */
export function formatLocation({ neighbourhood, suburb, city } = {}) {
    const parts = [neighbourhood, suburb, city].filter(Boolean);
    return parts.join(', ') || 'Location not set';
}

/**
 * Returns a short display label for cards and filters.
 * Format: "Subcity • City" – uses the most specific sub-area + the main city.
 *
 * Example: "HITEC City • Hyderabad"
 */
export function formatLocationShort({ neighbourhood, suburb, city } = {}) {
    const subcityPart = neighbourhood || suburb || '';
    if (subcityPart && city) return `${subcityPart} • ${city}`;
    if (city) return city;
    return 'Location not set';
}

export function buildLocationPayload(addr = {}, lat, lon, source = 'gps') {
    const { neighbourhood, suburb, city, country } = parseNominatimAddress(addr);
    return {
        subcity: [neighbourhood, suburb].filter(Boolean).join(', '),
        city,
        country,
        latitude: lat,
        longitude: lon,
        location_source: source,
    };
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number|null} Distance in kilometers rounded to 2 decimal places, or null if invalid
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
        return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Number(distance.toFixed(2));
}
