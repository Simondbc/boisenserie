const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Autorise seulement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      productName,
      price,         // en centimes (ex: 4990 pour 49,90€)
      engravingText, // texte de gravure
      emblem,        // emblème choisi
      wood,          // essence de bois
      format,        // format choisi
      giftBox        // option coffret cadeau
    } = req.body;

    // Construction de la description détaillée
    let description = `Planche à découper personnalisée — Emblème : ${emblem || 'Cigogne'} — Bois : ${wood || 'Chêne des Vosges'}`;
    if (engravingText) description += ` — Gravure : "${engravingText}"`;
    if (format) description += ` — Format : ${format}`;
    if (giftBox) description += ' — Coffret cadeau inclus';

    // Ligne de commande principale
    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName || 'Planche gravée Boisenserie',
            description: description,
          },
          unit_amount: price || 4990,
        },
        quantity: 1,
      },
    ];

    // Option coffret cadeau (+4,90€)
    if (giftBox) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Coffret cadeau premium',
            description: 'Boîte kraft rigide, papier de soie, ruban Boisenserie, carte personnalisée',
          },
          unit_amount: 490,
        },
        quantity: 1,
      });
    }

    // Création de la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',

      // URLs de redirection après paiement
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,

      // Interface en français
      locale: 'fr',

      // Collecte de l'adresse de livraison
      shipping_address_collection: {
        allowed_countries: ['FR', 'DE', 'CH', 'BE', 'LU', 'NL', 'AT', 'IT', 'ES', 'PT', 'GB', 'US', 'CA'],
      },

      // Options de livraison
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Livraison standard',
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

      // Métadonnées de commande (visibles dans Stripe)
      metadata: {
        engraving_text: engravingText || '',
        emblem: emblem || '',
        wood: wood || '',
        format: format || '',
        gift_box: giftBox ? 'oui' : 'non',
      },

      // Collecte de l'email
      customer_creation: 'always',

      // Champs personnalisés pour instructions gravure
      custom_text: {
        submit: {
          message: 'Votre planche sera gravée et expédiée sous 48h ouvrées. Merci de bien vérifier l\'orthographe de votre gravure avant de confirmer.',
        },
      },
    });

    // Retourne l'URL de la session Stripe
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};
