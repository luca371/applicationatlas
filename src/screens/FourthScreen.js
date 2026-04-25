import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './FourthScreen.css';

const FourthScreen = ({ onComplete }) => {
  const mountRef       = useRef(null);
  const rendererRef    = useRef(null);
  const frameRef       = useRef(null);
  const clockRef       = useRef(new THREE.Clock());
  const cameraRef      = useRef(null);
  const trickyRef      = useRef(null);
  const trickyLidL     = useRef(null);
  const trickyLidR     = useRef(null);
  const blinkTimer     = useRef(0);
  const blinkState     = useRef('open');
  const elapsed        = useRef(0);
  const camTargetPos   = useRef(new THREE.Vector3(0, 2, 10));
  const camTargetLook  = useRef(new THREE.Vector3(0, 0, 0));
  const camLookCurrent = useRef(new THREE.Vector3(0, 0, 0));

  const [act, setAct]         = useState(1);
  const [showBtn, setShowBtn] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [typing, setTyping]   = useState(false);

  const ACT1_TEXT = "So I asked Luka...\n\"Why Duane?\"";
  const ACT2_TEXT = "When he was in Cluj and you were there to play — you were the only player who talked with him.\n\nNot as a fan. Not as a sponsor.\n\nAs a real person.\n\nLuka really wants you as his partner.";
  const ACT3_POINTS = [
    { label: "Elite level", body: "Euroleague — kids already look up to you" },
    { label: "Huge reach", body: "Engaged social following that trusts you" },
    { label: "You give back", body: "Genuine connection to the next generation" },
    { label: "You remember", body: "You're young — you remember the grind" },
  ];

  // typewriter
  const typeText = (text, cb) => {
    setTypedText('');
    setTyping(true);
    let i = 0;
    const iv = setInterval(() => {
      setTypedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(iv);
        setTyping(false);
        if (cb) setTimeout(cb, 500);
      }
    }, 28);
    return iv;
  };

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x02020a);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── SCENE ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02020a, 0.055);

    /* ── CAMERA ── */
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0x111122, 1));
    const keyLight = new THREE.SpotLight(0xffffff, 2.5, 20, Math.PI / 5, 0.5);
    keyLight.position.set(0, 10, 5);
    scene.add(keyLight);
    const orangeRim = new THREE.DirectionalLight(0xff5f1f, 0.8);
    orangeRim.position.set(-6, 4, -2);
    scene.add(orangeRim);
    const blueRim = new THREE.DirectionalLight(0x2244ff, 0.4);
    blueRim.position.set(6, 2, 3);
    scene.add(blueRim);

    /* ── FLOOR ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.4, metalness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    scene.add(floor);

    /* ── GRID LINES on floor ── */
    const grid = new THREE.GridHelper(40, 40, 0xff5f1f, 0x111133);
    grid.position.y = -1.99;
    grid.material.transparent = true;
    grid.material.opacity = 0.15;
    scene.add(grid);

    /* ── STARS ── */
    const sv = [];
    for (let i = 0; i < 1200; i++) sv.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100 + 20, (Math.random() - 0.5) * 200);
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.45 })));

    /* ── FLOATING ORANGE PARTICLES (atmosphere) ── */
    const pv = [];
    for (let i = 0; i < 60; i++) pv.push((Math.random() - 0.5) * 16, Math.random() * 6 - 1, (Math.random() - 0.5) * 10);
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3));
    const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xff5f1f, size: 0.06, transparent: true, opacity: 0.5 }));
    scene.add(particles);

    /* ── TRICKY ── */
    const tg = new THREE.Group();
    tg.position.set(-3.5, 0.5, 0);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2, roughness: 0 })
    );
    tg.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
    );
    tg.add(halo);
    tg.add(new THREE.PointLight(0xffffff, 2, 6));

    const makeEye = (x) => {
      const eg = new THREE.Group();
      const sc = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sc.position.set(0, 0, 0.225);
      eg.add(sc);
      const pu = new THREE.Mesh(new THREE.CircleGeometry(0.034, 24), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      pu.position.set(0, -0.008, 0.23);
      eg.add(pu);
      const lid = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      lid.position.set(0, 0.01, 0.231);
      lid.scale.y = 0.01;
      eg.add(lid);
      eg.position.x = x;
      return { group: eg, lid };
    };
    const lEye = makeEye(-0.09);
    const rEye = makeEye(0.09);
    tg.add(lEye.group, rEye.group);
    trickyLidL.current = lEye.lid;
    trickyLidR.current = rEye.lid;
    scene.add(tg);
    trickyRef.current = tg;

    /* ── BIG "WHY YOU?" TEXT PLANE (act 1 atmosphere) ── */
    // Just a glowing ring on the floor under Tricky
    const groundGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.7, 64),
      new THREE.MeshBasicMaterial({ color: 0xff5f1f, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.set(-3.5, -1.98, 0);
    scene.add(groundGlow);

    /* ── ANIMATE ── */
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      elapsed.current += delta;
      const t = elapsed.current;
      const cam = cameraRef.current;
      const tricky = trickyRef.current;

      cam.position.lerp(camTargetPos.current, delta * 2);
      camLookCurrent.current.lerp(camTargetLook.current, delta * 3);
      cam.lookAt(camLookCurrent.current);

      // tricky float
      tricky.position.y = 0.5 + Math.sin(t * 1.6) * 0.1;
      tricky.rotation.y += delta * 0.4;
      halo.material.opacity = 0.08 + Math.sin(t * 2.2) * 0.05;

      // particles drift
      const pos = pgeo.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += delta * 0.08;
        if (pos[i] > 5) pos[i] = -1;
      }
      pgeo.attributes.position.needsUpdate = true;

      // ground glow pulse
      groundGlow.material.opacity = 0.2 + Math.sin(t * 2) * 0.1;
      groundGlow.rotation.z += delta * 0.5;

      // blink
      blinkTimer.current -= delta;
      if (blinkTimer.current <= 0) {
        blinkState.current = blinkState.current === 'open' ? 'closing' : 'open';
        blinkTimer.current = blinkState.current === 'open' ? 2 + Math.random() * 3 : 0.08;
      }
      const bt = blinkState.current === 'closing' ? 1 : 0.01;
      if (trickyLidL.current && trickyLidR.current) {
        trickyLidL.current.scale.y = THREE.MathUtils.lerp(trickyLidL.current.scale.y, bt, delta * 30);
        trickyLidR.current.scale.y = THREE.MathUtils.lerp(trickyLidR.current.scale.y, bt, delta * 30);
      }

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const W = mount.clientWidth;
      const H = mount.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // Start act 1 typewriter on mount
  useEffect(() => {
    const iv = typeText(ACT1_TEXT, () => setShowBtn(true));
    return () => clearInterval(iv);
  }, []);

  const handleAct1 = () => {
    setShowBtn(false);
    setAct(2);
    camTargetPos.current.set(1, 1.5, 8);
    camTargetLook.current.set(0, 0.5, 0);
    setTimeout(() => {
      typeText(ACT2_TEXT, () => setShowBtn(true));
    }, 600);
  };

  const handleAct2 = () => {
    setShowBtn(false);
    setAct(3);
    camTargetPos.current.set(0, 2, 9);
    camTargetLook.current.set(0, 0, 0);
    setTimeout(() => setShowBtn(true), 800);
  };

  const handleAct3 = () => {
    setShowBtn(false);
    if (onComplete) onComplete();
  };

  return (
    <div className="fourth-screen">
      <div ref={mountRef} className="three-canvas" />

      {/* ── ACT 1 — Why Duane ── */}
      {act === 1 && (
        <div className="center-panel">
          <div className="eyebrow">Why You, Duane?</div>
          <div className="big-question">
            {typedText.split('\n').map((line, i) => (
              <span key={i}>{line}{i < typedText.split('\n').length - 1 && <br />}</span>
            ))}
            {typing && <span className="cursor-blink" />}
          </div>
          <div className="tricky-label">
            <div className="dot-mini" />
            <span>Tricky</span>
          </div>
        </div>
      )}

      {/* ── ACT 2 — Personal story ── */}
      {act === 2 && (
        <div className="story-panel">
          <div className="tricky-dot-indicator" />
          <div className="bubble-name">Tricky</div>
          <div className="story-text">
            {typedText.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < typedText.split('\n').length - 1 && <br />}
              </span>
            ))}
            {typing && <span className="cursor-blink" />}
          </div>
        </div>
      )}

      {/* ── ACT 3 — Basketball reasons ── */}
      {act === 3 && (
        <div className="reasons-panel">
          <div className="tricky-dot-indicator" />
          <div className="bubble-name">Tricky</div>
          <div className="reasons-intro">
            And on the basketball side? Luka thinks you're the perfect fit.
          </div>
          <div className="reasons-list">
            {ACT3_POINTS.map((pt, i) => (
              <div
                key={i}
                className="reason-item"
                style={{ animationDelay: `${i * 0.18}s` }}
              >
                <div className="reason-dot" />
                <div>
                  <span className="reason-label">{pt.label} — </span>
                  <span className="reason-body">{pt.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BUTTONS ── */}
      {showBtn && act === 1 && (
        <button className="next-btn" onClick={handleAct1}>
          Tell me more →
        </button>
      )}
      {showBtn && act === 2 && (
        <button className="next-btn" onClick={handleAct2}>
          What else? →
        </button>
      )}
      {showBtn && act === 3 && (
        <button className="next-btn" onClick={handleAct3}>
          Ok I get it. What's the deal? →
        </button>
      )}

      <div className="scene-label">04 / 06</div>
    </div>
  );
};

export default FourthScreen;