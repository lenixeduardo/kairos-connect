// URL base do backend KairOS.
// Override via VITE_KAIROS_API_URL no .env.local para desenvolvimento local.
export const KAIROS_API_URL =
  import.meta.env.VITE_KAIROS_API_URL || 'https://maintech-backend-v8bl.onrender.com';
