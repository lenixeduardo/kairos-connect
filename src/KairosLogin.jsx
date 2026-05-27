import * as React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const WAVE_KEYFRAMES = `
@keyframes waveMove1 {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes waveMove2 {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
@keyframes waveMove3 {
  0% { transform: translateX(-25%); }
  100% { transform: translateX(-75%); }
}
`;

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='noise'>
    <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>
  <rect width='200' height='200' filter='url(#noise)' opacity='0.08'/>
</svg>`;

const noiseDataUrl = `data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}`;

// Wave path data for sine waves spanning 200% width (two repeats for seamless loop)
const wave1Path = 'M0,55 C180,10 360,100 540,55 C720,10 900,100 1080,55 C1260,10 1440,100 1620,55 C1800,10 1980,100 2160,55 C2340,10 2520,100 2700,55 C2880,10 2880,55 2880,55 L2880,900 L0,900 Z';
const wave2Path = 'M0,80 C200,30 400,130 600,80 C800,30 1000,130 1200,80 C1400,30 1600,130 1800,80 C2000,30 2200,130 2400,80 C2600,30 2800,80 2880,80 L2880,900 L0,900 Z';
const wave3Path = 'M0,40 C150,5 300,75 450,40 C600,5 750,75 900,40 C1050,5 1200,75 1350,40 C1500,5 1650,75 1800,40 C1950,5 2100,75 2250,40 C2400,5 2550,75 2700,40 C2850,5 2880,40 2880,40 L2880,900 L0,900 Z';

const LeftPanel = () => (
  <div className="relative flex-[6] h-full overflow-hidden hidden sm:flex flex-col" style={{ background: '#020a06' }}>
    <style>{WAVE_KEYFRAMES}</style>

    {/* Radial gradient blooms */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,255,157,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at -10% 110%, rgba(0,229,255,0.45) 0%, transparent 65%)'
    }} />

    {/* Grain texture */}
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `url("${noiseDataUrl}")`,
      backgroundRepeat: 'repeat',
      opacity: 0.18,
      mixBlendMode: 'overlay'
    }} />

    {/* Wave SVG animations */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Wave 1 */}
      <svg viewBox="0 0 2880 900" preserveAspectRatio="none" className="absolute top-0 left-0 w-[200%] h-full" style={{
        animation: 'waveMove1 14s linear infinite'
      }} aria-hidden="true">
        <path d={wave1Path} fill="rgba(0,255,157,0.13)" />
      </svg>

      {/* Wave 2 */}
      <svg viewBox="0 0 2880 900" preserveAspectRatio="none" className="absolute top-0 left-0 w-[200%] h-full" style={{
        animation: 'waveMove2 20s linear infinite'
      }} aria-hidden="true">
        <path d={wave2Path} fill="rgba(0,229,255,0.08)" />
      </svg>

      {/* Wave 3 */}
      <svg viewBox="0 0 2880 900" preserveAspectRatio="none" className="absolute top-0 left-0 w-[200%] h-full" style={{
        animation: 'waveMove3 26s linear infinite'
      }} aria-hidden="true">
        <path d={wave3Path} fill="rgba(0,255,204,0.07)" />
      </svg>
    </div>

    {/* Branding — bottom-third */}
    <div className="relative z-10 mt-auto px-14 pb-16">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-4 h-4 shrink-0" style={{ background: '#00FF9D' }} aria-hidden="true" />
        <span className="text-white font-bold text-2xl tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
          KairOS <span className="text-[#00FF9D]">CONNECT</span>
        </span>
      </div>
      <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: '#6b7a72', fontFamily: 'monospace' }}>
        Controle Industrial em Tempo Real
      </p>
    </div>
  </div>
);

const srOnlyStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0'
};

const RightPanel = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const apiUrl = import.meta.env.VITE_KAIROS_API_URL;

    // Real API authentication when backend URL is configured
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Credenciais inválidas');

        localStorage.setItem('kairos_access_token', data.accessToken);
        localStorage.setItem('kairos_refresh_token', data.refreshToken);
        if (data.user) localStorage.setItem('kairos_user', JSON.stringify(data.user));

        if (onLogin) onLogin(data.user);
      } catch (err) {
        setError(err.message || 'Erro ao conectar ao servidor KairOS.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Demo mode — no backend configured, use local credential check
    const targetEmailHash = "5edfa2692bdacc5e6ee805c626c50cb44cebb065f092d9a1067d89f74dacd326";
    const targetPasswordHash = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

    const getSHA256 = async (str) => {
      const utf8 = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    try {
      const inputEmailHash = await getSHA256(email.trim().toLowerCase());
      const inputPasswordHash = await getSHA256(password);

      const envEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      const isEmailValid = envEmail
        ? email.trim().toLowerCase() === envEmail.trim().toLowerCase()
        : inputEmailHash === targetEmailHash;
      const isPasswordValid = envPassword
        ? password === envPassword
        : inputPasswordHash === targetPasswordHash;

      if (!isEmailValid || !isPasswordValid) {
        setError('Credenciais inválidas. Use admin@admin.com e senha "admin".');
        setIsSubmitting(false);
        return;
      }

      setTimeout(() => {
        setIsSubmitting(false);
        if (onLogin) onLogin(null);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Erro no processamento da autenticação.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 sm:flex-[4] h-full flex flex-col justify-center" style={{ background: '#000000', padding: '0 clamp(20px, 6vw, 48px)' }}>
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="w-full max-w-sm mx-auto">
        {/* Label */}
        <p className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#4a5050', fontFamily: 'monospace' }}>
          ACESSO AO SISTEMA
        </p>

        {/* Heading */}
        <h1 className="font-bold mb-2" style={{ fontSize: '32px', color: '#ffffff', fontFamily: 'Inter, sans-serif', lineHeight: 1.15 }}>
          Sala de Controle
        </h1>

        {/* Subtext */}
        <p className="text-sm mb-6" style={{ color: '#5a6060' }}>
          Entre com suas credenciais para acessar.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-sm text-xs font-mono border border-destructive/30 bg-destructive/10 text-destructive shadow-[0_0_10px_rgba(239,68,68,0.1)]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" style={srOnlyStyle}>Endereço de E-mail</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operador@kairos.ind"
              autoComplete="email"
              required
              className={cn(
                'w-full rounded-sm py-3 px-4 text-sm text-white placeholder:text-[#3a4040] outline-none transition-all',
                'border focus:border-[#00FF9D] focus:ring-2 focus:ring-[#00FF9D]/20'
              )}
              style={{ background: '#111111', border: '1px solid #333333', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#00FF9D';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,255,157,0.12)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="login-password" style={srOnlyStyle}>Senha</label>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-sm py-3 pl-4 pr-12 text-sm text-white placeholder:text-[#3a4040] outline-none transition-all"
              style={{ background: '#111111', border: '1px solid #333333', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#00FF9D';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,255,157,0.12)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#4a5050' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onMouseEnter={e => e.currentTarget.style.color = '#00FF9D'}
              onMouseLeave={e => e.currentTarget.style.color = '#4a5050'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-sm font-bold text-sm tracking-wider transition-all disabled:opacity-50 cursor-pointer"
            style={{
              background: '#00FF9D',
              color: '#000000',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 0 16px rgba(0,255,157,0.25)'
            }}
          >
            {isSubmitting ? 'VERIFICANDO...' : 'Entrar no Sistema'}
          </motion.button>
        </form>

        {/* Forgot password */}
        <div className="mt-5 text-center">
          <span className="text-xs" style={{ color: '#4a5050' }}>
            Esqueceu a senha?{' '}
          </span>
          <button className="text-xs underline decoration-[#00FF9D]/40 hover:decoration-[#00FF9D] transition-colors cursor-pointer" style={{ color: '#00FF9D', textDecorationStyle: 'solid' }}>
            Recuperar acesso
          </button>
        </div>

        {/* Status section */}
        <div className="mt-10 pt-6 space-y-2" style={{ borderTop: '1px solid #1a1a1a' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00FF9D' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#00FF9D' }} />
              </span>
              <span className="text-[9px] tracking-widest uppercase" style={{ color: '#00FF9D', fontFamily: 'monospace' }}>
                Sistema Online
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" style={{ color: '#3a4040' }} />
              <span className="text-[9px] tracking-wider" style={{ color: '#3a4040', fontFamily: 'monospace' }}>
                CT-100 · 174°C
              </span>
              <span className="text-[9px] tracking-wider" style={{ color: '#00FF9D', opacity: 0.7, fontFamily: 'monospace' }}>
                OPERACIONAL
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const KairosLogin = ({ onLogin }) => (
  <div className="flex flex-row h-screen w-screen overflow-hidden">
    <LeftPanel />
    <RightPanel onLogin={onLogin} />
  </div>
);
