const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { access_token, password } = req.body;

  if (!access_token || !password) {
    return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    // Utilise le token pour mettre à jour le mot de passe
    const { error } = await supabase.auth.admin.updateUserById(
      // D'abord on récupère l'utilisateur via son token
      await getUserIdFromToken(access_token),
      { password }
    );

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès.'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ error: 'Lien invalide ou expiré. Veuillez recommencer.' });
  }
};

async function getUserIdFromToken(access_token) {
  const { data, error } = await supabase.auth.getUser(access_token);
  if (error || !data?.user) throw new Error('Token invalide ou expiré.');
  return data.user.id;
}
