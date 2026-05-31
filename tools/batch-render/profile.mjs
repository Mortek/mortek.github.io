// Locked look for automated renders. Each key is a DOM control id; each value
// is that control's option `value` (selects) or raw value (range inputs).
// Confirmed against music_visualizer.html on 2026-05-31. Edit here to retune.
const SHARED = {
  // Particles
  partStyle: 'sparksint',   // Sparks Intensified
  partIntensity: '2',       // High
  partAmount: '500',        // Tons (500)
  partSpeed: '1',           // Fast
  partSize: '1',            // Normal
  partLife: '4',            // Very Long
  bassReact: '70',          // Strong
  // Spectrum Bars (barIntensity is set per-tab below)
  barThreshold: '0.08',     // Low
  barCount: '100',
  barWidth: '2.5',          // Normal
  barLength: '0.07',        // Short
  barSmoothing: '0.003',    // Smooth
  innerRadius: '110',       // Small
  barCaps: '0',             // Off
  barGlow: '6',             // Subtle
  reactRadius: '0.5',       // Strong
  // Visual
  colorScheme: 'imageColors',
  overlay: '0',             // None
  centerShadow: '0.9',      // Very Dark
  logoTint: '40',           // 40%
  partGlow: '8',            // Subtle
  partTrails: '0.5',        // Faint
  vigColor: '0',            // Off
  colorCycle: '0',          // Off
  // Background FX
  bassZoom: '0.003',        // Very Subtle
  brightPulse: '0',         // Off
  vigPulse: '0.35',         // Strong
  hueShift: '0.1',          // Very Slow (inert while Enable Hue is off)
  hueSat: '100',            // 100%
  cameraShake: '1',         // Very Subtle
};

export const LANDSCAPE_PROFILE = { ...SHARED, barIntensity: '2' };   // High
export const SHORTS_PROFILE = { ...SHARED, barIntensity: '1.5', shortsDur: '58' }; // Medium-High, 60 sec
export const HUE_ENABLED = false; // "Enable Hue" checkbox

// Runs IN THE PAGE (passed to page.evaluate). Sets every control and fires the
// input/change events the visualizer listens for. `hueOn` toggles the checkbox.
export function applyProfileInPage(values, hueOn) {
  for (const [id, val] of Object.entries(values)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const hue = document.getElementById('hueShiftOn');
  if (hue) {
    hue.checked = !!hueOn;
    hue.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
