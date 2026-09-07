exports.handler = async (event) => {
  const username = event.queryStringParameters?.username?.replace(/^@/, '').trim()
  if (!username) {
    return { statusCode: 400, body: JSON.stringify({ error: 'username required' }) }
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
  }

  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, { headers })
    const html = await res.text()

    // Extract OpenGraph meta tags — most reliable, used for link previews
    const ogTitle   = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1]
                   || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/)?.[1]
                   || ''
    const ogImage   = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1]
                   || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/)?.[1]
                   || ''
    const ogDesc    = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)?.[1]
                   || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/)?.[1]
                   || ''

    // og:title format: "Full Name (@username) • Instagram photos and videos"
    const fullName = ogTitle.match(/^(.+?)\s*(?:\(@[^)]+\))?\s*[•·]/)?.[1]?.trim()
                  || ogTitle.replace(/\s*•.*$/, '').replace(/\s*\(@[^)]+\)/, '').trim()
                  || username

    // og:description format: "X Followers, Y Following, Z Posts - See Instagram photos and videos..."
    // or bio content if profile has a bio set
    const bio = ogDesc.replace(/^\d[\d.,K M]+ Followers.*?- /, '').trim()

    // Detect blocked/redirect responses — Instagram returns generic og:title when not logged in
    const isBlocked = !ogTitle || ogTitle.trim() === 'Instagram' || ogTitle.trim() === 'Login • Instagram'
    if (isBlocked || (!ogTitle && !ogImage)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Profile not found or private' }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        username,
        fullName,
        profilePicUrl: ogImage,
        bio,
        raw: { title: ogTitle, desc: ogDesc },
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
