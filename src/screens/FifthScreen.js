import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './FifthScreen.css';

const FifthScreen = ({ onComplete }) => {
  const mountRef    = useRef(null);
  const rendererRef = useRef(null);
  const frameRef    = useRef(null);
  const clockRef    = useRef(new THREE.Clock());
  const trickyRef   = useRef(null);
  const trickyLidL  = useRef(null);
  const trickyLidR  = useRef(null);
  const blinkTimer  = useRef(0);
  const blinkState  = useRef('open');
  const elapsed     = useRef(0);

  const [visibleLines, setVisibleLines] = useState(0);
  const [showClosing,  setShowClosing]  = useState(false);
  const [showButton,   setShowButton]   = useState(false);

  const LINES = [
    { label: 'Real Equity',   body: 'Ownership in Atlas — not a one-time fee' },
    { label: 'Your Time',     body: 'Post when it suits you. No pressure.' },
    { label: 'June 2026',     body: 'Platform is built. We just need you.' },
    { label: 'Global Reach',  body: 'Youth players from every country, day one.' },
  ];

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── SCENE ── */
    const scene = new THREE.Scene();

    /* ── CAMERA ── */
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0x111122, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1);
    key.position.set(0, 5, 5);
    scene.add(key);
    const orange = new THREE.DirectionalLight(0xff5f1f, 0.6);
    orange.position.set(-5, 2, 2);
    scene.add(orange);

    /* ── STARS ── */
    const sv = [];
    for (let i = 0; i < 800; i++) sv.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, -20 - Math.random() * 60);
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.35 })));

    /* ── TRICKY ── */
    const tg = new THREE.Group();
    tg.position.set(3.5, 0, 0);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5, roughness: 0 })
    );
    tg.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
    );
    tg.add(halo);
    tg.add(new THREE.PointLight(0xffffff, 2, 6));

    const makeEye = (x) => {
      const eg = new THREE.Group();
      const sc = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sc.position.set(0, 0, 0.265); eg.add(sc);
      const pu = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      pu.position.set(0, -0.01, 0.27); eg.add(pu);
      const lid = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      lid.position.set(0, 0.01, 0.271); lid.scale.y = 0.01; eg.add(lid);
      eg.position.x = x;
      return { group: eg, lid };
    };
    const lEye = makeEye(-0.1);
    const rEye = makeEye(0.1);
    tg.add(lEye.group, rEye.group);
    trickyLidL.current = lEye.lid;
    trickyLidR.current = rEye.lid;
    scene.add(tg);
    trickyRef.current = tg;

    /* ── ANIMATE ── */
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      elapsed.current += delta;
      const t = elapsed.current;
      const tricky = trickyRef.current;

      tricky.position.y = Math.sin(t * 1.5) * 0.12;
      tricky.rotation.y += delta * 0.45;
      halo.material.opacity = 0.06 + Math.sin(t * 2) * 0.04;

      // slow camera breathe
      camera.position.x = Math.sin(t * 0.08) * 0.2 - 0.5;
      camera.position.y = Math.cos(t * 0.06) * 0.2;
      camera.lookAt(1, 0, 0);

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

    // cascade lines in
    const timers = [
      setTimeout(() => setVisibleLines(1), 600),
      setTimeout(() => setVisibleLines(2), 1400),
      setTimeout(() => setVisibleLines(3), 2200),
      setTimeout(() => setVisibleLines(4), 3000),
      setTimeout(() => setShowClosing(true), 4200),
      setTimeout(() => setShowButton(true), 5000),
    ];

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
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="fifth-screen">
      <div ref={mountRef} className="three-canvas" />

      {/* Content centered vertically */}
      <div className="content">

        {/* Title */}
        <div className="screen-title">
          <div className="title-eyebrow">The Deal</div>
          <div className="title-main">What Luka is offering.</div>
        </div>

        {/* Deal lines */}
        <div className="lines-list">
          {LINES.map((line, i) => (
            <div key={i} className={`deal-line ${visibleLines > i ? 'show' : ''}`}>
              <span className="line-number">0{i + 1}</span>
              <div className="line-content">
                <span className="line-label">{line.label}</span>
                <span className="line-body">{line.body}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Closing */}
        {showClosing && (
          <div className="closing-line">
            We build this together.
          </div>
        )}
      </div>

      {showButton && (
        <button className="next-btn" onClick={() => { if (onComplete) onComplete(); }}>
          I want in →
        </button>
      )}

      <div className="scene-label">05 / 06</div>
    </div>
  );
};

export default FifthScreen;