"""
NORVYX Vanguard Fighter — procedural mesh generator
Modern stealth fighter silhouette, NOT primitives stacked.
Fuselage: lofted cross-sections (nose-tip → nozzle)
Wings: swept delta panel with airfoil taper
Tails: twin canted vertical stabilisers
Canopy: lofted dome
Intakes: NACA-scoop geometry
Nozzles: twin circular tubes
"""
import bpy, bmesh, math, os, time
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT  = os.path.join(ROOT, 'baked')
os.makedirs(OUT, exist_ok=True)

# ── helpers ──────────────────────────────────────────────────────────────────

def oval(n, hw, hh, cx=0.0, cz=0.0):
    """N-point oval ring (X=span, Z=height) at Y=0, to be placed by loft."""
    return [(cx + hw * math.cos(math.tau * i / n),
             cz + hh * math.sin(math.tau * i / n)) for i in range(n)]

def loft(sections, name):
    """
    sections: [(y, [(x,z),...]), ...]
    Single-vertex tip sections connect as fans; equal-N sections as quad strips.
    """
    bm = bmesh.new()
    prev_ring, prev_y = None, None

    for y, profile in sections:
        cur = [bm.verts.new(Vector((x, y, z))) for x, z in profile]

        if prev_ring is not None:
            pn, cn = len(prev_ring), len(cur)
            if pn == 1:                                 # fan from tip
                for i in range(cn):
                    bm.faces.new([prev_ring[0], cur[i], cur[(i+1) % cn]])
            elif cn == 1:                               # fan to tip
                for i in range(pn):
                    bm.faces.new([cur[0], prev_ring[(i+1) % pn], prev_ring[i]])
            else:                                       # quad strip (pn == cn)
                n = pn
                for i in range(n):
                    bm.faces.new([prev_ring[i], prev_ring[(i+1)%n],
                                  cur[(i+1)%n],  cur[i]])

        prev_ring = cur

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(
        do_local_ids=True, do_linked_ids=True, do_recursive=True)

# ── materials ────────────────────────────────────────────────────────────────

def mk_mat(name, base, m=0.85, r=0.28, emit=None, es=0.0, trans=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = mat.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value    = (*base, 1)
    b.inputs['Metallic'].default_value      = m
    b.inputs['Roughness'].default_value     = r
    if emit:
        b.inputs['Emission Color'].default_value    = (*emit, 1)
        b.inputs['Emission Strength'].default_value = es
    if trans > 0:
        # Blender 4.x uses 'Transmission Weight'
        try:
            b.inputs['Transmission Weight'].default_value = trans
        except KeyError:
            b.inputs['Transmission'].default_value = trans
        mat.blend_method = 'BLEND'
    return mat

def build_materials():
    return dict(
        body   = mk_mat('NVX_Body',   (0.038, 0.046, 0.060), m=0.86, r=0.26),
        panel  = mk_mat('NVX_Panel',  (0.058, 0.068, 0.088), m=0.76, r=0.36),
        dark   = mk_mat('NVX_Dark',   (0.016, 0.020, 0.030), m=0.92, r=0.18),
        wing   = mk_mat('NVX_Wing',   (0.032, 0.040, 0.054), m=0.90, r=0.22),
        canopy = mk_mat('NVX_Canopy', (0.004, 0.018, 0.036), m=0.05, r=0.05,
                        emit=(0.0, 0.20, 0.35), es=1.2, trans=0.30),
        nozzle = mk_mat('NVX_Nozzle', (0.040, 0.042, 0.048), m=0.96, r=0.10),
        intake = mk_mat('NVX_Intake', (0.008, 0.010, 0.016), m=0.93, r=0.12),
        cyan   = mk_mat('NVX_Cyan',   (0.000, 0.055, 0.095), m=0.15, r=0.30,
                        emit=(0.0, 0.55, 1.00), es=6.0),
    )

# ── fuselage ─────────────────────────────────────────────────────────────────

def build_fuselage(M):
    N = 12   # polygon sides — enough for smooth circular cross-sections
    s = [
        # (y,   cross-section)                          part
        ( 1.60, [(0, 0)]),                              # nose tip
        ( 1.50, oval(N, 0.022, 0.018)),                 # nose
        ( 1.35, oval(N, 0.068, 0.055)),
        ( 1.15, oval(N, 0.125, 0.100)),
        ( 0.92, oval(N, 0.168, 0.132)),                 # forward fuse
        ( 0.68, oval(N, 0.192, 0.150)),                 # cockpit shoulder
        ( 0.42, oval(N, 0.208, 0.162)),
        ( 0.15, oval(N, 0.218, 0.168)),                 # widest (intake/wing root)
        (-0.18, oval(N, 0.215, 0.165)),
        (-0.52, oval(N, 0.205, 0.158)),
        (-0.88, oval(N, 0.190, 0.148)),                 # aft taper
        (-1.22, oval(N, 0.172, 0.132)),
        (-1.52, oval(N, 0.150, 0.116)),                 # engine bay
        (-1.78, oval(N, 0.128, 0.098)),
        (-1.98, oval(N, 0.108, 0.082)),
        (-2.12, oval(N, 0.092, 0.072)),                 # nozzle root
        (-2.22, oval(N, 0.082, 0.064)),
    ]
    obj = loft(s, 'Fuselage')
    obj.data.materials.append(M['body'])
    sub = obj.modifiers.new('Sub', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    return obj

# ── wings ─────────────────────────────────────────────────────────────────────

def build_wings(M):
    """
    Swept delta wing — right half, mirrored to left.
    Top surface: 5-vert polygon with proper leading/trailing edge sweep.
    Thin wedge cross-section (thicker at root, knife-edge at tip).
    """
    bm = bmesh.new()

    # Plan-view shape (from above) — right half
    #  LE  tip ──────── TE  tip
    #  │                      │
    #  LE root ──────── TE root  (attached to fuselage)
    # Y=forward (+Y toward nose), X=span, Z=height

    T = 0.042   # root half-thickness
    t = 0.009   # tip half-thickness

    top = [
        Vector(( 0.215,  0.22,  T)),       # root LE
        Vector(( 1.140,  0.00,  t)),       # tip LE
        Vector(( 1.090, -0.65,  t*0.6)),   # tip TE
        Vector(( 0.650, -1.12,  T*0.5)),   # mid TE
        Vector(( 0.215, -1.38,  T*0.7)),   # root TE
    ]
    bot = [Vector((v.x, v.y, -v.z * 0.55)) for v in top]

    tv = [bm.verts.new(p) for p in top]
    bv = [bm.verts.new(p) for p in bot]

    # Top & bottom faces
    bm.faces.new(tv)
    bm.faces.new(bv[::-1])
    # Leading edge strip
    for i in range(len(tv) - 1):
        bm.faces.new([tv[i], bv[i], bv[i+1], tv[i+1]])
    # Tip cap
    bm.faces.new([tv[-1], bv[-1], bv[0], tv[0]])   # root cap (inner wall)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('Wing_R')
    bm.to_mesh(mesh); bm.free()

    w = bpy.data.objects.new('Wing_R', mesh)
    bpy.context.collection.objects.link(w)
    w.data.materials.append(M['wing'])
    for p in w.data.polygons:
        p.use_smooth = True

    bv2 = w.modifiers.new('Bevel', 'BEVEL')
    bv2.width    = 0.018
    bv2.segments = 3

    mir = w.modifiers.new('Mirror', 'MIRROR')
    mir.use_axis[0] = True
    mir.use_clip    = True
    return w

# ── horizontal stabilisers ────────────────────────────────────────────────────

def build_hstabs(M):
    """Small all-moving horizontal tailplanes at Y≈-1.6"""
    bm = bmesh.new()
    T = 0.022
    t = 0.006
    top = [
        Vector(( 0.175, -1.40,  T)),
        Vector(( 0.620, -1.52,  t)),
        Vector(( 0.580, -1.88,  t*0.5)),
        Vector(( 0.175, -1.82,  T*0.6)),
    ]
    bot = [Vector((v.x, v.y, -v.z * 0.55)) for v in top]
    tv = [bm.verts.new(p) for p in top]
    bv = [bm.verts.new(p) for p in bot]
    bm.faces.new(tv)
    bm.faces.new(bv[::-1])
    for i in range(len(tv)-1):
        bm.faces.new([tv[i], bv[i], bv[i+1], tv[i+1]])
    bm.faces.new([tv[-1], bv[-1], bv[0], tv[0]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('HStab_R')
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new('HStab_R', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M['wing'])
    for p in obj.data.polygons: p.use_smooth = True
    bv2 = obj.modifiers.new('Bevel', 'BEVEL')
    bv2.width = 0.010; bv2.segments = 2
    mir = obj.modifiers.new('Mirror', 'MIRROR')
    mir.use_axis[0] = True; mir.use_clip = True
    return obj

# ── vertical tails ────────────────────────────────────────────────────────────

def build_vtails(M):
    bm = bmesh.new()
    for sx in (-1, 1):
        ox = 0.13 * sx
        th = 0.055 * sx   # thickness direction

        # 8 verts: 4 root + 4 tip side
        pts = [
            # root (Z low)                                   #  idx
            Vector((ox,        -1.22,  0.055)),             # 0 root front low
            Vector((ox,        -2.08,  0.038)),             # 1 root rear  low
            # tip (Z high)
            Vector((ox + th,   -1.42,  0.950)),             # 2 tip leading edge
            Vector((ox + th,   -2.00,  0.880)),             # 3 tip trailing edge
            # outer face thickness
            Vector((ox + th,   -1.22,  0.055)),             # 4
            Vector((ox + th,   -2.08,  0.038)),             # 5
            # outer tip
            Vector((ox + th*2, -1.42,  0.950)),             # 6
            Vector((ox + th*2, -2.00,  0.880)),             # 7
        ]
        v = [bm.verts.new(p) for p in pts]

        bm.faces.new([v[0], v[1], v[3], v[2]])  # inner face
        bm.faces.new([v[4], v[6], v[7], v[5]])  # outer face
        bm.faces.new([v[0], v[4], v[5], v[1]])  # bottom (root)
        bm.faces.new([v[2], v[3], v[7], v[6]])  # top (tip)
        bm.faces.new([v[0], v[2], v[6], v[4]])  # leading edge
        bm.faces.new([v[1], v[5], v[7], v[3]])  # trailing edge

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('VTails')
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new('VTails', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M['body'])
    for p in obj.data.polygons: p.use_smooth = True
    bv2 = obj.modifiers.new('Bevel', 'BEVEL')
    bv2.width = 0.014; bv2.segments = 2
    return obj

# ── cockpit canopy ────────────────────────────────────────────────────────────

def build_canopy(M):
    N = 10
    dz = 0.172   # Z offset — canopy sits on top of fuselage
    s = [
        ( 0.92, [(0, dz)]),
        ( 0.84, oval(N, 0.055, 0.052, cz=dz)),
        ( 0.74, oval(N, 0.098, 0.092, cz=dz)),
        ( 0.63, oval(N, 0.122, 0.112, cz=dz)),
        ( 0.52, oval(N, 0.130, 0.120, cz=dz)),
        ( 0.42, oval(N, 0.118, 0.108, cz=dz)),
        ( 0.34, oval(N, 0.088, 0.078, cz=dz)),
        ( 0.28, [(0, dz)]),
    ]
    obj = loft(s, 'Canopy')
    obj.data.materials.append(M['canopy'])
    return obj

# ── engine nozzles ────────────────────────────────────────────────────────────

def build_nozzles(M):
    bm = bmesh.new()
    N = 12
    for sx in (-1, 1):
        cx = 0.082 * sx
        rings = [
            (-1.95, oval(N, 0.055, 0.055, cx=cx)),
            (-2.05, oval(N, 0.060, 0.060, cx=cx)),
            (-2.14, oval(N, 0.062, 0.062, cx=cx)),
            (-2.21, oval(N, 0.058, 0.058, cx=cx)),
            (-2.28, oval(N, 0.048, 0.048, cx=cx)),
        ]
        for i in range(len(rings)-1):
            y1, r1 = rings[i];  y2, r2 = rings[i+1]
            v1 = [bm.verts.new(Vector((x, y1, z))) for x,z in r1]
            v2 = [bm.verts.new(Vector((x, y2, z))) for x,z in r2]
            for j in range(N):
                bm.faces.new([v1[j], v1[(j+1)%N], v2[(j+1)%N], v2[j]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('Nozzles')
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new('Nozzles', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M['nozzle'])
    for p in obj.data.polygons: p.use_smooth = True
    return obj

# ── side air intakes ──────────────────────────────────────────────────────────

def build_intakes(M):
    bm = bmesh.new()
    for sx in (-1, 1):
        xf = 0.212 * sx    # flush with fuselage side
        xi = 0.175 * sx    # inward duct depth

        mouth = [Vector((xf, y, z)) for y,z in [
            ( 0.52,  0.055), ( 0.02,  0.055),
            ( 0.02, -0.108), ( 0.52, -0.068),
        ]]
        duct  = [Vector((xi, y, z)) for y,z in [
            ( 0.46,  0.038), ( 0.08,  0.038),
            ( 0.08, -0.088), ( 0.46, -0.052),
        ]]
        mv = [bm.verts.new(p) for p in mouth]
        dv = [bm.verts.new(p) for p in duct]

        bm.faces.new(mv if sx > 0 else mv[::-1])          # outer lip
        bm.faces.new(dv[::-1] if sx > 0 else dv)          # inner duct
        for i in range(4):
            bm.faces.new([mv[i], mv[(i+1)%4], dv[(i+1)%4], dv[i]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('Intakes')
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new('Intakes', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M['intake'])
    return obj

# ── tiny cyan emissive strip ──────────────────────────────────────────────────

def build_cyan_strip(M):
    """Thin emissive line along dorsal spine between cockpit and wing root."""
    bm = bmesh.new()
    W = 0.007
    pts = [
        (-W, 0.65, 0.220), ( W, 0.65, 0.220),
        ( W, 0.18, 0.215), (-W, 0.18, 0.215),
    ]
    v = [bm.verts.new(Vector(p)) for p in pts]
    bm.faces.new(v)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('CyanStrip')
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new('CyanStrip', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M['cyan'])
    return obj

# ── scene ─────────────────────────────────────────────────────────────────────

def setup_world():
    w = bpy.context.scene.world
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value   = (0.002, 0.004, 0.010, 1)
    bg.inputs['Strength'].default_value = 0.04

def setup_camera():
    bpy.ops.object.camera_add(location=(8.5, -0.1, 7.5))
    cam = bpy.context.object
    cam.name = 'SpriteCamera'
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 3.5
    d = Vector((0, 0, 0)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam

def setup_lights():
    def L(name, loc, energy, col, size=4):
        bpy.ops.object.light_add(type='AREA', location=loc)
        l = bpy.context.object
        l.name = name
        l.data.energy = energy
        l.data.color  = col
        l.data.shape  = 'DISK'
        l.data.size   = size

    # Cinematic studio key — strong cool-white from upper right
    L('Key',      ( 5.0, -4.0,  9.0), 1800, (0.72, 0.80, 0.98), 7)
    # Soft fill — prevents completely black shadows
    L('Fill',     (-4.0,  2.5,  4.5),  500, (0.52, 0.58, 0.72), 9)
    # Cyan rim — defines fuselage silhouette from left rear
    L('RimCyan',  (-3.5, -5.0,  3.5), 1050, (0.00, 0.42, 1.00), 4)
    # Magenta accent — subtle colour from front right low
    L('RimMag',   ( 2.5,  4.5,  2.0),  420, (0.92, 0.06, 0.38), 3)
    # Under-fill — soft bounce light from below
    L('Under',    ( 0.0,  0.0, -3.5),  160, (0.28, 0.38, 0.50), 7)

def configure_render():
    sc = bpy.context.scene
    sc.render.engine  = 'CYCLES'
    sc.cycles.device  = 'CPU'

    sc.cycles.samples               = 256
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold    = 0.015
    sc.cycles.adaptive_min_samples  = 32

    sc.cycles.max_bounces          = 6
    sc.cycles.diffuse_bounces      = 3
    sc.cycles.glossy_bounces       = 5
    sc.cycles.transmission_bounces = 4
    sc.cycles.shadow_bounces       = 2
    sc.cycles.volume_bounces       = 0

    sc.cycles.use_denoising = True
    sc.cycles.denoiser      = 'OPENIMAGEDENOISE'
    sc.render.use_persistent_data = True

    sc.render.resolution_x   = 2048
    sc.render.resolution_y   = 2048
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format  = 'PNG'
    sc.render.image_settings.color_mode  = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.render.film_transparent = True

    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look           = 'AgX - Medium High Contrast'

# ── main ─────────────────────────────────────────────────────────────────────

print('[VANGUARD] Clearing scene...')
clear()

print('[VANGUARD] Building materials...')
M = build_materials()

print('[VANGUARD] Building fuselage...')
build_fuselage(M)

print('[VANGUARD] Building wings...')
build_wings(M)

print('[VANGUARD] Building horizontal stabilisers...')
build_hstabs(M)

print('[VANGUARD] Building vertical tails...')
build_vtails(M)

print('[VANGUARD] Building cockpit canopy...')
build_canopy(M)

print('[VANGUARD] Building nozzles...')
build_nozzles(M)

print('[VANGUARD] Building intakes...')
build_intakes(M)

print('[VANGUARD] Building cyan detail strip...')
build_cyan_strip(M)

print('[VANGUARD] Setting up scene...')
setup_world()
setup_camera()
setup_lights()
configure_render()

out = os.path.join(OUT, 'vanguard_00.png')
bpy.context.scene.render.filepath = out
print(f'[VANGUARD] Rendering 2048×2048 RGBA → {out}')
t0 = time.time()
bpy.ops.render.render(write_still=True)
print(f'[VANGUARD] Done in {time.time()-t0:.1f}s')
