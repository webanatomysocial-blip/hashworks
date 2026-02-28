import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
            {
                headers: {
                    "User-Agent": "HashWorks/1.0 (contact@hashworks.local)",
                },
            }
        );

        const data = await response.json();

        const formatted = data.map((place) => ({
            display_name: place.display_name,
            city: place.address?.city || place.address?.town || place.address?.village || place.name,
            country: place.address?.country,
            latitude: place.lat,
            longitude: place.lon,
        }));

        return NextResponse.json(formatted);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
