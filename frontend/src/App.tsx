import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEtablissementStats from './pages/AdminEtablissementStats';
import MerchantLogin from './pages/MerchantLogin';
import MerchantDashboard from './pages/MerchantDashboard';
import AcceptInvitation from './pages/AcceptInvitation';
import Paiement from './pages/Paiement';
import PaiementSucces from './pages/PaiementSucces';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/etablissements/:id" element={<AdminEtablissementStats />} />
      <Route path="/login" element={<MerchantLogin />} />
      <Route path="/dashboard" element={<MerchantDashboard />} />
      <Route path="/invitation/:token" element={<AcceptInvitation />} />
      <Route path="/paiement/:token" element={<Paiement />} />
      <Route path="/paiement/:token/succes" element={<PaiementSucces />} />
    </Routes>
  );
}

export default App;
