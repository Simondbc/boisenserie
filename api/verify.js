module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    // Vérifie la signature
    if (payload.sig !== process.env.ADMIN_SECRET_KEY.slice(-8)) {
      return res.status(401).json({ valid: false });
    }

    // Session de 8h maximum
    const age = Date.now() - payload.ts;
    if (age > 8 * 60 * 60 * 1000) {
      return res.status(401).json({ valid: false, expired: true });
    }

    res.status(200).json({ valid: true });
  } catch (e) {
    res.status(401).json({ valid: false });
  }
};
