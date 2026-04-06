import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import SharedPlanViewer from './components/SharedPlanViewer.jsx';
import { decodePlan } from './components/ShareView.jsx';

// If there's a URL hash, try to decode it as a shared plan.
// If successful, render the read-only SharedPlanViewer for Ryan.
// Otherwise render the full planning App for Emily.
const hash = window.location.hash.slice(1);
const sharedPlan = hash ? decodePlan(hash) : null;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {sharedPlan ? <SharedPlanViewer plan={sharedPlan} /> : <App />}
  </StrictMode>
);
