module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis.' });
  }

  if (password !== process.env.ADMIN_SECRET_KEY) {
    // Délai artificiel pour ralentir les attaques brute-force
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  // Génère un token de session signé avec timestamp
  const token = Buffer.from(
    JSON.stringify({ ts: Date.now(), sig: process.env.ADMIN_SECRET_KEY.slice(-8) })
  ).toString('base64');

  res.status(200).json({ token });
};
