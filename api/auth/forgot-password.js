const { createClient } = require('@supabase/supabase-js');
const { sendPasswordResetEmail } = require('../../emails');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis.' });
  }

  try {
    // Vérifie si l'utilisateur existe
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.users.find(u => u.email === email);

    // Réponse identique que l'utilisateur existe ou non (sécurité)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
      });
    }

    // Génère le lien de reset via Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://boisenserie.fr/reset-password'
      }
    });

    if (error) throw error;

    // Envoie l'email via Resend (votre template personnalisé)
    await sendPasswordResetEmail({
      email,
      firstName: user.user_metadata?.first_name || '',
      resetLink: data.properties.action_link
    });

    res.status(200).json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du lien de réinitialisation.' });
  }
};
