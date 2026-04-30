export const TUBE = {
  lengthKm: 28.7,
  boreDiameterM: 5.0,
  outerDiameterM: 13.0,
  coilCount: 1147,
  coilMaterial: "NbTi (Niobium-Titanium)",
  coilTemp: "4.2 K (liquid helium)",
  coilField: "8 Tesla peak",
  vacuumAtm: 0.001,
  elevationDeg: 15,
  accelGs: 70,
  exitSpeedMach: 3.5,
  transitSec: 23,
  energyMJ: 900,
} as const;

export const SEAL = {
  name: "Three-Layer Thermite Membrane",
  layers: [
    {
      name: "Carbon Fiber Diaphragm",
      color: "#1a1a1a",
      thickness: "4 mm",
      role: "Primary vacuum boundary — maintains 0.001 atm bore pressure",
    },
    {
      name: "Aerogel Buffer",
      color: "#aaaaaa",
      thickness: "8 mm",
      role: "Thermal isolation between CF layer and thermite charge",
    },
    {
      name: "Al/Fe₂O₃ Thermite Layer",
      color: "#ffaa00",
      thickness: "6 mm",
      role: "Self-consumes in < 50 μs on WC tip contact — zero debris",
    },
  ],
  rupturePressurePa: 4800,
  burnTimeUs: 50,
} as const;

export const NOSE = {
  designName: "Manna Penetrator Type 1",
  layers: [
    {
      name: "WC-Co Tip",
      color: "#e8e8e8",
      thickness: "5 mm",
      role: "Tungsten carbide-cobalt — initiates seal rupture, handles 12 GPa impact stress",
    },
    {
      name: "SiC Ogive",
      color: "#ddddcc",
      thickness: "22 mm",
      role: "Silicon carbide ceramic — hypersonic shockwave shaping, 1400°C rated",
    },
    {
      name: "C/C Composite",
      color: "#1a1a1a",
      thickness: "18 mm",
      role: "Carbon-carbon thermal protection — ablative shield for muzzle blast",
    },
    {
      name: "Duocel® Foam Core",
      color: "#446688",
      thickness: "30 mm",
      role: "Open-cell aluminum foam — decelerates internal components across 300 Gs",
    },
    {
      name: "Ti-6Al-4V Collar",
      color: "#8899aa",
      thickness: "12 mm",
      role: "Titanium structural ring — bonds nose assembly to main body",
    },
  ],
} as const;

export const ENERGY = {
  storedMJ: 900,
  peakPowerGW: 45,
  coilSwitchingUs: 87,
  cryoSystemKW: 240,
  chargeTimeSec: 420,
  stages: [
    { label: "T−420s", event: "Begin coil pre-charge" },
    { label: "T−60s", event: "Vacuum pump-down to 0.001 atm" },
    { label: "T−5s", event: "Cryogenic coils at 4.2 K, all 1,147 confirmed" },
    { label: "T 0", event: "Pod loaded at breach, seal inserted" },
    { label: "T+0s", event: "Coil firing sequence initiated — 900 MJ release" },
    { label: "T+23s", event: "Pod exits muzzle at Mach 3.5 · 4,287 km/h" },
    { label: "T+23.05s", event: "Seal self-destructs in < 50 μs, bore re-pressurizes" },
  ],
} as const;
