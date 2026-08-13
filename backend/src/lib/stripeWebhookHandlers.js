const pool = require('../db');
const { createInvitation, trySendInvitationEmail } = require('./invitation');

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
    `UPDATE etablissements SET abonnement_statut = 'resilie' WHERE stripe_subscription_id = $1 RETURNING id, nom`,
    [subscription.id]
  );
  const etablissement = result.rows[0];

  if (!etablissement) {
    console.warn(`customer.subscription.deleted: aucun établissement trouvé pour ${subscription.id}`);
    return;
  }

  console.log(`${etablissement.nom}: abonnement résilié, la plaque cessera de rediriger vers Google.`);
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
