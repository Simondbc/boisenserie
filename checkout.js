const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier est vide.' });
    }

    // Construction des lignes de commande depuis le panier
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.engravingText
            ? `Gravure : "${item.engravingText}" — ${item.wood} — ${item.format}`
            : `${item.wood} — ${item.format}`,
        },
        unit_amount: item.price, // en centimes
      },
      quantity: item.quantity || 1,
    }));

    // Option coffret cadeau
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,
      locale: 'fr',
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR', 'DE', 'CH', 'BE', 'LU', 'NL', 'AT', 'IT', 'ES', 'PT', 'GB', 'US', 'CA'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Livraison standard (3-5 jours)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 850, currency: 'eur' },
            display_name: 'Livraison express J+2',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 2 },
            },
          },
        },
      ],
      custom_text: {
        submit: { message: 'Votre planche sera gravée et expédiée sous 48h ouvrées.' },
      },
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};
