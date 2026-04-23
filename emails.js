const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND = {
  name: 'Boisenserie',
  email: 'contact@boisenserie.fr',
  site: 'https://boisenserie.fr',
  color: '#225A3B',
  colorLight: '#F0F6F2',
  colorBorder: '#D3E8D9',
};

// ── Styles partagés ──────────────────────────────────────────
const base = `
  <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    body{margin:0;padding:0;background:#F3EEE8;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
    .wrap{max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,14,12,.08)}
    .header{background:${BRAND.color};padding:32px 40px;text-align:center}
    .logo{font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:.04em}
    .logo span{font-style:italic}
    .body{padding:40px}
    .title{font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1A1916;line-height:1.3;margin:0 0 12px}
    .title em{font-style:italic;color:${BRAND.color}}
    .subtitle{font-size:15px;color:#6E6C64;line-height:1.7;margin:0 0 28px}
    .divider{border:none;border-top:.5px solid #E1D7CB;margin:28px 0}
    .label{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9C9A90;margin-bottom:6px}
    .value{font-size:15px;color:#1A1916;font-weight:500}
    .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:.5px solid #F3EEE8}
    .card{background:#FAFAF8;border-radius:10px;border:.5px solid #E1D7CB;padding:20px 24px;margin:20px 0}
    .badge{display:inline-block;background:${BRAND.colorLight};color:${BRAND.color};border:.5px solid ${BRAND.colorBorder};padding:5px 14px;border-radius:9999px;font-size:12px;font-weight:600;letter-spacing:.04em}
    .btn{display:block;width:fit-content;margin:28px auto 0;background:${BRAND.color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-size:15px;font-weight:500;text-align:center}
    .footer{background:#1A1916;padding:28px 40px;text-align:center}
    .footer p{font-size:12px;color:#6E6C64;margin:4px 0;line-height:1.6}
    .footer a{color:#66A47B;text-decoration:none}
    .item-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:.5px solid #F3EEE8}
    .item-icon{width:48px;height:36px;border-radius:6px;background:linear-gradient(135deg,#C9A37A,#A67C52,#7A5535);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}
    .item-name{font-size:14px;font-weight:500;color:#1A1916}
    .item-detail{font-size:12px;color:#9C9A90;margin-top:2px}
    .item-price{font-size:15px;font-weight:600;color:#1A1916;margin-left:auto;flex-shrink:0}
    .total-row{display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:600;color:#1A1916}
    .steps{list-style:none;padding:0;margin:0}
    .step{display:flex;gap:14px;padding:12px 0;border-bottom:.5px solid #F3EEE8}
    .step:last-child{border-bottom:none}
    .step-num{width:28px;height:28px;border-radius:50%;background:${BRAND.color};color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
    .step-text{font-size:14px;color:#6E6C64;line-height:1.6}
    .step-title{font-size:14px;font-weight:600;color:#1A1916;margin-bottom:2px}
    .highlight{background:${BRAND.colorLight};border-left:3px solid ${BRAND.color};border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;font-size:14px;color:#225A3B;line-height:1.6}
    @media(max-width:600px){.wrap{margin:0;border-radius:0}.body{padding:28px 20px}.header{padding:24px 20px}.footer{padding:20px}}
  </style></head><body>`;

const footer = `
  <div class="footer">
    <p><strong style="color:#D3E8D9;font-family:Georgia,serif;font-size:14px">Boisenserie</strong></p>
    <p>Planches à découper gravées · Alsace · Vosges</p>
    <p><a href="${BRAND.site}">${BRAND.site}</a> · <a href="mailto:${BRAND.email}">${BRAND.email}</a></p>
    <p style="margin-top:12px">🌲 Bois certifié PEFC · Gravure laser · Fabriqué en Alsace</p>
  </div></div></body></html>`;

// ════════════════════════════════════════════════════════════
// EMAIL 1 — NOTIFICATION INTERNE : NOUVELLE COMMANDE
// ════════════════════════════════════════════════════════════
function buildOrderNotificationEmail(order) {
  const { orderNumber, items = [], total, customer, shippingAddress } = order;
  const itemsHtml = items.map(item => `
    <div class="item-row">
      <div class="item-icon">🪵</div>
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-detail">${item.wood} · ${item.format}${item.engravingText ? ` · "${item.engravingText}"` : ''}</div>
      </div>
      <div class="item-price">${fmtPrice(item.price * item.quantity)}</div>
    </div>`).join('');

  return `${base}
  <div class="wrap">
    <div class="header">
      <div class="logo">Bois<span>enserie</span></div>
    </div>
    <div class="body">
      <div class="badge">🛒 Nouvelle commande</div>
      <h1 class="title" style="margin-top:16px">Commande reçue — <em>${orderNumber}</em></h1>
      <p class="subtitle">Une nouvelle commande vient d'être validée et payée. Lancez la production dans les 24h.</p>

      <div class="card">
        <div class="label">Client</div>
        <div class="value">${customer?.name || 'Client invité'}</div>
        <div style="font-size:13px;color:#9C9A90;margin-top:4px">${customer?.email || ''}</div>
      </div>

      <div class="label" style="margin-top:20px">Articles commandés</div>
      ${itemsHtml}
      <div class="total-row">
        <span>Total payé</span>
        <span style="color:${BRAND.color}">${fmtPrice(total)}</span>
      </div>

      ${shippingAddress ? `
      <hr class="divider">
      <div class="label">Adresse de livraison</div>
      <div class="value" style="line-height:1.7">${shippingAddress}</div>` : ''}

      <hr class="divider">
      <div class="highlight">
        ⚡ <strong>Action requise :</strong> Lancez la gravure sous 24h. N'oubliez pas de mettre à jour le statut de la commande dans votre espace client pour notifier automatiquement le client.
      </div>

      <a href="${BRAND.site}/account.html" class="btn">Voir le tableau de bord →</a>
    </div>
    ${footer}`;
}

// ════════════════════════════════════════════════════════════
// EMAIL 2 — NOTIFICATION INTERNE : NOUVEAU COMPTE CLIENT
// ════════════════════════════════════════════════════════════
function buildNewAccountNotificationEmail(user) {
  const { firstName, lastName, email, createdAt } = user;
  const date = new Date(createdAt || Date.now()).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `${base}
  <div class="wrap">
    <div class="header">
      <div class="logo">Bois<span>enserie</span></div>
    </div>
    <div class="body">
      <div class="badge">👤 Nouveau client</div>
      <h1 class="title" style="margin-top:16px">Un nouveau compte vient d'être créé</h1>
      <p class="subtitle">Un visiteur vient de rejoindre la communauté Boisenserie.</p>

      <div class="card">
        <div class="label">Prénom & Nom</div>
        <div class="value">${firstName} ${lastName || ''}</div>
        <hr class="divider" style="margin:14px 0">
        <div class="label">Adresse e-mail</div>
        <div class="value">${email}</div>
        <hr class="divider" style="margin:14px 0">
        <div class="label">Date d'inscription</div>
        <div class="value">${date}</div>
      </div>

      <div class="highlight">
        💡 <strong>Conseil :</strong> Si ce client ne commande pas dans les 48h, vous pouvez lui envoyer un email personnalisé avec une offre de bienvenue.
      </div>
    </div>
    ${footer}`;
}

// ════════════════════════════════════════════════════════════
// EMAIL 3 — CLIENT : CONFIRMATION DE COMMANDE
// ════════════════════════════════════════════════════════════
function buildOrderConfirmationEmail(order) {
  const { orderNumber, items = [], total, firstName, estimatedDelivery } = order;
  const itemsHtml = items.map(item => `
    <div class="item-row">
      <div class="item-icon">🪵</div>
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-detail">${item.wood} · ${item.format}</div>
        ${item.engravingText ? `<div style="font-size:12px;color:${BRAND.color};margin-top:3px;font-style:italic">✦ Gravure : "${item.engravingText}"</div>` : ''}
      </div>
      <div class="item-price">${fmtPrice(item.price * item.quantity)}</div>
    </div>`).join('');

  const delivery = estimatedDelivery || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  return `${base}
  <div class="wrap">
    <div class="header">
      <div class="logo">Bois<span>enserie</span></div>
      <p style="color:#D3E8D9;font-size:13px;margin:8px 0 0;font-family:Georgia,serif;font-style:italic">"L'Alsace gravée dans le bois."</p>
    </div>
    <div class="body">
      <div class="badge">✓ Commande confirmée</div>
      <h1 class="title" style="margin-top:16px">Merci ${firstName || ''} — votre planche est <em>entre nos mains.</em></h1>
      <p class="subtitle">Votre paiement a été reçu. Votre gravure va être lancée dans les prochaines 24 heures dans notre atelier alsacien.</p>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <div class="label">Numéro de commande</div>
            <div class="value">${orderNumber}</div>
          </div>
          <div class="badge">Payée ✓</div>
        </div>
      </div>

      <div class="label" style="margin-top:24px">Votre commande</div>
      ${itemsHtml}
      <div class="total-row">
        <span>Total</span>
        <span>${fmtPrice(total)}</span>
      </div>

      <hr class="divider">
      <div class="label">Ce qui se passe maintenant</div>
      <ul class="steps">
        <li class="step">
          <div class="step-num">1</div>
          <div>
            <div class="step-title">Gravure laser — sous 24h</div>
            <div class="step-text">Notre artisan lance la gravure dans notre atelier de Saint-Dié-des-Vosges. Chaque trait est contrôlé à la loupe.</div>
          </div>
        </li>
        <li class="step">
          <div class="step-num">2</div>
          <div>
            <div class="step-title">Emballage soigné — sous 48h</div>
            <div class="step-text">Votre planche est emballée dans du papier kraft recyclé, prête à être offerte ou gardée.</div>
          </div>
        </li>
        <li class="step">
          <div class="step-num">3</div>
          <div>
            <div class="step-title">Expédition Colissimo</div>
            <div class="step-text">Vous recevrez un SMS avec votre numéro de suivi dès l'envoi. Livraison estimée : <strong>${delivery}</strong>.</div>
          </div>
        </li>
      </ul>

      <hr class="divider">
      <div class="highlight">
        🌲 <strong>Le saviez-vous ?</strong> Votre planche est taillée dans un chêne ou un hêtre des forêts vosgiennes certifiées PEFC. Elle vieillira avec vous — la gravure s'accentue avec le temps.
      </div>

      <div style="text-align:center;margin-top:28px">
        <p style="font-size:13px;color:#9C9A90;margin-bottom:12px">Une question ? Nous répondons sous 24h.</p>
        <a href="mailto:${BRAND.email}" class="btn">Contacter Boisenserie →</a>
      </div>
    </div>
    ${footer}`;
}

// ════════════════════════════════════════════════════════════
// EMAIL 4 — CLIENT : COLIS EXPÉDIÉ
// ════════════════════════════════════════════════════════════
function buildShippingEmail(order) {
  const { orderNumber, firstName, trackingNumber, items = [], estimatedDelivery } = order;

  const delivery = estimatedDelivery || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  const trackingUrl = trackingNumber
    ? `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`
    : null;

  const itemsHtml = items.map(item => `
    <div class="item-row">
      <div class="item-icon">🪵</div>
      <div>
        <div class="item-name">${item.name}</div>
        ${item.engravingText ? `<div style="font-size:12px;color:${BRAND.color};font-style:italic">✦ "${item.engravingText}"</div>` : ''}
      </div>
    </div>`).join('');

  return `${base}
  <div class="wrap">
    <div class="header" style="background:#1A1916">
      <div class="logo">Bois<span>enserie</span></div>
      <p style="color:#66A47B;font-size:13px;margin:8px 0 0;font-family:Georgia,serif;font-style:italic">Votre planche est en route. 🚚</p>
    </div>
    <div class="body">
      <div class="badge" style="background:#E6F1FB;color:#185FA5;border-color:#85B7EB">📦 Colis expédié</div>
      <h1 class="title" style="margin-top:16px">C'est parti ${firstName || ''} — votre planche <em>voyage vers vous.</em></h1>
      <p class="subtitle">Votre commande <strong>${orderNumber}</strong> vient d'être confiée à Colissimo. Elle a quitté notre atelier alsacien et prend la route.</p>

      ${trackingNumber ? `
      <div class="card" style="text-align:center;border-color:#85B7EB;background:#E6F1FB">
        <div class="label" style="color:#185FA5">Numéro de suivi</div>
        <div style="font-family:monospace;font-size:18px;font-weight:700;color:#185FA5;letter-spacing:.08em;margin:8px 0">${trackingNumber}</div>
        <div style="font-size:13px;color:#6E6C64">Livraison estimée : <strong>${delivery}</strong></div>
        ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:14px;background:#185FA5;color:white;text-decoration:none;padding:10px 24px;border-radius:9999px;font-size:13px;font-weight:500">Suivre mon colis →</a>` : ''}
      </div>` : `
      <div class="card" style="text-align:center">
        <div style="font-size:13px;color:#6E6C64">Livraison estimée : <strong>${delivery}</strong></div>
        <div style="font-size:12px;color:#9C9A90;margin-top:6px">Vous recevrez votre numéro de suivi par SMS</div>
      </div>`}

      <div class="label" style="margin-top:24px">Dans votre colis</div>
      ${itemsHtml}

      <hr class="divider">
      <div class="label">Comment entretenir votre planche</div>
      <ul class="steps">
        <li class="step">
          <div class="step-num" style="background:#D4A738">💧</div>
          <div>
            <div class="step-title">Lavage à la main uniquement</div>
            <div class="step-text">Eau tiède et savon doux. Jamais au lave-vaisselle — la chaleur et l'humidité intense abîment le bois.</div>
          </div>
        </li>
        <li class="step">
          <div class="step-num" style="background:#D4A738">🫙</div>
          <div>
            <div class="step-title">Huile alimentaire une fois par mois</div>
            <div class="step-text">Quelques gouttes d'huile minérale alimentaire, laissez pénétrer 15 min, essuyez. La gravure s'accentuera avec le temps.</div>
          </div>
        </li>
        <li class="step">
          <div class="step-num" style="background:#D4A738">☀️</div>
          <div>
            <div class="step-title">Évitez la chaleur directe</div>
            <div class="step-text">Ne posez pas votre planche sur un radiateur ou au soleil direct. Le bois travaille — gardez-le à l'abri.</div>
          </div>
        </li>
      </ul>

      <hr class="divider">
      <div style="text-align:center;padding:20px 0">
        <p style="font-size:14px;color:#6E6C64;margin-bottom:8px">Vous avez aimé votre expérience Boisenserie ?</p>
        <p style="font-size:13px;color:#9C9A90;margin-bottom:16px">Un avis en ligne nous aide énormément — merci d'avance !</p>
        <a href="${BRAND.site}" class="btn">Laisser un avis →</a>
      </div>
    </div>
    ${footer}`;
}

// ── Utilitaires ──────────────────────────────────────────────
function fmtPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

// ════════════════════════════════════════════════════════════
// FONCTIONS D'ENVOI
// ════════════════════════════════════════════════════════════

// 1. Notification interne — nouvelle commande
async function sendOrderNotification(order) {
  return resend.emails.send({
    from: `Boisenserie <${BRAND.email}>`,
    to: BRAND.email,
    subject: `🛒 Nouvelle commande — ${order.orderNumber} (${fmtPrice(order.total)})`,
    html: buildOrderNotificationEmail(order),
  });
}

// 2. Notification interne — nouveau compte
async function sendNewAccountNotification(user) {
  return resend.emails.send({
    from: `Boisenserie <${BRAND.email}>`,
    to: BRAND.email,
    subject: `👤 Nouveau client — ${user.firstName} ${user.lastName || ''} (${user.email})`,
    html: buildNewAccountNotificationEmail(user),
  });
}

// 3. Email client — confirmation commande
async function sendOrderConfirmation(order) {
  if (!order.customerEmail) return;
  return resend.emails.send({
    from: `Boisenserie <${BRAND.email}>`,
    to: order.customerEmail,
    reply_to: BRAND.email,
    subject: `✓ Votre commande ${order.orderNumber} est confirmée — Boisenserie`,
    html: buildOrderConfirmationEmail(order),
  });
}

// 4. Email client — colis expédié
async function sendShippingNotification(order) {
  if (!order.customerEmail) return;
  return resend.emails.send({
    from: `Boisenserie <${BRAND.email}>`,
    to: order.customerEmail,
    reply_to: BRAND.email,
    subject: `📦 Votre colis est en route — ${order.orderNumber}`,
    html: buildShippingEmail(order),
  });
}

module.exports = {
  sendOrderNotification,
  sendNewAccountNotification,
  sendOrderConfirmation,
  sendShippingNotification,
};
