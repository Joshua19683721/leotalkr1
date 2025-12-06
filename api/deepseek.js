export default async function handler(req, res) {
  const allowOrigin = process.env.ALLOW_ORIGIN || '*';
  const allowHeaders = 'Content-Type, Authorization';
  const allowMethods = 'POST, OPTIONS';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  res.setHeader('Access-Control-Allow-Methods', allowMethods);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const origin = req.headers['origin'] || '';
  if (allowOrigin !== '*' && origin && origin !== allowOrigin) {
    return res.status(403).json({ error: 'forbidden_origin', origin });
  }
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (process.env.DEEPSEEK_API_KEY || '');
    if (!token) return res.status(401).json({ error: 'no_api_key' });
    const mod = await import('openai');
    const OpenAI = mod.default;
    const client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: token });
    const { model = 'deepseek-chat', messages = [], max_tokens = 800, temperature = 0.7 } = req.body || {};
    const completion = await client.chat.completions.create({ model, messages, max_tokens, temperature });
    return res.status(200).send(JSON.stringify(completion));
  } catch (e) {
    return res.status(502).send(JSON.stringify({ error: 'proxy_error', message: String(e && e.message || 'unknown') }));
  }
}
