import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './SixthScreen.css';

const SixthScreen = () => {
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

  const [showQuestion, setShowQuestion] = useState(false);
  const [showPlease,   setShowPlease]   = useState(false);
  const [showContact,  setShowContact]  = useState(false);
  const [pleaseCount,  setPleaseCount]  = useState(0);

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
    const orange = new THREE.DirectionalLight(0xff5f1f, 0.7);
    orange.position.set(-4, 2, 2);
    scene.add(orange);

    /* ── STARS ── */
    const sv = [];
    for (let i = 0; i < 800; i++) {
      sv.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, -20 - Math.random() * 60);
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.3 })));

    /* ── TRICKY ── */
    const tg = new THREE.Group();
    tg.position.set(0, 0.5, 0);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5, roughness: 0 })
    );
    tg.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
    );
    tg.add(halo);
    tg.add(new THREE.PointLight(0xffffff, 2.5, 8));

    const makeEye = (x) => {
      const eg = new THREE.Group();
      const sc = new THREE.Mesh(new THREE.CircleGeometry(0.105, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sc.position.set(0, 0, 0.325); eg.add(sc);
      const pu = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      pu.position.set(0, -0.012, 0.33); eg.add(pu);
      const lid = new THREE.Mesh(new THREE.CircleGeometry(0.105, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      lid.position.set(0, 0.012, 0.331); lid.scale.y = 0.01; eg.add(lid);
      eg.position.x = x;
      return { group: eg, lid };
    };
    const lEye = makeEye(-0.13);
    const rEye = makeEye(0.13);
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

      // idle float
      tricky.position.y = 0.5 + Math.sin(t * 1.4) * 0.12;
      tricky.rotation.y += delta * 0.4;
      halo.material.opacity = 0.06 + Math.sin(t * 2.2) * 0.04;

      // gentle camera breathe
      camera.position.x = Math.sin(t * 0.07) * 0.25;
      camera.position.y = Math.cos(t * 0.05) * 0.15 + 0.2;
      camera.lookAt(0, 0.5, 0);

      // blink
      blinkTimer.current -= delta;
      if (blinkTimer.current <= 0) {
        blinkState.current = blinkState.current === 'open' ? 'closing' : 'open';
        blinkTimer.current = blinkState.current === 'open' ? 1.8 + Math.random() * 2.5 : 0.08;
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

  // cascade timing
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowQuestion(true), 600),
      // 3 second wait then please
      setTimeout(() => { setShowPlease(true); setPleaseCount(1); }, 3800),
      setTimeout(() => setPleaseCount(2), 4500),
      setTimeout(() => setPleaseCount(3), 5100),
      setTimeout(() => setShowContact(true), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="sixth-screen">
      <div ref={mountRef} className="three-canvas" />

      <div className="content">

        {/* Big question */}
        <div className={`question ${showQuestion ? 'show' : ''}`}>
          So Duane...<br />
          <span className="question-highlight">are you in?</span>
        </div>

        {/* Please please please */}
        {showPlease && (
          <div className="please-wrap">
            {[...Array(pleaseCount)].map((_, i) => (
              <span
                key={i}
                className="please"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                please
              </span>
            ))}
          </div>
        )}

        {/* Contact */}
        {showContact && (
          <div className="contact-wrap">
            <div className="contact-line">
              <span className="contact-label">Email</span>
              <a href="mailto:lserban2603@gmail.com" className="contact-value">
                lserban2603@gmail.com
              </a>
            </div>
            <div className="contact-line">
              <span className="contact-label">Phone</span>
              <a href="tel:+40720000947" className="contact-value">
                +40 720 000 947
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Tricky label bottom */}
      <div className="tricky-credit">
        <div className="dot-mini" />
        <span>Tricky & Luka — Atlas Basketball, 2026</span>
      </div>

      <div className="scene-label">06 / 06</div>
    </div>
  );
};

export default SixthScreen;