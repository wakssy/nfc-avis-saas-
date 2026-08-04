import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useParallax } from '../lib/useParallax';
import Reveal from '../components/Reveal';
import Logo from '../components/Logo';
import '../styles/home.css';

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconNoApp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M6 5h12M6 18h12" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function ContactSection() {
  const idNom = useId();
  const idEmail = useId();
  const idMessage = useId();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnvoi(true);

    try {
      const res = await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify({ nom, email, message }),
      });

      if (res.ok) {
        setEnvoye(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'envoi.");
      }
    } catch {
      setError('Erreur de connexion. Réessaie dans un instant.');
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <div className="card contact-card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 32, margin: '0 0 8px' }}>✓</p>
        <p style={{ fontWeight: 600, margin: 0 }}>Merci, je vous répondrai rapidement.</p>
      </div>
    );
  }

  return (
    <form className="card contact-card contact-form" onSubmit={handleSubmit}>
      <div className="contact-field">
        <label htmlFor={idNom}>Nom</label>
        <input
          id={idNom}
          className="input"
          placeholder="Votre nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          autoComplete="name"
          required
        />
      </div>
      <div className="contact-field">
        <label htmlFor={idEmail}>Email</label>
        <input
          id={idEmail}
          className="input"
          type="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="contact-field">
        <label htmlFor={idMessage}>Message</label>
        <textarea
          id={idMessage}
          className="input"
          placeholder="Votre message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={envoi}>
        {envoi ? 'Envoi...' : 'Envoyer'}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function Home() {
  const parallaxRef = useParallax<HTMLDivElement>(0.1);
  const tapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = tapRef.current;
    if (!node) return;
    const timer = setTimeout(() => node.classList.add('tap-fired'), 500);
    return () => clearTimeout(timer);
  }, []);

  function setHeroRefs(node: HTMLDivElement | null) {
    parallaxRef.current = node;
    tapRef.current = node;
  }

  return (
    <div className="home">
      <nav className="home-nav">
        <Logo />
        <a href="#contact">Contact</a>
      </nav>

      <div className="hero-band">
        <header className="home-section hero">
          <p className="hero-kicker">NFC · QR CODE</p>
          <h1>
            Un scan. <em>Un avis Google.</em>
          </h1>
          <p className="hero-sub">
            Une plaque à poser sur votre comptoir. Vos clients la scannent avec leur téléphone — NFC ou QR
            code — et atterrissent directement sur votre fiche Google, prêts à laisser un avis. Rien à
            installer, rien à créer de leur côté.
          </p>
          <div className="hero-ctas">
            <a href="#tarifs" className="btn btn-primary">
              Voir les tarifs
            </a>
            <a href="#contact" className="btn-ghost">
              Nous contacter
            </a>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-parallax" ref={setHeroRefs}>
              <div className="plaque-ring" />
              <div className="plaque-ring" />
              <picture>
                <source srcSet="/plaque.webp" type="image/webp" />
                <img
                  className="plaque-photo"
                  src="/plaque.png"
                  alt="Plaque avisplaque avec picto NFC et QR code, a poser sur un comptoir pour collecter des avis Google"
                  width={954}
                  height={1008}
                />
              </picture>
              <div className="hero-chip">
                <span className="stars">★★★★★</span>
                <span>Avis envoyé</span>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="home-band home-band-plain">
        <section className="home-section home-section-tight">
          <Reveal>
            <p className="home-eyebrow">Comment ça marche</p>
          </Reveal>
          <div className="signal-path">
            <Reveal delay={0}>
              <div className="signal-node">
                <div className="signal-number">01</div>
                <h3>Le client scanne</h3>
                <p>Il approche son téléphone de la plaque (NFC) ou scanne le QR code imprimé dessus.</p>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="signal-node">
                <div className="signal-node-line" />
                <div className="signal-number">02</div>
                <h3>Il atterrit sur votre fiche Google</h3>
                <p>Directement sur la page où laisser une note et un commentaire, sans détour.</p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <div className="signal-node">
                <div className="signal-node-line" />
                <div className="signal-number">03</div>
                <h3>Vous suivez tout depuis votre tableau de bord</h3>
                <p>Nombre de scans, évolution des avis, alertes d'inactivité, objectifs mensuels.</p>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      <div className="home-band home-band-tint">
        <section id="tarifs" className="home-section">
          <Reveal>
            <p className="home-eyebrow">Tarifs</p>
          </Reveal>
          <div className="pricing">
            <Reveal delay={0}>
              <div className="price-card">
                <p className="price-name">Plaque seule</p>
                <p className="price-amount">45 €</p>
                <p className="price-detail">Paiement unique, aucun abonnement.</p>
                <ul className="price-features">
                  <li>Redirection immédiate vers votre fiche avis Google</li>
                  <li>Plaque NFC + QR code incluse</li>
                  <li>Aucun tableau de bord</li>
                </ul>
                <a href="#contact" className="btn">
                  Nous contacter
                </a>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="price-card price-card-featured">
                <span className="price-badge">Recommandé</span>
                <p className="price-name">Plaque + abonnement</p>
                <p className="price-amount">
                  14,99 € <span>/mois</span>
                </p>
                <p className="price-detail">Plaque offerte. Engagement minimum de 2 mois.</p>
                <ul className="price-features">
                  <li>Tout ce qui est inclus dans l'offre Plaque seule</li>
                  <li>Tableau de bord complet : scans, évolution des avis, alertes, objectifs</li>
                  <li>Suggestions de réponses aux avis générées par IA</li>
                  <li>Résumés automatiques par email</li>
                </ul>
                <a href="#contact" className="btn btn-primary">
                  Nous contacter
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      <div className="home-band home-band-plain">
        <section className="home-section">
          <Reveal>
            <p className="home-eyebrow">Pourquoi avisplaque</p>
          </Reveal>
          <div className="why-grid">
            <Reveal delay={0}>
              <div className="why-item">
                <div className="why-icon">
                  <IconClock />
                </div>
                <h3>Installation en quelques minutes</h3>
                <p>Posez la plaque, associez-la à votre fiche Google, c'est prêt.</p>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <div className="why-item">
                <div className="why-icon">
                  <IconNoApp />
                </div>
                <h3>Aucune app pour vos clients</h3>
                <p>Ils utilisent l'appareil photo ou le NFC déjà intégré à leur téléphone.</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="why-item">
                <div className="why-icon">
                  <IconChart />
                </div>
                <h3>Suivi en temps réel</h3>
                <p>Scans, avis, tendances : tout dans un tableau de bord simple.</p>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="why-item">
                <div className="why-icon">
                  <IconCalendar />
                </div>
                <h3>Sans engagement long</h3>
                <p>Deux mois minimum sur l'abonnement, résiliable ensuite à tout moment.</p>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      <div className="home-band home-band-tint">
        <section id="contact" className="home-section">
          <Reveal>
            <p className="home-eyebrow home-eyebrow-center" style={{ textAlign: 'center' }}>
              Contact
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 26, marginBottom: 24 }}>Une question ? Écrivez-nous.</h2>
          </Reveal>
          <ContactSection />
        </section>
      </div>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <p className="home-footer-legal">
            avisplaque — Mentions légales à compléter après immatriculation de la micro-entreprise.
          </p>
          <div className="home-footer-links">
            <Link to="/login">Connexion commerçant</Link>
            <Link to="/admin/login">Administration</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
