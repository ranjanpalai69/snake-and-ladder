"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useGame } from "@/hooks/useGame";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { PLAYER_COLOR_HEX } from "@/lib/utils";
import { cellToCoords, SNAKES, LADDERS, GRID_COLS, GRID_ROWS } from "@/lib/game/constants";
import { playDiceRoll, playStep, playSnakeBite, playLadderClimb, playWin } from "@/lib/sounds";

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL = 1;
const HALF = (GRID_COLS * CELL) / 2;
const PIECE_Y = 0.38;
const SNAKE_Y = 0.26;   // snakes lie flat on the board
const LADDER_Y = 0.44;  // ladders raised above snakes
const CELL_STEP_MS = 130;
const SNAKE_ANIM_MS = 1500;
const LADDER_ANIM_MS = 1100;

function ease(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ─── World helpers ────────────────────────────────────────────────────────────
function cellToWorld(cell: number): THREE.Vector3 {
  if (cell <= 0) return new THREE.Vector3(0, PIECE_Y, HALF + 1.4);
  const { row, col } = cellToCoords(cell);
  return new THREE.Vector3(col * CELL - HALF + CELL / 2, PIECE_Y, -row * CELL + HALF - CELL / 2);
}

function buildCellPath(from: number, diceValue: number): number[] {
  const path: number[] = [];
  const raw = from + diceValue;
  if (raw > 100) {
    for (let i = from + 1; i <= 100; i++) path.push(i);
    for (let i = 99; i >= 200 - raw; i--) path.push(i);
  } else {
    for (let i = from + 1; i <= raw; i++) path.push(i);
  }
  return path;
}

// ─── Camera auto-fit ──────────────────────────────────────────────────────────
function fitCamera(camera: THREE.PerspectiveCamera, w: number, h: number) {
  const aspect = w / h;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  const fovRad = camera.fov * Math.PI / 180;
  const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
  const BOARD = GRID_COLS + 1.5; // board + margin

  // At 45° elevation the board depth projects to board/sin(45°) in camera space
  const elevAngle = Math.PI / 4;
  const projH = BOARD / Math.sin(elevAngle);
  const distH = (projH / 2) / Math.tan(fovRad / 2);
  const distW = (BOARD / 2) / Math.tan(hFovRad / 2);
  const dist = Math.max(distH, distW) * 1.28;

  camera.position.set(0, dist * Math.sin(elevAngle), dist * Math.cos(elevAngle));
  camera.lookAt(0, 0, 0);
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function makeTextCanvas(text: string, bg: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = text === "100" ? "#ffd700" : "#e2e8f0";
  ctx.font = `bold ${text.length > 2 ? 14 : 18}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, 32, 32);
  return c;
}

function makeDiceCanvas(value: number, rolling: boolean): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, rolling ? "#7c3aed" : "#4f46e5");
  grad.addColorStop(1, rolling ? "#a21caf" : "#6d28d9");
  ctx.fillStyle = grad;
  (ctx as any).roundRect?.(4, 4, 120, 120, 14);
  ctx.fill();
  ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2;
  (ctx as any).roundRect?.(4, 4, 120, 120, 14);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  const dots: [number, number][][] = [
    [[64, 64]],
    [[36, 36], [92, 92]],
    [[36, 36], [64, 64], [92, 92]],
    [[36, 36], [92, 36], [36, 92], [92, 92]],
    [[36, 36], [92, 36], [64, 64], [36, 92], [92, 92]],
    [[36, 36], [92, 36], [36, 64], [92, 64], [36, 92], [92, 92]],
  ];
  for (const [dx, dy] of (dots[value - 1] ?? dots[0])) {
    ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

// ─── Board ────────────────────────────────────────────────────────────────────
function buildBoard(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(GRID_COLS + 1.3, 0.18, GRID_ROWS + 1.3),
    new THREE.MeshStandardMaterial({ color: 0x0a0818, roughness: 0.3, metalness: 0.4 })
  );
  base.position.y = -0.13; base.receiveShadow = true;
  g.add(base);
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(GRID_COLS + 1.4, 0.05, GRID_ROWS + 1.4),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x4f46e5, emissiveIntensity: 1.4, transparent: true, opacity: 0.75 })
  );
  edge.position.y = -0.04; g.add(edge);

  const snakeHeads = new Set(SNAKES.map(s => s.head));
  const ladderBottoms = new Set(LADDERS.map(l => l.bottom));

  for (let num = 1; num <= 100; num++) {
    const isSnake = snakeHeads.has(num);
    const isLadder = ladderBottoms.has(num);
    const isEnd = num === 100;
    let hex = num % 2 === 0 ? 0x1e1b4b : 0x2e2a5e;
    let bg = num % 2 === 0 ? "#1e1b4b" : "#2e2a5e";
    if (isSnake)  { hex = 0x7f1d1d; bg = "#7f1d1d"; }
    if (isLadder) { hex = 0x14532d; bg = "#14532d"; }
    if (isEnd)    { hex = 0x4a1d96; bg = "#4a1d96"; }

    const p = cellToWorld(num);
    const cell = new THREE.Mesh(
      new THREE.BoxGeometry(CELL - 0.04, 0.1, CELL - 0.04),
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.4, metalness: 0.1 })
    );
    cell.position.set(p.x, 0, p.z); cell.receiveShadow = true; g.add(cell);

    const tex = new THREE.CanvasTexture(makeTextCanvas(String(num), bg));
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL - 0.14, CELL - 0.14),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(p.x, 0.06, p.z);
    g.add(label);
  }
  return g;
}

// ─── Snake — flat S-curve lying on the board ──────────────────────────────────
function buildSnakeGroup(head: number, tail: number, idx: number): THREE.Group {
  const g = new THREE.Group();

  const startW = cellToWorld(head); startW.y = SNAKE_Y;
  const endW   = cellToWorld(tail); endW.y   = SNAKE_Y;

  // Direction in XZ
  const dx = endW.x - startW.x;
  const dz = endW.z - startW.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const nx = dx / len; const nz = dz / len;   // normalized forward
  const px = -nz; const pz = nx;               // perpendicular (XZ plane)

  // S-amplitude scales with snake length (min 0.5)
  const amp = Math.max(0.5, Math.min(2.0, len * 0.22));
  const flip = idx % 2 === 0 ? 1 : -1;

  // Five control points for a smooth S-curve flat on board
  const q0 = startW.clone();
  const q1 = new THREE.Vector3(startW.x + dx * 0.2  + px * amp * flip,  SNAKE_Y, startW.z + dz * 0.2  + pz * amp * flip);
  const q2 = new THREE.Vector3(startW.x + dx * 0.5,                      SNAKE_Y, startW.z + dz * 0.5);
  const q3 = new THREE.Vector3(startW.x + dx * 0.8  - px * amp * flip,  SNAKE_Y, startW.z + dz * 0.8  - pz * amp * flip);
  const q4 = endW.clone();

  const curve = new THREE.CatmullRomCurve3([q0, q1, q2, q3, q4], false, "centripetal", 0.5);

  const SNAKE_COLORS = [
    0x16a34a, 0xdc2626, 0xd97706, 0x7c3aed,
    0x0891b2, 0xbe123c, 0x15803d, 0xb45309, 0xc026d3,
  ];
  const bodyColor = SNAKE_COLORS[idx % SNAKE_COLORS.length];

  // Body tube
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor, roughness: 0.6, metalness: 0.1,
    emissive: new THREE.Color(bodyColor).multiplyScalar(0.06),
  });
  const bodyMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.115, 10, false), bodyMat);
  bodyMesh.castShadow = true;
  g.add(bodyMesh);

  // Scale stripe overlay (slightly transparent darker stripe)
  const stripeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor).multiplyScalar(0.55),
    roughness: 0.8, transparent: true, opacity: 0.45,
  });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.07, 6, false), stripeMat));

  // ── Head group (lies flat, faces the direction of the body start) ──────────
  const headGroup = new THREE.Group();
  headGroup.position.copy(startW);

  // Orient head toward first control point
  const headDir = q1.clone().sub(startW);
  if (headDir.length() > 0.01) {
    const angle = Math.atan2(headDir.x, headDir.z);
    headGroup.rotation.y = angle;
  }

  const headMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor).multiplyScalar(0.85),
    roughness: 0.45, metalness: 0.18,
    emissive: new THREE.Color(bodyColor).multiplyScalar(0.12),
  });

  // Flat head (flattened sphere)
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 10), headMat);
  headMesh.scale.set(1.05, 0.55, 1.3);
  headGroup.add(headMesh);

  // Snout bump
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), headMat);
  snout.scale.set(1.1, 0.5, 1.2);
  snout.position.set(0, 0, 0.2);
  headGroup.add(snout);

  // Eyes — glowing
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 1.5 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  [[-0.1, 0.1], [0.1, 0.1]].forEach(([xo]) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
    eye.position.set(xo, 0.07, 0.13); headGroup.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
    pupil.position.set(xo, 0.07, 0.19); headGroup.add(pupil);
  });

  // Tongue
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff1744, emissive: 0xff1744, emissiveIntensity: 0.8, side: THREE.DoubleSide });
  const tongueBase = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.14), tongueMat);
  tongueBase.position.set(0, 0.01, 0.3); headGroup.add(tongueBase);
  [-0.045, 0.045].forEach(xo => {
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.005, 0.07), tongueMat);
    fork.position.set(xo, 0.01, 0.41);
    fork.rotation.y = xo > 0 ? 0.35 : -0.35;
    headGroup.add(fork);
  });

  g.add(headGroup);

  // Tail tip
  const tailDir = q3.clone().sub(endW);
  const tailAngle = Math.atan2(tailDir.x, tailDir.z);
  const tailMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 })
  );
  tailMesh.position.copy(endW);
  tailMesh.position.y += 0.04;
  tailMesh.rotation.x = Math.PI / 2;
  tailMesh.rotation.z = tailAngle;
  g.add(tailMesh);

  g.userData = { curve, headGroup, head, tail };
  return g;
}

// ─── Ladder — raised above snakes ────────────────────────────────────────────
function buildLadderGroup(bottom: number, top: number): THREE.Group {
  const g = new THREE.Group();

  const botW = cellToWorld(bottom); botW.y = LADDER_Y;
  const topW = cellToWorld(top);   topW.y = LADDER_Y;

  // Perpendicular offset for rails (in XZ plane)
  const dx = topW.x - botW.x;
  const dz = topW.z - botW.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const perpX = (-dz / len) * 0.17;
  const perpZ = ( dx / len) * 0.17;

  // Slight arc midpoint
  const mid = botW.clone().lerp(topW, 0.5);
  mid.y += Math.max(0.2, len * 0.06);

  const railMat = new THREE.MeshStandardMaterial({
    color: 0x92400e, roughness: 0.45, metalness: 0.5,
    emissive: 0x3d1c00, emissiveIntensity: 0.18,
  });
  const rungMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, roughness: 0.28, metalness: 0.7,
    emissive: 0x5c3a00, emissiveIntensity: 0.12,
  });

  function makeRail(offX: number, offZ: number): THREE.CatmullRomCurve3 {
    const pts = [
      new THREE.Vector3(botW.x + offX, botW.y, botW.z + offZ),
      new THREE.Vector3(mid.x  + offX, mid.y,  mid.z  + offZ),
      new THREE.Vector3(topW.x + offX, topW.y, topW.z + offZ),
    ];
    const c = new THREE.CatmullRomCurve3(pts);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.042, 7, false), railMat);
    mesh.castShadow = true;
    g.add(mesh);
    return c;
  }

  const leftC  = makeRail( perpX,  perpZ);
  const rightC = makeRail(-perpX, -perpZ);

  // Rungs
  const numRungs = Math.max(3, Math.round(len * 1.9));
  for (let i = 0; i <= numRungs; i++) {
    const t = i / numRungs;
    const lp = leftC.getPoint(t);
    const rp = rightC.getPoint(t);
    const rungLen = lp.distanceTo(rp);
    const rungDir = rp.clone().sub(lp).normalize();
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, rungLen, 7), rungMat);
    rung.position.copy(lp.clone().lerp(rp, 0.5));
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rungDir);
    rung.castShadow = true;
    g.add(rung);
  }

  // Glowing end caps
  [botW, topW].forEach(pos => {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 1.8, transparent: true, opacity: 0.95 })
    );
    glow.position.set(pos.x, pos.y + 0.08, pos.z);
    g.add(glow);
  });

  // Centre path for piece animation
  const centerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(botW.x, botW.y + 0.06, botW.z),
    new THREE.Vector3(mid.x,  mid.y  + 0.06, mid.z),
    new THREE.Vector3(topW.x, topW.y + 0.06, topW.z),
  ]);
  g.userData = { curve: centerCurve, bottom, top };
  return g;
}

// ─── Dice ─────────────────────────────────────────────────────────────────────
function buildDiceGroup(): THREE.Group {
  const g = new THREE.Group();
  const mats = Array.from({ length: 6 }, (_, i) =>
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(makeDiceCanvas(i + 1, false)),
      roughness: 0.28, metalness: 0.12,
    })
  );
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), mats);
  die.castShadow = true; die.name = "dice";
  g.add(die);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.05, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x6366f1, emissiveIntensity: 1.3, transparent: true, opacity: 0.8 })
  );
  ring.rotation.x = Math.PI / 2; ring.position.y = -0.52;
  g.add(ring);
  // "Click to roll" hint label
  const hint = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.28),
    new THREE.MeshBasicMaterial({
      map: (() => {
        const cv = document.createElement("canvas");
        cv.width = 256; cv.height = 60;
        const ctx = cv.getContext("2d")!;
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0, 0, 256, 60);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("CLICK TO ROLL", 128, 30);
        return new THREE.CanvasTexture(cv);
      })(),
      transparent: true, depthWrite: false,
    })
  );
  hint.rotation.x = -Math.PI / 2;
  hint.position.set(0, -0.52, 0.82);
  g.add(hint);
  return g;
}

// ─── Animation step ───────────────────────────────────────────────────────────
interface AnimStep {
  duration: number;
  update: (t: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface GameSceneProps {
  singlePlayer?: boolean;
  onRollOverride?: () => void;
  onAnimDone?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GameScene({ singlePlayer = false, onRollOverride, onAnimDone }: GameSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { gameState, isRolling, isMyTurn } = useGame();
  const { rollDice } = useSocket();
  const { lastMove } = useGameStore();

  const isRollingRef   = useRef(isRolling);
  const isMyTurnRef    = useRef(isMyTurn);
  const onRollRef      = useRef<() => void>(onRollOverride ?? rollDice);
  const gameStateRef   = useRef(gameState);
  const onAnimDoneRef  = useRef(onAnimDone);
  const winPlayedRef   = useRef(false);

  useEffect(() => { isRollingRef.current = isRolling; }, [isRolling]);
  useEffect(() => { isMyTurnRef.current = singlePlayer || isMyTurn; }, [isMyTurn, singlePlayer]);
  useEffect(() => { onRollRef.current = onRollOverride ?? rollDice; }, [onRollOverride, rollDice]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { onAnimDoneRef.current = onAnimDone; }, [onAnimDone]);

  // Three.js refs
  const rendererRef    = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef       = useRef<THREE.Scene | null>(null);
  const cameraRef      = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef    = useRef<{ update: () => void; dispose: () => void; target: THREE.Vector3 } | null>(null);
  const piecesRef      = useRef<Map<string, THREE.Mesh>>(new Map());
  const diceGroupRef   = useRef<THREE.Group | null>(null);
  const snakeGroupsRef = useRef<Map<number, THREE.Group>>(new Map());
  const ladderGroupsRef= useRef<Map<number, THREE.Group>>(new Map());
  const rafRef         = useRef<number | null>(null);
  const diceSpinRef    = useRef(0);
  const pl1Ref         = useRef<THREE.PointLight | null>(null);

  const animQueueRef  = useRef<AnimStep[]>([]);
  const animStart     = useRef<number | null>(null);
  const animatingRef  = useRef(false);

  // ── Scene init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Starfield
    const starBuf = new Float32Array(2000 * 3);
    for (let i = 0; i < starBuf.length; i++) starBuf[i] = (Math.random() - 0.5) * 200;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starBuf, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07 })));

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
    fitCamera(camera, w, h);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(10, 18, 10); dir.castShadow = true;
    dir.shadow.mapSize.setScalar(2048); scene.add(dir);
    const pl1 = new THREE.PointLight(0x6366f1, 0.75); pl1.position.set(-5, 10, -5);
    scene.add(pl1); pl1Ref.current = pl1;
    const pl2 = new THREE.PointLight(0x8b5cf6, 0.35);
    pl2.position.set(5, 7, 5);
    scene.add(pl2);

    // Board
    scene.add(buildBoard());

    // Snakes
    SNAKES.forEach(({ head, tail }, i) => {
      const sg = buildSnakeGroup(head, tail, i);
      snakeGroupsRef.current.set(head, sg);
      scene.add(sg);
    });

    // Ladders (added after snakes so they render on top)
    LADDERS.forEach(({ bottom, top }) => {
      const lg = buildLadderGroup(bottom, top);
      ladderGroupsRef.current.set(bottom, lg);
      scene.add(lg);
    });

    // Dice
    const dg = buildDiceGroup();
    // Position dice off the right edge of the board
    dg.position.set(HALF + 1.2, 0.52, 0);
    scene.add(dg);
    diceGroupRef.current = dg;

    // Click handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      if (!isMyTurnRef.current || isRollingRef.current || animatingRef.current) return;
      const rect = mount.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.intersectObjects(dg.children, true).length > 0) {
        onRollRef.current?.();
        // Only play sound here in multiplayer (single-player handleRoll plays it)
        if (!singlePlayer) playDiceRoll();
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    // Resize → refit camera
    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth, nh = mount.clientHeight;
      if (cameraRef.current) {
        fitCamera(cameraRef.current, nw, nh);
        controlsRef.current?.target.set(0, 0, 0);
        controlsRef.current?.update();
      }
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controlsRef.current?.update();

      // Process queue
      const queue = animQueueRef.current;
      if (queue.length > 0) {
        animatingRef.current = true;
        const now = performance.now();
        if (animStart.current === null) {
          animStart.current = now;
          queue[0].onStart?.();
        }
        const step = queue[0];
        const t = Math.min((now - animStart.current) / step.duration, 1);
        step.update(ease(t));
        if (t >= 1) {
          step.onEnd?.();
          queue.shift();
          animStart.current = null;
          if (queue.length === 0) {
            animatingRef.current = false;
            onAnimDoneRef.current?.();
          }
        }
      }

      // Dice spin / bob
      const diceG = diceGroupRef.current;
      if (diceG) {
        if (isRollingRef.current) {
          diceSpinRef.current += 0.14;
          diceG.rotation.x = diceSpinRef.current;
          diceG.rotation.y = diceSpinRef.current * 0.72;
        } else {
          diceG.rotation.x = THREE.MathUtils.lerp(diceG.rotation.x, 0, 0.1);
          diceG.rotation.y = THREE.MathUtils.lerp(diceG.rotation.y, 0, 0.1);
          diceSpinRef.current = 0;
        }
        diceG.position.y = 0.52 + Math.sin(Date.now() * 0.0022) * 0.06;
      }

      // Pulse light
      if (pl1Ref.current) pl1Ref.current.intensity = 0.55 + Math.sin(Date.now() * 0.0009) * 0.22;

      renderer.render(scene, camera);
    };
    animate();

    // OrbitControls (lazy) — guard against unmount before import resolves
    let disposed = false;
    import("three/examples/jsm/controls/OrbitControls.js").then(({ OrbitControls }) => {
      if (disposed) return;
      const ctrl = new OrbitControls(camera, renderer.domElement);
      ctrl.target.set(0, 0, 0);
      ctrl.enablePan = false;
      ctrl.minDistance = 8;
      ctrl.maxDistance = 50;
      ctrl.minPolarAngle = Math.PI / 10;
      ctrl.maxPolarAngle = Math.PI / 2.2;
      ctrl.dampingFactor = 0.06;
      ctrl.enableDamping = true;
      controlsRef.current = ctrl;
    });

    return () => {
      disposed = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      controlsRef.current?.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      piecesRef.current.clear();
      snakeGroupsRef.current.clear();
      ladderGroupsRef.current.clear();
      rendererRef.current = null; sceneRef.current = null;
      cameraRef.current = null; diceGroupRef.current = null; pl1Ref.current = null;
      animQueueRef.current = []; animStart.current = null;
    };
  }, []);

  // ── Build move animation when lastMove changes ─────────────────────────────
  useEffect(() => {
    if (!lastMove) return;
    const { playerId, from, to, diceValue, hadSnake, hadLadder } = lastMove;
    const scene = sceneRef.current;
    if (!scene) return;

    // Ensure piece exists
    const color = new THREE.Color(
      PLAYER_COLOR_HEX[gameStateRef.current?.players.find(p => p.id === playerId)?.color ?? "blue"] ?? "#3B82F6"
    );
    let piece = piecesRef.current.get(playerId);
    if (!piece) {
      piece = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.23, 0.44, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.55, emissive: color.clone().multiplyScalar(0.3) })
      );
      piece.castShadow = true;
      piece.position.copy(cellToWorld(from));
      scene.add(piece);
      piecesRef.current.set(playerId, piece);
    }

    const p = piece; // stable for closures
    const queue = animQueueRef.current;
    const cellPath = buildCellPath(from, diceValue);

    // Step through each cell
    cellPath.forEach(cell => {
      const target = cellToWorld(cell);
      let stepFrom = new THREE.Vector3();
      queue.push({
        duration: CELL_STEP_MS,
        onStart() { stepFrom = p.position.clone(); playStep(); },
        update(t) {
          p.position.set(
            THREE.MathUtils.lerp(stepFrom.x, target.x, t),
            PIECE_Y + Math.sin(t * Math.PI) * 0.22,
            THREE.MathUtils.lerp(stepFrom.z, target.z, t)
          );
        },
      });
    });

    const landedOn = cellPath.at(-1) ?? from;

    if (hadSnake) {
      const sg = snakeGroupsRef.current.get(landedOn);
      const sCurve = sg?.userData?.curve as THREE.CatmullRomCurve3 | undefined;
      const headG  = sg?.userData?.headGroup as THREE.Group | undefined;

      // Snake bite flash
      queue.push({
        duration: 380,
        onStart() { playSnakeBite(); },
        update(t) {
          if (headG) headG.scale.setScalar(1 + Math.sin(t * Math.PI * 2.5) * 0.5);
        },
        onEnd() { if (headG) headG.scale.setScalar(1); },
      });

      // Slide along snake body (flat path)
      if (sCurve) {
        queue.push({
          duration: SNAKE_ANIM_MS,
          update(t) {
            const pt = sCurve.getPoint(t);
            p.position.set(pt.x, PIECE_Y, pt.z);
          },
          onEnd() { p.position.copy(cellToWorld(to)); },
        });
      } else {
        queue.push({ duration: 200, update() {}, onEnd() { p.position.copy(cellToWorld(to)); } });
      }
    } else if (hadLadder) {
      const lg = ladderGroupsRef.current.get(landedOn);
      const lCurve = lg?.userData?.curve as THREE.CatmullRomCurve3 | undefined;

      if (lCurve) {
        queue.push({
          duration: LADDER_ANIM_MS,
          onStart() { playLadderClimb(); },
          update(t) {
            const pt = lCurve.getPoint(t);
            p.position.set(pt.x, pt.y + 0.1, pt.z);
          },
          onEnd() { p.position.copy(cellToWorld(to)); },
        });
      } else {
        queue.push({ duration: 200, update() {}, onEnd() { p.position.copy(cellToWorld(to)); } });
      }
    }

    // Win
    if (to === 100 && !winPlayedRef.current) {
      winPlayedRef.current = true;
      queue.push({
        duration: 700,
        onStart() { playWin(); },
        update(t) { p.position.y = PIECE_Y + Math.abs(Math.sin(t * Math.PI * 4)) * 0.55; },
        onEnd() { p.position.y = PIECE_Y; },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove]);

  // ── Reset win flag ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState?.status === "playing") winPlayedRef.current = false;
  }, [gameState?.status]);

  // ── Sync pieces (initial placement & new players) ─────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !gameState) return;

    for (const player of gameState.players) {
      if (piecesRef.current.has(player.id)) continue; // already exists, animation handles position
      const color = new THREE.Color(PLAYER_COLOR_HEX[player.color] ?? "#ffffff");
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.23, 0.44, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.55, emissive: color.clone().multiplyScalar(0.3) })
      );
      mesh.castShadow = true;
      mesh.position.copy(cellToWorld(player.position));
      scene.add(mesh);
      piecesRef.current.set(player.id, mesh);
    }

    // Highlight active player
    const current = gameState.players[gameState.currentPlayerIndex];
    piecesRef.current.forEach((mesh, id) => {
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = id === current?.id ? 0.85 : 0.2;
    });
  }, [gameState]);

  // ── Update dice face ──────────────────────────────────────────────────────
  useEffect(() => {
    const dg = diceGroupRef.current;
    if (!dg || !gameState) return;
    const die = dg.getObjectByName("dice") as THREE.Mesh | undefined;
    if (!die) return;
    (die.material as THREE.MeshStandardMaterial[]).forEach((m, i) => {
      m.map?.dispose();
      m.map = new THREE.CanvasTexture(makeDiceCanvas(i + 1, isRolling));
      m.needsUpdate = true;
    });
  }, [gameState?.dice.value, isRolling]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: (singlePlayer || isMyTurn) && !isRolling && !animatingRef.current ? "pointer" : "default" }}
    />
  );
}
