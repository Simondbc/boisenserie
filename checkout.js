const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { sendOrderNotification, sendOrderConfirmation } = require('./emails');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { items, userToken } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier est vide.' });
    }

    // Récupérer l'utilisateur si connecté
    let userId = null;
    let userEmail = null;
    let userFirstName = null;
    if (userToken) {
      const { data: { user } } = await supabase.auth.getUser(userToken);
      if (user) {
        userId = user.id;
        userEmail = user.email;
        userFirstName = user.user_metadata?.first_name || '';
      }
    }

    // Construire les lignes de commande Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.engravingText
            ? `Gravure : "${item.engravingText}" — ${item.wood} — ${item.format}`
            : `${item.wood} — ${item.format}`,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity || 1,
    }));

    const hasGiftBox = items.some(i => i.giftBox);
    if (hasGiftBox) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Coffret cadeau premium', description: 'Boîte kraft, papier de soie, ruban, carte personnalisée' },
          unit_amount: 490,
        },
        quantity: 1,
      });
    }

    const totalCts = items.reduce((s, i) => s + i.price * i.quantity, 0) + (hasGiftBox ? 490 : 0);
    const orderNumber = 'BOI-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,
      locale: 'fr',
      customer_email: userEmail || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR', 'DE', 'CH', 'BE', 'LU', 'NL', 'AT', 'IT', 'ES', 'PT', 'GB'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Livraison standard (3-5 jours)',
            delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 5 } },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 850, currency: 'eur' },
            display_name: 'Livraison express J+2',
            delivery_estimate: { minimum: { unit: 'business_day', value: 1 }, maximum: { unit: 'business_day', value: 2 } },
          },
        },
      ],
      metadata: { order_number: orderNumber, user_id: userId || 'guest' },
    });

    // Sauvegarder en base si connecté
    if (userId) {
      await supabase.from('orders').insert({
        user_id: userId,
        stripe_session_id: session.id,
        order_number: orderNumber,
        status: 'paid',
        items: items,
        total_cts: totalCts,
      });
    }

    // ── Envoyer les emails de notification ──────────────────
    const orderData = {
      orderNumber,
      items,
      total: totalCts,
      customer: { name: userFirstName || 'Client invité', email: userEmail },
      customerEmail: userEmail,
      firstName: userFirstName,
    };

    // Email interne (vous) + confirmation client (en parallèle)
    await Promise.allSettled([
      sendOrderNotification(orderData),
      userEmail ? sendOrderConfirmation(orderData) : Promise.resolve(),
    ]);

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Erreur checkout:', error);
    res.status(500).json({ error: error.message });
  }
};
