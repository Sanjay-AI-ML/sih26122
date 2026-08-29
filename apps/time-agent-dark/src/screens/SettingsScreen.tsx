import { useState } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';


interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}

function Toggle({ value, onChange, color = '#1b1c1c' }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 26,
        borderRadius: 13,
        background: value ? color : '#e4e2e1',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3, left: value ? 25 : 3,
        width: 20, height: 20,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

export default function SettingsScreen() {
  
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [simulateOffline, setSimulateOffline] = useState(false);

  function saveConfig() {
    localStorage.setItem('kadam_settings', JSON.stringify({ darkMode, highContrast, textSize, simulateOffline }));
    console.log('/');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 64, background: '#fbf9f8' }}>
      {/* Header */}
      <header style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #eae8e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: '#1b1c1c' }}>Settings</div>
        <button onClick={() => console.log('/')}>
          <X size={22} color="#747684" />
        </button>
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Dark Mode */}
        <SettingCard>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Dark Mode</div>
            <div style={{ fontSize: 13, color: '#747684' }}>Switch to high-contrast dark theme</div>
          </div>
          <Toggle value={darkMode} onChange={setDarkMode} />
        </SettingCard>

        {/* High Contrast */}
        <SettingCard>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>High Contrast</div>
            <div style={{ fontSize: 13, color: '#747684' }}>Enhance readability in bright sunlight</div>
          </div>
          <Toggle value={highContrast} onChange={setHighContrast} />
        </SettingCard>

        {/* Text Size */}
        <SettingCard>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Text Size</div>
            <div style={{ fontSize: 13, color: '#747684' }}>Adjust global interface text size</div>
          </div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #e4e2e1', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
            {(['sm', 'md', 'lg'] as const).map((sz, i) => (
              <button
                key={sz}
                onClick={() => setTextSize(sz)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  fontWeight: textSize === sz ? 700 : 400,
                  background: textSize === sz ? '#1b1c1c' : '#fff',
                  color: textSize === sz ? '#fff' : '#1b1c1c',
                  fontSize: sz === 'sm' ? 13 : sz === 'md' ? 15 : 17,
                  borderRight: i < 2 ? '1px solid #e4e2e1' : 'none',
                }}
              >
                {sz === 'sm' ? 'A-' : sz === 'md' ? 'MD' : 'A+'}
              </button>
            ))}
          </div>
        </SettingCard>

        {/* Simulate Offline */}
        <SettingCard>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Simulate Offline</span>
              <span style={{ background: '#da251c', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>DEMO</span>
            </div>
            <div style={{ fontSize: 13, color: '#747684' }}>Force local cache only</div>
          </div>
          <Toggle value={simulateOffline} onChange={setSimulateOffline} color="#da251c" />
        </SettingCard>
      </div>

      {/* Save + Reset */}
      <div style={{ marginTop: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={saveConfig}
          style={{
            width: '100%',
            background: '#e1b91b',
            color: '#fff',
            padding: '14px',
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          <Save size={16} /> Save Configuration
        </button>
        <button
          onClick={() => { setDarkMode(false); setHighContrast(false); setTextSize('md'); setSimulateOffline(false); }}
          style={{
            width: '100%',
            background: '#fff',
            border: '1px solid #e4e2e1',
            color: '#666666',
            padding: '14px',
            borderRadius: 2,
            fontWeight: 500,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <RotateCcw size={15} /> Reset to Defaults
        </button>
      </div>
    </div>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 2,
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      {children}
    </div>
  );
}
