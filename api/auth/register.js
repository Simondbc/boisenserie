const { createClient } = require('@supabase/supabase-js');
const { sendNewAccountNotification, sendWelcomeEmail } = require('../../emails');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode non autorisee' });
  }
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName) {
    return res.status(400).json({ error: 'Email, mot de passe et prenom sont requis.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caracteres.' });
  }
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName || '',
        full_name: (firstName + ' ' + (lastName || '')).trim()
      }
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'Un compte existe deja avec cet email.' });
      }
      throw error;
    }
    await Promise.allSettled([
      sendNewAccountNotification({ firstName, lastName: lastName || '', email, createdAt: new Date().toISOString() }),
      sendWelcomeEmail({ firstName, email }),
    ]);
    res.status(201).json({ success: true, message: 'Compte cree avec succes.', user: { id: data.user.id, email: data.user.email, firstName } });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la creation du compte.' });
  }
};
