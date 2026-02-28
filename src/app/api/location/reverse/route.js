import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
                headers: {
                    "User-Agent": "HashWorks/1.0 (contact@hashworks.local)",
                },
            }
        );

        const data = await response.json();

        const formatted = {
            display_name: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || data.name,
            country: data.address?.country,
            latitude: data.lat,
            longitude: data.lon,
        };

        return NextResponse.json(formatted);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
