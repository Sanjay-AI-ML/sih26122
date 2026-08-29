import React from 'react';

interface KeycloakFieldLoginScreenProps {
  onLogin: () => void;
}

export const KeycloakFieldLoginScreen: React.FC<KeycloakFieldLoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-slate-900 text-slate-100 text-white font-sans">
      {/* TopAppBar */}
      <header className="bg-slate-900 text-slate-100 border-b border-[#cfc4c5] w-full top-0 flex items-center justify-between px-3 h-10 shrink-0">
        <div className="flex items-center gap-2">
          <img 
            alt="Oil India Logo" 
            className="h-6 w-auto object-contain" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPQFrCdvKQAtvZYv-6FOf6RITcHYxxYqHhWg6MPipIdfuZDHp75U3Zz-3N3qVlhF4Npub8f23bs0ddhhq2JMiXpfHzqJ7_zUHOX0wc4nP-SyPhOfzLxapTo1PBHlp7a5ZX6s-28eWclD5PYbl2hmwa30GK49wMz3onGvQxTrcdVIOLnkN-L54EWiqVfWp_d9-DmyhNvqFWio3rCvmSi2cb4WvaFAysXlwNKb_XQ-hqk3heG7UDt67OKAo58NEPUDGyFm4"
          />
          <span className="font-bold text-sm text-white">Time Agent Field Portal</span>
        </div>
        <div>
          <span className="material-symbols-outlined text-black cursor-pointer active:opacity-80 transition-opacity">language</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col px-3 py-8 gap-6 justify-center max-w-md mx-auto w-full">
        {/* Monospace Realm Badge */}
        <div className="flex justify-center w-full">
          <div className="font-mono text-[11px] leading-tight text-[#4c4546] bg-slate-900 text-slate-200 border-slate-700 border border-[#CCCCCC] rounded px-3 py-1.5 inline-flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">security</span>
            Realm: kadam-realm | Field Access Only
          </div>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-900 text-slate-100 rounded border border-[#CCCCCC] p-4 shadow-sm flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-1 text-left">
            <h1 className="font-bold text-base text-white">Sign In</h1>
            <p className="text-xs text-slate-300">Enter your enterprise field credentials.</p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            {/* Username */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-white" htmlFor="username">Username / Field ID</label>
              <input 
                className="h-10 px-3 bg-slate-900 text-slate-100 border border-[#CCCCCC] rounded text-xs text-white w-full font-mono focus:outline-none focus:border-black" 
                id="username" 
                type="text" 
                defaultValue="s_kadam@oilindia.in"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-white" htmlFor="password">Password</label>
              <input 
                className="h-10 px-3 bg-slate-900 text-slate-100 border border-[#CCCCCC] rounded text-xs text-white w-full font-mono focus:outline-none focus:border-black" 
                id="password" 
                type="password" 
                defaultValue="************"
              />
            </div>

            {/* Security Badge */}
            <div className="bg-blue-50 border border-[#1842AA] rounded px-3 py-2 flex items-start gap-2 mt-1 text-left">
              <span className="material-symbols-outlined text-[#1842AA] text-[16px] mt-0.5">verified_user</span>
              <span className="font-mono text-[10px] leading-tight text-[#1842AA] font-medium">
                Assigned Privilege: ROLE_SUPERVISOR<br/>[Field Logging Authorized]
              </span>
            </div>

            {/* CTA Button */}
            <button 
              onClick={onLogin}
              className="mt-2 w-full h-10 bg-[#E1B91B] hover:bg-[#ebc327] text-black font-semibold text-xs rounded border border-[#725c00] active:opacity-80 transition-all flex items-center justify-center cursor-pointer shadow-xs" 
              type="button"
            >
              Sign In to Time Agent
            </button>
          </form>

          <div className="flex justify-center mt-1">
            <a className="text-[11px] text-slate-300 hover:text-[#E1B91B] underline cursor-pointer" href="#">Need help logging in?</a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-100 border-t border-[#cfc4c5] w-full bottom-0 flex flex-col items-center justify-center gap-1 py-3 px-3 shrink-0">
        <span className="text-[10px] text-slate-300">Connected to Keycloak 24.0 (Enterprise SSO)</span>
        <div className="flex gap-4 mt-0.5 text-[10px] text-slate-300">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
        <span className="text-[9px] text-[#7e7576] mt-1 font-mono">Powered by Oil India Limited</span>
      </footer>
    </div>
  );
};
