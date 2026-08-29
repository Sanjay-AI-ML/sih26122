import React, { useState } from 'react';

interface KeycloakLoginScreenProps {
  onLogin: () => void;
}

export const KeycloakLoginScreen: React.FC<KeycloakLoginScreenProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-6 font-sans text-on-surface w-screen">
      <main className="w-full max-w-[480px]">
        {/* System Status Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-gray-200 px-3.5 py-1.5 rounded-full font-mono text-xs text-gray-700 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Realm: kadam-realm | Active Directory LDAP Federation
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 text-slate-100 border border-slate-700 border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 text-center bg-slate-50/50">
            <img 
              alt="Oil India Limited Logo" 
              className="h-16 mx-auto mb-3 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvEheaKATTKxtwBXaKv8tk4vU1ALyjTbo-4gj8yuIdpfBcgRzF5PzUPBv2XpMHUmAPAIF5Z0w-x5ZjK825yTKfVSLxKLarHLTrRplIr5JwM1aV4Zyk99piGs2c1hPJY2qE9QKSyivlTFXNmzvUe4IcMLs1ZhDUH7AABqkVGpTUZ0Dq2n3XJl45MrjhBkAbA077To70oCBwWJ4DtgEZHW62UOYNclUT_QyFHyITzNv8HCb_T2pql2OE6esfhyK6DLOAMQ"
            />
            <h1 className="text-xl font-bold text-[#002c85] tracking-tight">Review Console - Schedule Control Office</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">Enterprise Keycloak Single Sign-On (SSO)</p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
              {/* Username Field */}
              <div className="space-y-1 text-left">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider" htmlFor="username">
                  Corporate LDAP ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">person</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50/30 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#002c85] focus:border-transparent transition-all" 
                    id="username" 
                    type="text" 
                    defaultValue="p_mehta@oilindia.in"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1 text-left">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50/30 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#002c85] focus:border-transparent transition-all" 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    defaultValue="************"
                  />
                  <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Privilege Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 mt-4 text-left">
                <span className="material-symbols-outlined text-[#002c85] text-[22px] shrink-0 mt-0.5">admin_panel_settings</span>
                <div>
                  <p className="text-[10px] font-bold text-[#002c85] uppercase tracking-wider">Assigned Privilege</p>
                  <p className="font-mono text-xs font-semibold text-[#1842aa] mt-0.5">ROLE_PLANNER [Primavera P6 Baseline Control Authorized]</p>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <button 
                  onClick={onLogin}
                  className="w-full flex items-center justify-center gap-2 bg-[#002c85] hover:bg-[#1842aa] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer" 
                  type="button"
                >
                  <span>Sign In to Planning Console</span>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-gray-100 text-center flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-blue-700">shield</span>
              <span>OAuth 2.0 / OIDC Compliant</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-green-700">verified_user</span>
              <span>Multi-Factor Auth (MFA) Enabled</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
