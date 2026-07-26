const pool = require('../db');
const stripe = require('./stripe');
const { createInvitation, trySendInvitationEmail } = require('./invitation');

const MOIS_ENGAGEMENT_MINIMUM = 2;
const PRIX_PLAQUE_CENTIMES = 4500;

function getInvoiceSubscriptionId(invoice) {
  return invoice.subscription || invoice.parent?.subscription_details?.subscription || null;
}

async function inviteIfNeeded(etablissementId) {
  const result = await pool.query(
    'SELECT nom, email, password_hash, invitation_token FROM etablissements WHERE id = $1',
    [etablissementId]
  );
  const etablissement = result.rows[0];
  if (!etablissement || !etablissement.email) return;
  if (etablissement.password_hash || etablissement.invitation_token) return;

  const invitationUrl = await createInvitation(etablissementId, etablissement.email);
  await trySendInvitationEmail(etablissement.email, etablissement.nom, invitationUrl);
}

async function handleCheckoutCompleted(session) {
  const etablissementId = session.metadata?.etablissement_id;
  if (!etablissementId) {
    console.error('checkout.session.completed sans etablissement_id en metadata');
    return;
  }

  if (session.mode === 'subscription') {
    await pool.query(
      `UPDATE etablissements
       SET stripe_customer_id = $1, stripe_subscription_id = $2, abonnement_statut = 'actif'
       WHERE id = $3`,
      [session.customer, session.subscription, etablissementId]
    );
  } else {
    await pool.query(
      `UPDATE etablissements
       SET stripe_customer_id = $1, abonnement_statut = 'plaque_seule'
       WHERE id = $2`,
      [session.customer, etablissementId]
    );
  }

  await inviteIfNeeded(etablissementId);
}

async function handleInvoicePaid(invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const result = await pool.query(
    `UPDATE etablissements
     SET mois_payes = mois_payes + 1, abonnement_statut = 'actif'
     WHERE stripe_subscription_id = $1
     RETURNING id`,
    [subscriptionId]
  );

  if (result.rows.length === 0) {
    console.warn(`invoice.paid: aucun établissement trouvé pour l'abonnement ${subscriptionId}`);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  await pool.query(
    `UPDATE etablissements SET abonnement_statut = 'impaye' WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
}

async function handleSubscriptionDeleted(subscription) {
  const result = await pool.query(
    'SELECT id, nom, mois_payes, stripe_customer_id FROM etablissements WHERE stripe_subscription_id = $1',
    [subscription.id]
  );
  const etablissement = result.rows[0];

  if (!etablissement) {
    console.warn(`customer.subscription.deleted: aucun établissement trouvé pour ${subscription.id}`);
    return;
  }

  await pool.query(`UPDATE etablissements SET abonnement_statut = 'resilie' WHERE id = $1`, [etablissement.id]);

  if (etablissement.mois_payes >= MOIS_ENGAGEMENT_MINIMUM) {
    console.log(`${etablissement.nom}: résiliation après ${etablissement.mois_payes} mois, pas de frais.`);
    return;
  }

  console.log(
    `${etablissement.nom}: résiliation après seulement ${etablissement.mois_payes} mois — facturation de 45€.`
  );

  try {
    const paymentMethod =
      subscription.default_payment_method ||
      (await stripe.customers.retrieve(etablissement.stripe_customer_id)).invoice_settings
        ?.default_payment_method;

    if (!paymentMethod) {
      throw new Error('Aucun moyen de paiement enregistré pour ce client');
    }

    await stripe.paymentIntents.create({
      amount: PRIX_PLAQUE_CENTIMES,
      currency: 'eur',
      customer: etablissement.stripe_customer_id,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      description: `Frais de plaque (résiliation avant ${MOIS_ENGAGEMENT_MINIMUM} mois) — ${etablissement.nom}`,
    });

    await pool.query(`UPDATE etablissements SET abonnement_statut = 'resilie_facture' WHERE id = $1`, [
      etablissement.id,
    ]);
    console.log(`${etablissement.nom}: 45€ facturés avec succès.`);
  } catch (err) {
    console.error(`${etablissement.nom}: échec de la facturation des 45€ à la résiliation:`, err.message);
    await pool.query(`UPDATE etablissements SET abonnement_statut = 'resilie_echec_facturation' WHERE id = $1`, [
      etablissement.id,
    ]);
  }
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break;
  }
}

module.exports = { handleStripeEvent };
