import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './ThirdScreen.css';

const ThirdScreen = ({ onComplete }) => {
  const mountRef       = useRef(null);
  const rendererRef    = useRef(null);
  const frameRef       = useRef(null);
  const clockRef       = useRef(new THREE.Clock());
  const phaseRef       = useRef('arrive'); // arrive → orbit → exit
  const cameraRef      = useRef(null);

  const trickyRef      = useRef(null);
  const trickyLidL     = useRef(null);
  const trickyLidR     = useRef(null);
  const cardsRef       = useRef([]);
  const portalRef      = useRef(null);
  const portalParts    = useRef([]);

  const blinkTimer     = useRef(0);
  const blinkState     = useRef('open');
  const elapsed        = useRef(0);
  const arriveStart    = useRef(0);

  const camTargetPos   = useRef(new THREE.Vector3(0, 4, 12));
  const camTargetLook  = useRef(new THREE.Vector3(0, 0, 0));
  const camLookCurrent = useRef(new THREE.Vector3(0, 0, 0));

  const [showButton, setShowButton] = useState(false);

  const CARDS = [
    {
      icon: <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
      title: 'Pro Workouts',
      body: 'Real training routines published directly by Euroleague players',
    },
    {
      icon: <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      title: 'Direct Access',
      body: 'No middlemen - straight from pro to player',
    },
    {
      icon: <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
      title: 'Daily Training',
      body: 'Structured daily sessions built around your level',
    },
    {
      icon: <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
      title: 'Track Progress',
      body: 'See your improvement over time with built-in analytics',
    },
    {
      icon: <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      title: 'Global Community',
      body: 'Connect with players from every country',
    },
    {
      icon: <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
      title: 'Launch June 2026',
      body: 'Be one of the first founding ambassadors',
    },
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
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── SCENE ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.06);

    /* ── CAMERA ── */
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0x111111, 1));

    const centerLight = new THREE.PointLight(0xffffff, 0, 12);
    centerLight.position.set(0, 2, 0);
    scene.add(centerLight);

    const orangeRim = new THREE.DirectionalLight(0xff5f1f, 0.6);
    orangeRim.position.set(-5, 5, 3);
    scene.add(orangeRim);

    const blueRim = new THREE.DirectionalLight(0x3344ff, 0.4);
    blueRim.position.set(5, 3, -3);
    scene.add(blueRim);

    /* ── FLOOR (dark reflective) ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.3, metalness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── GROUND GLOW RING ── */
    const glowRingGeo = new THREE.RingGeometry(3.5, 4.2, 64);
    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0xff5f1f,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = -1.98;
    scene.add(glowRing);

    /* ── PORTAL (arrival, on floor) ── */
    const pg = new THREE.Group();
    pg.position.set(0, -1.98, 0);
    pg.rotation.x = -Math.PI / 2;
    pg.scale.set(1.2, 1.2, 1.2);

    pg.add(new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.09, 24, 80),
      new THREE.MeshStandardMaterial({ color: 0xff5f1f, emissive: 0xff3300, emissiveIntensity: 3, roughness: 0.1 })
    ));
    pg.add(new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 64),
      new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.6 })
    ));

    const portalGlow = new THREE.PointLight(0xff5f1f, 4, 8);
    pg.add(portalGlow);

    const pparts = Array.from({ length: 40 }, () => {
      const pm = new THREE.Mesh(
        new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 1, 0.6), transparent: true, opacity: 0.9 })
      );
      const a = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 0.5;
      pm.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      pm.userData = { angle: a, r, speed: 0.02 + Math.random() * 0.02 };
      pg.add(pm);
      return pm;
    });
    portalParts.current = pparts;
    portalRef.current = pg;
    scene.add(pg);

    /* ── STARS ── */
    const sv = [];
    for (let i = 0; i < 1500; i++) {
      sv.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.5 })));

    /* ── TRICKY ── */
    const tg = new THREE.Group();
    tg.position.set(0, -1.98, 0); // starts inside portal
    tg.scale.set(0.01, 0.01, 0.01);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2, roughness: 0 })
    );
    tg.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
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

    /* ── 3D CARDS ── */
    const RADIUS = 4.5;
    const cardMeshes = CARDS.map((card, i) => {
      const angle = (i / CARDS.length) * Math.PI * 2;
      const x = Math.cos(angle) * RADIUS;
      const z = Math.sin(angle) * RADIUS;

      const cg = new THREE.Group();
      cg.position.set(x, -6, z); // start below floor
      cg.rotation.y = -angle + Math.PI; // face center

      // card body
      const cardBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.8, 0.08),
        new THREE.MeshStandardMaterial({
          color: 0x0d0d1a,
          roughness: 0.4,
          metalness: 0.6,
          transparent: true,
          opacity: 0.92,
        })
      );
      cg.add(cardBody);

      // card border glow (thin outline)
      const border = new THREE.Mesh(
        new THREE.BoxGeometry(2.88, 1.88, 0.04),
        new THREE.MeshBasicMaterial({
          color: 0xff5f1f,
          transparent: true,
          opacity: 0.35,
        })
      );
      border.position.z = -0.02;
      cg.add(border);

      // card top accent line
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.06, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xff5f1f, transparent: true, opacity: 0.9 })
      );
      accent.position.set(0, 0.87, 0.04);
      cg.add(accent);

      // card point light
      const cl = new THREE.PointLight(0xff5f1f, 0, 3);
      cl.position.set(0, 0, 0.5);
      cg.add(cl);

      cg.userData = {
        targetY: -1.5 + Math.sin(i * 1.2) * 0.3, // slight height variation
        angle,
        index: i,
        cardLight: cl,
        arrived: false,
      };

      scene.add(cg);
      return cg;
    });
    cardsRef.current = cardMeshes;

    /* ── ANIMATION ── */
    let cardSpawnTimer = 0;
    let cardsSpawned = 0;
    let orbitAngle = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      elapsed.current += delta;
      const t = elapsed.current;
      const phase = phaseRef.current;
      const tricky = trickyRef.current;
      const cam = cameraRef.current;

      // camera lerp
      cam.position.lerp(camTargetPos.current, delta * 2);
      camLookCurrent.current.lerp(camTargetLook.current, delta * 3);
      cam.lookAt(camLookCurrent.current);

      // portal particles spin
      portalParts.current.forEach(p => {
        p.userData.angle += p.userData.speed;
        p.position.x = Math.cos(p.userData.angle) * p.userData.r;
        p.position.y = Math.sin(p.userData.angle) * p.userData.r;
      });
      portalRef.current.children[0].rotation.z += delta * 1.2;

      // ── ARRIVE ──
      if (phase === 'arrive') {
        if (arriveStart.current === 0) arriveStart.current = t;
        const at = Math.min((t - arriveStart.current) / 1.2, 1);
        const eased = 1 - Math.pow(1 - at, 3);

        // Tricky shoots up from portal
        tricky.position.y = THREE.MathUtils.lerp(-1.98, 0.2, eased);
        tricky.scale.setScalar(THREE.MathUtils.lerp(0.01, 1, eased));
        tricky.rotation.y += delta * (5 * (1 - eased) + 0.4);

        // portal fades after Tricky exits
        if (at > 0.5) {
          portalGlow.intensity = THREE.MathUtils.lerp(4, 0, (at - 0.5) * 2);
          pg.children[1].material.opacity = THREE.MathUtils.lerp(0.6, 0, (at - 0.5) * 2);
        }

        // center light builds
        centerLight.intensity = eased * 3;
        glowRingMat.opacity = eased * 0.5;

        if (at >= 1) {
          phaseRef.current = 'orbit';
          // fade portal ring
          pg.children[0].material.emissiveIntensity = 0.3;
        }
      }

      // ── ORBIT ── cards rise up one by one and orbit
      if (phase === 'orbit' || phase === 'exit') {
        orbitAngle += delta * 0.25;

        // tricky gentle float in center
        tricky.position.y = 0.2 + Math.sin(t * 1.6) * 0.1;
        tricky.rotation.y += delta * 0.5;
        halo.material.opacity = 0.1 + Math.sin(t * 2) * 0.05;

        // spawn cards one by one
        cardSpawnTimer += delta;
        if (cardSpawnTimer > 0.3 && cardsSpawned < CARDS.length) {
          cardSpawnTimer = 0;
          cardsSpawned++;
        }

        // animate each card
        cardsRef.current.forEach((card, i) => {
          if (i >= cardsSpawned) return;

          const baseAngle = card.userData.angle + orbitAngle;
          const targetX = Math.cos(baseAngle) * RADIUS;
          const targetZ = Math.sin(baseAngle) * RADIUS;
          const targetY = card.userData.targetY;

          // rise from below
          card.position.x = THREE.MathUtils.lerp(card.position.x, targetX, delta * 2.5);
          card.position.z = THREE.MathUtils.lerp(card.position.z, targetZ, delta * 2.5);
          card.position.y = THREE.MathUtils.lerp(card.position.y, targetY, delta * 3);

          // always face center
          card.rotation.y = -baseAngle + Math.PI;

          // subtle float
          card.position.y += Math.sin(t * 1.2 + i * 1.1) * 0.004;

          // card glow when arrived
          if (card.position.y > targetY - 0.5) {
            card.userData.arrived = true;
            card.userData.cardLight.intensity = THREE.MathUtils.lerp(
              card.userData.cardLight.intensity, 0.8, delta * 3
            );
          }
        });

        // camera slowly orbits opposite direction
        camTargetPos.current.set(
          Math.sin(t * 0.08) * 1.5,
          4 + Math.sin(t * 0.05) * 0.5,
          12
        );
        camTargetLook.current.set(0, 0, 0);

        // show button when all cards arrived
        if (cardsSpawned >= CARDS.length && !showButton) {
          setTimeout(() => setShowButton(true), 1200);
        }
      }

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

      // ground glow ring pulse
      glowRingMat.opacity = 0.3 + Math.sin(t * 2) * 0.1;

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    phaseRef.current = 'exit';
    setShowButton(false);
    if (onComplete) onComplete();
  };

  return (
    <div className="third-screen">
      <div ref={mountRef} className="three-canvas" />

      {/* Card labels rendered in CSS over the 3D scene */}
      <div className="cards-overlay">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className={`card-label ${showButton ? 'visible' : ''}`}
            style={{ transitionDelay: `${i * 0.12}s` }}
          >
            {card.icon}
            <div className="card-title">{card.title}</div>
            <div className="card-body">{card.body}</div>
          </div>
        ))}
      </div>

      {/* Tricky speech */}
      <div className={`tricky-panel ${showButton ? 'visible' : ''}`}>
        <div className="tricky-dot-indicator" />
        <div className="bubble-name">Tricky</div>
        <p className="act2-text">
          This is Atlas. Everything a young player needs,<br />
          delivered straight from the pros.
        </p>
      </div>

      {showButton && (
        <button className="next-btn" onClick={handleNext}>
          This is big. What's next? →
        </button>
      )}

      <div className="scene-label">03 / 06</div>
    </div>
  );
};

export default ThirdScreen;