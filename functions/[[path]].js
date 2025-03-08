export async function onRequest(context) {
    const clientIp = context.request.headers.get('CF-Connecting-IP') || 
                    context.request.headers.get('X-Forwarded-For') || 
                    'Unknown';
    
    const ipList = clientIp.split(',');
    const ipv4 = ipList.map(ip => ip.trim()).find(ip => /^\d+\.\d+\.\d+\.\d+$/.test(ip)) || 'No IPv4 detected';
    const ipv6 = ipList.map(ip => ip.trim()).find(ip => /:/.test(ip) && !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) || 'No IPv6 detected';

    // Determine connection protocol
    const firstIp = ipList[0].trim();
    const isIPv6 = /:/.test(firstIp) && !/^\d+\.\d+\.\d+\.\d+$/.test(firstIp);
    
    const { pathname } = new URL(context.request.url);

    // Explicit root path (/) - For curl
    if (pathname === '/') {
        const ipToReturn = isIPv6 ? ipv6 : ipv4;
        return new Response(ipToReturn, {
            status: 200,
            headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }
        });
    }

    // /all endpoint - Returns both as JSON
    if (pathname === '/all') {
        return new Response(JSON.stringify({ ipv4, ipv6 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Pass through to static assets (like index.html) for other requests
    return context.next();
}