import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './FirstScreen.css';

const FirstScreen = ({ onComplete, onMusicStart }) => {
  const mountRef       = useRef(null);
  const rendererRef    = useRef(null);
  const frameRef       = useRef(null);
  const clockRef       = useRef(new THREE.Clock());
  const phaseRef       = useRef('dropping');

  // dot refs
  const dotRef         = useRef(null);   // the main white sphere group
  const dotCoreRef     = useRef(null);   // inner glowing sphere
  const glowRef        = useRef(null);   // outer glow sprite

  // eye refs (added after landing)
  const eyeGroupRef    = useRef(null);
  const lidLRef        = useRef(null);
  const lidRRef        = useRef(null);
  const blinkTimer     = useRef(0);
  const blinkState     = useRef('open'); // 'open' | 'closing'

  // portal
  const portalRef      = useRef(null);
  const portalParts    = useRef([]);

  // camera
  const cameraRef      = useRef(null);

  // timings
  const landedAt       = useRef(0);
  const portalStart    = useRef(0);
  const elapsed        = useRef(0);
  const bounced        = useRef(false);
  const eyesAdded      = useRef(false);
  const completeCalled = useRef(false);

  const [showText,   setShowText]   = useState(false);
  const [typedText,  setTypedText]  = useState('');
  const [showButton, setShowButton] = useState(false);

  const FULL_TEXT = "Hi Duane! I'm Tricky 👋\nLuka sent me to show you something special.\nAre you ready?";
  const LAND_Y    = 0;      // where the dot rests
  const START_Y   = 18;     // drop from here
  const DROP_DUR  = 1.6;    // seconds to fall

  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050508);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── SCENE ── */
    const scene = new THREE.Scene();

    /* ── CAMERA ── */
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(5, 10, 5);
    scene.add(sun);

    /* ── STARS ── */
    const sv = [];
    for (let i = 0; i < 3000; i++) {
      sv.push((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300);
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.7 })));

    /* ── FLOOR GRID ── */
    const grid = new THREE.GridHelper(60, 60, 0xff5f1f, 0x1a1a2e);
    grid.position.y = -2;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    scene.add(grid);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x08080f, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.01;
    scene.add(floor);

    /* ── DOT (small white glowing ball) ── */
    const dotGroup = new THREE.Group();
    dotGroup.position.set(0, START_Y, 0);

    // core — small, bright white
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 2,
        roughness: 0,
        metalness: 0,
      })
    );
    dotGroup.add(core);
    dotCoreRef.current = core;

    // glow halo — slightly bigger transparent sphere
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
      })
    );
    dotGroup.add(halo);
    glowRef.current = halo;

    // point light that travels with the dot
    const dotLight = new THREE.PointLight(0xffffff, 2, 6);
    dotGroup.add(dotLight);

    scene.add(dotGroup);
    dotRef.current = dotGroup;

    /* ── SHADOW BLOB ── */
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -1.98, 0);
    scene.add(shadow);

    /* ── BUILD EYES (called once after landing) ── */
    const addEyes = () => {
      if (eyesAdded.current) return;
      eyesAdded.current = true;

      const eg = new THREE.Group();

      const makeEye = (xPos) => {
        const eg2 = new THREE.Group();

        // white sclera
        const sclera = new THREE.Mesh(
          new THREE.CircleGeometry(0.1, 32),
          new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
        );
        sclera.position.set(0, 0, 0.19);
        eg2.add(sclera);

        // pupil
        const pupil = new THREE.Mesh(
          new THREE.CircleGeometry(0.045, 32),
          new THREE.MeshBasicMaterial({ color: 0x111111 })
        );
        pupil.position.set(0, -0.01, 0.195);
        eg2.add(pupil);

        // eyelid (upper half-disc for blinking)
        const lid = new THREE.Mesh(
          new THREE.CircleGeometry(0.1, 32, 0, Math.PI),
          new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
        );
        lid.position.set(0, 0, 0.196);
        lid.scale.y = 0.01; // start fully open (invisible)
        eg2.add(lid);

        eg2.position.x = xPos;
        return { group: eg2, lid };
      };

      const leftEye  = makeEye(-0.12);
      const rightEye = makeEye(0.12);
      eg.add(leftEye.group, rightEye.group);

      lidLRef.current = leftEye.lid;
      lidRRef.current = rightEye.lid;

      dotGroup.add(eg);
      eyeGroupRef.current = eg;
    };

    /* ── PORTAL ── */
    const buildPortal = () => {
      const pg = new THREE.Group();
      pg.position.set(5, -0.5, -5);
      pg.rotation.y = -Math.PI / 4;
      pg.visible = false;

      // ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.1, 24, 80),
        new THREE.MeshStandardMaterial({
          color: 0xff5f1f,
          emissive: 0xff3300,
          emissiveIntensity: 3,
          roughness: 0.1,
          metalness: 0.6,
        })
      );
      pg.add(ring);

      // inner dark disc
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(1.3, 64),
        new THREE.MeshBasicMaterial({ color: 0x110000, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      pg.add(disc);

      // outer glow ring
      const glow = new THREE.Mesh(
        new THREE.TorusGeometry(1.55, 0.3, 16, 80),
        new THREE.MeshBasicMaterial({ color: 0xff5f1f, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
      );
      pg.add(glow);

      // orbiting particles
      const parts = [];
      for (let i = 0; i < 60; i++) {
        const pm = new THREE.Mesh(
          new THREE.SphereGeometry(0.025 + Math.random() * 0.03, 8, 8),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 1, 0.6),
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3,
          })
        );
        const a = Math.random() * Math.PI * 2;
        const r = 1.1 + Math.random() * 0.55;
        pm.position.set(Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.2);
        pm.userData = { angle: a, r, speed: 0.015 + Math.random() * 0.02 };
        pg.add(pm);
        parts.push(pm);
      }
      portalParts.current = parts;

      scene.add(pg);
      portalRef.current = pg;
    };
    buildPortal();

    /* ── ANIMATION LOOP ── */
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      elapsed.current += delta;
      const t = elapsed.current;
      const phase = phaseRef.current;
      const dot = dotRef.current;
      const cam = cameraRef.current;

      // ── DROPPING ──
      if (phase === 'dropping') {
        const p = Math.min(t / DROP_DUR, 1);
        // ease in — accelerate as it falls
        const eased = p * p * p;
        dot.position.y = THREE.MathUtils.lerp(START_Y, LAND_Y, eased);

        // shadow grows as dot approaches floor
        const shadowOpacity = eased * 0.5;
        shadow.material.opacity = shadowOpacity;
        const ss = eased * 0.6;
        shadow.scale.set(ss, ss, ss);

        // camera tilts slightly to follow
        cam.position.y = THREE.MathUtils.lerp(6, 3, eased);
        cam.lookAt(0, dot.position.y * 0.3, 0);

        if (p >= 1 && !bounced.current) {
          bounced.current = true;
          landedAt.current = t;
          phaseRef.current = 'bouncing';
        }
      }

      // ── BOUNCING ──
      if (phase === 'bouncing') {
        const bt = t - landedAt.current;
        // damped sine bounce
        const bounce = Math.max(0, Math.sin(bt * 14) * Math.exp(-bt * 4) * 1.2);
        dot.position.y = LAND_Y + bounce;

        // squash & stretch
        const stretch = 1 + bounce * 0.4;
        const squash  = 1 - bounce * 0.15;
        dot.scale.set(squash, stretch, squash);

        shadow.material.opacity = 0.5 - bounce * 0.2;
        const ss = 0.6 - bounce * 0.2;
        shadow.scale.set(ss, ss, ss);

        cam.position.y = THREE.MathUtils.lerp(cam.position.y, 2.5, delta * 4);
        cam.lookAt(0, 0.5, 0);

        if (bt > 1.4) {
          dot.scale.set(1, 1, 1);
          dot.position.y = LAND_Y;
          phaseRef.current = 'landed';
          addEyes();
          setShowText(true);
          if (onMusicStart) onMusicStart();
        }
      }

      // ── LANDED / TALKING ──
      if (phase === 'landed' || phase === 'talking') {
        const bt = t - landedAt.current - 1.4;
        // gentle float
        dot.position.y = LAND_Y + Math.sin(bt * 1.8) * 0.06;
        dot.rotation.y += delta * 0.4;

        // slow camera orbit
        const ca = t * 0.08;
        cam.position.x = Math.sin(ca) * 1.5;
        cam.position.z = 14 + Math.cos(ca) * 0.5;
        cam.lookAt(dot.position.x, dot.position.y + 0.3, dot.position.z);

        // halo pulse
        if (glowRef.current) {
          glowRef.current.material.opacity = 0.1 + Math.sin(t * 3) * 0.06;
        }
      }

      // ── PORTAL ──
      if (phase === 'portal') {
        if (portalStart.current === 0) portalStart.current = t;
        const pt = t - portalStart.current;

        const portal = portalRef.current;
        portal.visible = true;

        // portal scales in
        const ps = Math.min(pt * 2.5, 1);
        portal.scale.set(ps, ps, ps);

        // spin portal ring
        portal.children[0].rotation.z += delta * 0.5;

        // orbit particles
        portalParts.current.forEach(p => {
          p.userData.angle += p.userData.speed;
          p.position.x = Math.cos(p.userData.angle) * p.userData.r;
          p.position.y = Math.sin(p.userData.angle) * p.userData.r;
        });

        if (pt > 0.6) {
          const moveT  = Math.min((pt - 0.6) / 2.2, 1);
          const eased  = moveT < 0.5 ? 2 * moveT * moveT : -1 + (4 - 2 * moveT) * moveT;

          // dot flies toward portal at 45°
          dot.position.x = THREE.MathUtils.lerp(0, 5.5, eased);
          dot.position.z = THREE.MathUtils.lerp(0, -5.5, eased);
          dot.position.y = LAND_Y + Math.sin(eased * Math.PI) * 2;
          dot.rotation.y += delta * 8;

          // shrink as it enters
          if (moveT > 0.65) {
            const shrink = 1 - ((moveT - 0.65) / 0.35);
            dot.scale.set(Math.max(shrink, 0), Math.max(shrink, 0), Math.max(shrink, 0));
          }

          // camera chases dot
          const camTarget = new THREE.Vector3(
            dot.position.x * 0.5,
            dot.position.y + 1,
            dot.position.z * 0.3 + 12
          );
          cam.position.lerp(camTarget, delta * 3);
          cam.lookAt(dot.position.x, dot.position.y, dot.position.z);

          if (moveT >= 1 && !completeCalled.current) {
            completeCalled.current = true;
            if (onComplete) onComplete();
          }
        } else {
          // dot turns toward portal before flying
          const targetY = Math.atan2(5.5, 5.5);
          dot.rotation.y = THREE.MathUtils.lerp(dot.rotation.y, targetY, delta * 4);
          dot.position.y = LAND_Y + Math.sin(t * 4) * 0.08;
        }
      }

      // ── BLINK ──
      if ((phase === 'landed' || phase === 'talking' || phase === 'portal') && eyesAdded.current) {
        blinkTimer.current -= delta;
        if (blinkTimer.current <= 0) {
          if (blinkState.current === 'open') {
            blinkState.current = 'closing';
            blinkTimer.current = 0.08;
          } else {
            blinkState.current = 'open';
            blinkTimer.current = 2 + Math.random() * 3;
          }
        }
        const target = blinkState.current === 'closing' ? 1 : 0.01;
        if (lidLRef.current && lidRRef.current) {
          lidLRef.current.scale.y = THREE.MathUtils.lerp(lidLRef.current.scale.y, target, delta * 30);
          lidRRef.current.scale.y = THREE.MathUtils.lerp(lidRRef.current.scale.y, target, delta * 30);
          // move lid down when closing
          const lidY = blinkState.current === 'closing' ? -0.05 : 0.05;
          lidLRef.current.position.y = THREE.MathUtils.lerp(lidLRef.current.position.y, lidY, delta * 30);
          lidRRef.current.position.y = THREE.MathUtils.lerp(lidRRef.current.position.y, lidY, delta * 30);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    /* ── RESIZE ── */
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── TYPEWRITER ── */
  useEffect(() => {
    if (!showText) return;
    phaseRef.current = 'talking';
    let i = 0;
    const iv = setInterval(() => {
      setTypedText(FULL_TEXT.slice(0, i + 1));
      i++;
      if (i >= FULL_TEXT.length) {
        clearInterval(iv);
        setTimeout(() => setShowButton(true), 700);
      }
    }, 36);
    return () => clearInterval(iv);
  }, [showText]);

  const handleReady = () => {
    phaseRef.current = 'portal';
    setShowButton(false);
    setShowText(false);
  };

  return (
    <div className="first-screen">
      <div ref={mountRef} className="three-canvas" />

      {showText && (
        <div className="chat-bubble visible">
          <div className="bubble-name">Tricky</div>
          <div className="bubble-text">
            {typedText.split('\n').map((line, idx) => (
              <span key={idx}>
                {line}
                {idx < typedText.split('\n').length - 1 && <br />}
              </span>
            ))}
            <span className="cursor-blink" />
          </div>
        </div>
      )}

      {showButton && (
        <button className="ready-btn" onClick={handleReady}>
          Yeah, I'm Ready 🏀
        </button>
      )}

      <div className="scene-label">01 / 06</div>
    </div>
  );
};

export default FirstScreen;