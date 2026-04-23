const { createClient } = require('@supabase/supabase-js');
const { sendShippingNotification } = require('../emails');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Cet endpoint est appelé par vous (admin) quand vous expédiez une commande
// POST /api/orders/ship
// Body: { orderId, trackingNumber, adminKey }

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Sécurité basique — clé admin
  const { orderId, orderNumber, trackingNumber, customerEmail, customerFirstName, items, adminKey } = req.body;

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Non autorisé.' });
  }

  if (!customerEmail) {
    return res.status(400).json({ error: 'Email client requis.' });
  }

  try {
    // Mettre à jour le statut dans Supabase
    if (orderId) {
      await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    // Envoyer l'email d'expédition au client
    await sendShippingNotification({
      orderNumber: orderNumber || orderId,
      firstName: customerFirstName || '',
      customerEmail,
      trackingNumber,
      items: items || [],
    });

    res.status(200).json({ success: true, message: 'Email d\'expédition envoyé.' });

  } catch (error) {
    console.error('Erreur expédition:', error);
    res.status(500).json({ error: error.message });
  }
};
