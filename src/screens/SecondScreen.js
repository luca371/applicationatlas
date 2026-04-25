import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './SecondScreen.css';

const SecondScreen = ({ onComplete }) => {
  const mountRef       = useRef(null);
  const rendererRef    = useRef(null);
  const frameRef       = useRef(null);
  const clockRef       = useRef(new THREE.Clock());
  const phaseRef       = useRef('act1'); // act1 → act2 → act3 → score → portal
  const cameraRef      = useRef(null);

  const trickyRef      = useRef(null);
  const trickyLidL     = useRef(null);
  const trickyLidR     = useRef(null);
  const portalRef      = useRef(null);
  const portalParts    = useRef([]);
  const blinkTimer     = useRef(0);
  const blinkState     = useRef('open');
  const elapsed        = useRef(0);
  const completeCalled = useRef(false);
  const act3Start      = useRef(0);
  const scoreStart     = useRef(0);
  const portalStart    = useRef(0);

  // camera targets for lerping
  const camTargetPos   = useRef(new THREE.Vector3(0, 9, 20));
  const camTargetLook  = useRef(new THREE.Vector3(0, 1, 0));
  const camLookCurrent = useRef(new THREE.Vector3(0, 1, 0));

  const [act, setAct]             = useState(1);
  const [textLine, setTextLine]   = useState(0);
  const [showBtn1, setShowBtn1]   = useState(false);
  const [showBtn2, setShowBtn2]   = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05050a);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── SCENE ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.038);

    /* ── CAMERA ── */
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
    camera.position.set(0, 9, 20);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0x0a0a1a, 1));

    const courtSpot = new THREE.SpotLight(0xffe8c0, 4, 35, Math.PI / 7, 0.35, 1.2);
    courtSpot.position.set(0, 16, 0);
    courtSpot.target.position.set(0, 0, 0);
    courtSpot.castShadow = true;
    courtSpot.shadow.mapSize.width = 2048;
    courtSpot.shadow.mapSize.height = 2048;
    scene.add(courtSpot);
    scene.add(courtSpot.target);

    // right hoop spotlight (for act 3)
    const hoopSpot = new THREE.SpotLight(0xffa040, 3, 20, Math.PI / 6, 0.4, 1);
    hoopSpot.position.set(14, 12, 0);
    hoopSpot.target.position.set(13.9, 3, 0);
    hoopSpot.intensity = 0;
    scene.add(hoopSpot);
    scene.add(hoopSpot.target);

    // visible light cone
    const coneGeo = new THREE.ConeGeometry(4.5, 16, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xffe8c0, transparent: true, opacity: 0.04, side: THREE.BackSide });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 8, 0);
    cone.rotation.x = Math.PI;
    scene.add(cone);

    const blueRim = new THREE.DirectionalLight(0x1133aa, 0.25);
    blueRim.position.set(-12, 4, 6);
    scene.add(blueRim);

    /* ── FLOOR ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 15),
      new THREE.MeshStandardMaterial({ color: 0x7a3a10, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── COURT LINES ── */
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const addRect = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.01, z);
      scene.add(m);
    };
    addRect(27.8, 0.055, 0, -7.47);
    addRect(27.8, 0.055, 0,  7.47);
    addRect(0.055, 14.9, -13.9, 0);
    addRect(0.055, 14.9,  13.9, 0);
    addRect(0.055, 14.9, 0, 0);

    const mkCircle = (r) => {
      const pts = Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * r, 0.011, Math.sin(a) * r);
      });
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff })));
    };
    mkCircle(1.85);

    const mkArc = (cx, flip = 1) => {
      const pts = Array.from({ length: 49 }, (_, i) => {
        const a = -Math.PI / 2 + (i / 48) * Math.PI;
        return new THREE.Vector3(cx + Math.cos(a) * 6.7 * flip, 0.011, Math.sin(a) * 6.7);
      });
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff })));
    };
    mkArc(-13.9,  1);
    mkArc( 13.9, -1);

    const paintMat = new THREE.MeshBasicMaterial({ color: 0x1a0800, transparent: true, opacity: 0.45 });
    [-11.2, 11.2].forEach(x => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.8), paintMat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.005, 0);
      scene.add(p);
    });

    const pkMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const mkBox = (cx) => {
      const s = cx < 0 ? 1 : -1;
      const corners = [
        new THREE.Vector3(cx,         0.012, -2.9),
        new THREE.Vector3(cx + s*5.4, 0.012, -2.9),
        new THREE.Vector3(cx + s*5.4, 0.012,  2.9),
        new THREE.Vector3(cx,         0.012,  2.9),
        new THREE.Vector3(cx,         0.012, -2.9),
      ];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(corners), pkMat));
    };
    mkBox(-13.9);
    mkBox( 13.9);

    /* ── HOOPS ── */
    const mkHoop = (x) => {
      const s = x < 0 ? 1 : -1;
      const bb = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.1, 1.85),
        new THREE.MeshStandardMaterial({ color: 0xccccdd, transparent: true, opacity: 0.65 })
      );
      bb.position.set(x + s * 0.1, 3.6, 0);
      scene.add(bb);

      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(0.23, 0.022, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6 })
      );
      // flat horizontal ring — rotated on X so it lies parallel to the floor
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(x + s * 0.52, 3.05, 0);
      scene.add(hoop);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 3.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x777788 })
      );
      pole.position.set(x, 1.6, 0);
      scene.add(pole);
    };
    mkHoop(-13.9);
    mkHoop( 13.9);

    /* ── STANDS ── */
    const standMat = new THREE.MeshStandardMaterial({ color: 0x0d0d18, roughness: 1 });
    [[-15.5, 0], [15.5, 0]].forEach(([x, z]) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 15), standMat);
      s.position.set(x, 2, z);
      scene.add(s);
    });
    const backStand = new THREE.Mesh(new THREE.BoxGeometry(28, 5, 2), standMat);
    backStand.position.set(0, 1.5, -8.5);
    scene.add(backStand);

    /* ── PORTAL (flat on floor, under right basket) ── */
    const pg = new THREE.Group();
    pg.position.set(13.38, 0.02, 0);
    pg.rotation.x = -Math.PI / 2;
    pg.visible = false;
    pg.scale.set(0.01, 0.01, 0.01);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.09, 24, 80),
      new THREE.MeshStandardMaterial({ color: 0xff5f1f, emissive: 0xff3300, emissiveIntensity: 3, roughness: 0.1, metalness: 0.6 })
    );
    pg.add(ring);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 64),
      new THREE.MeshBasicMaterial({ color: 0x110000, side: THREE.DoubleSide, transparent: true, opacity: 0.97 })
    );
    pg.add(disc);

    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.28, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xff5f1f, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    pg.add(glowRing);

    const portalLight = new THREE.PointLight(0xff5f1f, 0, 6);
    pg.add(portalLight);

    const parts = Array.from({ length: 50 }, () => {
      const pm = new THREE.Mesh(
        new THREE.SphereGeometry(0.025 + Math.random() * 0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 1, 0.6), transparent: true, opacity: 0.8 })
      );
      const a = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 0.5;
      pm.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      pm.userData = { angle: a, r, speed: 0.015 + Math.random() * 0.02 };
      pg.add(pm);
      return pm;
    });
    portalParts.current = parts;
    portalRef.current = pg;
    scene.add(pg);

    /* ── TRICKY ── */
    const tg = new THREE.Group();
    tg.position.set(-10, 2.5, -4);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8, roughness: 0 })
    );
    tg.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
    );
    tg.add(halo);
    tg.add(new THREE.PointLight(0xffffff, 1.5, 5));

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

    /* ── STARS ── */
    const sv = [];
    for (let i = 0; i < 800; i++) sv.push((Math.random() - 0.5) * 120, Math.random() * 30 + 18, (Math.random() - 0.5) * 120);
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.4 })));

    /* ── ANIMATION ── */
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      elapsed.current += delta;
      const t = elapsed.current;
      const phase = phaseRef.current;
      const cam = cameraRef.current;
      const tricky = trickyRef.current;

      // ── CAMERA LERP ──
      const lerpSpeed = phase === 'act2' ? 3.5 : 1.8;
      cam.position.lerp(camTargetPos.current, delta * lerpSpeed);
      camLookCurrent.current.lerp(camTargetLook.current, delta * (lerpSpeed + 1));
      cam.lookAt(camLookCurrent.current);

      // ── ACT 1 — slow drift wide ──
      if (phase === 'act1') {
        camTargetPos.current.set(Math.sin(t * 0.05) * 2, 9 + Math.sin(t * 0.04) * 0.4, Math.max(20 - t * 0.2, 14));
        camTargetLook.current.set(0, 1, 0);
      }

      // ── ACT 2 — big zoom to center court, low angle ──
      if (phase === 'act2') {
        camTargetPos.current.set(0, 1.8, 5);
        camTargetLook.current.set(0, 0.5, 0);
      }

      // ── ACT 3 — camera swings right toward right hoop ──
      if (phase === 'act3') {
        if (act3Start.current === 0) act3Start.current = t;
        const at = Math.min((t - act3Start.current) / 2.5, 1);
        const eased = at < 0.5 ? 2 * at * at : -1 + (4 - 2 * at) * at;
        camTargetPos.current.set(
          THREE.MathUtils.lerp(cam.position.x, 8, eased),
          THREE.MathUtils.lerp(cam.position.y, 5, eased),
          THREE.MathUtils.lerp(cam.position.z, 10, eased)
        );
        camTargetLook.current.set(13.9, 3, 0);
        hoopSpot.intensity = THREE.MathUtils.lerp(hoopSpot.intensity, 3, delta * 2);

        // after camera settles, show portal and trigger scoring
        if (at > 0.9 && scoreStart.current === 0) {
          scoreStart.current = t;
          portalRef.current.visible = true;
          phaseRef.current = 'score';
        }
      }

      // ── SCORE — Tricky launches toward hoop ──
      if (phase === 'score') {
        const st = t - scoreStart.current;

        // portal scales in from floor
        const ps = Math.min(st * 3, 1);
        portalRef.current.scale.set(ps, ps, ps);
        portalLight.intensity = ps * 2.5;
        portalParts.current.forEach(p => {
          p.userData.angle += p.userData.speed;
          p.position.x = Math.cos(p.userData.angle) * p.userData.r;
          p.position.y = Math.sin(p.userData.angle) * p.userData.r;
        });
        portalRef.current.children[0].rotation.z += delta * 0.8;

        if (st > 0.6) {
          // Tricky arcs from left corner up through hoop
          const ft = Math.min((st - 0.6) / 1.4, 1);
          const fe = ft < 0.5 ? 2 * ft * ft : -1 + (4 - 2 * ft) * ft;

          tricky.position.x = THREE.MathUtils.lerp(-10, 13.38, fe);
          tricky.position.z = THREE.MathUtils.lerp(-4, 0, fe);
          tricky.position.y = 2.5 + Math.sin(fe * Math.PI) * 5; // arc over hoop
          tricky.rotation.x += delta * 10;
          tricky.rotation.y += delta * 8;

          camTargetLook.current.set(tricky.position.x, tricky.position.y, tricky.position.z);

          if (ft >= 1 && portalStart.current === 0) {
            portalStart.current = t;
            // store velocity for gravity drop
            tricky.userData.velY = 0;
            phaseRef.current = 'portal';
          }
        }
      }

      // ── PORTAL — Tricky falls with gravity into floor portal ──
      if (phase === 'portal') {

        // gravity — accelerate downward
        tricky.userData.velY = (tricky.userData.velY || 0) - 18 * delta;
        tricky.position.y += tricky.userData.velY * delta;
        tricky.rotation.x += delta * 14;
        tricky.rotation.z += delta * 6;

        // shrink as it gets close to floor
        const distToFloor = Math.max(tricky.position.y, 0);
        const shrink = Math.min(distToFloor / 1.5, 1);
        tricky.scale.set(Math.max(shrink, 0.01), Math.max(shrink, 0.01), Math.max(shrink, 0.01));

        // camera drops to watch it fall
        camTargetPos.current.set(10, 3.5, 8);
        camTargetLook.current.set(13.38, 0.5, 0);

        // portal light pulses as Tricky approaches
        const proximity = Math.max(1 - tricky.position.y / 3, 0);
        portalLight.intensity = 2.5 + proximity * 4;
        portalRef.current.children[0].rotation.z += delta * (1 + proximity * 3);

        // complete when Tricky hits the floor
        if (tricky.position.y <= 0.02 && !completeCalled.current) {
          completeCalled.current = true;
          if (onComplete) onComplete();
        }
      }

      // ── TRICKY IDLE float ──
      if (phase === 'act1' || phase === 'act2') {
        tricky.position.y = 2.5 + Math.sin(t * 1.8) * 0.1;
        tricky.rotation.y = Math.sin(t * 0.4) * 0.12;
        halo.material.opacity = 0.08 + Math.sin(t * 2.5) * 0.05;
      }

      // cone pulse
      cone.material.opacity = 0.035 + Math.sin(t * 1.2) * 0.008;

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

    // Act 1 text cascade
    const timers = [
      setTimeout(() => setTextLine(1), 600),
      setTimeout(() => setTextLine(2), 2400),
      setTimeout(() => setTextLine(3), 4000),
      setTimeout(() => setTextLine(4), 5500),
      setTimeout(() => setShowBtn1(true), 6400),
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeeProblem = () => {
    setShowBtn1(false);
    setAct(2);
    phaseRef.current = 'act2';
    // zoom in on court
    camTargetPos.current.set(0, 5, 12);
    setTimeout(() => setShowBtn2(true), 2200);
  };

  const handleUnderstood = () => {
    setShowBtn2(false);
    setAct(3);
    phaseRef.current = 'act3';
  };

  return (
    <div className="second-screen">
      <div ref={mountRef} className="three-canvas" />

      {/* ACT 1 — problem text top left */}
      {act === 1 && (
        <div className={`tricky-panel ${textLine >= 1 ? 'visible' : ''}`}>
          <div className="tricky-dot-indicator" />
          <div className="bubble-name">Tricky</div>
          <div className="bubble-lines">
            {[
              "Every day, thousands of young players grind alone.",
              "No access to elite training.",
              "No real connection to the pros who made it.",
              "The gap is real. Atlas is the bridge.",
            ].map((line, i) => (
              <p key={i} className={`bubble-line ${textLine >= i + 1 ? 'show' : ''} ${i === 3 ? 'highlight' : ''}`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ACT 2 — second prompt */}
      {act === 2 && (
        <div className="tricky-panel visible act2-panel">
          <div className="tricky-dot-indicator" />
          <div className="bubble-name">Tricky</div>
          <p className="act2-text">
            That's exactly why Atlas exists.<br />
            Let me show you what I mean.
          </p>
        </div>
      )}

      {/* ACT 3 label */}
      {act === 3 && (
        <div className="act3-label">
          <span>Watch closely.</span>
        </div>
      )}

      {showBtn1 && (
        <button className="next-btn" onClick={handleSeeProblem}>
          I see the problem →
        </button>
      )}

      {showBtn2 && (
        <button className="next-btn understood-btn" onClick={handleUnderstood}>
          Understood. Show me.
        </button>
      )}

      <div className="scene-label">02 / 06</div>
    </div>
  );
};

export default SecondScreen;