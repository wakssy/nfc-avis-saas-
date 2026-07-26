function PaiementSucces() {
  return (
    <div className="center-page">
      <div className="container-narrow" style={{ width: '100%', maxWidth: 480 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="logo-mark" style={{ justifyContent: 'center' }}>
            avis<span>plaque</span>
          </div>
          <p style={{ fontSize: 40, margin: '16px 0 8px' }}>✅</p>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Paiement confirmé</h2>
          <p className="subtitle">
            Merci ! Vous allez recevoir un email dans quelques instants pour créer votre accès au dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaiementSucces;
