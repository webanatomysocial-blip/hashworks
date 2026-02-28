import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        // 1. Get Client IP
        let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');

        // Handle comma separated IPs
        if (ip && ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        // Detect if we are on localhost/private network
        const isLocal = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');

        // 2. Geolocate IP via ipapi.co
        // If IP is local, ipapi.co/json/ will use the server's IP if deployed, or fail on localhost.
        // We'll use a public IP lookup as a fallback for local dev.
        let apiUrl = `https://ipapi.co/json/`;

        if (!isLocal && ip) {
            apiUrl = `https://ipapi.co/${ip}/json/`;
        }

        console.log('Detecting location. Remote IP:', ip, 'Target URL:', apiUrl);
        const geoRes = await fetch(apiUrl, { cache: 'no-store' });
        const geoData = await geoRes.json();

        if (geoData.error) {
            console.error('IPAPI Error:', geoData);
            // Fallback for local development: try to get the public IP of the network first
            if (isLocal) {
                const publicIpRes = await fetch('https://api.ipify.org?format=json');
                const { ip: publicIp } = await publicIpRes.json();
                const fallbackRes = await fetch(`https://ipapi.co/${publicIp}/json/`);
                const fallbackData = await fallbackRes.json();
                if (!fallbackData.error) {
                    return handleGeoData(fallbackData);
                }
            }
            return NextResponse.json({ error: geoData.reason || 'IP Geolocation failed' }, { status: 400 });
        }

        return handleGeoData(geoData);

    } catch (error) {
        console.error('IP Location API Fatal Error:', error);
        return NextResponse.json({ error: 'Server error during location detection' }, { status: 500 });
    }
}

async function handleGeoData(geoData) {
    const { city, country_name, latitude, longitude } = geoData;

    // 3. Reverse Geocode via Nominatim
    let displayName = `${city}, ${country_name}`;
    try {
        const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
                headers: { 'User-Agent': 'HashWorks-App/1.0' },
                next: { revalidate: 3600 }
            }
        );
        const nomData = await nomRes.json();
        if (nomData.display_name) {
            displayName = nomData.display_name;
        }
    } catch (nomErr) {
        console.warn('Nominatim fallback used:', nomErr);
    }

    return NextResponse.json({
        display_name: displayName,
        city: city || 'Unknown City',
        country: country_name || 'Unknown Country',
        latitude: latitude,
        longitude: longitude
    });
}
