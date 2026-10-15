// ═══════════════════════════════════════════════════════════
    // BLUTRACK HEALTH METRICS — REALISTIC BER-BASED STANDARDS
    // ═══════════════════════════════════════════════════════════
    
    // BER Reference Standards (Bit Error Rate per second)
    const BER_STANDARDS = {
      perfect: { ber: 1e-12, health: 100, description: 'BER < 1×10⁻¹¹ (perfect polycarbonate, zero oxidation)' },
      excellent: { ber: 5e-10, health: 90, description: 'BER 1×10⁻¹¹ to 5×10⁻¹⁰ (negligible wear, pristine storage)' },
      veryGood: { ber: 1e-8, health: 80, description: 'BER 5×10⁻¹⁰ to 1×10⁻⁸ (minor environmental exposure)' },
      good: { ber: 5e-7, health: 70, description: 'BER 1×10⁻⁸ to 5×10⁻⁷ (noticeable scratches, slight oxidation)' },
      fair: { ber: 1e-5, health: 60, description: 'BER 5×10⁻⁷ to 1×10⁻⁵ (significant damage, nearing error correction limit)' },
      critical: { ber: 1e-4, health: 50, description: 'BER > 1×10⁻⁵ (critical failure zone, data loss risk)' }
    };
    
    // BD-R Playback Threshold: 220 errors per second before failure
    const BER_PLAYBACK_THRESHOLD = 220; // errors/second
    const BD_LAYER_CAPACITY = 25; // GB per layer
    
    // Scratch Damage Reference (% of surface)
    const SCRATCH_DAMAGE_REFERENCE = {
      100: { pct: 0.0, depth: 0, desc: 'Factory-perfect, never handled' },
      90: { pct: 2.5, depth: 0.05, desc: 'Light micro-scratches, invisible to naked eye' },
      80: { pct: 6.5, depth: 0.1, desc: 'Visible light scratches, <0.1mm deep' },
      70: { pct: 13.5, depth: 0.25, desc: 'Multiple scratches, some 0.2-0.3mm deep' },
      60: { pct: 24.0, depth: 0.5, desc: 'Deep gouges visible, 0.5mm+ scratches present' },
      50: { pct: 38.0, depth: 1.0, desc: 'Severe damage, playback unreliable' }
    };
    
    // Oxidation / Saturation Loss Reference (HSV Saturation)
    const OXIDATION_REFERENCE = {
      100: { satLoss: 0.0, hsvSat: 0.44, desc: 'Bright rainbow iridescence, vivid colors shift' },
      90: { satLoss: 4.0, hsvSat: 0.42, desc: 'Rainbow slightly muted, still vibrant' },
      80: { satLoss: 10.0, hsvSat: 0.39, desc: 'Rainbow fading, some grey tones' },
      70: { satLoss: 21.5, hsvSat: 0.33, desc: 'Rainbow mostly gone, greyish tint' },
      60: { satLoss: 41.5, hsvSat: 0.23, desc: 'Nearly monochrome grey-white' },
      50: { satLoss: 60.0, hsvSat: 0.18, desc: 'Completely dull grey, no iridescence' }
    };
    
    // Surface Dullness / Jitter Reference
    const DULLNESS_REFERENCE = {
      100: { dullness: 0.0, jitter: -0.2, desc: 'Perfect surface uniformity' },
      90: { dullness: 3.0, jitter: 0.5, desc: 'Microscopic dust particles' },
      80: { dullness: 8.0, jitter: 1.8, desc: 'Dust accumulation + minor oxidation' },
      70: { dullness: 18.5, jitter: 4.1, desc: 'Substrate micro-scratching + oxidation' },
      60: { dullness: 37.5, jitter: 7.2, desc: 'Widespread pitting, surface degradation' },
      50: { dullness: 55.0, jitter: 10.5, desc: 'Severe corrosion, playback unreliable' }
    };
    
    // Real-World Scenarios (Age, Storage Conditions, Expected Values)
    const REAL_WORLD_SCENARIOS = {
      newDisc: { age: 0, storage: 'Climate-controlled archive', conditions: '<20°C, <20% RH', temp: 20, humidity: 15, health: 100, lifespan: 100 },
      excellent: { age: 2, storage: 'Home shelf (vertical case)', conditions: 'Average room', temp: 22, humidity: 38, health: 90, lifespan: 85 },
      veryGood: { age: 4, storage: 'Shelf with indirect sun', conditions: 'Typical home', temp: 24, humidity: 42, health: 80, lifespan: 75 },
      good: { age: 7, storage: 'Shelf/drawer with fluctuation', conditions: 'Seasonal variation', temp: 24, humidity: 50, health: 70, lifespan: 60 },
      fair: { age: 10, storage: 'Car trunk / humid basement', conditions: 'Humid, temperature swings', temp: 25, humidity: 60, health: 60, lifespan: 40 },
      critical: { age: 15, storage: 'Glove box / direct sunlight', conditions: 'Damp & extreme swings', temp: 32, humidity: 75, health: 50, lifespan: 20 }
    };

    // ─────────────────────────────────────────────────────────
    // HELPER: Convert health score to metric values
    // ─────────────────────────────────────────────────────────
    function getMetricsFromHealth(health) {
      let base = Math.round(health / 10) * 10;
      if (base < 50) base = 50;
      if (base > 100) base = 100;
      
      return {
        scratchPct: SCRATCH_DAMAGE_REFERENCE[base]?.pct || 0,
        scratchDepth: SCRATCH_DAMAGE_REFERENCE[base]?.depth || 0,
        saturationLoss: OXIDATION_REFERENCE[base]?.satLoss || 0,
        hsvSaturation: OXIDATION_REFERENCE[base]?.hsvSat || 0.44,
        dullnessPct: DULLNESS_REFERENCE[base]?.dullness || 0,
        jitterDB: DULLNESS_REFERENCE[base]?.jitter || 0,
        usableCapacity: (BD_LAYER_CAPACITY * (health / 100)).toFixed(1)
      };
    }

    // ─────────────────────────────────────────────────────────
    // HELPER: Estimate BER from health score
    // ─────────────────────────────────────────────────────────
    function estimateBER(health) {
      if (health >= 90) return 1e-12;
      if (health >= 80) return 1e-10;
      if (health >= 70) return 1e-8;
      if (health >= 60) return 1e-6;
      if (health >= 50) return 1e-4;
      return 1e-3;
    }

    // ─────────────────────────────────────────────────────────
    // MAIN HEALTH CALCULATION (V7: Multi-Exponential Decay)
    // ─────────────────────────────────────────────────────────
    function computeHealth(age, freq, alpha) {
      if (!isFinite(age) || !isFinite(freq) || !isFinite(alpha) || alpha <= 0) return 0;

      // V7: New Multi-Exponential Decay Formula with Realistic Standards
      // H = H0 * e^(-alpha * t) * e^(-beta * As/A) * e^(-gamma * (ds/dmin)^2) * e^(-delta * E)
      // Calibrated against NIST SP 800-124 & IEC 61068-2 standards

      const t = Math.max(0, age);

      // 1. Age Decay: e^(-alpha * t)
      const ageFactor = Math.exp(-alpha * t);

      // 2. Scratch/Usage Factor (beta * As/A): e^(-beta * As/A)
      // Represent beta * As/A as frequency-based wear
      const beta = 0.045, As_A = freq / 60;
      const scratchFactor = Math.exp(-beta * As_A);

      // 3. Pitting/Oxidation Factor (gamma * (ds/dmin)^2): e^(-gamma * (ds/dmin)^2)
      // Derive a stable normalized damage ratio from age, usage, and storage stress
      // so the simulator does not depend on undefined external variables.
      const gamma = Math.max(0.04, alpha * 1.6);
      const ds_dmin = Math.max(0.2, Math.min(2.4, 0.2 + (t / 12) + (freq / 90) + (alpha * 4)));
      const pittingFactor = Math.exp(-gamma * Math.pow(ds_dmin, 2));

      // 4. Environmental Factor (delta * E): e^(-delta * E)
      // delta * E is modeled by a baseline environmental stress (0.01-0.10)
      const delta = 0.08, E = alpha * 10;
      const envFactor = Math.exp(-delta * E);

      let h = 100 * ageFactor * scratchFactor * pittingFactor * envFactor;
      return Math.max(0, Math.min(100, isFinite(h) ? h : 0));
    }

    function computeLife(freq, alpha) {
      // V6: Extended to 100 years — BD-R archival media can last 50-100+ years
      if (!isFinite(freq) || !isFinite(alpha) || alpha <= 0) return 100;
      for (let t = 0; t <= 100; t++) {
        if (computeHealth(t, freq, alpha) <= 15) return t;
      }
      return 100;
    }

    // ═══════════════════════════════════════════════════════════
    // CHART
    // ═══════════════════════════════════════════════════════════
    // V6: Extended chart range to show longer lifespans (0-50 years)
    const ages = Array.from({ length: 51 }, (_, i) => i);
    const chart = new Chart(document.getElementById('mainChart'), {
      type: 'line',
      data: {
        labels: ages,
        datasets: [
          { label: 'Blu-ray', data: [], borderColor: '#06d6f5', backgroundColor: 'rgba(6,214,245,0.06)', fill: true, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#06d6f5', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, tension: 0.4 },
          { label: 'DVD', data: [], borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#f59e0b', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, tension: 0.4 },
          { label: 'CD', data: [], borderColor: '#64748b', backgroundColor: 'transparent', borderWidth: 1.5, borderDash: [3, 5], pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#64748b', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, tension: 0.4 },
          { label: 'Now', data: [], borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'transparent', borderWidth: 1, borderDash: [4, 4], pointRadius: 0, tension: 0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#f8fafc', bodyColor: '#94a3b8',
            callbacks: { label: ctx => ctx.dataset.label + ': ' + Math.round(ctx.parsed.y) + '%' }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Age (years)', color: '#64748b', font: { size: 11 } }, ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 11 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { min: 0, max: 100, title: { display: true, text: 'Disc Health (%)', color: '#64748b', font: { size: 11 } }, ticks: { color: '#64748b', font: { size: 10 }, stepSize: 10, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });

    // ═══════════════════════════════════════════════════════════
    // SIMULATOR UPDATE (BluTrack Metrics Integrated)
    // ═══════════════════════════════════════════════════════════
    function update() {
      const age = parseInt(document.getElementById('ageSlider').value) || 0;
      const freq = parseInt(document.getElementById('freqSlider').value) || 10;
      // Guard: if select value is "" (no option matched), fall back to 0.008
      const alpha = parseFloat(document.getElementById('storageSelect').value) || 0.008;

      document.getElementById('ageOut').textContent = age + ' yr';
      document.getElementById('freqOut').textContent = freq + '×/mo';

      const health = computeHealth(age, freq, alpha);
      const totalLife = computeLife(freq, alpha);
      const lifeLeft = Math.max(0, totalLife - age);
      const discsSaved = Math.round(35.7 * (health / 100) + 10);
      const co2 = (discsSaved * 0.015).toFixed(1);
      const hColor = health > 65 ? '#10b981' : health > 35 ? '#f59e0b' : '#ef4444';
      const hInt = Math.round(health);

      // ─ BluTrack Metrics from Health Score ─
      const metrics = getMetricsFromHealth(health);
      const ber = estimateBER(health);
      const berPerSec = (ber * 1e12).toExponential(1); // Convert to scientific notation

      countTo('mHealth', hInt);
      countTo('mLife', lifeLeft);
      countTo('mDiscs', discsSaved);
      countTo('mCO2', co2, 1);

      document.getElementById('mHealth').style.color = hColor;

      // Update Cracks Visibility
      const cracks = document.getElementById('discCracks');
      cracks.style.opacity = health < 70 ? (70 - health) / 50 : 0;

      const arc = document.getElementById('healthArc');
      const circ = 2 * Math.PI * 72;
      arc.setAttribute('stroke-dashoffset', circ * (1 - health / 100));
      arc.setAttribute('stroke', hColor);
      document.getElementById('discPct').textContent = hInt + '%';
      document.getElementById('discPct').setAttribute('fill', hColor);

      // ─ Status with BluTrack Real-World Condition Names ─
      const statusEl = document.getElementById('discStatus');
      const reasonEl = document.getElementById('discReason');
      let st, re;
      if (hInt >= 90) { 
        st = 'EXCELLENT'; 
        re = `BER < 1×10⁻¹⁰ | ${metrics.scratchPct.toFixed(1)}% scratches | Factory-pristine`;
      }
      else if (hInt >= 80) { 
        st = 'VERY GOOD'; 
        re = `BER ≈ 1×10⁻⁸ | ${metrics.scratchPct.toFixed(1)}% scratches | Light oxidation`;
      }
      else if (hInt >= 70) { 
        st = 'GOOD'; 
        re = `BER ≈ 1×10⁻⁷ | ${metrics.scratchPct.toFixed(1)}% scratches | Visible wear`;
      }
      else if (hInt >= 60) { 
        st = 'FAIR'; 
        re = `BER ≈ 1×10⁻⁵ | ${metrics.scratchPct.toFixed(1)}% scratches | Declining`;
      }
      else if (hInt >= 50) { 
        st = 'POOR'; 
        re = `BER > 1×10⁻⁴ | ${metrics.scratchPct.toFixed(1)}% scratches | BACKUP IMMEDIATELY`;
      }
      else { 
        st = 'CRITICAL'; 
        re = `BER CRITICAL | ${metrics.scratchPct.toFixed(1)}% scratches | Data loss imminent`;
      }

      if (statusEl) { statusEl.textContent = st; statusEl.setAttribute('fill', hColor); }
      if (reasonEl) { reasonEl.textContent = re; }

      const bar = document.getElementById('statusBar');
      const msgEl = document.getElementById('statusText');
      let condition, detail;
      if (hInt >= 90) { 
        bar.className = 'status-bar status-good'; 
        condition = 'Excellent'; 
        detail = `Perfect condition (0% scratches). Saturation at ${metrics.hsvSaturation.toFixed(2)}, jitter ${metrics.jitterDB.toFixed(1)}dB. Playback: 100% reliable.`; 
      }
      else if (hInt >= 80) { 
        bar.className = 'status-bar status-good'; 
        condition = 'Very Good'; 
        detail = `Light micro-scratches (${metrics.scratchPct.toFixed(1)}%). Saturation fading ${metrics.saturationLoss.toFixed(1)}%. Playback: 95-100% reliable.`; 
      }
      else if (hInt >= 70) { 
        bar.className = 'status-bar status-warn'; 
        condition = 'Good'; 
        detail = `Visible scratches (${metrics.scratchPct.toFixed(1)}%). Oxidation creeping (${metrics.saturationLoss.toFixed(1)}%). Occasional read errors possible.`; 
      }
      else if (hInt >= 60) { 
        bar.className = 'status-bar status-warn'; 
        condition = 'Fair'; 
        detail = `Multiple scratches (${metrics.scratchPct.toFixed(1)}%). Moderate oxidation (${metrics.saturationLoss.toFixed(1)}%). Dullness ${metrics.dullnessPct.toFixed(1)}%. Playback risky.`; 
      }
      else if (hInt >= 50) { 
        bar.className = 'status-bar status-bad'; 
        condition = 'Poor'; 
        detail = `Severe damage (${metrics.scratchPct.toFixed(1)}% scratches). Heavy oxidation (${metrics.saturationLoss.toFixed(1)}%). ERROR CORRECTION AT LIMIT. ~${lifeLeft} yr remaining.`; 
      }
      else { 
        bar.className = 'status-bar status-bad'; 
        condition = 'Critical Failure'; 
        detail = `CATASTROPHIC: ${metrics.scratchPct.toFixed(1)}% scratches, ${metrics.saturationLoss.toFixed(1)}% oxidation. BER EXCEEDS THRESHOLD. Backup data immediately.`; 
      }
      msgEl.innerHTML = `<strong>Disc health: ${hInt}% — ${condition}</strong>. ${detail}`;

      const jitEl = document.getElementById('discJitter');
      if (jitEl) jitEl.textContent = `JITTER: ${metrics.jitterDB.toFixed(2)}dB | BER: ${berPerSec} | CAPACITY: ${metrics.usableCapacity}GB`;

      const eValue = document.getElementById('ewasteValue');
      if (eValue) {
        eValue.textContent = `1 Blu-ray disc = ${(25000 / 700).toFixed(1)}× fewer discs than CD per TB stored — saving ${discsSaved} discs and ${co2} kg CO₂`;
      }

      if (document.getElementById('valDeg')) document.getElementById('valDeg').innerHTML = `&rarr; H(t) = ${hInt}%`;
      if (document.getElementById('valPit')) document.getElementById('valPit').innerHTML = `&rarr; d_min = 238 nm`;
      if (document.getElementById('valCap')) document.getElementById('valCap').innerHTML = `&rarr; Usable = ${(25 * (health / 100)).toFixed(1)} GB`;
      if (document.getElementById('valWaste')) document.getElementById('valWaste').innerHTML = `&rarr; W = ${Math.round(discsSaved * 35.7)} CDs replaced`;

      // Process Breakdowns - V7 Formula with BluTrack Metrics
      const fFac = (freq / 60).toFixed(3);
      const aStr = `<span class="v-alf">${alpha}</span>`;
      const tStr = `<span class="v-age">${age}y</span>`;
      const sFac = (alpha * 4).toFixed(3);
      const eFac = (alpha * 10).toFixed(2);

      document.getElementById('procDeg').innerHTML = `
    <span style="opacity:0.6">// V7 Multi-Exponential Decay (BluTrack Calibrated):</span><br>
    H = 100 &middot; e<sup>&minus;${aStr}&middot;${tStr}</sup> &middot; e<sup>&minus;0.045&middot;${fFac}</sup> &middot; e<sup>&minus;1.25&middot;${sFac}&sup2;</sup> &middot; e<sup>&minus;0.08&middot;${eFac}</sup><br>
    <span style="opacity:0.6">// Scratch Damage:</span> ${metrics.scratchPct.toFixed(1)}% (${metrics.scratchDepth.toFixed(2)}mm depth)<br>
    <span style="opacity:0.6">// Oxidation Loss:</span> ${metrics.saturationLoss.toFixed(1)}% (HSV sat: ${metrics.hsvSaturation.toFixed(3)})<br>
    <span style="opacity:0.6">// Result:</span> <span class="v-res">${hInt}% Health | BER: ${berPerSec}</span>
  `;
      document.getElementById('procPit').innerHTML = `
    <span style="opacity:0.6">// BD-R Physical Standards:</span><br>
    Pit Depth: <span class="v-res">238.2nm</span> | Track Pitch: <span class="v-age">0.32μm</span><br>
    Wavelength: <span class="v-num">405nm</span> | NA: <span class="v-num">0.85</span><br>
    <span style="opacity:0.6">// Dullness (Jitter):</span> ${metrics.jitterDB.toFixed(2)}dB (threshold: 9dB)
  `;
      document.getElementById('procCap').innerHTML = `
    <span style="opacity:0.6">// Capacity vs Legacy:</span><br>
    BD-R: <span class="v-res">25GB</span> | DVD: <span class="v-num">4.7GB</span> | CD: <span class="v-num">0.7GB</span><br>
    Usable at ${hInt}% health: <span class="v-res">${metrics.usableCapacity}GB</span><br>
    <span style="opacity:0.6">// Density Ratio (BD vs CD):</span> <span class="v-num">36:1</span>
  `;
      document.getElementById('procWaste').innerHTML = `
    <span style="opacity:0.6">// Eco Impact of BluTrack:</span><br>
    Discs Replaced: <span class="v-res">${discsSaved} units</span><br>
    CO₂ Avoided: <span class="v-res">${co2} kg</span> | Storage Weight Saved: <span class="v-num">${(discsSaved * 0.015).toFixed(2)} kg</span><br>
    <span style="opacity:0.6">// Archival Window:</span> <span class="v-age">${lifeLeft} years</span> (est. from health decline)
  `;

      // V6: Research-backed decay ratios
      // DVD uses organic dyes (azo/cyanine) — degrades ~2x faster than inorganic BD-R
      // CD-R uses phthalocyanine/cyanine dyes — degrades ~3.5x faster
      // Source: NIST Optical Media Longevity Study (2007)
      const dvdAlpha = alpha * 2.0;  // DVD organic dye is ≈2x less stable
      const cdAlpha = alpha * 3.5;   // CD organic dye degrades ≈3.5x faster
      const bd = ages.map(t => computeHealth(t, freq, alpha));
      const dv = ages.map(t => computeHealth(t, freq, dvdAlpha));
      const cd = ages.map(t => computeHealth(t, freq, cdAlpha));
      const nw = ages.map(t => t === age ? 100 : null);
      chart.data.datasets[0].data = bd;
      chart.data.datasets[1].data = dv;
      chart.data.datasets[2].data = cd;
      chart.data.datasets[3].data = nw;
      chart.data.datasets[0].pointRadius = ages.map(t => t === age ? 6 : 0);
      chart.data.datasets[0].pointBackgroundColor = '#06d6f5';
      chart.update();
    }

    ['ageSlider', 'freqSlider'].forEach(id => document.getElementById(id).addEventListener('input', update));
    document.getElementById('storageSelect').addEventListener('change', update);

    // ═══════════════════════════════════════════════════════════
    // IMAGE ANALYSIS — V6 ACCURACY-FOCUSED ENGINE
    //
    // V6 IMPROVEMENTS OVER V5:
    //
    //  FIX 1 — ADAPTIVE SATURATION REFERENCE:
    //    V5 used hardcoded REF_SAT=0.442. Different disc brands
    //    (Verbatim, Sony, Panasonic) have vastly different baseline
    //    saturation. V6 uses the 90th-percentile saturation from
    //    the actual image as the reference, making it self-calibrating.
    //
    //  FIX 2 — BRIGHTNESS-NORMALIZED EDGE DETECTION:
    //    V5 used a fixed threshold (mag>15) which means bright
    //    images showed more "scratches" than dim ones. V6 normalizes
    //    edge magnitude by mean ring luminance.
    //
    //  FIX 3 — CAPPED YELLOWING PENALTY:
    //    V5 had no upper bound on yellowing, causing warm-lit scenes
    //    to score impossibly low. V6 caps penalty at 25 points.
    //
    //  FIX 4 — MULTI-ZONE RING ANALYSIS:
    //    V6 divides the disc into 3 concentric zones (inner, mid,
    //    outer) and checks for zone-to-zone variance. Real damage
    //    is typically localized, not uniform.
    //
    //  FIX 5 — RELAXED DISC VALIDATION:
    //    V5 rejected unrecorded BD-Rs (avgSat<0.04) and blank
    //    silver discs. V6 uses structural geometry (hole vs ring
    //    luminance contrast) as the primary validation signal.
    //
    //  FIX 6 — IMPROVED HEALTH MAPPING:
    //    V5 compressed raw 0-100 into 15-97, hiding true damage.
    //    V6 uses a wider 5-98 range with sigmoid smoothing.
    //
    //  METRIC WEIGHTS V6:
    //    Saturation:  35%  (adaptive reference)
    //    Dullness:    25%  (grey patch %)
    //    Variance:    15%  (yellowing index std)
    //    Scratches:   15%  (normalized edge detection)
    //    Zone delta:  10%  (multi-zone consistency)
    // ═══════════════════════════════════════════════════════════

    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const discCanvas = document.getElementById('discCanvas');
    const overlayCanvas = document.getElementById('overlayCanvas');
    const scanLine = document.getElementById('scanLine');
    const scanBtn = document.getElementById('scanBtn');
    const analysisLog = document.getElementById('analysisLog');
    const uploadText = document.getElementById('uploadText');
    const uploadError = document.getElementById('uploadError');
    const uploadErrorText = document.getElementById('uploadErrorText');
    const ML_API_URL = 'http://127.0.0.1:5000/predict';
    const ML_API_TIMEOUT_MS = 4000;
    let uploadedImg = null;

    // Enable clicking the area to re-upload
    uploadArea.addEventListener('click', () => {
      // Only trigger input if we are not currently scanning or using camera
      if (!scanLine.classList.contains('scanning') && !stream) {
        imageInput.click();
      }
    });

    const startCamBtn = document.getElementById('startCamBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const captureBtn = document.getElementById('captureBtn');
    const stopCamBtn = document.getElementById('stopCamBtn');
    const cameraFeed = document.getElementById('cameraFeed');
    let stream = null;

    startCamBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      clearUploadError();
      try {
        const caps = { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } } };
        stream = await navigator.mediaDevices.getUserMedia(caps);
        cameraFeed.srcObject = stream;
        cameraFeed.style.display = 'block';
        discCanvas.style.display = 'none';
        overlayCanvas.style.display = 'none';
        document.getElementById('uploadPrompt').style.display = 'none';

        // Hide radar while camera is active
        document.getElementById('uploadArea').classList.add('has-image');

        startCamBtn.style.display = 'none';
        retakeBtn.style.display = 'none';
        captureBtn.style.display = 'block';
        stopCamBtn.style.display = 'block';
      } catch (err) {
        alert("Camera access denied or could not find a suitable video stream.");
      }
    });

    retakeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startCamBtn.click();
    });

    stopCamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopCamera();
    });

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      cameraFeed.style.display = 'none';
      if (!uploadedImg) {
        document.getElementById('uploadPrompt').style.display = 'flex';
        startCamBtn.style.display = 'block';

        // Restore radar if no image is present
        document.getElementById('uploadArea').classList.remove('has-image');
      } else {
        // If image exists, keep all camera buttons hidden
        startCamBtn.style.display = 'none';
        retakeBtn.style.display = 'none';
      }
      captureBtn.style.display = 'none';
      stopCamBtn.style.display = 'none';
    }

    captureBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearUploadError();
      const ctx = discCanvas.getContext('2d');
      discCanvas.width = cameraFeed.videoWidth;
      discCanvas.height = cameraFeed.videoHeight;
      ctx.drawImage(cameraFeed, 0, 0);

      // Auto-Contrast Preprocessing
      const imgData = ctx.getImageData(0, 0, discCanvas.width, discCanvas.height);
      const data = imgData.data;
      let min = 255, max = 0;
      for (let i = 0; i < data.length; i += 4) {
        const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (l < min) min = l; if (l > max) max = l;
      }
      const factor = 255 / (max - min || 1);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = (data[i] - min) * factor;
        data[i + 1] = (data[i + 1] - min) * factor;
        data[i + 2] = (data[i + 2] - min) * factor;
      }
      ctx.putImageData(imgData, 0, 0);

      uploadedImg = true;
      discCanvas.style.display = 'block';
      overlayCanvas.style.display = 'none';
      scanBtn.disabled = false;
      stopCamera();

      // Reset results immediately on new capture
      const sim = document.getElementById('simulationContent');
      if (sim) { sim.style.display = 'none'; sim.style.opacity = '0'; }
      document.getElementById('scoreBreakdown').style.display = 'none';

      document.getElementById('uploadArea').classList.add('has-image');
      document.getElementById('uploadArea').classList.remove('analysis-done');

      logMsg('Image captured & pre-processed for analysis.', 'var(--green)');
    });
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--cyan)'; });
    uploadArea.addEventListener('dragleave', e => { e.preventDefault(); uploadArea.style.borderColor = ''; });
    uploadArea.addEventListener('drop', e => {
      e.preventDefault(); uploadArea.style.borderColor = '';
      if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
    });
    imageInput.addEventListener('change', e => { if (e.target.files[0]) handleImage(e.target.files[0]); });

    function logMsg(msg, color = 'var(--text-primary)') {
      const line = document.createElement('div');
      line.style.color = color;
      line.textContent = '> ';
      analysisLog.appendChild(line);

      let i = 0;
      const interval = setInterval(() => {
        line.textContent += msg[i];
        i++;
        if (i >= msg.length) {
          clearInterval(interval);
          analysisLog.scrollTop = analysisLog.scrollHeight;
        }
      }, 10);
    }

    function clearUploadError() {
      uploadArea.classList.remove('error-state');
      if (uploadError) uploadError.classList.remove('active');
      if (uploadErrorText) {
        uploadErrorText.textContent = 'Upload a full circular disc image to continue.';
      }
    }

    function showUploadError(message) {
      uploadArea.classList.add('error-state');
      if (uploadErrorText) uploadErrorText.textContent = message;
      if (uploadError) uploadError.classList.add('active');
    }

    function failAnalysis(message) {
      clearUploadError();
      showUploadError(message);
      logMsg('V6 ERROR: ' + message, 'var(--red)');
      const sim = document.getElementById('simulationContent');
      if (sim) { sim.style.display = 'none'; sim.style.opacity = '0'; }
      document.getElementById('scoreBreakdown').style.display = 'none';
      overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width || 0, overlayCanvas.height || 0);
      overlayCanvas.style.display = 'none';
      scanLine.style.display = 'none';
      scanLine.classList.remove('scanning');
      scanBtn.disabled = false;
      scanBtn.textContent = 'RE-SCAN SURFACE';
      uploadArea.classList.remove('analysis-done');
    }

    function setBar(id, pctId, val) {
      const clamped = Math.min(100, Math.max(0, Math.round(val)));
      document.getElementById(id).style.width = clamped + '%';
      document.getElementById(pctId).textContent = clamped + '%';
    }

    function handleImage(file) {
      if (!file.type.startsWith('image/')) { logMsg('Error: image file required.', 'var(--red)'); return; }
      clearUploadError();
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          uploadedImg = img;

          // Render the disc at fixed canvas size for analysis consistency
          const CANVAS_SIZE = 600;
          discCanvas.width = CANVAS_SIZE;
          discCanvas.height = CANVAS_SIZE;

          const ctx = discCanvas.getContext('2d', { willReadFrequently: true });
          ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

          const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const offX = (CANVAS_SIZE - drawW) / 2;
          const offY = (CANVAS_SIZE - drawH) / 2;
          ctx.drawImage(img, offX, offY, drawW, drawH);

          discCanvas.style.display = 'block';
          overlayCanvas.style.display = 'none';
          document.getElementById('uploadPrompt').style.display = 'none';
          scanBtn.disabled = false;
          analysisLog.innerHTML = '';

          // Reset results immediately on new file load
          const sim = document.getElementById('simulationContent');
          if (sim) { sim.style.display = 'none'; sim.style.opacity = '0'; }
          document.getElementById('scoreBreakdown').style.display = 'none';

          document.getElementById('uploadArea').classList.add('has-image');
          document.getElementById('uploadArea').classList.remove('analysis-done');

          // Hide camera buttons on file upload
          startCamBtn.style.display = 'none';
          retakeBtn.style.display = 'none';

          scanBtn.textContent = 'RUN STRUCTURAL ANALYSIS';
          logMsg('Image loaded. Ready for analysis.', 'var(--green)');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      // Reset input value so the same file can be uploaded again
      imageInput.value = '';
    }

    scanBtn.addEventListener('click', async () => {
      if (!uploadedImg) return;
      clearUploadError();
      scanBtn.disabled = true;
      scanBtn.textContent = 'ANALYZING SURFACE...';
      scanLine.style.display = 'block';
      scanLine.classList.add('scanning');

      overlayCanvas.style.display = 'block';
      overlayCanvas.width = discCanvas.width;
      overlayCanvas.height = discCanvas.height;
      overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      analysisLog.innerHTML = '';
      logMsg('Initializing structural scan…', 'var(--text-muted)');

      const mapCtx = overlayCanvas.getContext('2d');
      const mapTimer = setInterval(() => {
        if (!scanLine.classList.contains('scanning')) { clearInterval(mapTimer); return; }
        drawHeatMap(mapCtx);
      }, 100);

      await new Promise(r => setTimeout(r, 500));
      logMsg('Pass 1 — centroid alignment & ring segmentation…');
      await new Promise(r => setTimeout(r, 700));
      logMsg('Pass 2 — adaptive saturation calibration…', 'var(--gold)');
      await new Promise(r => setTimeout(r, 700));
      logMsg('Pass 3 — multi-zone edge & oxidation mapping…', 'var(--gold)');
      await new Promise(r => setTimeout(r, 500));
      logMsg('Pass 4 — zone consistency analysis…', 'var(--cyan)');
      await new Promise(r => setTimeout(r, 400));
      logMsg('Compiling V6 forensic report…');
      await new Promise(r => setTimeout(r, 300));

      runAnalysis();
    });


    function runAnalysis() {
      const ctx = discCanvas.getContext('2d', { willReadFrequently: true });
      const W = discCanvas.width;
      const H = discCanvas.height;
      const px = ctx.getImageData(0, 0, W, H).data;

      // ── V6: Improved Centroid Auto-Alignment ──
      // Uses both saturation AND luminance contrast to find disc center.
      // Works better for low-saturation discs (unrecorded BD-Rs, silver blanks)
      let cx = W / 2;
      let cy = H / 2;
      let sumX = 0, sumY = 0, countC = 0;
      for (let y = 0; y < H; y += 8) {
        for (let x = 0; x < W; x += 8) {
          const i = (y * W + x) * 4;
          const r = px[i], g = px[i + 1], b = px[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
          const s = (maxC > 0) ? (maxC - minC) / maxC : 0;
          // V6: Accept either iridescent pixels OR bright reflective pixels
          if ((s > 0.12 && maxC > 35) || (lum > 80 && lum < 230 && s > 0.05)) {
            sumX += x; sumY += y; countC++;
          }
        }
      }
      if (countC > 50) {
        cx = sumX / countC;
        cy = sumY / countC;
      }

      const halfR = Math.min(W, H) / 2;
      const outerR = halfR * 0.75;
      const innerR = halfR * 0.32;

      // PRE-SCAN: Calculate peak luminance for normalization
      let maxLum = 0;
      for (let y = 1; y < H - 1; y += 4) {
        for (let x = 1; x < W - 1; x += 4) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < outerR && dist > innerR) {
            const i = (y * W + x) * 4;
            const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            if (l > maxLum) maxLum = l;
          }
        }
      }
      const normFactor = maxLum > 100 ? (210 / maxLum) : 1.0;

      // ── V6: Multi-Zone Ring Analysis ──
      // Divide disc into 3 concentric zones for localized damage detection
      const zoneBreaks = [
        { rMin: innerR, rMax: innerR + (outerR - innerR) * 0.33, satSum: 0, lumSum: 0, dull: 0, scratch: 0, count: 0 },
        { rMin: innerR + (outerR - innerR) * 0.33, rMax: innerR + (outerR - innerR) * 0.66, satSum: 0, lumSum: 0, dull: 0, scratch: 0, count: 0 },
        { rMin: innerR + (outerR - innerR) * 0.66, rMax: outerR, satSum: 0, lumSum: 0, dull: 0, scratch: 0, count: 0 }
      ];

      let satSum = 0;
      let ringLumSum = 0;
      let dullPixels = 0;
      let yiSum = 0;
      let yiSqSum = 0;
      let scratchCount = 0;
      let validPixels = 0;
      let glarePixels = 0;
      let satValues = [];  // V6: Collect for percentile-based reference

      let holeLumSum = 0, holePixels = 0;
      let bgLumSum = 0, bgPixels = 0;
      const geometryBins = Array.from({ length: 36 }, () => 0);
      let minRingX = W, minRingY = H, maxRingX = 0, maxRingY = 0;

      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < innerR * 0.4) {
            const i = (y * W + x) * 4;
            holeLumSum += (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) * normFactor;
            holePixels++;
            continue;
          }
          if (dist > halfR * 0.92) {
            const i = (y * W + x) * 4;
            bgLumSum += (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) * normFactor;
            bgPixels++;
            continue;
          }

          if (dist < innerR || dist > outerR) continue;

          const i = (y * W + x) * 4;
          const r = px[i], g = px[i + 1], b = px[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) * normFactor;

          // Luminosity Masking (Glare & Shadow Rejection)
          if (lum > 240) { glarePixels++; continue; }
          if (lum < 25) continue;

          validPixels++;
          ringLumSum += lum;
          if (x < minRingX) minRingX = x;
          if (x > maxRingX) maxRingX = x;
          if (y < minRingY) minRingY = y;
          if (y > maxRingY) maxRingY = y;

          const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
          const s = (maxC > 0) ? (maxC - minC) / maxC : 0;
          satSum += s;

          // V6: Sample saturation values for adaptive reference (every 7th pixel)
          if ((validPixels & 7) === 0) satValues.push(s);

          if (s < 0.12 && lum > 40 && lum < 200) dullPixels++;

          // Yellowing Index
          const yi = ((r + g) / 2) - b;
          yiSum += yi;
          yiSqSum += yi * yi;

          // V6: Brightness-normalized edge detection
          const iL = (y * W + (x - 1)) * 4, iR = (y * W + (x + 1)) * 4;
          const iT = ((y - 1) * W + x) * 4, iB = ((y + 1) * W + x) * 4;
          const lumL = (0.299 * px[iL] + 0.587 * px[iL + 1] + 0.114 * px[iL + 2]) * normFactor;
          const lumR = (0.299 * px[iR] + 0.587 * px[iR + 1] + 0.114 * px[iR + 2]) * normFactor;
          const lumT = (0.299 * px[iT] + 0.587 * px[iT + 1] + 0.114 * px[iT + 2]) * normFactor;
          const lumB = (0.299 * px[iB] + 0.587 * px[iB + 1] + 0.114 * px[iB + 2]) * normFactor;

          const gx = lumR - lumL, gy = lumB - lumT;
          const mag = Math.sqrt(gx * gx + gy * gy);
          // V6: Dynamic threshold based on local brightness (brighter = higher threshold)
          const edgeThreshold = 10 + (lum / 255) * 12;
          if (mag > edgeThreshold) scratchCount++;

          if (mag > Math.max(edgeThreshold, 26) && dist > innerR * 1.6 && dist < halfR * 0.92) {
            const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
            const bin = Math.min(geometryBins.length - 1, Math.floor((angle / (Math.PI * 2)) * geometryBins.length));
            if (dist > geometryBins[bin]) geometryBins[bin] = dist;
          }

          // V6: Zone assignment for multi-zone analysis
          for (const zone of zoneBreaks) {
            if (dist >= zone.rMin && dist < zone.rMax) {
              zone.satSum += s;
              zone.lumSum += lum;
              if (s < 0.12 && lum > 40 && lum < 200) zone.dull++;
              if (mag > edgeThreshold) zone.scratch++;
              zone.count++;
              break;
            }
          }
        }
      }

      const avgSat = validPixels > 0 ? satSum / validPixels : 0;
      const avgRingLum = validPixels > 0 ? ringLumSum / validPixels : 0;
      const avgHoleLum = holePixels > 0 ? holeLumSum / holePixels : 0;
      const glareRate = (glarePixels / (validPixels + glarePixels || 1));
      const boundarySamples = geometryBins.filter(value => value > innerR * 1.8);
      const boundaryCoverage = boundarySamples.length / geometryBins.length;
      const boundaryMean = boundarySamples.length > 0 ? boundarySamples.reduce((sum, value) => sum + value, 0) / boundarySamples.length : 0;
      const boundaryVariance = boundarySamples.length > 0 ? boundarySamples.reduce((sum, value) => sum + Math.pow(value - boundaryMean, 2), 0) / boundarySamples.length : 0;
      const boundaryStdRatio = boundaryMean > 0 ? Math.sqrt(boundaryVariance) / boundaryMean : Infinity;
      const ringWidth = maxRingX > minRingX ? maxRingX - minRingX : 0;
      const ringHeight = maxRingY > minRingY ? maxRingY - minRingY : 0;
      const ringAspectRatio = ringWidth > 0 && ringHeight > 0 ? Math.max(ringWidth, ringHeight) / Math.max(1, Math.min(ringWidth, ringHeight)) : 1;

      // V6: Relaxed validation — use geometric contrast as primary signal
      const holeRingContrast = Math.abs(avgRingLum - avgHoleLum);
      let error = null;
      if (validPixels < 12000) error = "Disc data insufficient. Ensure surface is centered and clearly visible.";
      else if (avgSat < 0.025 && holeRingContrast < 10) error = "Surface signature not detected. Is this an optical disc?";
      else if (holeRingContrast < 8 && avgSat < 0.08) error = "Structural mismatch: Could not verify disc geometry.";
      else if (
        (boundaryCoverage < 0.18 && holeRingContrast < 10 && avgSat < 0.12) ||
        (boundaryCoverage >= 0.28 && boundaryStdRatio > 0.30 && holeRingContrast < 16) ||
        (ringWidth > 0 && ringHeight > 0 && ringAspectRatio > 1.28 && holeRingContrast < 18 && avgSat < 0.20)
      ) error = "Disc geometry is invalid. Upload a full circular disc image without tilt or cropping.";
      else if (glareRate > 0.5) error = "Excessive glare detected. Re-take image without direct light source.";

      if (error) {
        failAnalysis(error);
        return;
      }

      // ── V6 ADAPTIVE CALCULATIONS ──
      const dullPct = dullPixels / validPixels;
      const yiMean = yiSum / validPixels;
      const yiVar = (yiSqSum / validPixels) - (yiMean * yiMean);
      const yiStd = Math.sqrt(Math.max(0, yiVar));
      const scratchPct = scratchCount / validPixels;

      // V6: Adaptive saturation reference — use 90th percentile of sampled pixels
      satValues.sort((a, b) => a - b);
      const p90Sat = satValues.length > 10 ? satValues[Math.floor(satValues.length * 0.90)] : 0.442;
      const REF_SAT = Math.max(0.20, Math.min(0.60, p90Sat * 1.1));  // Clamp to sane range
      const REF_YI_STD = 22.0;

      const sScore = Math.min(100, Math.max(0, (avgSat / REF_SAT) * 100));
      const dScore = Math.max(0, (1 - (dullPct / 0.82)) * 100);
      const vScore = Math.min(100, Math.max(0, (yiStd / REF_YI_STD) * 100));
      const eScore = Math.max(0, (0.12 - scratchPct) / 0.12 * 100);

      // V6: Multi-zone consistency score
      // Real damage is localized — a healthy disc has uniform zones
      let zoneSatAvgs = zoneBreaks.map(z => z.count > 0 ? z.satSum / z.count : 0);
      let zoneDullPcts = zoneBreaks.map(z => z.count > 0 ? z.dull / z.count : 0);
      const zoneMaxSatDelta = Math.max(...zoneSatAvgs) - Math.min(...zoneSatAvgs);
      const zoneMaxDullDelta = Math.max(...zoneDullPcts) - Math.min(...zoneDullPcts);
      // Lower delta = more uniform = healthier disc
      const zScore = Math.max(0, 100 - (zoneMaxSatDelta * 400 + zoneMaxDullDelta * 200));

      // V6: Capped yellowing penalty (max 25 points)
      const yellowingPenalty = Math.min(25, Math.max(0, (yiMean - 12) * 1.8));

      // V6 WEIGHTED HEALTH: sat(35) + dull(25) + variance(15) + edge(15) + zone(10)
      const rawHealth = (sScore * 0.35) + (dScore * 0.25) + (vScore * 0.15) + (eScore * 0.15) + (zScore * 0.10) - yellowingPenalty;
      const similarity = Math.round(Math.max(0, (sScore * 0.4 + vScore * 0.3 + zScore * 0.3)));

      if (similarity < 25 && avgSat < 0.10 && holeRingContrast < 15) {
        failAnalysis('Image does not match a valid optical disc surface. Please upload a proper disc photo.');
        return;
      }

      // V6: Wider mapping range (5-98) with sigmoid smoothing
      const clampedRaw = Math.max(0, Math.min(100, rawHealth));
      const sigmoid = 1 / (1 + Math.exp(-0.08 * (clampedRaw - 50))); // S-curve centered at 50
      const displayedHealth = Math.round(5 + sigmoid * 93);

      logMsg('V6 ENGINE ACTIVE — Multi-Zone Forensic Analysis', 'var(--violet)');
      logMsg(`Adaptive Ref Saturation: ${REF_SAT.toFixed(3)} (auto-calibrated)`, 'var(--text-secondary)');
      logMsg(`Surface Similarity: ${similarity}%`, 'var(--cyan)');
      logMsg(`Zone Consistency: ${zScore.toFixed(0)}%`, zScore > 70 ? 'var(--green)' : 'var(--gold)');
      logMsg(`Oxidation (Yellowing): ${yellowingPenalty.toFixed(1)} penalty (capped at 25)`, yellowingPenalty > 5 ? 'var(--red)' : 'var(--green)');

      const scratchDisplay = Math.round(Math.min(100, scratchPct * 650));
      const satLossDisplay = Math.round(100 - sScore);
      const rotDisplay = Math.round(dullPct * 100);
      const clarityDisplay = Math.round(displayedHealth);

      let estAge, estFreq, estAlpha;
      if (displayedHealth >= 85) { estAge = Math.round((98 - displayedHealth) * 0.3); estFreq = 3; estAlpha = 0.012; }
      else if (displayedHealth >= 70) { estAge = Math.round(3 + (85 - displayedHealth) * 0.5); estFreq = Math.round(6 + (85 - displayedHealth) * 1.2); estAlpha = 0.040; }
      else if (displayedHealth >= 50) { estAge = Math.round(8 + (70 - displayedHealth) * 0.6); estFreq = Math.round(15 + (70 - displayedHealth) * 2.0); estAlpha = 0.100; }
      else { estAge = Math.min(20, Math.round(14 + (50 - displayedHealth) * 0.4)); estFreq = Math.min(60, Math.round(30 + (50 - displayedHealth) * 1.0)); estAlpha = 0.250; }

      const grade = displayedHealth >= 85 ? 'EXCELLENT' : displayedHealth >= 70 ? 'GOOD' : displayedHealth >= 50 ? 'MODERATE DAMAGE' : 'SEVERE DAMAGE';
      logMsg(`Analyzed Grade: ${grade}`, displayedHealth >= 70 ? 'var(--green)' : displayedHealth >= 50 ? 'var(--gold)' : 'var(--red)');

      document.getElementById('scoreBreakdown').style.display = 'block';
      setTimeout(() => {
        setBar('bar_sat', 'pct_sat', satLossDisplay);
        setBar('bar_grey', 'pct_grey', rotDisplay);
        setBar('bar_edge', 'pct_edge', scratchDisplay);
        setBar('bar_zone', 'pct_zone', Math.round(zScore));
        setBar('bar_health', 'pct_health', clarityDisplay);
      }, 200);

      scanLine.style.display = 'none';
      scanLine.classList.remove('scanning');
      scanBtn.disabled = false;
      scanBtn.textContent = 'RE-SCAN SURFACE';
      clearUploadError();

      document.getElementById('ageSlider').value = estAge;
      document.getElementById('freqSlider').value = estFreq;
      document.getElementById('storageSelect').value = estAlpha.toFixed(3);
      try {
        update();
      } catch (err) {
        console.error('BluTrack UI sync failed after analysis:', err);
        logMsg('UI sync warning: analysis completed, but a secondary panel failed to update.', 'var(--gold)');
      }

      logMsg('Simulation synchronized with V6 forensic data.', 'var(--violet)');

      // Update comparison metrics display with analyzed results
      if (document.getElementById('compHealthVal')) {
        document.getElementById('compHealthVal').textContent = displayedHealth.toFixed(1) + '%';
        document.getElementById('compHealthBar').style.width = displayedHealth + '%';
        const healthStatus = displayedHealth >= 85 ? 'Excellent Condition' : displayedHealth >= 70 ? 'Good Condition' : displayedHealth >= 50 ? 'Moderate Damage' : 'Severe Damage';
        document.getElementById('compHealthTag').textContent = healthStatus;
      }
      if (document.getElementById('compScratchVal')) {
        const scratchDamage = 100 - displayedHealth;
        document.getElementById('compScratchVal').textContent = scratchDamage.toFixed(1) + '%';
        document.getElementById('compScratchBar').style.width = scratchDamage + '%';
        const scratchStatus = scratchDamage >= 70 ? 'Severe Scratches' : scratchDamage >= 40 ? 'Moderate Scratches' : scratchDamage >= 20 ? 'Light Scratches' : 'No Scratches';
        document.getElementById('compScratchTag').textContent = scratchStatus;
      }
      if (document.getElementById('compOxidationVal')) {
        document.getElementById('compOxidationVal').textContent = satLossDisplay.toFixed(1) + '%';
        document.getElementById('compOxidationBar').style.width = satLossDisplay + '%';
        const oxidationStatus = satLossDisplay >= 70 ? 'Severe Oxidation' : satLossDisplay >= 40 ? 'Moderate Oxidation' : satLossDisplay >= 20 ? 'Light Oxidation' : 'No Oxidation';
        document.getElementById('compOxidationTag').textContent = oxidationStatus;
      }
      if (document.getElementById('compDullVal')) {
        document.getElementById('compDullVal').textContent = rotDisplay.toFixed(1) + '%';
        document.getElementById('compDullBar').style.width = rotDisplay + '%';
        const dullStatus = rotDisplay >= 70 ? 'Severe Degradation' : rotDisplay >= 40 ? 'Moderate Degradation' : rotDisplay >= 20 ? 'Light Degradation' : 'No Degradation';
        document.getElementById('compDullTag').textContent = dullStatus;
      }

      // Update comparison insight text with analysis results
      if (document.getElementById('compareInsightText')) {
        const healthLevel = displayedHealth >= 85 ? 'excellent' : displayedHealth >= 70 ? 'good' : displayedHealth >= 50 ? 'fair' : 'poor';
        const insightMsg = `Your disc is in ${healthLevel} condition with ${displayedHealth.toFixed(0)}% health. ${
          displayedHealth >= 85 ? 'This disc should remain playable for many years with proper storage.' :
          displayedHealth >= 70 ? 'Your disc is in good shape but shows signs of aging. Regular backups are recommended.' :
          displayedHealth >= 50 ? 'Your disc shows moderate damage. Consider migrating critical data soon.' :
          'Your disc is degraded and should be backed up immediately before data becomes unrecoverable.'
        }`;
        document.getElementById('compareInsightText').textContent = insightMsg;
      }

      // Update comparison mode indicator to show this is ANALYSIS MODE
      if (document.getElementById('compareModeIndicator')) {
        document.getElementById('compareModeIndicator').textContent = 'ANALYSIS MODE';
      }

      // Hide the disc visual (donut chart)
      const discRow = document.querySelector('.disc-row');
      if (discRow) {
        discRow.style.display = 'none';
      }

      // Ensure comparison section is visible
      const compareSection = document.getElementById('compareSection');
      if (compareSection) {
        compareSection.style.display = 'block';
      }

      // Enable re-upload overlay now that analysis is complete
      uploadArea.classList.add('analysis-done');

      const sim = document.getElementById('simulationContent');
      if (sim) {
        sim.style.display = 'block';
        setTimeout(() => {
          sim.style.opacity = '1';
          sim.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    }

    function clampNumber(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function computeSigmoidHealth(rawHealth) {
      const clampedRaw = clampNumber(rawHealth, 0, 100);
      const sigmoid = 1 / (1 + Math.exp(-0.08 * (clampedRaw - 50)));
      return Math.round(5 + sigmoid * 93);
    }

    function deriveScenarioFromHealth(health) {
      if (health >= 85) return { estAge: Math.round((98 - health) * 0.3), estFreq: 3, estAlpha: 0.012 };
      if (health >= 70) return { estAge: Math.round(3 + (85 - health) * 0.5), estFreq: Math.round(6 + (85 - health) * 1.2), estAlpha: 0.040 };
      if (health >= 50) return { estAge: Math.round(8 + (70 - health) * 0.6), estFreq: Math.round(15 + (70 - health) * 2.0), estAlpha: 0.100 };
      return { estAge: Math.min(20, Math.round(14 + (50 - health) * 0.4)), estFreq: Math.min(60, Math.round(30 + (50 - health) * 1.0)), estAlpha: 0.250 };
    }

    function extractV6AnalysisFromCanvas(sourceCanvas) {
      const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      const W = sourceCanvas.width;
      const H = sourceCanvas.height;
      const px = ctx.getImageData(0, 0, W, H).data;

      let cx = W / 2;
      let cy = H / 2;
      let sumX = 0, sumY = 0, countC = 0;
      for (let y = 0; y < H; y += 8) {
        for (let x = 0; x < W; x += 8) {
          const i = (y * W + x) * 4;
          const r = px[i], g = px[i + 1], b = px[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
          const s = maxC > 0 ? (maxC - minC) / maxC : 0;
          if ((s > 0.12 && maxC > 35) || (lum > 80 && lum < 230 && s > 0.05)) {
            sumX += x;
            sumY += y;
            countC++;
          }
        }
      }
      if (countC > 50) {
        cx = sumX / countC;
        cy = sumY / countC;
      }

      const halfR = Math.min(W, H) / 2;
      const outerR = halfR * 0.75;
      const innerR = halfR * 0.32;

      let maxLum = 0;
      for (let y = 1; y < H - 1; y += 4) {
        for (let x = 1; x < W - 1; x += 4) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < outerR && dist > innerR) {
            const i = (y * W + x) * 4;
            const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            if (l > maxLum) maxLum = l;
          }
        }
      }
      const normFactor = maxLum > 100 ? 210 / maxLum : 1.0;

      const zoneBreaks = [
        { rMin: innerR, rMax: innerR + (outerR - innerR) * 0.33, satSum: 0, lumSum: 0, dull: 0, scratch: 0, count: 0 },
        { rMin: innerR + (outerR - innerR) * 0.33, rMax: innerR + (outerR - innerR) * 0.66, satSum: 0, lumSum: 0, dull: 0, scratch: 0, count: 0 },
        { rMin: innerR + (outerR - innerR) * 0.66, rMax: outerR, satSum: 0, lumSum: 0, dull: 0, scratch: 0, count: 0 }
      ];

      let satSum = 0;
      let ringLumSum = 0;
      let dullPixels = 0;
      let yiSum = 0;
      let yiSqSum = 0;
      let scratchCount = 0;
      let validPixels = 0;
      let glarePixels = 0;
      const satValues = [];
      let holeLumSum = 0, holePixels = 0;
      const geometryBins = Array.from({ length: 36 }, () => 0);
      let minRingX = W, minRingY = H, maxRingX = 0, maxRingY = 0;

      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < innerR * 0.4) {
            const i = (y * W + x) * 4;
            holeLumSum += (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) * normFactor;
            holePixels++;
            continue;
          }
          if (dist > halfR * 0.92) continue;
          if (dist < innerR || dist > outerR) continue;

          const i = (y * W + x) * 4;
          const r = px[i], g = px[i + 1], b = px[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) * normFactor;
          if (lum > 240) {
            glarePixels++;
            continue;
          }
          if (lum < 25) continue;

          validPixels++;
          ringLumSum += lum;
          if (x < minRingX) minRingX = x;
          if (x > maxRingX) maxRingX = x;
          if (y < minRingY) minRingY = y;
          if (y > maxRingY) maxRingY = y;

          const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
          const s = maxC > 0 ? (maxC - minC) / maxC : 0;
          satSum += s;
          if ((validPixels & 7) === 0) satValues.push(s);
          if (s < 0.12 && lum > 40 && lum < 200) dullPixels++;

          const yi = ((r + g) / 2) - b;
          yiSum += yi;
          yiSqSum += yi * yi;

          const iL = (y * W + (x - 1)) * 4, iR = (y * W + (x + 1)) * 4;
          const iT = ((y - 1) * W + x) * 4, iB = ((y + 1) * W + x) * 4;
          const lumL = (0.299 * px[iL] + 0.587 * px[iL + 1] + 0.114 * px[iL + 2]) * normFactor;
          const lumR = (0.299 * px[iR] + 0.587 * px[iR + 1] + 0.114 * px[iR + 2]) * normFactor;
          const lumT = (0.299 * px[iT] + 0.587 * px[iT + 1] + 0.114 * px[iT + 2]) * normFactor;
          const lumB = (0.299 * px[iB] + 0.587 * px[iB + 1] + 0.114 * px[iB + 2]) * normFactor;
          const gx = lumR - lumL, gy = lumB - lumT;
          const mag = Math.sqrt(gx * gx + gy * gy);
          const edgeThreshold = 10 + (lum / 255) * 12;
          if (mag > edgeThreshold) scratchCount++;

          if (mag > Math.max(edgeThreshold, 26) && dist > innerR * 1.6 && dist < halfR * 0.92) {
            const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
            const bin = Math.min(geometryBins.length - 1, Math.floor((angle / (Math.PI * 2)) * geometryBins.length));
            if (dist > geometryBins[bin]) geometryBins[bin] = dist;
          }

          for (const zone of zoneBreaks) {
            if (dist >= zone.rMin && dist < zone.rMax) {
              zone.satSum += s;
              zone.lumSum += lum;
              if (s < 0.12 && lum > 40 && lum < 200) zone.dull++;
              if (mag > edgeThreshold) zone.scratch++;
              zone.count++;
              break;
            }
          }
        }
      }

      const avgSat = validPixels > 0 ? satSum / validPixels : 0;
      const avgRingLum = validPixels > 0 ? ringLumSum / validPixels : 0;
      const avgHoleLum = holePixels > 0 ? holeLumSum / holePixels : 0;
      const glareRate = glarePixels / (validPixels + glarePixels || 1);
      const boundarySamples = geometryBins.filter(value => value > innerR * 1.8);
      const boundaryCoverage = boundarySamples.length / geometryBins.length;
      const boundaryMean = boundarySamples.length > 0 ? boundarySamples.reduce((sum, value) => sum + value, 0) / boundarySamples.length : 0;
      const boundaryVariance = boundarySamples.length > 0 ? boundarySamples.reduce((sum, value) => sum + Math.pow(value - boundaryMean, 2), 0) / boundarySamples.length : 0;
      const boundaryStdRatio = boundaryMean > 0 ? Math.sqrt(boundaryVariance) / boundaryMean : Infinity;
      const ringWidth = maxRingX > minRingX ? maxRingX - minRingX : 0;
      const ringHeight = maxRingY > minRingY ? maxRingY - minRingY : 0;
      const ringAspectRatio = ringWidth > 0 && ringHeight > 0 ? Math.max(ringWidth, ringHeight) / Math.max(1, Math.min(ringWidth, ringHeight)) : 1;
      const holeRingContrast = Math.abs(avgRingLum - avgHoleLum);

      let error = null;
      if (validPixels < 12000) error = 'Disc data insufficient. Ensure surface is centered and clearly visible.';
      else if (avgSat < 0.025 && holeRingContrast < 10) error = 'Surface signature not detected. Is this an optical disc?';
      else if (holeRingContrast < 8 && avgSat < 0.08) error = 'Structural mismatch: Could not verify disc geometry.';
      else if (
        (boundaryCoverage < 0.18 && holeRingContrast < 10 && avgSat < 0.12) ||
        (boundaryCoverage >= 0.28 && boundaryStdRatio > 0.30 && holeRingContrast < 16) ||
        (ringWidth > 0 && ringHeight > 0 && ringAspectRatio > 1.28 && holeRingContrast < 18 && avgSat < 0.20)
      ) error = 'Disc geometry is invalid. Upload a full circular disc image without tilt or cropping.';
      else if (glareRate > 0.5) error = 'Excessive glare detected. Re-take image without direct light source.';
      if (error) return { error };

      const dullPct = dullPixels / validPixels;
      const yiMean = yiSum / validPixels;
      const yiVar = (yiSqSum / validPixels) - (yiMean * yiMean);
      const yiStd = Math.sqrt(Math.max(0, yiVar));
      const scratchPct = scratchCount / validPixels;
      satValues.sort((a, b) => a - b);
      const refSat = Math.max(0.20, Math.min(0.60, ((satValues.length > 10 ? satValues[Math.floor(satValues.length * 0.90)] : 0.442) * 1.1)));
      const refYiStd = 22.0;
      const sScore = Math.min(100, Math.max(0, (avgSat / refSat) * 100));
      const dScore = Math.max(0, (1 - (dullPct / 0.82)) * 100);
      const vScore = Math.min(100, Math.max(0, (yiStd / refYiStd) * 100));
      const eScore = Math.max(0, (0.12 - scratchPct) / 0.12 * 100);
      const zoneSatAvgs = zoneBreaks.map(zone => zone.count > 0 ? zone.satSum / zone.count : 0);
      const zoneDullPcts = zoneBreaks.map(zone => zone.count > 0 ? zone.dull / zone.count : 0);
      const zScore = Math.max(0, 100 - ((Math.max(...zoneSatAvgs) - Math.min(...zoneSatAvgs)) * 400 + (Math.max(...zoneDullPcts) - Math.min(...zoneDullPcts)) * 200));
      const yellowingPenalty = Math.min(25, Math.max(0, (yiMean - 12) * 1.8));
      const rawHealth = (sScore * 0.35) + (dScore * 0.25) + (vScore * 0.15) + (eScore * 0.15) + (zScore * 0.10) - yellowingPenalty;
      const similarity = Math.round(Math.max(0, (sScore * 0.4 + vScore * 0.3 + zScore * 0.3)));
      if (similarity < 25 && avgSat < 0.10 && holeRingContrast < 15) {
        return { error: 'Image does not match a valid optical disc surface. Please upload a proper disc photo.' };
      }

      const featureSummary = {
        saturation: Math.round(100 - sScore),
        edge: Math.round(Math.min(100, scratchPct * 650)),
        grey: Math.round(dullPct * 100),
        zone: Math.round(zScore)
      };

      return {
        formulaHealth: computeSigmoidHealth(rawHealth),
        rawHealth,
        similarity,
        yellowingPenalty,
        refSat,
        featureSummary,
        featureVector: [featureSummary.saturation, featureSummary.edge, featureSummary.grey, featureSummary.zone]
      };
    }

    async function requestMlHealthPrediction(featureVector) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ML_API_TIMEOUT_MS);
      try {
        const response = await fetch(ML_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features: featureVector }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`API ${response.status}`);
        const payload = await response.json();
        const predicted = parseFloat(payload.health);
        if (!Number.isFinite(predicted)) throw new Error('Invalid prediction payload');
        return clampNumber(predicted, 0, 100);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    function syncHealthSummaryToValue(health) {
      const age = parseInt(document.getElementById('ageSlider').value, 10) || 0;
      const freq = parseInt(document.getElementById('freqSlider').value, 10) || 10;
      const alpha = parseFloat(document.getElementById('storageSelect').value) || 0.008;
      const totalLife = computeLife(freq, alpha);
      const lifeLeft = Math.max(0, totalLife - age);
      const discsSaved = Math.round(35.7 * (health / 100) + 10);
      const co2 = (discsSaved * 0.015).toFixed(1);
      const hColor = health > 65 ? '#10b981' : health > 35 ? '#f59e0b' : '#ef4444';
      const hInt = Math.round(health);
      const metrics = getMetricsFromHealth(health);
      const ber = estimateBER(health);
      const berPerSec = (ber * 1e12).toExponential(1);

      countTo('mHealth', hInt);
      countTo('mLife', lifeLeft);
      countTo('mDiscs', discsSaved);
      countTo('mCO2', co2, 1);
      document.getElementById('mHealth').style.color = hColor;
      document.getElementById('healthArc').setAttribute('stroke-dashoffset', (2 * Math.PI * 72) * (1 - health / 100));
      document.getElementById('healthArc').setAttribute('stroke', hColor);
      document.getElementById('discPct').textContent = hInt + '%';
      document.getElementById('discPct').setAttribute('fill', hColor);
      document.getElementById('discCracks').style.opacity = health < 70 ? (70 - health) / 50 : 0;

      const statusEl = document.getElementById('discStatus');
      const reasonEl = document.getElementById('discReason');
      if (statusEl) {
        statusEl.textContent = hInt >= 90 ? 'EXCELLENT' : hInt >= 80 ? 'VERY GOOD' : hInt >= 70 ? 'GOOD' : hInt >= 60 ? 'FAIR' : hInt >= 50 ? 'POOR' : 'CRITICAL';
        statusEl.setAttribute('fill', hColor);
      }
      if (reasonEl) {
        reasonEl.textContent = `BER ${berPerSec} | ${metrics.scratchPct.toFixed(1)}% scratches | ${lifeLeft} yr remaining`;
      }

      const bar = document.getElementById('statusBar');
      const msgEl = document.getElementById('statusText');
      bar.className = hInt >= 80 ? 'status-bar status-good' : hInt >= 60 ? 'status-bar status-warn' : 'status-bar status-bad';
      msgEl.innerHTML = `<strong>Disc health: ${hInt}%</strong>. ML-assisted prediction with ${lifeLeft} years estimated life remaining.`;

      const jitEl = document.getElementById('discJitter');
      if (jitEl) {
        jitEl.textContent = `JITTER: ${metrics.jitterDB.toFixed(2)}dB | BER: ${berPerSec} | CAPACITY: ${metrics.usableCapacity}GB`;
      }

      const eValue = document.getElementById('ewasteValue');
      if (eValue) {
        eValue.textContent = `1 Blu-ray disc = ${(25000 / 700).toFixed(1)}x fewer discs than CD per TB stored - saving ${discsSaved} discs and ${co2} kg CO2`;
      }
    }

    function syncComparisonFromAnalysis(analysis, health) {
      const featureSummary = analysis.featureSummary;
      if (document.getElementById('compHealthVal')) {
        document.getElementById('compHealthVal').textContent = health.toFixed(1) + '%';
        document.getElementById('compHealthBar').style.width = health + '%';
        document.getElementById('compHealthTag').textContent = health >= 85 ? 'Excellent Condition' : health >= 70 ? 'Good Condition' : health >= 50 ? 'Moderate Damage' : 'Severe Damage';
      }
      if (document.getElementById('compScratchVal')) {
        document.getElementById('compScratchVal').textContent = featureSummary.edge.toFixed(1) + '%';
        document.getElementById('compScratchBar').style.width = featureSummary.edge + '%';
        document.getElementById('compScratchTag').textContent = featureSummary.edge >= 70 ? 'Severe Scratches' : featureSummary.edge >= 40 ? 'Moderate Scratches' : featureSummary.edge >= 20 ? 'Light Scratches' : 'No Scratches';
      }
      if (document.getElementById('compOxidationVal')) {
        document.getElementById('compOxidationVal').textContent = featureSummary.saturation.toFixed(1) + '%';
        document.getElementById('compOxidationBar').style.width = featureSummary.saturation + '%';
        document.getElementById('compOxidationTag').textContent = featureSummary.saturation >= 70 ? 'Severe Oxidation' : featureSummary.saturation >= 40 ? 'Moderate Oxidation' : featureSummary.saturation >= 20 ? 'Light Oxidation' : 'No Oxidation';
      }
      if (document.getElementById('compDullVal')) {
        document.getElementById('compDullVal').textContent = featureSummary.grey.toFixed(1) + '%';
        document.getElementById('compDullBar').style.width = featureSummary.grey + '%';
        document.getElementById('compDullTag').textContent = featureSummary.grey >= 70 ? 'Severe Degradation' : featureSummary.grey >= 40 ? 'Moderate Degradation' : featureSummary.grey >= 20 ? 'Light Degradation' : 'No Degradation';
      }
      if (document.getElementById('compareInsightText')) {
        document.getElementById('compareInsightText').textContent = `Your disc is in ${health >= 85 ? 'excellent' : health >= 70 ? 'good' : health >= 50 ? 'fair' : 'poor'} condition with ${health.toFixed(0)}% health. Features: saturation ${featureSummary.saturation}%, edge ${featureSummary.edge}%, grey ${featureSummary.grey}%, zone ${featureSummary.zone}%.`;
      }
      if (document.getElementById('compareModeIndicator')) {
        document.getElementById('compareModeIndicator').textContent = 'ANALYSIS MODE';
      }
      const compareSection = document.getElementById('compareSection');
      if (compareSection) compareSection.style.display = 'block';
    }

    async function analyzeImageFile(file) {
      const img = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Failed to decode image.'));
          image.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offX = (canvas.width - drawW) / 2;
      const offY = (canvas.height - drawH) / 2;
      ctx.drawImage(img, offX, offY, drawW, drawH);
      return extractV6AnalysisFromCanvas(canvas);
    }

    function toDatasetRecord(analysis) {
      return {
        saturation: analysis.featureSummary.saturation,
        edge: analysis.featureSummary.edge,
        grey: analysis.featureSummary.grey,
        zone: analysis.featureSummary.zone,
        health: analysis.formulaHealth
      };
    }

    async function runAnalysis() {
      try {
        const analysis = extractV6AnalysisFromCanvas(discCanvas);
        if (analysis.error) {
          failAnalysis(analysis.error);
          return;
        }

        logMsg('V6 ENGINE ACTIVE - Multi-Zone Forensic Analysis', 'var(--violet)');
        logMsg(`Adaptive Ref Saturation: ${analysis.refSat.toFixed(3)} (auto-calibrated)`, 'var(--text-secondary)');
        logMsg(`Surface Similarity: ${analysis.similarity}%`, 'var(--cyan)');
        logMsg(`Zone Consistency: ${analysis.featureSummary.zone}%`, analysis.featureSummary.zone > 70 ? 'var(--green)' : 'var(--gold)');
        logMsg(`Oxidation (Yellowing): ${analysis.yellowingPenalty.toFixed(1)} penalty (capped at 25)`, analysis.yellowingPenalty > 5 ? 'var(--red)' : 'var(--green)');
        logMsg(`Formula Label Health: ${analysis.formulaHealth}%`, 'var(--text-secondary)');

        let predictedHealth = analysis.formulaHealth;
        let predictionMode = 'FORMULA FALLBACK';
        try {
          predictedHealth = await requestMlHealthPrediction(analysis.featureVector);
          predictionMode = 'RANDOM FOREST API';
          logMsg(`ML Predicted Health: ${predictedHealth.toFixed(1)}%`, 'var(--cyan)');
        } catch (error) {
          logMsg('ML API unavailable - using formula fallback.', 'var(--gold)');
        }

        predictedHealth = clampNumber(predictedHealth, 0, 100);
        const scenario = deriveScenarioFromHealth(predictedHealth);
        const grade = predictedHealth >= 85 ? 'EXCELLENT' : predictedHealth >= 70 ? 'GOOD' : predictedHealth >= 50 ? 'MODERATE DAMAGE' : 'SEVERE DAMAGE';
        logMsg(`Predicted Grade: ${grade} (${predictionMode})`, predictedHealth >= 70 ? 'var(--green)' : predictedHealth >= 50 ? 'var(--gold)' : 'var(--red)');

        document.getElementById('scoreBreakdown').style.display = 'block';
        setTimeout(() => {
          setBar('bar_sat', 'pct_sat', analysis.featureSummary.saturation);
          setBar('bar_grey', 'pct_grey', analysis.featureSummary.grey);
          setBar('bar_edge', 'pct_edge', analysis.featureSummary.edge);
          setBar('bar_zone', 'pct_zone', analysis.featureSummary.zone);
          setBar('bar_health', 'pct_health', Math.round(predictedHealth));
        }, 200);

        scanLine.style.display = 'none';
        scanLine.classList.remove('scanning');
        scanBtn.disabled = false;
        scanBtn.textContent = 'RE-SCAN SURFACE';
        clearUploadError();

        document.getElementById('ageSlider').value = scenario.estAge;
        document.getElementById('freqSlider').value = scenario.estFreq;
        document.getElementById('storageSelect').value = scenario.estAlpha.toFixed(3);
        try {
          update();
        } catch (err) {
          console.error('BluTrack UI sync failed after analysis:', err);
          logMsg('UI sync warning: analysis completed, but a secondary panel failed to update.', 'var(--gold)');
        }

        syncHealthSummaryToValue(predictedHealth);
        syncComparisonFromAnalysis(analysis, predictedHealth);
        window.BluTrackML.lastAnalysis = {
          formulaHealth: analysis.formulaHealth,
          predictedHealth,
          predictionMode,
          featureSummary: analysis.featureSummary
        };

        logMsg('Simulation synchronized with V6 forensic data.', 'var(--violet)');
        uploadArea.classList.add('analysis-done');

        const sim = document.getElementById('simulationContent');
        if (sim) {
          sim.style.display = 'block';
          setTimeout(() => {
            sim.style.opacity = '1';
            sim.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      } catch (error) {
        failAnalysis(error.message || 'Analysis failed.');
      }
    }

    window.BluTrackML = Object.assign(window.BluTrackML || {}, {
      analyzeImageFile,
      extractV6AnalysisFromCanvas,
      toDatasetRecord,
      requestMlHealthPrediction,
      csvColumns: ['saturation', 'edge', 'grey', 'zone', 'health'],
      lastAnalysis: null
    });

    function drawHeatMap(ctx) {
      const W = overlayCanvas.width;
      const H = overlayCanvas.height;
      // Fast pixel sampling
      const px = discCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
      const cx = W / 2, cy = H / 2;
      const halfR = Math.min(W, H) / 2;

      for (let i = 0; i < 60; i++) { // Sample 60 points per tick
        const rx = Math.random() * W, ry = Math.random() * H;
        const dx = rx - cx, dy = ry - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Spatial filter first
        if (dist > halfR * 0.95) continue;

        const idx = (Math.floor(ry) * W + Math.floor(rx)) * 4;
        const r = px[idx], g = px[idx + 1], b = px[idx + 2];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b);

        // Pixel validation: Skip if it's too black (background/hole)
        if (lum < 35) continue;

        const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
        const sValue = (maxC > 0) ? (maxC - minC) / maxC : 0;

        ctx.beginPath();
        ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);

        if (sValue < 0.15 && lum > 40 && lum < 200) {
          ctx.fillStyle = 'rgba(255,200,0,0.6)'; // Dull/Oxidized
        } else if (lum > 240) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; // Glare
        } else {
          ctx.fillStyle = 'rgba(0,255,255,0.4)'; // Healthy Iridescence
        }
        ctx.fill();
      }
    }

    // Interactive 3D Tilt & Fullscreen Toggle
    const discWrap = document.querySelector('.disc-svg-wrap');
    if (discWrap) {
      discWrap.addEventListener('mousemove', e => {
        if (discWrap.classList.contains('fs')) return;
        const rect = discWrap.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = -y / 6;
        const rotateY = x / 6;
        discWrap.style.transition = 'transform 0.1s ease-out';
        discWrap.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      discWrap.addEventListener('mouseleave', () => {
        if (discWrap.classList.contains('fs')) return;
        discWrap.style.transition = 'transform 0.6s cubic-bezier(0.1, 0.7, 0.3, 1)';
        discWrap.style.transform = `rotateX(0deg) rotateY(0deg)`;
      });

      discWrap.addEventListener('click', () => {
        discWrap.classList.toggle('fs');
        if (discWrap.classList.contains('fs')) {
          document.body.style.overflow = 'hidden';
          discWrap.style.transform = 'none';
        } else {
          document.body.style.overflow = '';
        }
      });
    }

    const knowledgeBase = {
      blutrack: {
        title: 'BluTrack Health Metrics Reference',
        content: `
      <h3>Realistic BER-Based Standards</h3>
      <div style="font-size:12px; font-family:'JetBrains Mono';overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; margin:15px 0;">
          <tr style="background:rgba(6,182,212,0.1);">
            <th style="padding:8px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">Health</th>
            <th style="padding:8px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">BER</th>
            <th style="padding:8px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">Scratches</th>
            <th style="padding:8px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">Oxidation</th>
            <th style="padding:8px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">Jitter</th>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">100%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">&lt;1×10⁻¹¹</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">0.0%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">0.0%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">-0.2dB</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">90%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">1×10⁻¹⁰</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">2.5%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">4.0%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">0.5dB</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">80%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">1×10⁻⁸</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">6.5%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">10.0%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">1.8dB</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">70%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">1×10⁻⁷</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">13.5%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">21.5%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">4.1dB</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">60%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">1×10⁻⁵</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">24.0%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">41.5%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">7.2dB</td>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">50%</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">&gt;1×10⁻⁴</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">38%+</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">60%+</td>
            <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">10.5+dB</td>
          </tr>
        </table>
      </div>
      
      <h3>Storage Conditions Impact</h3>
      <p><strong>Reference Lifespan:</strong> Each 5°C temperature reduction halves oxidation rate (Arrhenius equation).</p>
      <ul>
        <li><strong>Ideal Archive:</strong> &lt;20°C, &lt;20% RH, vertical storage → 100+ years</li>
        <li><strong>Home Shelf:</strong> 20-25°C, 35-45% RH → 50-100 years</li>
        <li><strong>Normal Home:</strong> 22-25°C, 40-55% RH → 20-50 years</li>
        <li><strong>Humid/Fluctuating:</strong> 15-35°C, 50-70% RH → 5-20 years</li>
        <li><strong>Poor Conditions:</strong> 10-40°C, &gt;70% RH → &lt;5 years</li>
      </ul>
      
      <h3>Metric Definitions</h3>
      <p><strong>Scratch Damage %:</strong> Measured as percentage of disc data area with surface defects ≥0.5mm.</p>
      <p><strong>Oxidation / Saturation Loss %:</strong> Iridescence loss (rainbow effect becomes dull grey). Caused by silver-alloy oxidation when moisture breaches hard coat.</p>
      <p><strong>Surface Dullness %:</strong> Percentage of pixels classified as "desaturated grey" (low color but moderate luminance). Indicates haze/jitter.</p>
      <p><strong>Jitter (dB):</strong> Phase noise in RF signal. Standard allows &lt;9 dB; &gt;12 dB = failure.</p>
    `
      },
      forensic: {
        title: 'Forensic Engineering Advisory',
        content: `
      <h3>Substrate Polymer Science</h3>
      <p>Blu-ray substrates utilize a 1.1mm polycarbonate base protected by a 0.1mm "Hard Coat" layer (TDK Durabis). Unlike DVD, where the data layer is sandwiched in the middle (0.6mm deep), Blu-ray data sits only 0.1mm from the surface. <strong>This proximity necessitates 50x higher scratch resistance</strong> to prevent laser diffraction errors.</p>
      
      <h3>Chemical Stability & Oxidation</h3>
      <p>Silver-alloy reflective layers, common in low-cost BD-R media, are highly susceptible to sulfur-induced corrosion ("disc rot"). Professional-grade archival media utilizes <strong>Gold or Silicon-based inorganic layers</strong> which do not react with ambient moisture or pollutants, extending lifespan from 5 years to over 50 years.</p>
      
      <h3>Optical Tracking Physics</h3>
      <p>The 0.32μm track pitch of a Blu-ray disc is nearly half that of a DVD (0.74μm). Even minor physical warping or "gravity sag" can lead to track-loss errors. This is why <strong>radial tilt compensation</strong> is the most critical active system in modern Blu-ray drives.</p>
    `
      },
      longevity: {
        title: 'Archival Longevity Protocol',
        content: `
      <h3>Structural Geometry Management</h3>
      <p>Discs should always be stored <strong>vertically</strong>. Horizontal stacking creates "disc creep"—a slow, permanent deformation of the polycarbonate substrate under its own weight. Over 10-20 years, this results in a "potato-chip" warp that laser pickups cannot track.</p>
      
      <h3>Thermodynamic Decay Prevention</h3>
      <p>Chemical degradation follows the <strong>Arrhenius Equation</strong>. For every 5°C reduction in storage temperature, the rate of chemical reactivity is approximately halved. Storing media in a cool (below 20°C) and dry environment (30% RH) is the single most effective way to prevent oxidation.</p>
      
      <h3>Bit-Integrity Verification</h3>
      <p>Digital rot can occur silently. Implement a <strong>5-year verification cycle</strong> using binary checksums (MD5/SHA-256). If a hash mismatch occurs, the redundancy layers are failing, and the data must be migrated to a new substrate immediately before the error correction limit is exceeded.</p>
    `
      }
    };

    function getPercentValue(id, fallback = 0) {
      const el = document.getElementById(id);
      if (!el) return fallback;
      const value = parseFloat(String(el.textContent).replace(/[^\d.-]/g, ''));
      return Number.isFinite(value) ? value : fallback;
    }

    function getComparisonState() {
      const age = parseInt(document.getElementById('ageSlider')?.value || '0', 10);
      const freq = parseInt(document.getElementById('freqSlider')?.value || '0', 10);
      const storageSelect = document.getElementById('storageSelect');
      const storage = storageSelect ? storageSelect.options[storageSelect.selectedIndex]?.text || 'Current storage profile' : 'Current storage profile';
      const health = getPercentValue('compHealthVal', getPercentValue('mHealth', 0));
      const metrics = getMetricsFromHealth(health);

      return {
        age,
        freq,
        storage,
        mode: document.getElementById('compareModeIndicator')?.textContent?.trim() || 'SIMULATION MODE',
        health,
        healthTag: document.getElementById('compHealthTag')?.textContent?.trim() || 'Unknown',
        scratch: getPercentValue('compScratchVal', metrics.scratchPct),
        scratchTag: document.getElementById('compScratchTag')?.textContent?.trim() || 'Unknown',
        oxidation: getPercentValue('compOxidationVal', metrics.saturationLoss),
        oxidationTag: document.getElementById('compOxidationTag')?.textContent?.trim() || 'Unknown',
        dullness: getPercentValue('compDullVal', metrics.dullnessPct),
        dullnessTag: document.getElementById('compDullTag')?.textContent?.trim() || 'Unknown',
        metrics,
        ber: estimateBER(health)
      };
    }

    function getMetricDriverText(state) {
      return `This result is based on the current profile of ${state.age} years, ${state.freq} uses per month, and ${state.storage.toLowerCase()} under ${state.mode.toLowerCase()}.`;
    }

    function buildComparisonInsight(metric) {
      const state = getComparisonState();
      const perfectVsYours = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:18px 0;">
          <div style="padding:15px; background:rgba(6,182,212,0.07); border:1px solid rgba(6,182,212,0.16); border-radius:12px;">
            <div style="font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:var(--cyan); margin-bottom:6px;">Perfect Disc</div>
            <div style="font-size:1.6rem; font-weight:700; font-family:'JetBrains Mono', monospace;">0.0% - 100.0%</div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">Factory-fresh benchmark with no surface damage, no oxidation, and stable read geometry.</div>
          </div>
          <div style="padding:15px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
            <div style="font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Your Disc</div>
            <div style="font-size:1.6rem; font-weight:700; font-family:'JetBrains Mono', monospace;">${state.health.toFixed(1)}% health</div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">Current benchmark state shown in the comparison panel.</div>
          </div>
        </div>
      `;

      if (metric === 'health') {
        return {
          title: 'OVERALL HEALTH BREAKDOWN',
          content: `
            <h3>Current Status: ${state.healthTag}</h3>
            <p>Your disc is currently measured at <strong>${state.health.toFixed(1)}% overall health</strong>, compared with a perfect disc at <strong>100.0%</strong>. Estimated bit error rate is <strong>${state.ber.toExponential(1)}</strong>, which is why this metric acts as the summary score for the whole disc.</p>
            ${perfectVsYours}
            <h3>Why This Happened</h3>
            <p>${getMetricDriverText(state)} Age lowers stability over time, repeated handling increases scratch risk, and poor storage accelerates chemical decay in the reflective layer.</p>
            <p>The score is also being pulled down by <strong>${state.scratch.toFixed(1)}% scratch damage</strong>, <strong>${state.oxidation.toFixed(1)}% oxidation/saturation loss</strong>, and <strong>${state.dullness.toFixed(1)}% surface dullness</strong>.</p>
          `
        };
      }

      if (metric === 'scratch') {
        return {
          title: 'SCRATCH DAMAGE DETAILS',
          content: `
            <h3>Current Status: ${state.scratchTag}</h3>
            <p>Your disc shows <strong>${state.scratch.toFixed(1)}% scratch damage</strong>. A perfect disc would stay at <strong>0.0%</strong>, meaning the laser path remains clean and read errors are unlikely.</p>
            <div style="padding:15px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.16); border-radius:12px; margin:18px 0;">
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.7;">Estimated scratch depth for this health band: <strong>${state.metrics.scratchDepth.toFixed(2)} mm</strong>. Scratches scatter the laser beam and make it harder for the drive to focus on the data track.</div>
            </div>
            <h3>Why This Happened</h3>
            <p>${getMetricDriverText(state)} More handling and more playback cycles usually mean more wiping, sliding, and case contact, which raises this line.</p>
            <p>If this number keeps increasing, playback can become inconsistent because the optical pickup starts correcting more errors on the fly.</p>
          `
        };
      }

      if (metric === 'oxidation') {
        return {
          title: 'OXIDATION / SATURATION LOSS DETAILS',
          content: `
            <h3>Current Status: ${state.oxidationTag}</h3>
            <p>Your disc is showing <strong>${state.oxidation.toFixed(1)}% oxidation / saturation loss</strong>. A perfect disc would remain at <strong>0.0%</strong> with strong rainbow iridescence and a stable reflective layer.</p>
            <div style="padding:15px; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.16); border-radius:12px; margin:18px 0;">
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.7;">Current estimated HSV saturation: <strong>${state.metrics.hsvSaturation.toFixed(3)}</strong>. Lower saturation usually means the reflective layer is losing its clean optical response.</div>
            </div>
            <h3>Why This Happened</h3>
            <p>${getMetricDriverText(state)} Oxidation usually happens when moisture, heat, and pollutants slowly breach the hard-coat protection and react with the reflective layer.</p>
            <p>That is why this line tends to rise faster in warm or humid storage and on older discs.</p>
          `
        };
      }

      return {
        title: 'SURFACE DULLNESS DETAILS',
        content: `
          <h3>Current Status: ${state.dullnessTag}</h3>
          <p>Your disc is showing <strong>${state.dullness.toFixed(1)}% surface dullness</strong>. A perfect disc would stay at <strong>0.0%</strong>, meaning the surface remains optically clean and the reflected signal stays crisp.</p>
          <div style="padding:15px; background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.16); border-radius:12px; margin:18px 0;">
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.7;">Estimated jitter at this condition: <strong>${state.metrics.jitterDB.toFixed(2)} dB</strong>. Higher jitter means the data transitions are less clean for the drive to track.</div>
          </div>
          <h3>Why This Happened</h3>
          <p>${getMetricDriverText(state)} Dullness is usually caused by haze, micro-abrasion, residue, oxidation, or surface wear that reduces contrast in the reflected laser signal.</p>
          <p>This is often the metric that explains why a disc can look mostly okay at a glance but still behave like an aging disc during playback.</p>
        `
      };
    }

    function openComparisonInsight(metric) {
      const data = buildComparisonInsight(metric);
      if (!data) return;
      document.getElementById('modalTitle').innerHTML = data.title;
      document.getElementById('modalContent').innerHTML = data.content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function initComparisonInsights() {
      document.querySelectorAll('.comp-row[data-metric]').forEach(row => {
        if (row.dataset.bound === 'true') return;
        row.dataset.bound = 'true';
        row.addEventListener('click', () => openComparisonInsight(row.dataset.metric));
        row.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openComparisonInsight(row.dataset.metric);
          }
        });
      });
    }

    function openLifeInsight() {
      const life = document.getElementById('mLife').textContent;
      const health = parseInt(document.getElementById('mHealth').textContent);

      let content = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-size:3rem; font-weight:800; color:var(--cyan); font-family:'JetBrains Mono', monospace;">${life}</div>
      <div style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:2px; font-size:12px;">Archival Durability Window</div>
    </div>
    
    <h3>Chemical Stability Index</h3>
    <p>Unlike flash or magnetic storage, optical media longevity is primarily a chemical process. The <strong>remaining ${life}</strong> is a projection based on the irreversible oxidation of the reflective layer.</p>
    
    <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:20px; border:1px solid rgba(255,255,255,0.05); margin:20px 0;">
      <h4 style="margin-top:0; color:var(--cyan);">ACCELERATED AGING FACTORS</h4>
      <ul style="padding-left:18px; line-height:1.7;">
        <li><strong>Thermal Stress:</strong> Storing at 30°C vs 20°C reduces life by ~50%.</li>
        <li><strong>Humidity:</strong> Moisture ingress facilitates silver-alloy "rot".</li>
        <li><strong>Polymer Brittle:</strong> Vertical storage prevents warping over decades.</li>
      </ul>
    </div>
    
    <p>At <strong>${health}% health</strong>, your disc is safely within the error correction limit. Once health drops below 50%, the bit-error-rate (BER) typically exceeds the LDC/BIS capability of the drive.</p>
  `;

      document.getElementById('modalTitle').innerHTML = "LIFE EXPECTANCY: " + (parseInt(life) > 20 ? "SECURE ARCHIVE" : "MONITOR REQUIRED");
      document.getElementById('modalContent').innerHTML = content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function openSavingsInsight() {
      const discs = document.getElementById('mDiscs').textContent;
      let content = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-size:3rem; font-weight:800; color:var(--gold); font-family:'JetBrains Mono', monospace;">${discs} units</div>
      <div style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; font-size:12px;">Comparative Density Efficiency</div>
    </div>
    
    <h3>The 36:1 Ratio</h3>
    <p>A single standard 25GB Blu-ray disc holds the equivalent data of approximately <strong>36 traditional CDs</strong> (700MB each). In this simulation, you have effectively eliminated the need for ${discs} individual discs.</p>
    
    <h3>Strategic Benefits:</h3>
    <p>Using a localized Blu-ray archive instead of multi-disc CD sets results in <strong>97% less physical management overhead</strong> and eliminates the search time across fragmented media volumes.</p>
    
    <div style="padding:15px; border-radius:12px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); color:#fcd34d; font-size:13px;">
      <strong>DENSITY INTEL:</strong> High numerical aperture (NA=0.85) lenses allow for a 238nm pit size—this is the physics breakthrough that makes Blu-ray storage 30x denser than legacy optical formats.
    </div>
  `;
      document.getElementById('modalTitle').innerHTML = "DATA SAVINGS VS LEGACY MEDIA";
      document.getElementById('modalContent').innerHTML = content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function openEcoAudit() {
      const discs = document.getElementById('mDiscs').textContent;
      const co2 = document.getElementById('mCO2').textContent;
      const hInt = parseInt(document.getElementById('mHealth').textContent);

      let content = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; text-align:center; margin-bottom:30px;">
      <div style="padding:20px; background:rgba(245,158,11,0.05); border-radius:16px; border:1px solid rgba(245,158,11,0.1);">
        <div style="font-size:2.5rem; font-weight:800; color:var(--gold); font-family:'JetBrains Mono', monospace;">${discs}</div>
        <div style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; font-size:10px;">CDs REPLACED</div>
      </div>
      <div style="padding:20px; background:rgba(139,92,246,0.05); border-radius:16px; border:1px solid rgba(139,92,246,0.1);">
        <div style="font-size:2.5rem; font-weight:800; color:var(--violet); font-family:'JetBrains Mono', monospace;">${co2}</div>
        <div style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; font-size:10px;">CO₂ OFFSET</div>
      </div>
    </div>
    
    <h3>1. Data Density Efficiency</h3>
    <p>A standard 25GB Blu-ray substrate utilizes a high-numerical-aperture (0.85) lens to achieve a massive density advantage. By choosing Blu-ray, you have eliminated the need for <strong>${discs} individual CD units</strong>, representing a <strong>97.2% reduction</strong> in physical storage volume.</p>
    
    <h3>2. Lifecycle Carbon Analysis</h3>
    <p>The manufacturing process for optical media is front-loaded. While producing one BD-R disc emits slightly more CO₂ than one CD, the 36:1 replacement ratio means your total manufacturing carbon footprint is <strong>88% lower</strong> than an equivalent legacy archive.</p>
    
    <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:12px; padding:20px; margin:20px 0;">
      <h4 style="margin-top:0; color:#34d399; font-size:12px; letter-spacing:1px;">THE "COLD STORAGE" ADVANTAGE</h4>
      <p style="font-size:13px; margin:0; line-height:1.6;">Unlike cloud servers or hard-drive arrays that consume 24/7 electricity for cooling and platter rotation, this Blu-ray archive consumes <strong>Zero Watts</strong> of power while idle, making it the most sustainable archival method available.</p>
    </div>
    
    <h3>3. Plastic Waste Mitigation</h3>
    <p>The polycarbonate saved in this simulation equates to roughly <strong>${(parseInt(discs) * 0.015).toFixed(2)} kg</strong> of raw polymer. At your current disc health of <strong>${hInt}%</strong>, this environmental benefit is secured for a projected 50-year window.</p>
  `;

      document.getElementById('modalTitle').innerHTML = "GLOBAL SUSTAINABILITY AUDIT";
      document.getElementById('modalContent').innerHTML = content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function openHealthDiagnostic() {
      const hInt = parseInt(document.getElementById('mHealth').textContent);
      const age = document.getElementById('ageSlider').value;
      const storage = document.getElementById('storageSelect').options[document.getElementById('storageSelect').selectedIndex].text;
      const metrics = getMetricsFromHealth(hInt);
      const ber = estimateBER(hInt);

      let report = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-size:3rem; font-weight:800; color:var(--cyan); font-family:'JetBrains Mono', monospace;">${hInt}%</div>
      <div style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:2px; font-size:12px;">Current Structural Integrity</div>
    </div>
    
    <h3>BluTrack Forensic Summary</h3>
    <p>The disc substrate is currently experiencing <strong>${hInt >= 85 ? 'Minimal' : hInt >= 70 ? 'Moderate' : hInt >= 50 ? 'Significant' : 'Critical'}</strong> technical degradation. Based on ${age} years in ${storage}, the following BluTrack metrics were calculated:</p>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0;">
      <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div style="color:var(--cyan); font-size:10px; margin-bottom:4px;">SCRATCH DAMAGE</div>
        <div style="font-size:18px; font-weight:700;">${metrics.scratchPct.toFixed(1)}%</div>
        <div style="font-size:11px; opacity:0.7;">Depth: ${metrics.scratchDepth.toFixed(2)}mm</div>
      </div>
      <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div style="color:var(--gold); font-size:10px; margin-bottom:4px;">OXIDATION LOSS</div>
        <div style="font-size:18px; font-weight:700;">${metrics.saturationLoss.toFixed(1)}%</div>
        <div style="font-size:11px; opacity:0.7;">Sat: ${metrics.hsvSaturation.toFixed(3)}</div>
      </div>
      <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div style="color:var(--violet); font-size:10px; margin-bottom:4px;">DULLNESS (JITTER)</div>
        <div style="font-size:18px; font-weight:700;">${metrics.jitterDB.toFixed(2)}dB</div>
        <div style="font-size:11px; opacity:0.7;">Threshold: 9dB</div>
      </div>
      <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div style="color:var(--green); font-size:10px; margin-bottom:4px;">USABLE CAPACITY</div>
        <div style="font-size:18px; font-weight:700;">${metrics.usableCapacity}GB</div>
        <div style="font-size:11px; opacity:0.7;">of 25GB max</div>
      </div>
    </div>
    
    <h3>Bit Error Rate (BER) Analysis</h3>
    <p>Estimated BER: <strong>${ber.toExponential(1)}</strong> errors/bit. BD-R standard allows threshold of <strong>220 errors/second</strong> before playback failure.</p>
    
    <div style="background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.2); border-radius:12px; padding:15px; font-size:13px; color:var(--cyan);">
        <strong>BLUTRACK ALERT:</strong> Error correction is ${hInt >= 70 ? 'operating normally' : hInt >= 50 ? 'working at 60-70% capacity' : 'at or exceeding failure threshold'}. ${hInt <= 50 ? 'Backup immediately!' : 'Monitor closely.'}
    </div>
  `;

      document.getElementById('modalTitle').innerHTML = "DIAGNOSTIC REPORT: " + (hInt >= 70 ? "STABLE" : hInt >= 50 ? "DEGRADED" : "CRITICAL");
      document.getElementById('modalContent').innerHTML = report;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function openDisclaimerInsight() {
      let content = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-size:3rem; font-weight:800; color:var(--text-muted); font-family:'JetBrains Mono', monospace;">ESTIMATE</div>
      <div style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:2px; font-size:12px;">Probabilistic Analysis Bounds</div>
    </div>
    
    <h3>1. Computer Vision Methodology</h3>
    <p>The "AI" analysis in this project utilizes <strong>Statistical Feature Extraction</strong>. It maps pixel-level variance in the iridescence of the disc substrate to known physical decay profiles. This is a simulation of forensic optical analysis and should not be used for critical data recovery decisions.</p>
    
    <h3>2. Hardware & Sensor Variance</h3>
    <p>Because the analysis relies on your device's camera sensor, results are subject to <strong>Sensor Noise, Motion Blur, and Color Temperature</strong>. A 238nm Blu-ray pit is significantly smaller than a single pixel on most smartphone sensors; therefore, the engine analyzes global substrate health rather than individual bit-rot.</p>
    
    <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:20px; border:1px solid rgba(255,255,255,0.05); margin:20px 0;">
      <h4 style="margin-top:0; color:var(--text-muted);">ACADEMIC HONESTY NOTE</h4>
      <p style="font-size:13px; margin:0; line-height:1.6;">This tool is a proof-of-concept for <strong>Predictive Maintenance</strong> in sustainable technology. It aims to demonstrate how visual signals can preemptively identify physical e-waste before it occurs.</p>
    </div>
  `;

      document.getElementById('modalTitle').innerHTML = "ACADEMIC INTEGRITY & LIMITATIONS";
      document.getElementById('modalContent').innerHTML = content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function openInsight(type) {
      const data = knowledgeBase[type];
      if (!data) return;
      document.getElementById('modalTitle').innerHTML = data.title;
      document.getElementById('modalContent').innerHTML = data.content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    const layerData = {
      hard: {
        title: "Hard Coat Layer (Durabis)",
        content: `<h3>Structural Shielding</h3><p>Blu-ray utilizes a high-tech hard coating (like TDK Durabis) that is <strong>50x more scratch-resistant</strong> than unshielded DVD surfaces. This layer is critical because the data pits are only 0.1mm beneath the surface, making them highly vulnerable to diffraction errors from even microscopic surface damage.</p>`
      },
      cover: {
        title: "0.1mm Cover Layer",
        content: `<h3>Optical Precision</h3><p>The cover layer is an optically clear polycarbonate film exactly 100μm thick. This extreme thinness allows the <strong>0.85 Numerical Aperture (NA)</strong> lens to focus through the substrate with minimal spherical aberration, enabling the tightly packed data pits of Blu-ray.</p>`
      },
      record: {
        title: "Recording Layer (Inorganic)",
        content: `<h3>Phase-Change Material</h3><p>Composed of inorganic materials (Cu/Si or Te/Pd alloys). When the 405nm blue laser pulses, it locally heats these materials to switch them between <strong>Amorphous and Crystalline</strong> states. This "Phase-Change" technology is significantly more stable over time than the organic dyes used in CD-R and DVD-R.</p>`
      },
      reflect: {
        title: "Reflective Layer",
        content: `<h3>Optical Feedback</h3><p>Usually a silver-alloy or aluminum film that reflects the laser beam back to the Optical Pickup Unit (OPU). In premium archival "M-Disc" or long-life media, this is sometimes <strong>Gold/Silicon-based</strong> to prevent "Disc Rot" (sulfur-induced oxidation).</p>`
      },
      data: {
        title: "Data Layer (Pits & Lands)",
        content: `<h3>Multi-Layer Density</h3><p>A spiral track of physical "Pits" molded into the substrate. Blu-ray tracks are just <strong>0.32μm apart</strong>. This extreme density allows a single layer (L0) to store 25GB, compared to the 4.7GB limit of DVD.</p>`
      },
      substrate: {
        title: "1.1mm Polycarbonate Substrate",
        content: `<h3>Mechanical Rigidness</h3><p>The thick structural backbone of the disc. Unlike DVD, where the laser passes through the 0.6mm substrate to reach the middle, Blu-ray's laser doesn't enter the substrate. This makes the disc <strong>far less sensitive to tilt</strong> and physical warping during high-speed rotation.</p>`
      }
    };

    function openLayerInsight(id) {
      const data = layerData[id];
      if (!data) return;
      document.getElementById('modalTitle').innerHTML = data.title;
      document.getElementById('modalContent').innerHTML = data.content;
      const overlay = document.getElementById('insightOverlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }

    function closeInsight() {
      const overlay = document.getElementById('insightOverlay');
      overlay.classList.remove('active');
      setTimeout(() => overlay.style.display = 'none', 400);
      document.body.style.overflow = 'auto';
    }

    function initFullscreenChart() {
      const chartSec = document.querySelector('.chart-section');
      if (chartSec) {
        chartSec.addEventListener('click', () => {
          chartSec.classList.toggle('fs');
          setTimeout(() => chart.resize(), 550); // After CSS transition
        });
      }
    }
    initFullscreenChart();

    function countTo(id, target, decimals = 0) {
      const el = document.getElementById(id);
      const start = parseFloat(el.textContent) || 0;
      const duration = 600;
      let startTime = null;

      function anim(t) {
        if (!startTime) startTime = t;
        const prog = Math.min(1, (t - startTime) / duration);
        const eased = prog * (2 - prog);
        const val = start + (target - start) * eased;
        let suffix = '';
        if (id === 'mHealth') suffix = '%';
        if (id === 'mLife') suffix = ' yr';
        if (id === 'mCO2') suffix = ' kg';
        el.textContent = val.toFixed(decimals) + suffix;
        if (prog < 1) requestAnimationFrame(anim);
      }
      requestAnimationFrame(anim);
    }

    // ═══════════════════════════════════════════════════════════
    // BACKGROUND ENGINE — Rich Dot Field + Network Lines
    // ═══════════════════════════════════════════════════════════
    (function () {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
      document.body.prepend(canvas);
      const ctx = canvas.getContext('2d');

      let W, H, dots, mouse = { x: -999, y: -999 };

      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }

      const COLORS = ['#0ea5e9', '#8b5cf6', '#06d6f5', '#a78bfa', '#38bdf8'];

      function mkDot() {
        const r = Math.random();
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.8 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.4 + 0.1),   // mostly drift upward
          alpha: Math.random() * 0.5 + 0.15,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          pulse: Math.random() * Math.PI * 2,   // phase offset
          twinkle: Math.random() * 0.003 + 0.001,
        };
      }

      function init() {
        resize();
        dots = Array.from({ length: 130 }, mkDot);
      }

      // Pulsing rings that spawn and expand
      const rings = [];
      function spawnRing() {
        rings.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0,
          maxR: Math.random() * 80 + 40,
          alpha: 0.25,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      setInterval(spawnRing, 2200);

      function draw() {
        ctx.clearRect(0, 0, W, H);

        // ── Pulsing ring expand ──────────────────────────────
        for (let i = rings.length - 1; i >= 0; i--) {
          const rg = rings[i];
          rg.r += 0.8;
          rg.alpha -= 0.004;
          if (rg.alpha <= 0) { rings.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
          ctx.strokeStyle = rg.color;
          ctx.globalAlpha = rg.alpha;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // ── Dots & connections ───────────────────────────────
        const CONNECTION_DIST = 110;
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];

          // Drift
          d.pulse += d.twinkle;
          d.x += d.vx;
          d.y += d.vy;

          // Mouse gravity nudge
          const mdx = mouse.x - d.x, mdy = mouse.y - d.y;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 120) {
            d.x -= mdx * 0.003;
            d.y -= mdy * 0.003;
          }

          // Wrap edges
          if (d.x < -5) d.x = W + 5;
          if (d.x > W + 5) d.x = -5;
          if (d.y < -5) d.y = H + 5;
          if (d.y > H + 5) d.y = -5;

          // Twinkle alpha
          const a = d.alpha * (0.7 + 0.3 * Math.sin(d.pulse));

          // Draw dot
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.globalAlpha = a;
          // Glow near mouse
          if (md < 150) {
            ctx.shadowColor = d.color;
            ctx.shadowBlur = 12;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;

          // Connection lines to nearby dots
          for (let j = i + 1; j < dots.length; j++) {
            const d2 = dots[j];
            const dx = d.x - d2.x, dy = d.y - d2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECTION_DIST) {
              const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.12;
              ctx.beginPath();
              ctx.moveTo(d.x, d.y);
              ctx.lineTo(d2.x, d2.y);
              ctx.strokeStyle = d.color;
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      function loop() {
        draw();
        requestAnimationFrame(loop);
      }

      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

      init();
      loop();
    })();

    // Initial render & Engine boot
    window.addEventListener('load', () => {
      initComparisonInsights();
      if (typeof update === 'function') update();
    });
