// The studio's one door to Anthropic. The key stays here; the app on GitHub Pages, localhost or Netlify calls this.
const ALLOWED = [
  'https://laurenceuvin1411.github.io',
  'https://laurence-os-clients.netlify.app',
  'http://localhost:3009',
  'http://localhost:3002',
]

function cors(origin) {
  const ok = ALLOWED.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || ''
  const headers = { ...cors(origin), 'Content-Type': 'application/json' }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(origin), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  if (origin && !ALLOWED.includes(origin)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin not allowed' }) }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) }

  try {
    const body = JSON.parse(event.body)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('[anthropic fn] error', response.status)
      return { statusCode: response.status, headers, body: JSON.stringify({ error: data?.error?.message || 'Upstream error', status: response.status }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify(data) }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
  }
}
