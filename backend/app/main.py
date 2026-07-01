"""FastAPI app factory + lifespan."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.db.connection import get_pool, close_pool
from app.routers import knowledge, system, auth, skills, cron, sessions, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    pool = await get_pool()
    print(f"✅ PostgreSQL pool initialized ({pool.get_size()} connections)")
    yield
    # Shutdown
    await close_pool()
    print("✅ PostgreSQL pool closed")


app = FastAPI(
    title="Hermes Dashboard API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — localhost + Tailscale
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict to Tailscale IPs in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(knowledge.router)
app.include_router(system.router)
app.include_router(auth.router)
app.include_router(skills.router)
app.include_router(cron.router)
app.include_router(sessions.router)
app.include_router(chat.router)


# ── Obsidian-like 3D graph (standalone HTML, no Next.js needed) ──────────────
from fastapi import APIRouter as _AR
from fastapi.responses import HTMLResponse as _HR

_obs_router = _AR()


@_obs_router.get("/obsidian", response_class=_HR)
@_obs_router.get("/knowledge-graph", response_class=_HR)
async def _obsidian_graph():
    """Graphe 3D Three.js — 448 notes + 66 liens, façon Obsidian."""
    return _HR(content=_OBSIDIAN_HTML)


# ── Vault sub-pages (one per category) ──────────────────────
@_obs_router.get("/vault/{folder}", response_class=_HR)
async def _vault_page(folder: str):
    """Page vault filtrée par catégorie (skills, kanban, projets, logs, root)."""
    valid = {"skills": "🧬 Skills", "kanban": "📋 Kanban", "projets": "📂 Projets", "logs": "📜 Logs", "root": "🏠 Root"}
    if folder not in valid:
        return _HR(content=f"<h1>Vault inconnu : {folder}</h1><p>Disponibles: {', '.join(valid.keys())}</p>", status_code=404)
    return _HR(content=_VAULT_SINGLE_HTML.replace("{{FOLDER}}", folder).replace("{{TITLE}}", valid[folder]))


_VAULT_SINGLE_HTML = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{TITLE}} — Hermes Vault</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0b13; color: #c8d3e8; font-family: 'Inter', system-ui, sans-serif; }
  .nav { padding: 20px 24px; border-bottom: 1px solid rgba(125,211,252,.08); display: flex; align-items: center; gap: 16px; }
  .nav a { color: #7dd3fc; text-decoration: none; font-size: 13px; }
  .nav a:hover { text-decoration: underline; }
  .nav .sep { color: #475569; }
  .nav h1 { font-size: 16px; color: #f0f6fc; }
  .list { display: grid; gap: 1px; background: rgba(255,255,255,.02); }
  .item { background: #0d0f19; padding: 16px 24px; cursor: pointer; transition: background .15s; display: flex; align-items: center; gap: 12px; border-left: 3px solid transparent; }
  .item:hover { background: rgba(125,211,252,.04); border-left-color: rgba(125,211,252,.3); }
  .item .icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .item .info { flex: 1; min-width: 0; }
  .item .info .title { font-size: 13px; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .info .meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .item .info .meta .tag { background: rgba(125,211,252,.1); color: #7dd3fc; padding: 1px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; }
  .item .size { font-size: 10px; color: #475569; flex-shrink: 0; }
  #panel { position: fixed; right: -520px; top: 0; bottom: 0; width: 500px; background: #0d0f19; border-left: 1px solid rgba(125,211,252,.08); z-index: 20; transition: right .3s; overflow-y: auto; }
  #panel.open { right: 0; }
  #panel .close { position: sticky; top: 0; float: right; background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; padding: 16px; z-index: 1; }
  #panel .close:hover { color: #f0f6fc; }
  #panel .content { padding: 0 20px 20px; }
  #panel h2 { font-size: 16px; color: #f0f6fc; margin-bottom: 12px; }
  #panel pre { white-space: pre-wrap; font-size: 12px; line-height: 1.6; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
  .empty { text-align: center; padding: 60px 20px; color: #475569; }
  .count { font-size: 12px; color: #64748b; padding: 12px 24px; }
</style>
</head>
<body>
<div class="nav">
  <a href="/obsidian">📚 Graph</a>
  <span class="sep">›</span>
  <h1>{{TITLE}}</h1>
</div>
<div class="count" id="count"></div>
<div class="list" id="list"></div>
<div id="panel"><button class="close" onclick="closePanel()">×</button><div class="content" id="panel-content"></div></div>

<script>
const FOLDER = '{{FOLDER}}';
const rootFolder = FOLDER === 'root' ? '' : FOLDER;

async function init() {
  const res = await fetch(`/api/knowledge/notes?folder=${encodeURIComponent(rootFolder)}&limit=500`);
  const data = await res.json();
  const notes = data.notes || [];

  document.getElementById('count').textContent = `${notes.length} note(s)`;

  if (!notes.length) {
    document.getElementById('list').innerHTML = '<div class="empty">Aucune note dans ce vault</div>';
    return;
  }

  const icons = { skill: '🧬', kanban: '📋', project: '📂', log: '📜', note: '📝', index: '🏠' };
  const color = FOLDER === 'skills' ? '#22d3ee' : FOLDER === 'kanban' ? '#fb923c' : FOLDER === 'projets' ? '#a78bfa' : FOLDER === 'logs' ? '#34d399' : '#475569';

  document.getElementById('list').innerHTML = notes.map(n => `
    <div class="item" onclick="openNote(${n.id})">
      <div class="icon" style="background:${color}20;color:${color}">${icons[n.type] || '📄'}</div>
      <div class="info">
        <div class="title">${esc(n.title)}</div>
        <div class="meta">
          <span class="tag">${n.type || 'note'}</span>
          ${(n.tags||'[]')!=='[]' ? JSON.parse(n.tags||'[]').map(t => `<span class="tag">${esc(t)}</span>`).join('') : ''}
        </div>
      </div>
      <div class="size">${n.size ? (n.size/1024).toFixed(1)+'KB' : ''}</div>
    </div>
  `).join('');
}

async function openNote(id) {
  const res = await fetch(`/api/knowledge/notes/${id}`);
  const data = await res.json();
  const note = data.note || {};
  document.getElementById('panel-content').innerHTML = `
    <h2>${esc(note.title || 'Sans titre')}</h2>
    <pre>${esc(note.content || '(pas de contenu)')}</pre>
  `;
  document.getElementById('panel').classList.add('open');
}

function closePanel() { document.getElementById('panel').classList.remove('open'); }
function esc(s) { const d=document.createElement('div');d.textContent=s;return d.innerHTML; }

init();
</script>
</body>
</html>"""


@app.get("/api/knowledge/graph3d")
async def _graph3d():
    """Proxy qui retourne nodes + edges en un seul call pour le frontend 3D."""
    from app.services.knowledge_vault import vault
    return await vault.get_graph()


# ── Register the obsidian router (MUST be after all @_obs_router decorators) ──
app.include_router(_obs_router)  # /obsidian, /knowledge-graph, /vault/{folder}


_OBSIDIAN_HTML = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Obsidian Vault — Hermes Knowledge Graph 3D</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0b13; color: #c8d3e8; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
  #c { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
  #hud { position: fixed; top: 16px; left: 16px; z-index: 10; pointer-events: none; }
  #hud h1 { font-size: 18px; font-weight: 600; color: #7dd3fc; margin-bottom: 4px; text-shadow: 0 0 20px rgba(125,211,252,.4); }
  #hud p { font-size: 12px; color: #64748b; }
  #hud .stats { margin-top: 12px; display: flex; gap: 12px; }
  #hud .stat { background: rgba(20,22,35,.8); border: 1px solid rgba(125,211,252,.15); padding: 6px 12px; border-radius: 8px; font-size: 11px; }
  #hud .stat b { color: #7dd3fc; font-size: 14px; }
  #search { position: fixed; top: 16px; right: 16px; z-index: 10; pointer-events: auto; }
  #search input { background: rgba(20,22,35,.9); border: 1px solid rgba(125,211,252,.2); color: #c8d3e8; padding: 10px 16px; border-radius: 10px; font-size: 13px; width: 240px; outline: none; }
  #search input:focus { border-color: rgba(125,211,252,.5); box-shadow: 0 0 20px rgba(125,211,252,.15); }
  #panel { position: fixed; right: -440px; top: 60px; bottom: 16px; width: 420px; background: rgba(13,15,25,.97); border: 1px solid rgba(125,211,252,.12); border-radius: 12px; z-index: 20; transition: right .3s cubic-bezier(.4,0,.2,1); overflow-y: auto; }
  #panel.open { right: 16px; }
  #panel .hdr { padding: 20px; border-bottom: 1px solid rgba(125,211,252,.08); position: sticky; top: 0; background: rgba(13,15,25,.97); z-index: 1; }
  #panel .hdr h2 { font-size: 16px; color: #f0f6fc; margin-bottom: 6px; }
  #panel .hdr .meta { font-size: 11px; color: #64748b; display: flex; gap: 8px; flex-wrap: wrap; }
  #panel .hdr .meta .badge { background: rgba(125,211,252,.1); color: #7dd3fc; padding: 2px 8px; border-radius: 6px; }
  #panel .close { position: absolute; top: 16px; right: 16px; cursor: pointer; color: #64748b; font-size: 20px; background: none; border: none; }
  #panel .close:hover { color: #f0f6fc; }
  #panel .body { padding: 20px; }
  #panel .body pre { white-space: pre-wrap; font-size: 12px; line-height: 1.7; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
  #panel .links { margin-top: 16px; }
  #panel .links h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 8px; }
  #panel .links a { display: block; color: #7dd3fc; font-size: 12px; padding: 6px 0; text-decoration: none; cursor: pointer; }
  #panel .links a:hover { text-decoration: underline; }
  #filters { position: fixed; bottom: 16px; left: 16px; z-index: 10; display: flex; gap: 8px; }
  #filters .filter { background: rgba(20,22,35,.85); border: 1px solid rgba(255,255,255,.08); padding: 6px 14px; border-radius: 20px; font-size: 11px; cursor: pointer; transition: all .2s; }
  #filters .filter:hover { border-color: rgba(125,211,252,.3); }
  #filters .filter.active { background: rgba(125,211,252,.15); border-color: rgba(125,211,252,.4); color: #7dd3fc; }
  #hint { position: fixed; bottom: 16px; right: 16px; font-size: 10px; color: #475569; z-index: 10; }
  #loading { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 5; }
  #loading .spin { width: 48px; height: 48px; border: 3px solid rgba(125,211,252,.15); border-top-color: #7dd3fc; border-radius: 50%; animation: sp 1s linear infinite; margin: 0 auto 12px; }
  @keyframes sp { to { transform: rotate(360deg); } }
  #loading p { font-size: 12px; color: #64748b; text-align: center; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="loading"><div class="spin"></div><p>Chargement du vault…</p></div>
<div id="hud" style="display:none">
  <h1>📚 Knowledge Vault</h1>
  <p>Hermes Obsidian Graph — 448 notes interconnectées</p>
  <div class="stats">
    <div class="stat"><b id="stat-nodes">0</b> notes</div>
    <div class="stat"><b id="stat-edges">0</b> liens</div>
    <div class="stat"><b id="stat-visible">0</b> visibles</div>
  </div>
</div>
<div id="search" style="display:none">
  <input type="text" id="search-input" placeholder="🔎 Rechercher une note…">
</div>
<div id="filters" style="display:none">
  <div class="filter active" data-folder="all">Toutes</div>
  <div class="filter" data-folder="skills">🧬 Skills</div>
  <div class="filter" data-folder="kanban">📋 Kanban</div>
  <div class="filter" data-folder="projets">📂 Projets</div>
  <div class="filter" data-folder="logs">📜 Logs</div>
  <div class="filter" data-folder="">🏠 Root</div>
</div>
<div id="panel"><button class="close" onclick="closePanel()">×</button><div class="hdr"><h2 id="panel-title"></h2><div class="meta" id="panel-meta"></div></div><div class="body"><pre id="panel-content"></pre><div class="links" id="panel-links"></div></div></div>
<div id="hint">Glisser pour tourner · Scroll pour zoomer · Clic droit pour pan</div>

<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/" } }
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const FOLDER_COLORS = { '': 0x475569, 'skills': 0x22d3ee, 'kanban': 0xfb923c, 'projets': 0xa78bfa, 'logs': 0x34d399 };
let scene, camera, renderer, controls;
let graphData = { nodes: [], edges: [] };
let nodeMeshes = [], linkLines = [];
let hovered = null, selected = null;
let activeFolder = 'all';
let raycaster, mouse;
let labelSprites = [];

// ── Init ──────────────────────────────────────────────
async function init() {
  const res = await fetch('/api/knowledge/graph');
  graphData = await res.json();
  // Normalize: API returns "edges", frontend uses "edges"
  if (!graphData.edges) graphData.edges = graphData.links || [];
  document.getElementById('loading').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('search').style.display = 'block';
  document.getElementById('filters').style.display = 'flex';
  document.getElementById('stat-nodes').textContent = graphData.nodes.length;
  document.getElementById('stat-edges').textContent = graphData.edges.length;

  setupThree();
  buildGraph();
  animate();
}

function setupThree() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0b13, 0.008);
  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 280);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.8;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  // Lights
  scene.add(new THREE.AmbientLight(0x404060, 0.5));
  const dl = new THREE.DirectionalLight(0x7dd3fc, 0.8);
  dl.position.set(50, 50, 50);
  scene.add(dl);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  // Raycaster for sphere
  raycaster.params.Points.threshold = 8;
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', onClick);
}

// ── Spherical distribution (galaxy-like) ─────────────
function distribute(nodes) {
  const byFolder = {};
  nodes.forEach(n => {
    const f = n.folder || '';
    if (!byFolder[f]) byFolder[f] = [];
    byFolder[f].push(n);
  });
  const folders = Object.keys(byFolder);
  const folderOffsets = {};
  folders.forEach((f, i) => {
    const angle = (i / folders.length) * Math.PI * 2;
    folderOffsets[f] = { x: Math.cos(angle) * 60, z: Math.sin(angle) * 60, y: (i - folders.length/2) * 30 };
  });
  nodes.forEach(n => {
    const f = n.folder || '';
    const off = folderOffsets[f] || { x: 0, y: 0, z: 0 };
    const idx = byFolder[f].indexOf(n);
    const count = byFolder[f].length;
    const phi = Math.acos(-1 + (2 * idx) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const r = 20 + Math.random() * 30;
    n._pos = new THREE.Vector3(
      off.x + r * Math.sin(phi) * Math.cos(theta),
      off.y + r * Math.sin(phi) * Math.sin(theta),
      off.z + r * Math.cos(phi)
    );
  });
}

function buildGraph() {
  // Clear previous
  nodeMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  linkLines.forEach(l => { scene.remove(l); l.geometry.dispose(); l.material.dispose(); });
  labelSprites.forEach(s => scene.remove(s));
  nodeMeshes = []; linkLines = []; labelSprites = [];

  const visibleNodes = activeFolder === 'all'
    ? graphData.nodes
    : graphData.nodes.filter(n => (n.folder || '') === activeFolder);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  distribute(visibleNodes);

  // Nodes as instanced spheres
  visibleNodes.forEach(n => {
    const color = FOLDER_COLORS[n.folder || ''] || 0x64748b;
    const geo = new THREE.SphereGeometry(2.2, 12, 12);
    const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3, shininess: 60 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(n._pos);
    mesh.userData = n;
    scene.add(mesh);
    nodeMeshes.push(mesh);
  });

  // Links
  graphData.edges.forEach(e => {
    if (!e.source_id || !e.target_id) return;
    if (!visibleIds.has(e.source_id) || !visibleIds.has(e.target_id)) return;
    const src = visibleNodes.find(n => n.id === e.source_id);
    const tgt = visibleNodes.find(n => n.id === e.target_id);
    if (!src || !tgt || !src._pos || !tgt._pos) return;
    const geo = new THREE.BufferGeometry().setFromPoints([src._pos, tgt._pos]);
    const mat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.12 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    linkLines.push(line);
  });

  document.getElementById('stat-visible').textContent = visibleNodes.length;
}

// ── Interaction ──────────────────────────────────────
function onMouseMove(e) {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(nodeMeshes);
  if (hits.length > 0) {
    document.body.style.cursor = 'pointer';
    if (hovered !== hits[0].object) {
      if (hovered) hovered.scale.set(1, 1, 1);
      hovered = hits[0].object;
      hovered.scale.set(1.6, 1.6, 1.6);
    }
  } else {
    document.body.style.cursor = 'default';
    if (hovered) { hovered.scale.set(1, 1, 1); hovered = null; }
  }
}

async function onClick(e) {
  if (!hovered) return;
  controls.autoRotate = false;
  const n = hovered.userData;
  // Fetch full note
  try {
    const res = await fetch(`/api/knowledge/notes/${n.id}`);
    const data = await res.json();
    showPanel(data.note || n, n);
  } catch {
    showPanel(n, n);
  }
}

function showPanel(note, summary) {
  const p = document.getElementById('panel');
  document.getElementById('panel-title').textContent = note.title || summary.title;
  const meta = document.getElementById('panel-meta');
  const badges = [];
  if (note.folder || summary.folder) badges.push(`<span class="badge">${(note.folder||summary.folder) || 'root'}</span>`);
  if (note.type || summary.type) badges.push(`<span class="badge">${note.type || summary.type}</span>`);
  if (note.id || summary.id) badges.push(`<span class="badge">ID ${note.id || summary.id}</span>`);
  meta.innerHTML = badges.join('');
  const content = note.content || '(pas de contenu disponible)';
  const preview = content.length > 2000 ? content.slice(0, 2000) + '\n\n… (tronqué)' : content;
  document.getElementById('panel-content').textContent = preview;
  // Find linked notes
  const linksEl = document.getElementById('panel-links');
  const myLinks = graphData.edges.filter(e =>
    e.source_id === (note.id || summary.id) || e.target_id === (note.id || summary.id)
  );
  if (myLinks.length > 0) {
    const linkIds = new Set();
    myLinks.forEach(l => {
      if (l.source_id !== (note.id || summary.id)) linkIds.add(l.source_id);
      if (l.target_id !== (note.id || summary.id)) linkIds.add(l.target_id);
    });
    const linkedNodes = graphData.nodes.filter(n => linkIds.has(n.id));
    linksEl.innerHTML = `<h3>${linkedNodes.length} note(s) liée(s)</h3>` + linkedNodes.map(n =>
      `<a onclick="window._focusNode(${n.id})">${n.title}</a>`
    ).join('');
  } else {
    linksEl.innerHTML = '';
  }
  p.classList.add('open');
  selected = note.id || summary.id;
}

window._focusNode = function(id) {
  const mesh = nodeMeshes.find(m => m.userData.id === id);
  if (!mesh) return;
  // Animate camera to node
  const target = mesh.position.clone();
  const start = camera.position.clone();
  const end = target.clone().add(new THREE.Vector3(0, 0, 60));
  let t = 0;
  function tween() {
    t += 0.04;
    if (t >= 1) { camera.position.copy(end); controls.update(); return; }
    camera.position.lerpVectors(start, end, t);
    controls.target.lerp(target, t);
    controls.update();
    requestAnimationFrame(tween);
  }
  tween();
  // Simulate hover
  if (hovered) hovered.scale.set(1, 1, 1);
  hovered = mesh;
  mesh.scale.set(1.6, 1.6, 1.6);
  onClick(null);
};

window.closePanel = function() {
  document.getElementById('panel').classList.remove('open');
  if (hovered) { hovered.scale.set(1, 1, 1); hovered = null; }
  selected = null;
};

// ── Search ────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  nodeMeshes.forEach(m => {
    const match = !q || m.userData.title.toLowerCase().includes(q);
    m.material.opacity = match ? 1 : 0.15;
    m.material.transparent = !match;
    m.visible = true;
  });
  linkLines.forEach(l => {
    l.material.opacity = q ? 0.05 : 0.12;
  });
});

// ── Filters ──────────────────────────────────────────
document.querySelectorAll('.filter').forEach(f => {
  f.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
    f.classList.add('active');
    activeFolder = f.dataset.folder;
    buildGraph();
  });
});

// ── Render loop ──────────────────────────────────────
function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init();
</script>
</body>
</html>"""


# Static frontend (dev — Next.js s'occupe du prod)
_frontend = Path(__file__).parent.parent.parent / "frontend" / "out"
if _frontend.exists():
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")