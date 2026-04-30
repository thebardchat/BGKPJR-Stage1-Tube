<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";

  let container: HTMLDivElement;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let raf = 0;
  let last = 0;
  let resizeObs: ResizeObserver | null = null;

  // Pod position (0 → 1 across visible section)
  let podT = 0;
  let coilMeshes: THREE.Mesh[] = [];
  let fieldCurves: THREE.Mesh[] = [];
  let cameraAngle = 0;
  let podGroup: THREE.Group;
  let noseTip: THREE.Mesh;
  let noseTipMat: THREE.MeshStandardMaterial;

  // Coil X positions along the tube (in scene units)
  const COIL_X = [-80, -64, -48, -32, -16, 0, 16, 32, 48, 64, 80];

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * Math.min(Math.max(t, 0), 1);
  }

  function podWorldX() {
    return lerp(-88, 88, podT);
  }

  // Build a single magnetic field arc: from one side of active coil, loops around pod
  function buildFieldArc(
    startX: number, radius: number, side: number, // side = 1 (above) or -1 (below)
    color: number
  ): THREE.Mesh {
    const points: THREE.Vector3[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const angle = s * Math.PI; // 0 → π
      const x = startX + Math.cos(angle) * 10; // arc spans 20 units in X
      const y = side * (radius + Math.sin(angle) * 8);
      points.push(new THREE.Vector3(x, y, 0));
    }
    const curve  = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.5, 6, false);
    const mat     = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.6,
    });
    return new THREE.Mesh(tubeGeo, mat);
  }

  function init() {
    if (!container) return;
    const W = container.clientWidth;
    const H = container.clientHeight;

    scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x030810);
    scene.fog = new THREE.Fog(0x030810, 200, 500);

    camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 2000);
    camera.position.set(0, 55, 130);
    camera.lookAt(0, -5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping  = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x0d1f38, 2.5));
    const key = new THREE.DirectionalLight(0xfff0e0, 2.8);
    key.position.set(40, 120, 80);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x0044aa, 1.2);
    fill.position.set(-60, 20, -40);
    scene.add(fill);

    // ── OUTER BARREL SHELL (semi-transparent so coils are visible inside) ──
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x1c2d42,
      emissive: 0x020810,
      metalness: 0.88,
      roughness: 0.15,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const outerBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(13, 13, 200, 48, 1, false),
      barrelMat,
    );
    outerBarrel.rotation.z = Math.PI / 2;
    scene.add(outerBarrel);

    // Barrel end caps (solid — the muzzle and breach faces)
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1c2d42, metalness: 0.8, roughness: 0.2,
    });
    const muzzleCap = new THREE.Mesh(new THREE.CircleGeometry(13, 32), capMat);
    muzzleCap.position.x  = 100;
    muzzleCap.rotation.y  = -Math.PI / 2;
    scene.add(muzzleCap);

    const breachCap = new THREE.Mesh(new THREE.CircleGeometry(13, 32), capMat);
    breachCap.position.x = -100;
    breachCap.rotation.y  = Math.PI / 2;
    scene.add(breachCap);

    // ── INNER BORE (evacuated, dark) ──
    const bore = new THREE.Mesh(
      new THREE.CylinderGeometry(7.5, 7.5, 202, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x000508, side: THREE.BackSide }),
    );
    bore.rotation.z = Math.PI / 2;
    scene.add(bore);

    // ── BARREL EDGE RING HIGHLIGHT (visible structure lines) ──
    const edgeRingGeo = new THREE.TorusGeometry(13, 0.3, 6, 48);
    const edgeRingMat = new THREE.MeshBasicMaterial({ color: 0x1a3a5c });
    for (const x of [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100]) {
      const r = new THREE.Mesh(edgeRingGeo, edgeRingMat);
      r.position.x = x;
      r.rotation.y = Math.PI / 2;
      scene.add(r);
    }

    // ── EM COIL RINGS (NbTi superconducting, inside barrel wall) ──
    coilMeshes = [];
    for (const x of COIL_X) {
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0x1040a0,
        emissive: new THREE.Color(0x002299),
        emissiveIntensity: 0.6,
        metalness: 0.95,
        roughness: 0.05,
      });
      // Outer winding ring
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(11, 2.2, 10, 28),
        coilMat,
      );
      coil.position.x = x;
      coil.rotation.y = Math.PI / 2;
      scene.add(coil);
      coilMeshes.push(coil);

      // Inner thin accent ring (bore edge glow)
      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(7.6, 0.4, 6, 24),
        new THREE.MeshBasicMaterial({ color: 0x001155, transparent: true, opacity: 0.5 }),
      );
      inner.position.x = x;
      inner.rotation.y = Math.PI / 2;
      scene.add(inner);
    }

    // ── MUZZLE RING (glowing cyan exit point) ──
    const muzzleRing = new THREE.Mesh(
      new THREE.TorusGeometry(13.5, 3, 12, 36),
      new THREE.MeshStandardMaterial({
        color: 0x00b8d9,
        emissive: 0x00e5ff,
        emissiveIntensity: 1.4,
        metalness: 0.9,
        roughness: 0,
      }),
    );
    muzzleRing.position.x = 100;
    muzzleRing.rotation.y = Math.PI / 2;
    scene.add(muzzleRing);

    // ── MUZZLE SEAL (the proprietary membrane — shown at exit face) ──
    // Represented as a thin disc with a distinctive layered material
    const sealDisc = new THREE.Mesh(
      new THREE.CircleGeometry(7.4, 32),
      new THREE.MeshStandardMaterial({
        color: 0x884400,
        emissive: 0x331100,
        emissiveIntensity: 0.4,
        metalness: 0.3,
        roughness: 0.7,
        transparent: true,
        opacity: 0.88,
      }),
    );
    sealDisc.position.x = 99;
    sealDisc.rotation.y = -Math.PI / 2;
    scene.add(sealDisc);

    // Seal layer lines (showing the 3-layer construction)
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2 + i * 1.6, 0.2, 6, 24),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffcc00 : i === 1 ? 0xaaaaaa : 0x884400 }),
      );
      ring.position.x = 99;
      ring.rotation.y = -Math.PI / 2;
      scene.add(ring);
    }

    // ── BREACH RING (loading end) ──
    const breachRing = new THREE.Mesh(
      new THREE.TorusGeometry(13.5, 2.5, 12, 36),
      new THREE.MeshStandardMaterial({ color: 0x1040a0, emissive: 0x000d44, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.05 }),
    );
    breachRing.position.x = -100;
    breachRing.rotation.y = Math.PI / 2;
    scene.add(breachRing);

    // ── POD with ADVANCED NOSE CONE ──
    podGroup = new THREE.Group();
    scene.add(podGroup);

    // Main body
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(5.5, 14, 10, 18),
      new THREE.MeshStandardMaterial({ color: 0xb8cce0, emissive: 0x001830, metalness: 0.55, roughness: 0.45 }),
    );
    body.rotation.z = Math.PI / 2;
    podGroup.add(body);

    // Nose cone — SiC ceramic ogive body
    const noseBody = new THREE.Mesh(
      new THREE.ConeGeometry(5.5, 11, 20),
      new THREE.MeshStandardMaterial({ color: 0xddddcc, emissive: 0x110800, metalness: 0.2, roughness: 0.6 }),
    );
    noseBody.position.x = 13;
    noseBody.rotation.z = -Math.PI / 2;
    podGroup.add(noseBody);

    // Tungsten carbide penetrator tip (bright silver-gray, very hard)
    noseTipMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      emissive: 0x111111,
      metalness: 0.98,
      roughness: 0.02,
    });
    noseTip = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5, 16), noseTipMat);
    noseTip.position.x = 18.5;
    noseTip.rotation.z = -Math.PI / 2;
    podGroup.add(noseTip);

    // Carbon-carbon thermal protection band (dark band on nose)
    const ccBand = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 5.6, 3, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x050505, metalness: 0.05, roughness: 0.95 }),
    );
    ccBand.rotation.z = Math.PI / 2;
    ccBand.position.x = 7;
    podGroup.add(ccBand);

    // Armature section (magnetic coupling — distinct band)
    const armature = new THREE.Mesh(
      new THREE.CylinderGeometry(5.7, 5.7, 6, 20),
      new THREE.MeshStandardMaterial({ color: 0x2255cc, emissive: 0x001188, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.1 }),
    );
    armature.rotation.z = Math.PI / 2;
    armature.position.x = -2;
    podGroup.add(armature);

    // Tail cone
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(5.5, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x809ab8, emissive: 0x001122, metalness: 0.6, roughness: 0.35 }),
    );
    tail.position.x = -14;
    tail.rotation.z = Math.PI / 2;
    podGroup.add(tail);

    // ── FIELD LINE ARCS (created dynamically in tick) ──
    // Placeholder — rebuilt each frame based on coil activity

    // ── GROUND REFERENCE GRID ──
    const grid = new THREE.GridHelper(400, 20, 0x0a1830, 0x071426);
    grid.position.y = -14;
    scene.add(grid);

    resizeObs = new ResizeObserver(() => {
      const W2 = container.clientWidth;
      const H2 = container.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    });
    resizeObs.observe(container);
  }

  let frameCount = 0;

  function tick(now: number) {
    if (!last) last = now;
    const dt = Math.min(now - last, 80) / 1000;
    last = now;
    frameCount++;

    // Advance pod
    podT = (podT + dt * 0.09) % 1;
    const px = podWorldX();
    podGroup.position.x = px;

    // Slowly orbit camera for cinematic depth
    cameraAngle += dt * 0.035;
    const camR = 145;
    const camH = 55;
    camera.position.set(
      Math.sin(cameraAngle) * camR * 0.3,
      camH,
      Math.cos(cameraAngle * 0.4) * 20 + 120,
    );
    camera.lookAt(0, -4, 0);

    // Coil activation chase effect
    for (let i = 0; i < coilMeshes.length; i++) {
      const cx  = COIL_X[i];
      const ahead = cx - px;  // positive = coil ahead of pod
      const mat  = coilMeshes[i].material as THREE.MeshStandardMaterial;

      if (ahead > 0 && ahead < 32) {
        // Active leading coils — pulling pod forward
        const str = 1 - ahead / 32;
        mat.emissiveIntensity = 0.8 + str * 12;
        mat.emissive.setRGB(
          lerp(0, 0.1, str),
          lerp(0.14, 0.6, str),
          lerp(0.6, 1.0, str),
        );
        mat.color.setRGB(
          lerp(0.06, 0.2, str),
          lerp(0.25, 0.6, str),
          lerp(0.63, 1.0, str),
        );
      } else if (ahead < 0 && ahead > -20) {
        // Just-passed coils — fading out (de-energized to prevent back-pull)
        const fade = (ahead + 20) / 20;
        mat.emissiveIntensity = 0.3 + fade * 2.5;
        mat.emissive.setRGB(0, lerp(0, 0.12, fade), lerp(0.4, 0.6, fade));
        mat.color.setRGB(0.06, lerp(0.12, 0.25, fade), lerp(0.4, 0.63, fade));
      } else {
        // Inactive coils — dim standby
        mat.emissiveIntensity = 0.25;
        mat.emissive.setHex(0x001155);
        mat.color.setHex(0x0a2060);
      }
    }

    // Nose tip glows slightly when approaching active coil zone
    if (noseTipMat) {
      const nearSeal = px > 70; // approaching muzzle
      noseTipMat.emissiveIntensity = nearSeal ? 0.4 + Math.sin(frameCount * 0.2) * 0.2 : 0;
      noseTipMat.emissive.setHex(nearSeal ? 0xff4400 : 0x000000);
    }

    // Remove old field lines
    for (const fl of fieldCurves) {
      scene.remove(fl);
      fl.geometry.dispose();
    }
    fieldCurves = [];

    // Build field line arcs for the 2 most active leading coils
    for (let i = 0; i < COIL_X.length; i++) {
      const cx    = COIL_X[i];
      const ahead = cx - px;
      if (ahead <= 0 || ahead > 28) continue;
      const str   = 1 - ahead / 28;
      if (str < 0.3) continue;

      // Build 2 arcs per active coil (one above, one below)
      for (const side of [1, -1]) {
        const arcPts: THREE.Vector3[] = [];
        const steps = 24;
        for (let k = 0; k <= steps; k++) {
          const s = k / steps;
          const arcX = cx - 14 + s * 28;          // spans 28 units centered on coil
          const arcY = side * (8 + Math.sin(s * Math.PI) * 10); // arc peaks at 18
          arcPts.push(new THREE.Vector3(arcX, arcY, 0));
        }
        const curve  = new THREE.CatmullRomCurve3(arcPts);
        const tubeGeo = new THREE.TubeGeometry(curve, 18, lerp(0.2, 0.7, str), 5, false);
        const arcMesh = new THREE.Mesh(
          tubeGeo,
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setRGB(lerp(0, 0.2, str), lerp(0.4, 0.8, str), 1),
            transparent: true,
            opacity: lerp(0.15, 0.55, str),
          }),
        );
        scene.add(arcMesh);
        fieldCurves.push(arcMesh);
      }
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      init();
      podT = 0.5;
      tick(performance.now());
      cancelAnimationFrame(raf);
      return;
    }
    init();
    raf = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
    resizeObs?.disconnect();
    renderer?.dispose();
  });
</script>

<div class="tube-vis-frame">
  <div class="canvas-host" bind:this={container}></div>

  <!-- Component labels overlay -->
  <div class="labels">
    <div class="label-item" style="top:12%;left:4%">
      <span class="dot cyan"></span>
      <span class="lt">EM COIL RING (NbTi · 4.2K · 8T)</span>
    </div>
    <div class="label-item" style="top:12%;right:4%">
      <span class="lt">MUZZLE SEAL (3-LAYER MEMBRANE)</span>
      <span class="dot amber"></span>
    </div>
    <div class="label-item" style="bottom:34%;left:4%">
      <span class="dot steel"></span>
      <span class="lt">OUTER BARREL SHELL (STEEL / COMPOSITE)</span>
    </div>
    <div class="label-item" style="bottom:34%;right:4%">
      <span class="lt">WC PENETRATOR TIP</span>
      <span class="dot white"></span>
    </div>
    <div class="label-item" style="bottom:16%;left:4%">
      <span class="dot dark"></span>
      <span class="lt">EVACUATED BORE (0.1 ATM)</span>
    </div>
    <div class="label-item" style="bottom:16%;right:4%">
      <span class="lt">SUPERCONDUCTING ARMATURE</span>
      <span class="dot blue"></span>
    </div>
  </div>

  <div class="status-bar">
    <span class="sb-label">COILGUN SEQUENCE ACTIVE</span>
    <span class="sb-pulse"></span>
    <span class="sb-label">LEADING COILS PULL · TRAILING COILS DE-ENERGIZE · 900 MJ STORED</span>
  </div>
</div>

<style>
.tube-vis-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16/7;
  min-height: 360px;
  border: 1px solid #192e4c;
  border-radius: 14px;
  overflow: hidden;
  background: #030810;
}
.canvas-host { position: absolute; inset: 0; }

.labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.label-item {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  letter-spacing: .1em;
  color: #344d66;
}
.dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.dot.cyan  { background: #00e5ff; box-shadow: 0 0 6px #00e5ff; }
.dot.amber { background: #ffaa00; box-shadow: 0 0 6px #ffaa00; }
.dot.steel { background: #4a6e96; }
.dot.white { background: #e0e0e0; }
.dot.dark  { background: #0a2040; border: 1px solid #192e4c; }
.dot.blue  { background: #2255cc; box-shadow: 0 0 6px #2255cc; }

.status-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(3,8,16,.88);
  border-top: 1px solid #192e4c;
  padding: 7px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  letter-spacing: .1em;
  color: #344d66;
}
.sb-label { color: #254469; }
.sb-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: #00e5ff;
  box-shadow: 0 0 8px #00e5ff;
  animation: sbp 1.2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes sbp { 0%,100%{opacity:1;} 50%{opacity:.2;} }
</style>
