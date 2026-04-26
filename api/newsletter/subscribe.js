const { createClient } = require('@supabase/supabase-js');
const { sendNewsletterWelcomeEmail } = require('../../emails');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  try {
    // Vérifier si déjà inscrit
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà inscrit à notre newsletter.'
      });
    }

    // Enregistrer en base Supabase
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: email.toLowerCase(),
        subscribed_at: new Date().toISOString(),
        source: 'site_web'
      }]);

    if (insertError) throw insertError;

    // Envoyer l'email de bienvenue
    await sendNewsletterWelcomeEmail({ email: email.toLowerCase() });

    res.status(200).json({
      success: true,
      message: 'Inscription confirmée ! Bienvenue dans la communauté Boisenserie.'
    });

  } catch (error) {
    console.error('Erreur newsletter:', error);
    res.status(500).json({ error: 'Une erreur est survenue. Réessayez dans quelques instants.' });
  }
};
