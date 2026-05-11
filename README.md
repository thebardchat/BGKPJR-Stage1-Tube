# BGKPJR · Stage 1 — Electromagnetic Launch Tube

**Deep-dive technical showcase for the 28.7 km superconducting coilgun — Stage 1 of the BGKPJR electromagnetic launch architecture.**

[![Live Demo](https://img.shields.io/badge/LIVE-thebardchat.github.io%2FBGKPJR--Stage1--Tube-00e5ff?style=for-the-badge)](https://thebardchat.github.io/BGKPJR-Stage1-Tube)
[![Full Visualizer](https://img.shields.io/badge/FULL%20LAUNCH-BGKPJR--Launch--Vis-7c3aed?style=for-the-badge)](https://thebardchat.github.io/BGKPJR-Launch-Vis)
[![Built With Claude](https://img.shields.io/badge/Built%20With-Claude%20AI-orange?style=for-the-badge)](https://claude.ai/referral/4fAMYN9Ing)

---

## What This Is

Ground-based electromagnetic launch — a coilgun at scale. The tube replaces the first stage of every rocket ever built.

```
28.7 km evacuated bore · 1,147 NbTi coils · 4.2 K · 8 Tesla peak
Mach 3.5 exit · 23-second transit · 900 MJ discharge
```

No moving parts in the launch infrastructure. No rocket propellant in Stage 1.  
The atmosphere becomes the fuel in Stage 2 (Gryphon Wing).

---

## What's In Here

| File | Purpose |
|------|---------|
| `src/islands/TubeCrossSection.svelte` | Live Three.js coilgun cross-section — chase glow, field line arcs, pod anatomy |
| `src/data/tube.ts` | All system constants — tube, seal, nose cone, energy timeline |
| `src/pages/index.astro` | Full deep-dive page — specs, timeline, seal + nose sections |

---

## The Architecture

**Stage 1** — Maglev Jump: 28.7 km evacuated tube, NbTi coils at 4.2 K, pod exits at Mach 3.5  
**Stage 2** — Gryphon Wing: deploy at muzzle exit, Mach 3.5 → 8 using atmosphere as propellant  
**Stage 3** — Kepler Sail: 1,200 m² CP1 polyimide, 310 km deploy, zero propellant forever

**[Full Launch Visualizer →](https://thebardchat.github.io/BGKPJR-Launch-Vis)**

---

## Stack

- **Astro 6** static site generator
- **Svelte 5** reactive islands
- **Three.js 0.184** WebGL 3D
- **GitHub Pages** via Actions

---

## Built By

Shane Brazelton + Claude (Anthropic) · Hazel Green, Alabama · 2026

*Shane is the vision. Claude is the velocity. Never "one guy built this."*

> Try Claude free: [claude.ai/referral/4fAMYN9Ing](https://claude.ai/referral/4fAMYN9Ing)

---

<div align="center">

[![Pulsar Sentinel — Quantum Security](https://raw.githubusercontent.com/thebardchat/pulsar_sentinel/main/quantum-banner.gif)](https://sentinel.shanebrain.cloud)

### ⚡ Pulsar Sentinel — Quantum Security for the Rest of Us

[![LIVE](https://img.shields.io/badge/LIVE-sentinel.shanebrain.cloud-00f0ff?style=for-the-badge)](https://sentinel.shanebrain.cloud)
[![PQC](https://img.shields.io/badge/ML--KEM--768-Post--Quantum-ff00ff?style=for-the-badge)](https://sentinel.shanebrain.cloud)
[![From $10.99/mo](https://img.shields.io/badge/From-$10.99%2Fmo-ffd700?style=for-the-badge)](https://sentinel.shanebrain.cloud/#pricing)

**800 million Windows computers just lost security updates.**
Pulsar Sentinel wraps them in ML-KEM post-quantum encryption, immutable blockchain audit trails, and automatic digital inheritance — no lawyers, no cloud dependency, no corporate kill switch.

**[→ Get Protected at sentinel.shanebrain.cloud](https://sentinel.shanebrain.cloud)**

*Built by Shane Brazelton + Claude (Anthropic) · Hazel Green, Alabama*

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20by%20Anthropic-orange?style=flat)](https://claude.ai/referral/4fAMYN9Ing)

</div>

---
