require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function run() {
  const plaqueProduct = await stripe.products.create({ name: 'Plaque avisplaque (achat unique)' });
  const plaquePrice = await stripe.prices.create({
    product: plaqueProduct.id,
    unit_amount: 4500,
    currency: 'eur',
  });

  const abonnementProduct = await stripe.products.create({ name: 'Abonnement avisplaque (mensuel)' });
  const abonnementPrice = await stripe.prices.create({
    product: abonnementProduct.id,
    unit_amount: 1499,
    currency: 'eur',
    recurring: { interval: 'month' },
  });

  console.log('STRIPE_PRICE_PLAQUE=' + plaquePrice.id);
  console.log('STRIPE_PRICE_ABONNEMENT=' + abonnementPrice.id);
}

run().catch((err) => {
  console.error('Échec de la création des produits Stripe:', err.message);
  process.exit(1);
});
