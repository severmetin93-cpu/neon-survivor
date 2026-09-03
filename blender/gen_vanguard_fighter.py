"""
NORVYX VANGUARD — High-Quality Fighter Geometry Generator
Blender 4.2 headless script.

Builds an original F-22-class air-superiority fighter from scratch using bmesh,
applies NORVYX PBR materials, renders vanguard_00.png (2048×2048 RGBA, transparent).

Coordinate system (same as all NORVYX models):
  X+  = nose (forward)      X− = tail
  Y   = wingspan (±)        Z+ = up

Run:  blender -b --python blender/gen_vanguard_fighter.py
Out:  baked/vanguard_00.png
"""

import bpy
import bmesh
import math
import os
import sys
import time

# ── PATH SETUP ──────────────────────────────────────────────────────────────
try:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(
        next((a for a in sys.argv if a.endswith('.py')), 'blender/gen_vanguard_fighter.py')
    ))

ROOT  = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
BAKED = os.path.join(ROOT, 'baked')
os.makedirs(BAKED, exist_ok=True)

print(f'[VAN] ROOT={ROOT}  BAKED={BAKED}')

# ── CONSTANTS ────────────────────────────────────────────────────────────────
PI  = math.pi
PI2 = 2 * PI


def lerp(a, b, t):
    return a + (b - a) * t


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


# ── SCENE CLEAR ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

print('[VAN] Scene cleared')


# ── MATERIALS ────────────────────────────────────────────────────────────────
# Names match bake_sprites.py material-slot matcher: 'armor','dark','glass','cyan','orange'

def mkmat(name, base, metal=0.82, rough=0.24, em=None, ems=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bs = nt.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value    = (*base, 1.0)
    bs.inputs['Metallic'].default_value      = metal
    bs.inputs['Roughness'].default_value     = rough
    if em:
        bs.inputs['Emission Color'].default_value    = (*em, 1.0)
        bs.inputs['Emission Strength'].default_value = ems
    return m


# Modern military palette. Body is dark gunmetal / graphite composite, not neon.
# Slight region variance in metallic+roughness gives natural PBR panel differentiation
# without needing texture maps. Neon is pulled back — used only as tiny accents.
M_ARMOR   = mkmat('armor',   (0.19, 0.21, 0.25), metal=0.78, rough=0.30)   # main gunmetal fuselage
M_ARMOR2  = mkmat('armor2',  (0.16, 0.18, 0.22), metal=0.72, rough=0.38)   # engine cover / rear (matte)
M_DARK    = mkmat('dark',    (0.05, 0.06, 0.08), metal=0.68, rough=0.44)   # graphite (tails, dark panels)
M_CARBON  = mkmat('carbon',  (0.07, 0.08, 0.10), metal=0.55, rough=0.36)   # composite (control surfaces)
M_PANEL   = mkmat('panel',   (0.13, 0.14, 0.17), metal=0.28, rough=0.48)   # matte composite panel (nose/deck)
M_FRAME   = mkmat('frame',   (0.09, 0.10, 0.12), metal=0.88, rough=0.24)   # canopy metallic frame
M_GLASS   = mkmat('glass',   (0.022, 0.030, 0.048), metal=0.12, rough=0.04) # dark smoked canopy — high spec
M_CYAN    = mkmat('cyan',    (0.00, 0.06, 0.12), metal=0.14, rough=0.22,
                  em=(0.00, 0.55, 1.00), ems=0.7)                          # nav accent minimum
M_ORANGE  = mkmat('orange',  (0.06, 0.04, 0.02), metal=0.90, rough=0.18,
                  em=(1.00, 0.32, 0.05), ems=1.2)                          # nozzle interior only (minimum)
M_INTAKE  = mkmat('dark_intake', (0.02, 0.025, 0.035), metal=0.55, rough=0.55)  # dark intake interior

print('[VAN] Materials created')


# ── GEOMETRY HELPERS ─────────────────────────────────────────────────────────

def ellipse_pts(n, ry, rz, cy=0.0, cz=0.0):
    """n (y,z) tuples on ellipse. i=0 starts at top (Z+), goes CW from above."""
    pts = []
    for i in range(n):
        a = PI / 2 + PI2 * i / n
        pts.append((cy + ry * math.cos(a), cz + rz * math.sin(a)))
    return pts


def add_ring(bm, x, pts):
    """Add closed ring of verts at X from (y,z) list. Returns vert list."""
    return [bm.verts.new((x, y, z)) for y, z in pts]


def close_strip(bm, r0, r1):
    """Connect two equal-length closed rings with quads."""
    n = len(r0)
    for j in range(n):
        try:
            bm.faces.new([r0[j], r0[(j+1) % n], r1[(j+1) % n], r1[j]])
        except Exception:
            pass


def fan_tip(bm, tip_v, ring):
    """Fan triangles from single tip vertex to ring."""
    n = len(ring)
    for j in range(n):
        try:
            bm.faces.new([tip_v, ring[j], ring[(j+1) % n]])
        except Exception:
            pass


def resample_ring(bm, r_src, n_dst, x):
    """Resample a ring to different vertex count (for 8↔12 transitions)."""
    n_src = len(r_src)
    pts = []
    for k in range(n_dst):
        t = k / n_dst
        # interpolate between src verts
        fi = t * n_src
        i0 = int(fi) % n_src
        i1 = (i0 + 1) % n_src
        alpha = fi - int(fi)
        v0 = r_src[i0]
        v1 = r_src[i1]
        ny = lerp(v0.co.y, v1.co.y, alpha)
        nz = lerp(v0.co.z, v1.co.z, alpha)
        pts.append((ny, nz))
    return add_ring(bm, x, pts)


# ── FUSELAGE ─────────────────────────────────────────────────────────────────
# Compact modern air-superiority fighter proportions.
# Total length: 5.85 units (was 6.8). Nose short and aggressive.
# Center body: wide and voluminous. Rear engine bay: widest zone (twin engine housings).
# Wingspan/length ~0.71 — F-22 class ratio.

FUSE_STA = [
    # (  x,     ry,     rz,     cy,    cz,  n)
    #  ry=Y half-width  rz=Z half-height  cy=Y center  cz=Z center
    ( 2.80,  0.000,  0.000,  0.00,  0.02,  1),   # nose tip → single vert
    ( 2.72,  0.020,  0.014,  0.00,  0.02,  8),
    ( 2.62,  0.048,  0.032,  0.00,  0.02,  8),
    ( 2.48,  0.088,  0.058,  0.00,  0.03,  8),
    ( 2.30,  0.140,  0.088,  0.00,  0.03, 16),   # 8→16 transition
    ( 2.10,  0.198,  0.118,  0.00,  0.04, 16),
    ( 1.85,  0.258,  0.146,  0.00,  0.05, 16),   # canopy start
    ( 1.60,  0.316,  0.168,  0.00,  0.05, 16),
    ( 1.30,  0.370,  0.184,  0.00,  0.06, 16),   # canopy peak zone
    ( 1.00,  0.418,  0.194,  0.00,  0.06, 16),
    ( 0.70,  0.462,  0.200,  0.00,  0.06, 16),
    ( 0.40,  0.500,  0.204,  0.00,  0.05, 16),
    ( 0.10,  0.532,  0.206,  0.00,  0.05, 16),
    (-0.20,  0.552,  0.208,  0.00,  0.05, 16),   # blended body center
    (-0.50,  0.564,  0.212,  0.00,  0.05, 16),
    (-0.80,  0.572,  0.216,  0.00,  0.05, 16),   # engine bay approach
    (-1.10,  0.580,  0.222,  0.00,  0.06, 16),
    (-1.40,  0.584,  0.230,  0.00,  0.06, 16),   # engine bay PEAK (widest, twin-engine housing)
    (-1.70,  0.578,  0.236,  0.00,  0.06, 16),
    (-1.95,  0.560,  0.238,  0.00,  0.06, 16),
    (-2.18,  0.522,  0.230,  0.00,  0.05, 16),
    (-2.38,  0.462,  0.212,  0.00,  0.05, 16),
    (-2.55,  0.388,  0.186,  0.00,  0.04, 16),
    (-2.70,  0.302,  0.152,  0.00,  0.04, 16),
    (-2.82,  0.212,  0.114,  0.00,  0.03, 16),
    (-2.92,  0.128,  0.072,  0.00,  0.02,  8),   # 16→8 transition
    (-2.98,  0.062,  0.036,  0.00,  0.01,  8),
    (-3.02,  0.024,  0.014,  0.00,  0.01,  8),
    (-3.05,  0.000,  0.000,  0.00,  0.00,  1),   # tail tip → single vert
]


def fuse_top(x):
    """Fuselage top Z at given X, linear interpolation of FUSE_STA. Returns cz + rz."""
    for i in range(len(FUSE_STA) - 1):
        x0, ry0, rz0, cy0, cz0, n0 = FUSE_STA[i]
        x1, ry1, rz1, cy1, cz1, n1 = FUSE_STA[i + 1]
        if x1 <= x <= x0:
            if x0 == x1:
                t = 0.0
            else:
                t = (x - x1) / (x0 - x1)
            rz = lerp(rz1, rz0, t)
            cz = lerp(cz1, cz0, t)
            return cz + rz
    return 0.24


def fuse_half_width(x):
    """Fuselage Y half-width (ry) at given X."""
    for i in range(len(FUSE_STA) - 1):
        x0, ry0, rz0, cy0, cz0, n0 = FUSE_STA[i]
        x1, ry1, rz1, cy1, cz1, n1 = FUSE_STA[i + 1]
        if x1 <= x <= x0:
            if x0 == x1:
                t = 0.0
            else:
                t = (x - x1) / (x0 - x1)
            return lerp(ry1, ry0, t)
    return 0.30


def build_fuselage():
    bm = bmesh.new()
    rings = []

    for (x, ry, rz, cy, cz, n) in FUSE_STA:
        if n == 1:
            v = bm.verts.new((x, cy, cz))
            rings.append([v])
        else:
            pts = ellipse_pts(n, ry, rz, cy, cz)
            rings.append(add_ring(bm, x, pts))

    bm.verts.ensure_lookup_table()

    for i in range(len(rings) - 1):
        r0, r1 = rings[i], rings[i + 1]
        n0, n1 = len(r0), len(r1)

        if n0 == 1:
            fan_tip(bm, r0[0], r1)
        elif n1 == 1:
            fan_tip(bm, r1[0], r0)
        elif n0 == n1:
            close_strip(bm, r0, r1)
        else:
            # Transition: resample larger ring to match smaller, then stitch
            x_mid = (FUSE_STA[i][0] + FUSE_STA[i + 1][0]) / 2
            if n0 < n1:
                r_mid = resample_ring(bm, r0, n1, x_mid)
                close_strip(bm, r0, r_mid)    # n0 → n1 (need same size)
                # actually r_mid has n1 verts, r0 has n0 → this won't work with close_strip
                # Let's just do a direct interpolated connection:
                bm.verts.ensure_lookup_table()
                for j in range(n1):
                    src = r0[round(j * n0 / n1) % n0]
                    src2 = r0[round((j + 1) * n0 / n1) % n0]
                    dst = r1[j]
                    dst2 = r1[(j + 1) % n1]
                    if src == src2:
                        try:
                            bm.faces.new([src, dst, dst2])
                        except Exception:
                            pass
                    else:
                        try:
                            bm.faces.new([src, src2, dst2, dst])
                        except Exception:
                            pass
                # Remove the intermediate ring
                bmesh.ops.delete(bm, geom=r_mid, context='VERTS')
            else:
                for j in range(n0):
                    src = r0[j]
                    src2 = r0[(j + 1) % n0]
                    dst = r1[round(j * n1 / n0) % n1]
                    dst2 = r1[round((j + 1) * n1 / n0) % n1]
                    if dst == dst2:
                        try:
                            bm.faces.new([src, src2, dst])
                        except Exception:
                            pass
                    else:
                        try:
                            bm.faces.new([src, src2, dst2, dst])
                        except Exception:
                            pass

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('fuse_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('Fuselage', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_ARMOR)
    print(f'[VAN] Fuselage: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── WINGS ────────────────────────────────────────────────────────────────────
# Cranked delta (F-22 class): swept LE ~42°, nearly horizontal TE near root.
# Airfoil: biconvex, max thickness at 35% chord, tapers to sharp tip.

def build_wings():
    bm = bmesh.new()

    N_SPAN  = 11  # spanwise sections (root → tip)  — was 9, denser for smooth curves
    N_CHORD = 10  # chordwise sections (LE → TE)    — was 7,  smoother airfoil

    # Span stations: (x_LE, x_TE, y_pos, thickness_root_fraction)
    # Trapezoidal moderate-sweep wing (NOT delta):
    #   - Wider root chord (1.68 units) for structural mass at root
    #   - Slightly shorter wingspan (half=1.92, was 2.05) → more square planform
    #   - LE sweep moderate (~42° inboard, ~38° outboard)
    #   - Tip is BLUNTED (chord 0.32) — NOT sharp triangle
    #   - Thicker root (0.190), moderate taper to tip (0.014)
    SPAN = [
        # x_LE    x_TE    y       thick
        ( 0.70,  -0.98,  0.44,  0.190),   # root — wide chord (1.68), very thick
        ( 0.58,  -1.02,  0.60,  0.168),
        ( 0.42,  -1.06,  0.78,  0.146),
        ( 0.22,  -1.11,  0.98,  0.122),
        ( 0.00,  -1.16,  1.18,  0.098),   # inboard segment ends (~42° LE sweep)
        (-0.20,  -1.20,  1.36,  0.076),   # crank point — LE inflection
        (-0.38,  -1.24,  1.52,  0.058),   # outboard segment (~38° LE sweep, more relaxed)
        (-0.54,  -1.27,  1.66,  0.044),
        (-0.68,  -1.30,  1.78,  0.032),
        (-0.80,  -1.32,  1.86,  0.022),
        (-0.90,  -1.34,  1.92,  0.014),   # BLUNT tip — chord 0.44, NOT sharp triangle
    ]
    # Control-surface split index: rear 28% of chord = flap/aileron zone
    N_CS_START = int(N_CHORD * 0.72)  # face index at which control surface begins

    cs_face_indices = []   # indices of control-surface faces for material assignment

    def half_wing(side):
        s = side  # +1 or -1
        top_rows = []
        bot_rows = []

        for (x_le, x_te, y_abs, thick) in SPAN:
            y = s * y_abs
            chord = x_le - x_te

            top_row = []
            bot_row = []

            for m in range(N_CHORD):
                c = m / (N_CHORD - 1)  # 0 = LE, 1 = TE
                x = x_le - c * chord

                # Biconvex NACA-like profile — max thickness at c=0.32
                if c < 0.32:
                    zf = math.sqrt(c / 0.32)
                else:
                    zf = math.sqrt((1.0 - c) / 0.68)

                # Slight camber: wing surface tilted upward at LE
                camber = 0.010 * (1.0 - c)

                z_top = camber + thick * 0.58 * zf + 0.05
                z_bot = camber - thick * 0.42 * zf + 0.05

                top_row.append(bm.verts.new((x, y, z_top)))
                bot_row.append(bm.verts.new((x, y, z_bot)))

            top_rows.append(top_row)
            bot_rows.append(bot_row)

        bm.verts.ensure_lookup_table()

        # Top surface — track control-surface face indices for material zone
        for i in range(N_SPAN - 1):
            for m in range(N_CHORD - 1):
                try:
                    f = bm.faces.new([
                        top_rows[i][m],     top_rows[i + 1][m],
                        top_rows[i + 1][m + 1], top_rows[i][m + 1],
                    ])
                    if m >= N_CS_START:
                        cs_face_indices.append(f.index)
                except Exception:
                    pass

        # Bottom surface
        for i in range(N_SPAN - 1):
            for m in range(N_CHORD - 1):
                try:
                    f = bm.faces.new([
                        bot_rows[i][m],     bot_rows[i][m + 1],
                        bot_rows[i + 1][m + 1], bot_rows[i + 1][m],
                    ])
                    if m >= N_CS_START:
                        cs_face_indices.append(f.index)
                except Exception:
                    pass

        # Leading edge cap (closes top/bottom at LE)
        for i in range(N_SPAN - 1):
            try:
                bm.faces.new([
                    top_rows[i][0], top_rows[i + 1][0],
                    bot_rows[i + 1][0], bot_rows[i][0],
                ])
            except Exception:
                pass

        # Trailing edge cap
        for i in range(N_SPAN - 1):
            try:
                bm.faces.new([
                    top_rows[i][-1], bot_rows[i][-1],
                    bot_rows[i + 1][-1], top_rows[i + 1][-1],
                ])
            except Exception:
                pass

        # Wing tip cap
        for m in range(N_CHORD - 1):
            try:
                bm.faces.new([
                    top_rows[-1][m], top_rows[-1][m + 1],
                    bot_rows[-1][m + 1], bot_rows[-1][m],
                ])
            except Exception:
                pass

        # Root face (closes gap at fuselage junction)
        for m in range(N_CHORD - 1):
            try:
                bm.faces.new([
                    top_rows[0][m], bot_rows[0][m],
                    bot_rows[0][m + 1], top_rows[0][m + 1],
                ])
            except Exception:
                pass

    half_wing(+1)
    half_wing(-1)

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('wings_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('Wings', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_ARMOR)    # slot 0 — main wing skin
    ob.data.materials.append(M_CARBON)   # slot 1 — control-surface region (rear 30% chord)

    # Assign material slot 1 (M_CARBON) to control-surface faces.
    # remove_doubles may have shifted face indices — rebuild via chord position test.
    for poly in me.polygons:
        # Face centroid X in chord space: sample first vertex X
        # Simpler: test if the face is in rear portion of local chord region.
        # We flag by checking if the average x is close to trailing edge relative to leading edge for that spanwise slice.
        xs = [me.vertices[vi].co.x for vi in poly.vertices]
        ys = [me.vertices[vi].co.y for vi in poly.vertices]
        cx = sum(xs) / len(xs)
        cy = sum(ys) / len(ys)
        # Find span station bracket by |y|
        ay = abs(cy)
        if ay < 0.40 or ay > 1.93:
            continue
        # Interpolate LE/TE X at this Y from SPAN
        for k in range(len(SPAN) - 1):
            y0 = SPAN[k][2]; y1 = SPAN[k + 1][2]
            if y0 <= ay <= y1:
                t = (ay - y0) / (y1 - y0) if y1 != y0 else 0.0
                x_le = lerp(SPAN[k][0], SPAN[k + 1][0], t)
                x_te = lerp(SPAN[k][1], SPAN[k + 1][1], t)
                chord = x_le - x_te
                if chord > 0.0:
                    c_norm = (x_le - cx) / chord
                    if c_norm >= 0.70:   # rear 30% chord = control surface zone
                        poly.material_index = 1
                break

    print(f'[VAN] Wings: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── VERTICAL STABILIZERS ─────────────────────────────────────────────────────
# Twin fins at rear, canted outward ~27° (F-22 style).
# Swept leading edge, nearly vertical trailing edge.

def build_fins():
    bm = bmesh.new()

    CANT   = 0.35   # Y/Z ratio — moderate outward lean (was 0.50, more upright modern stealth)
    N_HGT  = 9     # height sections (was 7)
    N_CHOR = 6     # chordwise sections (was 5)

    # Height stations: (x_LE, x_TE, z_local, thickness).
    # Thick root (0.160) for real structural mass; smooth taper to sharp tip.
    # Root fairing gusset (build_fin_root_fairings) blends fin base to fuselage.
    FIN_STA = [
        # x_LE    x_TE    z_loc  thick
        (-1.85,  -2.75,  0.00,  0.160),   # root — very thick, blends into fuselage
        (-1.93,  -2.75,  0.14,  0.140),
        (-2.02,  -2.75,  0.28,  0.118),
        (-2.11,  -2.75,  0.42,  0.096),
        (-2.20,  -2.75,  0.54,  0.076),
        (-2.28,  -2.75,  0.64,  0.058),
        (-2.35,  -2.75,  0.72,  0.042),
        (-2.42,  -2.75,  0.78,  0.026),
        (-2.48,  -2.75,  0.82,  0.010),   # tip
    ]

    def half_fin(side):
        s = side   # +1 or -1

        top_rows = []
        bot_rows = []

        for (x_le, x_te, z_loc, thick) in FIN_STA:
            chord = x_le - x_te
            # Root sits on fuselage skin — start Y offset at fuselage upper-shoulder edge.
            # Use dynamic fuse_top(x_le) and slight outward offset scaled with height.
            base_y = s * (0.42 + z_loc * CANT)
            z_abs  = fuse_top(x_le) + z_loc

            top_row = []
            bot_row = []

            for m in range(N_CHOR):
                c = m / (N_CHOR - 1)
                x = x_le - c * chord

                # Symmetric NACA profile
                profile = math.sin(PI * (1.0 - c)) * thick * 0.5

                top_row.append(bm.verts.new((x, base_y + profile, z_abs)))
                bot_row.append(bm.verts.new((x, base_y - profile, z_abs)))

            top_rows.append(top_row)
            bot_rows.append(bot_row)

        bm.verts.ensure_lookup_table()

        # Side A faces
        for i in range(N_HGT - 1):
            for m in range(N_CHOR - 1):
                try:
                    bm.faces.new([
                        top_rows[i][m], top_rows[i + 1][m],
                        top_rows[i + 1][m + 1], top_rows[i][m + 1],
                    ])
                except Exception:
                    pass

        # Side B faces
        for i in range(N_HGT - 1):
            for m in range(N_CHOR - 1):
                try:
                    bm.faces.new([
                        bot_rows[i][m], bot_rows[i][m + 1],
                        bot_rows[i + 1][m + 1], bot_rows[i + 1][m],
                    ])
                except Exception:
                    pass

        # LE cap
        for i in range(N_HGT - 1):
            try:
                bm.faces.new([
                    top_rows[i][0], top_rows[i + 1][0],
                    bot_rows[i + 1][0], bot_rows[i][0],
                ])
            except Exception:
                pass

        # TE cap
        for i in range(N_HGT - 1):
            try:
                bm.faces.new([
                    top_rows[i][-1], bot_rows[i][-1],
                    bot_rows[i + 1][-1], top_rows[i + 1][-1],
                ])
            except Exception:
                pass

        # Tip cap
        for m in range(N_CHOR - 1):
            try:
                bm.faces.new([
                    top_rows[-1][m], top_rows[-1][m + 1],
                    bot_rows[-1][m + 1], bot_rows[-1][m],
                ])
            except Exception:
                pass

        # Root cap
        for m in range(N_CHOR - 1):
            try:
                bm.faces.new([
                    top_rows[0][m], bot_rows[0][m],
                    bot_rows[0][m + 1], top_rows[0][m + 1],
                ])
            except Exception:
                pass

    half_fin(+1)
    half_fin(-1)

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('fins_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('Fins', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_DARK)
    print(f'[VAN] Fins: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── COCKPIT CANOPY ───────────────────────────────────────────────────────────
# Dome sitting on fuselage top. Cross-section = upper arc (semi-ellipse).
# Nose and tail ends taper to single points.

def build_canopy():
    bm = bmesh.new()
    # fuse_top(x) now defined at module level (shared with fins/frame).

    # Canopy stations: (x, Y half-width, Z height above fuselage top).
    # Wider, shorter, forward-shifted bubble — real fighter cockpit proportions.
    # Length 1.55 (was 1.74), peak width 0.250 (was 0.220), peak at X=1.15 (was 1.00).
    # Rounded front curvature — pilot silhouette must read from top-down.
    CAN_STA = [
        ( 2.05, 0.000, 0.000),   # front tip (further forward, closer to nose)
        ( 1.96, 0.080, 0.042),   # rapid rise → wide, curved front
        ( 1.85, 0.140, 0.100),
        ( 1.70, 0.190, 0.164),
        ( 1.52, 0.228, 0.212),
        ( 1.32, 0.246, 0.238),
        ( 1.15, 0.250, 0.244),   # bubble PEAK — wide, tall (width ≈ height)
        ( 0.98, 0.244, 0.236),
        ( 0.82, 0.222, 0.212),
        ( 0.68, 0.184, 0.168),
        ( 0.56, 0.136, 0.116),
        ( 0.46, 0.086, 0.066),
        ( 0.40, 0.038, 0.024),
        ( 0.36, 0.000, 0.000),   # rear tip
    ]

    N_ARC = 14  # smoother upper arc per station (was 12)

    can_rings = []

    for (cx, cry, crz) in CAN_STA:
        bz = fuse_top(cx)

        if cry == 0.0:
            v = bm.verts.new((cx, 0.0, bz + crz))
            can_rings.append([v])
        else:
            # Upper arc from Y = -cry (left base) → Y = 0 (top) → Y = +cry (right base)
            # Angle sweeps from -π/2 → 0 → +π/2
            arc_pts = []
            for k in range(N_ARC):
                a = -PI / 2 + PI * k / (N_ARC - 1)
                y  = cry * math.sin(a)
                dz = crz * math.cos(a)   # crz at top (a=0), 0 at sides
                arc_pts.append((cx, y, bz + dz))
            ring_v = [bm.verts.new(pt) for pt in arc_pts]
            can_rings.append(ring_v)

    bm.verts.ensure_lookup_table()

    for i in range(len(can_rings) - 1):
        r0, r1 = can_rings[i], can_rings[i + 1]
        n0, n1 = len(r0), len(r1)

        if n0 == 1:
            # Fan from single point
            tip = r0[0]
            for j in range(n1 - 1):
                try:
                    bm.faces.new([tip, r1[j], r1[j + 1]])
                except Exception:
                    pass
        elif n1 == 1:
            tip = r1[0]
            for j in range(n0 - 1):
                try:
                    bm.faces.new([r0[j], r0[j + 1], tip])
                except Exception:
                    pass
        else:
            # Open arc (not closed ring) → strip quads
            nmin = min(n0, n1)
            for j in range(nmin - 1):
                try:
                    bm.faces.new([r0[j], r0[j + 1], r1[j + 1], r1[j]])
                except Exception:
                    pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('canopy_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('Canopy', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_GLASS)
    print(f'[VAN] Canopy: {len(me.vertices)}v {len(me.polygons)}f')

    # ── Canopy frame ─────────────────────────────────────────────────────
    # Thin metallic band around canopy base. Traces the base perimeter with
    # rectangular cross-section (outward + downward from base contour).
    fbm = bmesh.new()
    FRAME_OUT = 0.020   # extends outward from canopy base (in Y direction)
    FRAME_DN  = 0.028   # extends downward below fuselage top
    FRAME_UP  = 0.012   # extends upward around base (visible above canopy skin)

    # Collect base perimeter points from CAN_STA (skip tip verts, use base-arc endpoints)
    perim_R = []   # right side, nose → tail
    perim_L = []   # left  side, tail → nose (traversed in reverse)
    for (cx, cry, crz) in CAN_STA:
        if cry <= 0.0:
            continue
        bz = fuse_top(cx)
        perim_R.append((cx, +cry, bz))
        perim_L.append((cx, -cry, bz))

    def frame_ring(x, y_center, y_dir):
        """Rectangular cross-section ring perpendicular to canopy skin at (x,y)."""
        top_z = fuse_top(x)
        return [
            fbm.verts.new((x, y_center,                     top_z - FRAME_DN)),
            fbm.verts.new((x, y_center + y_dir * FRAME_OUT, top_z - FRAME_DN)),
            fbm.verts.new((x, y_center + y_dir * FRAME_OUT, top_z + FRAME_UP)),
            fbm.verts.new((x, y_center,                     top_z + FRAME_UP)),
        ]

    def build_side_band(perim, y_dir):
        rings = [frame_ring(x, y, y_dir) for (x, y, _) in perim]
        fbm.verts.ensure_lookup_table()
        for i in range(len(rings) - 1):
            r0, r1 = rings[i], rings[i + 1]
            for k in range(4):
                a = r0[k]
                b = r0[(k + 1) % 4]
                c = r1[(k + 1) % 4]
                d = r1[k]
                try:
                    fbm.faces.new([a, b, c, d])
                except Exception:
                    pass
        # End caps
        for r in (rings[0], rings[-1]):
            try:
                fbm.faces.new(r)
            except Exception:
                pass

    build_side_band(perim_R, +1)
    build_side_band(perim_L, -1)

    bmesh.ops.recalc_face_normals(fbm, faces=fbm.faces)
    fme = bpy.data.meshes.new('canopy_frame_me')
    fbm.to_mesh(fme)
    fbm.free()
    for p in fme.polygons:
        p.use_smooth = True

    fob = bpy.data.objects.new('CanopyFrame', fme)
    bpy.context.collection.objects.link(fob)
    fob.data.materials.append(M_FRAME)
    print(f'[VAN] CanopyFrame: {len(fme.vertices)}v {len(fme.polygons)}f')

    return ob, fob


# ── ENGINE NOZZLES ───────────────────────────────────────────────────────────
# Twin nozzles at rear engine bay. Two meshes:
#   - outer housing (gunmetal): nozzle exterior + petal-segmented rim
#   - inner exhaust cavity (orange emissive): deep hot exhaust ring
# Positioned to fit new short fuselage (tail X=-3.05).

def build_nozzles():
    bm_out = bmesh.new()   # outer housing (gunmetal)
    bm_in  = bmesh.new()   # inner cavity (orange emissive, deep)
    N_NOZ  = 20            # smoother nozzle circumference (was 14)

    def petal_pts(n, r, rz_ratio, y_ctr, z_ctr, petal_depth):
        """Ellipse ring with scalloped radius — alternate vertices indented.
        Creates visible petal segmentation of a real fighter thrust-vectoring nozzle."""
        pts = []
        for i in range(n):
            a = PI / 2 + PI2 * i / n
            # Deeper indent on every 2nd vertex — clearer petal peaks
            scale = 1.0 - (petal_depth if (i % 2 == 1) else 0.0)
            ry = r * scale
            rz = r * rz_ratio * scale
            pts.append((y_ctr + ry * math.cos(a), z_ctr + rz * math.sin(a)))
        return pts

    def make_nozzle(y_ctr):
        # Housing profile stations (X, radius). Rear = smaller (converging nozzle look).
        R_HOUSE = 0.175    # housing front (blends with engine bay)
        R_MID   = 0.152    # nozzle mid
        R_LIP   = 0.132    # nozzle lip (outer rim of exit)
        R_HOT   = 0.108    # inner exhaust ring (visible glow)
        Z_CTR   = 0.060

        # Outer housing: 4-ring loft with petal segmentation on the last 2 rings
        p_house = ellipse_pts(N_NOZ, R_HOUSE, R_HOUSE * 0.90, y_ctr, Z_CTR)
        p_mid   = ellipse_pts(N_NOZ, R_MID,   R_MID   * 0.86, y_ctr, Z_CTR)
        # Petal ring — deeper scalloped segmentation (more prominent petals)
        p_petal = petal_pts(N_NOZ, R_LIP + 0.014, 0.82, y_ctr, Z_CTR, 0.065)
        p_lip   = petal_pts(N_NOZ, R_LIP,          0.80, y_ctr, Z_CTR, 0.090)

        r_h = add_ring(bm_out, -2.30, p_house)
        r_m = add_ring(bm_out, -2.68, p_mid)
        r_p = add_ring(bm_out, -2.88, p_petal)
        r_l = add_ring(bm_out, -2.98, p_lip)
        close_strip(bm_out, r_h, r_m)
        close_strip(bm_out, r_m, r_p)
        close_strip(bm_out, r_p, r_l)

        # Rim closer: connect lip inward to hot-ring position (small annular face)
        p_hot_outer = ellipse_pts(N_NOZ, R_HOT, R_HOT * 0.80, y_ctr, Z_CTR)
        r_ho = add_ring(bm_out, -3.00, p_hot_outer)
        close_strip(bm_out, r_l, r_ho)

        # Inner exhaust cavity — recessed deep dark chamber with orange emissive rim
        p_hot_in = ellipse_pts(N_NOZ, R_HOT * 0.98, R_HOT * 0.78, y_ctr, Z_CTR)
        p_deep   = ellipse_pts(N_NOZ, R_HOT * 0.55, R_HOT * 0.45, y_ctr, Z_CTR)
        r_hi = add_ring(bm_in, -3.01, p_hot_in)
        r_d  = add_ring(bm_in, -3.18, p_deep)
        close_strip(bm_in, r_hi, r_d)

        # Deep-end disc (fully closed hot core)
        cv = bm_in.verts.new((-3.23, y_ctr, Z_CTR))
        fan_tip(bm_in, cv, r_d)

    make_nozzle(+0.230)
    make_nozzle(-0.230)

    bmesh.ops.recalc_face_normals(bm_out, faces=bm_out.faces)
    bmesh.ops.recalc_face_normals(bm_in,  faces=bm_in.faces)

    me_out = bpy.data.meshes.new('noz_out_me')
    bm_out.to_mesh(me_out)
    bm_out.free()
    for p in me_out.polygons:
        p.use_smooth = True

    me_in = bpy.data.meshes.new('noz_in_me')
    bm_in.to_mesh(me_in)
    bm_in.free()
    for p in me_in.polygons:
        p.use_smooth = True

    ob_out = bpy.data.objects.new('NozzleHousing', me_out)
    bpy.context.collection.objects.link(ob_out)
    ob_out.data.materials.append(M_ARMOR)     # gunmetal exterior

    ob_in = bpy.data.objects.new('NozzleExhaust', me_in)
    bpy.context.collection.objects.link(ob_in)
    ob_in.data.materials.append(M_ORANGE)     # deep hot glow only

    print(f'[VAN] NozzleHousing: {len(me_out.vertices)}v {len(me_out.polygons)}f')
    print(f'[VAN] NozzleExhaust: {len(me_in.vertices)}v {len(me_in.polygons)}f')
    return ob_out, ob_in


# ── AIR INTAKES ──────────────────────────────────────────────────────────────
# Side-mounted intakes on fuselage shoulder — positioned high enough to be
# readable from top-down camera. Deep cavity with visible dark inner duct.
# 8-point smooth trapezoidal opening (was 6-point).

def build_intakes():
    bm = bmesh.new()

    def make_intake(side):
        s  = side
        # Position: fuselage upper-shoulder — pulled slightly higher and outward
        # so the cavity opening is clearly visible from the 3/4 elevated camera.
        CY = s * 0.490    # Y center — outboard on shoulder
        CZ = 0.10         # Z center — RAISED (was 0.06) — cavity mouth visible from above
        W  = 0.200        # half-width  (was 0.185)
        H  = 0.160        # half-height (was 0.140)

        # 8-point smooth D-shaped intake profile (F-22/F-35 style caret intake).
        # The opening is at the LARGEST X (front) and faces forward+outward.
        def duct_pts(x, scale=1.0, y_ctr=None, z_ctr=None):
            w = W * scale
            h = H * scale
            cy = CY if y_ctr is None else y_ctr
            cz = CZ if z_ctr is None else z_ctr
            return [
                (cy,             cz + h),           # top center
                (cy + s*w*0.90,  cz + h*0.80),      # top-outer canted (caret peak)
                (cy + s*w,       cz + h*0.24),      # outer upper
                (cy + s*w,       cz - h*0.44),      # outer lower
                (cy + s*w*0.80,  cz - h*0.88),      # bottom-outer canted
                (cy,             cz - h),           # bottom center
                (cy - s*w*0.24,  cz - h*0.64),      # inner lower
                (cy - s*w*0.24,  cz + h*0.64),      # inner upper
            ]

        # Cavity: lip → interior duct → deep dark exit.
        # Extended forward (lip further ahead) → longer visible cavity from above.
        lip_x     = 0.55     # opening front (further forward for visibility)
        duct_x1   = 0.28
        duct_x2   = 0.00
        duct_x3   = -0.30
        deep_x    = -0.70    # deep interior recess

        # Progressive tapering + inward Y shift + slight downward Z (routes to engine)
        lip_ring   = add_ring(bm, lip_x,   duct_pts(lip_x,   scale=1.00))
        duct_ring1 = add_ring(bm, duct_x1, duct_pts(duct_x1, scale=0.93, y_ctr=s*0.470))
        duct_ring2 = add_ring(bm, duct_x2, duct_pts(duct_x2, scale=0.82, y_ctr=s*0.420, z_ctr=CZ - 0.010))
        duct_ring3 = add_ring(bm, duct_x3, duct_pts(duct_x3, scale=0.68, y_ctr=s*0.360, z_ctr=CZ - 0.030))
        duct_ring4 = add_ring(bm, deep_x,  duct_pts(deep_x,  scale=0.54, y_ctr=s*0.300, z_ctr=CZ - 0.050))

        bm.verts.ensure_lookup_table()
        close_strip(bm, lip_ring,   duct_ring1)
        close_strip(bm, duct_ring1, duct_ring2)
        close_strip(bm, duct_ring2, duct_ring3)
        close_strip(bm, duct_ring3, duct_ring4)

        # External raised lip frame — visible bevel around the opening.
        outer_ring1 = add_ring(bm, lip_x + 0.022, duct_pts(lip_x, scale=1.05))
        outer_ring2 = add_ring(bm, lip_x + 0.048, duct_pts(lip_x, scale=1.11))
        close_strip(bm, lip_ring,    outer_ring1)
        close_strip(bm, outer_ring1, outer_ring2)

        # Close deep duct exit with a dark disc — reads as engine face far inside
        exit_cv = bm.verts.new((deep_x - 0.03, s*0.300, CZ - 0.050))
        fan_tip(bm, exit_cv, duct_ring4)

    make_intake(+1)
    make_intake(-1)

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('int_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('Intakes', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_INTAKE)
    print(f'[VAN] Intakes: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── WING-ROOT FILLET (LERX) ──────────────────────────────────────────────────
# Blended leading-edge root extension — smooth aerodynamic transition between
# fuselage shoulder and wing leading edge. Critical for reading as a real fighter
# instead of a "wing bolted onto tube" spaceship.

def build_wing_root_fillet():
    bm = bmesh.new()

    # Chord line points along the fillet (from cockpit shoulder → wing LE root).
    # Runs from x≈1.20 (below canopy peak) → x≈0.70 (new wider wing LE root).
    # Y flares from small (0.24) → wide (0.44) meeting wing root.
    LERX = [
        # (x,    y_edge,  z_upper,  z_lower)
        ( 1.20,  0.24,   0.24,   0.05),   # front — thin at cockpit shoulder
        ( 1.06,  0.30,   0.23,   0.03),
        ( 0.92,  0.36,   0.21,   0.02),
        ( 0.80,  0.40,   0.19,   0.02),
        ( 0.70,  0.44,   0.18,   0.03),   # meets wing LE root
    ]

    def make_fillet(side):
        s = side
        top_row = []
        bot_row = []
        inner_top = []   # inner Y edge (touches fuselage skin)
        inner_bot = []

        for (x, y, zu, zl) in LERX:
            top_row.append(bm.verts.new((x, s * y, zu)))
            bot_row.append(bm.verts.new((x, s * y, zl)))
            # Inner edge sits closer to centerline (buried into fuselage)
            iy = fuse_half_width(x) * 0.60
            inner_top.append(bm.verts.new((x, s * iy, fuse_top(x) - 0.02)))
            inner_bot.append(bm.verts.new((x, s * iy, fuse_top(x) - 0.10)))

        bm.verts.ensure_lookup_table()

        n = len(LERX)
        for i in range(n - 1):
            # Top skin (upper surface of the fillet)
            try:
                bm.faces.new([top_row[i], top_row[i+1], inner_top[i+1], inner_top[i]])
            except Exception:
                pass
            # Bottom skin
            try:
                bm.faces.new([bot_row[i], inner_bot[i], inner_bot[i+1], bot_row[i+1]])
            except Exception:
                pass
            # Outer edge (LE of the fillet)
            try:
                bm.faces.new([top_row[i], bot_row[i], bot_row[i+1], top_row[i+1]])
            except Exception:
                pass

    make_fillet(+1)
    make_fillet(-1)

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('lerx_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('WingRootFillet', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_ARMOR)
    print(f'[VAN] WingRootFillet: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── DORSAL SPINE ─────────────────────────────────────────────────────────────
# Raised centerline ridge running from behind cockpit to engine bay.
# Adds visible stealth surface language (dorsal fairing) — key panel break.

def build_dorsal_spine():
    bm = bmesh.new()

    # (x, half_width, extra_z)
    SPINE = [
        ( 0.20, 0.055, 0.008),   # just behind canopy rear tip
        ( 0.00, 0.070, 0.014),
        (-0.30, 0.088, 0.020),
        (-0.60, 0.100, 0.024),
        (-0.90, 0.108, 0.026),
        (-1.20, 0.110, 0.026),
        (-1.50, 0.108, 0.024),
        (-1.80, 0.096, 0.020),
        (-2.05, 0.076, 0.014),
        (-2.25, 0.052, 0.008),
        (-2.42, 0.026, 0.004),
    ]

    left  = []
    right = []
    for (x, hw, dz) in SPINE:
        z = fuse_top(x) + dz
        left.append(bm.verts.new((x, -hw, z)))
        right.append(bm.verts.new((x,  hw, z)))

    bm.verts.ensure_lookup_table()

    n = len(SPINE)
    for i in range(n - 1):
        try:
            bm.faces.new([left[i], right[i], right[i+1], left[i+1]])
        except Exception:
            pass

    # Side walls down to fuselage skin (creates a sharp edge that reads as a panel break)
    for i in range(n - 1):
        z_fuse_i  = fuse_top(SPINE[i][0])
        z_fuse_ip = fuse_top(SPINE[i+1][0])
        # Right wall
        vr_up_i  = right[i]
        vr_up_ip = right[i+1]
        vr_dn_i  = bm.verts.new((SPINE[i][0],   SPINE[i][1],   z_fuse_i))
        vr_dn_ip = bm.verts.new((SPINE[i+1][0], SPINE[i+1][1], z_fuse_ip))
        try:
            bm.faces.new([vr_up_i, vr_dn_i, vr_dn_ip, vr_up_ip])
        except Exception:
            pass
        # Left wall
        vl_up_i  = left[i]
        vl_up_ip = left[i+1]
        vl_dn_i  = bm.verts.new((SPINE[i][0],   -SPINE[i][1],   z_fuse_i))
        vl_dn_ip = bm.verts.new((SPINE[i+1][0], -SPINE[i+1][1], z_fuse_ip))
        try:
            bm.faces.new([vl_up_i, vl_up_ip, vl_dn_ip, vl_dn_i])
        except Exception:
            pass

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('spine_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('DorsalSpine', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_ARMOR2)   # slightly matte for surface variation
    print(f'[VAN] DorsalSpine: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── ENGINE NACELLES ──────────────────────────────────────────────────────────
# Twin engine housings — raised nacelle geometry that WRAPS around the top+side
# of the rear fuselage, visually splitting the tail into two distinct engines.

def build_engine_humps():
    bm = bmesh.new()

    # Nacelle cross-section stations. Each station defines a partial arc
    # (from inner-top → outer-side) that sits on the fuselage skin like a saddle.
    # (x, top_half_width, side_z_span, top_z_offset, side_out_offset)
    NAC = [
        (-0.85, 0.075, 0.055, 0.012, 0.008),
        (-1.10, 0.108, 0.100, 0.028, 0.020),
        (-1.35, 0.130, 0.135, 0.040, 0.030),   # peak volume
        (-1.60, 0.132, 0.150, 0.042, 0.036),
        (-1.85, 0.126, 0.150, 0.038, 0.034),
        (-2.05, 0.108, 0.130, 0.030, 0.028),
        (-2.22, 0.084, 0.100, 0.020, 0.018),
        (-2.35, 0.056, 0.065, 0.010, 0.010),
        (-2.44, 0.028, 0.030, 0.004, 0.004),
    ]
    Y_CENTER = 0.230   # matches nozzle Y offset

    N_ARC = 5   # arc points per station (top-center → outer-side)

    def make_nacelle(side):
        s = side
        rings = []
        for (x, hw, sv, dz_top, out) in NAC:
            z_base = fuse_top(x)
            fh_at_x = fuse_half_width(x)
            # Arc spans from a=0 (top-center of nacelle) to a=π/2 (outer side)
            # Position on fuselage: nacelle top center at (Y=s*Y_CENTER, Z=z_base+dz_top)
            # Outer edge sits on fuselage skin side (Y=s*(fh_at_x+out), Z=z_base-sv*0.4)
            row = []
            for k in range(N_ARC):
                a = PI / 2 * k / (N_ARC - 1)   # 0 → π/2
                # Elliptical arc: y offset from center, z offset above skin
                dy = hw * math.sin(a)
                dz = dz_top * math.cos(a) + sv * math.sin(a) * 0.0   # top-heavy
                # But we also want it to reach outer side at a=π/2
                # Blend: at a=0 dy=0 (top ctr); at a=π/2 dy=hw+out (outer side)
                if k == N_ARC - 1:
                    dy = hw + out
                    dz = -sv * 0.35
                y = s * Y_CENTER + s * dy
                z = z_base + dz
                row.append(bm.verts.new((x, y, z)))
            rings.append(row)

        bm.verts.ensure_lookup_table()

        # Longitudinal strip faces
        for i in range(len(NAC) - 1):
            for k in range(N_ARC - 1):
                try:
                    bm.faces.new([
                        rings[i][k], rings[i+1][k],
                        rings[i+1][k+1], rings[i][k+1],
                    ])
                except Exception:
                    pass

    make_nacelle(+1)
    make_nacelle(-1)

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.003)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('nacelles_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('EngineNacelles', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_ARMOR2)
    print(f'[VAN] EngineNacelles: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── COCKPIT DECK / SURROUND ──────────────────────────────────────────────────
# Small raised deck panel behind cockpit — the "avionics fairing" that flows
# from canopy rear into dorsal spine. Reinforces cockpit-fuselage transition.

def build_cockpit_deck():
    bm = bmesh.new()

    # (x, half_width, extra_z)
    # Canopy rear tip now X=0.36 → deck starts just behind at X=0.32.
    DECK = [
        ( 0.32, 0.108, 0.006),   # just behind canopy rear
        ( 0.22, 0.092, 0.012),
        ( 0.12, 0.074, 0.016),
        ( 0.02, 0.062, 0.014),
        (-0.06, 0.062, 0.010),   # merges into spine start
    ]

    left  = []
    right = []
    for (x, hw, dz) in DECK:
        z = fuse_top(x) + dz
        left.append(bm.verts.new((x, -hw, z)))
        right.append(bm.verts.new((x,  hw, z)))

    bm.verts.ensure_lookup_table()

    n = len(DECK)
    for i in range(n - 1):
        try:
            bm.faces.new([left[i], right[i], right[i+1], left[i+1]])
        except Exception:
            pass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('deck_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('CockpitDeck', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_PANEL)
    print(f'[VAN] CockpitDeck: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── FIN ROOT FAIRINGS ────────────────────────────────────────────────────────
# Small triangular gussets at fin root that blend fin into rear fuselage.

def build_fin_root_fairings():
    bm = bmesh.new()

    # Points defining the fairing triangle at fin root (approximate fin base).
    # Fin root x range: -1.85 to -2.75 → fairing extends slightly beyond both.
    FAIR = [
        (-1.75, 0.36, 0.020),   # front tip on fuselage
        (-2.85, 0.24, 0.010),   # rear tip on fuselage
        (-2.30, 0.42, 0.180),   # mid, rising up onto fin
    ]

    def make_fairing(side):
        s = side
        verts = []
        for (x, y, dz) in FAIR:
            verts.append(bm.verts.new((x, s * y, fuse_top(x) + dz)))
        try:
            bm.faces.new(verts)
        except Exception:
            pass

    make_fairing(+1)
    make_fairing(-1)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('finfair_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('FinRootFairings', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_DARK)
    print(f'[VAN] FinRootFairings: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── PANEL SEAMS ──────────────────────────────────────────────────────────────
# Thin raised strips that read as engineering panel breaks under Cycles lighting.
# Strips are ~0.010 wide, raised ~0.005 above parent surface — bevel modifier
# picks up their edges creating subtle highlight rims (real fighter panel seam).
# Only engineering-logical locations: NO decorative long lines.

def build_panel_seams():
    bm = bmesh.new()

    SEAM_W = 0.010    # strip width
    Z_OFF  = 0.005    # raised above parent surface

    def strip_along_top(xs, y_ctr, side_hw=None):
        """Longitudinal strip on fuselage top at Y=y_ctr."""
        va, vb = [], []
        for x in xs:
            zt = fuse_top(x) + Z_OFF
            va.append(bm.verts.new((x, y_ctr - SEAM_W * 0.5, zt)))
            vb.append(bm.verts.new((x, y_ctr + SEAM_W * 0.5, zt)))
        for i in range(len(xs) - 1):
            try:
                bm.faces.new([va[i], vb[i], vb[i+1], va[i+1]])
            except Exception:
                pass

    def strip_transverse(x_ctr, y_from, y_to, z_val):
        """Transverse strip at X=x_ctr, spanning Y range at given Z."""
        va = bm.verts.new((x_ctr - SEAM_W * 0.5, y_from, z_val))
        vb = bm.verts.new((x_ctr + SEAM_W * 0.5, y_from, z_val))
        vc = bm.verts.new((x_ctr + SEAM_W * 0.5, y_to,   z_val))
        vd = bm.verts.new((x_ctr - SEAM_W * 0.5, y_to,   z_val))
        try:
            bm.faces.new([va, vb, vc, vd])
        except Exception:
            pass

    def strip_wing_hinge(side, span, chord_frac):
        """Wing control-surface hinge line at given chord fraction."""
        s = side
        va, vb = [], []
        for (x_le, x_te, y_abs, _thick) in span:
            chord = x_le - x_te
            x_hinge = x_le - chord_frac * chord
            y = s * y_abs
            # Wing top surface Z: baseline 0.05 + slight camber
            z_wing = 0.05 + 0.008 * (1.0 - chord_frac) + Z_OFF
            va.append(bm.verts.new((x_hinge - SEAM_W * 0.5, y, z_wing)))
            vb.append(bm.verts.new((x_hinge + SEAM_W * 0.5, y, z_wing)))
        for i in range(len(span) - 1):
            try:
                bm.faces.new([va[i], vb[i], vb[i+1], va[i+1]])
            except Exception:
                pass

    def rect_panel(x0, x1, y0, y1, z):
        """Rectangular access panel outline as 4 thin strips (top of nacelle)."""
        # 4 corners at z
        # Front edge (X=x0)
        for (a0, a1, b0, b1) in [
            ((x0, y0),      (x0 + SEAM_W, y0),      (x0 + SEAM_W, y1),      (x0, y1)),        # front
            ((x1 - SEAM_W, y0), (x1, y0),           (x1, y1),               (x1 - SEAM_W, y1)),   # rear
            ((x0, y0),      (x1, y0),               (x1, y0 + SEAM_W),      (x0, y0 + SEAM_W)),  # inner-Y
            ((x0, y1 - SEAM_W), (x1, y1 - SEAM_W),  (x1, y1),               (x0, y1)),        # outer-Y
        ]:
            va = bm.verts.new((a0[0], a0[1], z))
            vb = bm.verts.new((a1[0], a1[1], z))
            vc = bm.verts.new((b0[0], b0[1], z))
            vd = bm.verts.new((b1[0], b1[1], z))
            try:
                bm.faces.new([va, vb, vc, vd])
            except Exception:
                pass

    # ── 1) Nose upper panel seams (2 lines symmetric, follow chine direction) ──
    # Runs from just aft of nose tip back to canopy front.
    nose_xs = [2.55, 2.42, 2.28, 2.14, 2.00]
    for side in (+1, -1):
        y_ctr_offset = side * 0.11   # Y offset from center on nose top
        va, vb = [], []
        for x in nose_xs:
            zt = fuse_top(x) + Z_OFF
            va.append(bm.verts.new((x, y_ctr_offset - SEAM_W * 0.5 * side, zt)))
            vb.append(bm.verts.new((x, y_ctr_offset + SEAM_W * 0.5 * side, zt)))
        for i in range(len(nose_xs) - 1):
            try:
                bm.faces.new([va[i], vb[i], vb[i+1], va[i+1]])
            except Exception:
                pass

    # ── 2) Cockpit surround transverse seam (just behind canopy tip and just ahead)
    # Front seam: transverse line at X=2.10 (ahead of canopy front tip X=2.05)
    strip_transverse(2.10, -0.18, 0.18, fuse_top(2.10) + Z_OFF)
    # Rear seam: at X=0.36 (canopy rear tip), transverse across deck
    strip_transverse(0.34, -0.12, 0.12, fuse_top(0.34) + Z_OFF + 0.010)

    # ── 3) Wing root transverse seam (upper surface, close to fuselage)
    for side in (+1, -1):
        s = side
        strip_transverse(-0.10, s * 0.44, s * 0.62, 0.06 + Z_OFF)

    # ── 4) Wing control-surface hinge line (72% chord — flap/aileron pivot) ──
    # SPAN reference (from build_wings): root x_LE=0.70, x_TE=-0.98 through tip
    SPAN_REF = [
        ( 0.70,  -0.98,  0.44), ( 0.58,  -1.02,  0.60),
        ( 0.42,  -1.06,  0.78), ( 0.22,  -1.11,  0.98),
        ( 0.00,  -1.16,  1.18), (-0.20,  -1.20,  1.36),
        (-0.38,  -1.24,  1.52), (-0.54,  -1.27,  1.66),
        (-0.68,  -1.30,  1.78), (-0.80,  -1.32,  1.86),
        (-0.90,  -1.34,  1.92),
    ]
    span_thick = [(x_le, x_te, y, 0.05) for (x_le, x_te, y) in SPAN_REF]
    for side in (+1, -1):
        strip_wing_hinge(side, span_thick, chord_frac=0.72)

    # ── 5) Engine access panel — rectangular hatch on top of each nacelle ──
    for side in (+1, -1):
        cy = side * 0.230
        y0 = cy - 0.070 if side > 0 else cy - 0.070
        y1 = cy + 0.070 if side > 0 else cy + 0.070
        z  = fuse_top(-1.40) + 0.040 + Z_OFF   # sits on top of nacelle wrap
        rect_panel(-1.65, -1.05, min(y0, y1), max(y0, y1), z)

    # ── 6) Rear fuselage transverse seam (body → engine bay transition) ──
    strip_transverse(-0.80, -0.42, 0.42, fuse_top(-0.80) + Z_OFF)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('seams_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('PanelSeams', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_DARK)
    print(f'[VAN] PanelSeams: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── WING LE ACCENT STRIPS ────────────────────────────────────────────────────
# Thin cyan-emissive strips along wing leading edges. Visible from top-down.

def build_le_accents():
    bm = bmesh.new()

    LE_PTS = [
        ( 0.94,  0.40),
        ( 0.52,  0.74),
        ( 0.06,  1.12),
        (-0.40,  1.52),
        (-0.84,  1.90),
        (-1.22,  2.18),
        (-1.52,  2.36),
        (-1.82,  2.50),
    ]
    STRIP_W = 0.045   # inward width
    Z_ACCENT = 0.055  # sits just above wing surface

    def make_strip(side):
        s = side
        n = len(LE_PTS)
        for i in range(n - 1):
            x0, ya0 = LE_PTS[i]
            x1, ya1 = LE_PTS[i + 1]
            y0 = s * ya0
            y1 = s * ya1

            # Direction along LE
            dx = x1 - x0
            dy = y1 - y0
            length = math.hypot(dx, dy) + 1e-6

            # Inward normal (perpendicular to LE, pointing toward TE)
            # LE goes from root toward tip in direction (dx,dy)
            # Inward (toward TE) = rotate 90° clockwise for Y+ wing
            nx =  dy / length * s
            ny = -dx / length * s

            px = nx * STRIP_W
            py = ny * STRIP_W * s

            try:
                bm.faces.new([
                    bm.verts.new((x0,      y0,      Z_ACCENT)),
                    bm.verts.new((x0 + px, y0 + py, Z_ACCENT)),
                    bm.verts.new((x1 + px, y1 + py, Z_ACCENT)),
                    bm.verts.new((x1,      y1,      Z_ACCENT)),
                ])
            except Exception:
                pass

    make_strip(+1)
    make_strip(-1)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('acc_me')
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new('LeAccents', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_CYAN)
    print(f'[VAN] LE Accents: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── BUILD ALL ────────────────────────────────────────────────────────────────
print('[VAN] Building geometry...')
t_geom = time.time()

ob_fuse                 = build_fuselage()
ob_wings                = build_wings()
ob_fins                 = build_fins()
ob_canopy, ob_canframe  = build_canopy()          # canopy + separate metallic frame
ob_nozhouse, ob_nozexh  = build_nozzles()         # housing (gunmetal) + inner cavity (orange)
ob_intakes              = build_intakes()
ob_lerx                 = build_wing_root_fillet()  # LERX / wing-root fillet
ob_spine                = build_dorsal_spine()      # raised dorsal ridge behind canopy
ob_humps                = build_engine_humps()      # full twin engine nacelle wraps (top+side)
ob_deck                 = build_cockpit_deck()      # avionics fairing behind canopy
ob_finfair              = build_fin_root_fairings() # triangular gussets at fin base
ob_seams                = build_panel_seams()        # engineering panel breaks
# LE accents removed — user directive: no neon strip on wings.

print(f'[VAN] Geometry built in {time.time()-t_geom:.1f}s')

# ── APPLY BEVEL MODIFIERS ────────────────────────────────────────────────────
# Micro-bevel sharpens silhouette edges — panel breaks become subtly faceted.

for ob in [ob_fuse, ob_wings, ob_fins, ob_canopy, ob_canframe,
           ob_nozhouse, ob_nozexh, ob_intakes,
           ob_lerx, ob_spine, ob_humps, ob_deck, ob_finfair, ob_seams]:
    bev = ob.modifiers.new('Bevel', 'BEVEL')
    bev.width = 0.012
    bev.segments = 3
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(32)
    try:
        ob.modifiers.new('WeightNorm', 'WEIGHTED_NORMAL')
    except Exception:
        pass


# ── SCENE SETUP ──────────────────────────────────────────────────────────────
# Match bake_sprites.py exactly for consistent results.

def setup_world():
    w = bpy.context.scene.world
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value    = (0.003, 0.006, 0.015, 1.0)
    bg.inputs['Strength'].default_value = 0.08


def setup_camera(scale=6.4):
    """Top-down gameplay camera. Nose (+X) points toward BOTTOM of the frame."""
    bpy.ops.object.camera_add(location=(0.0, 0.0, 12.0))
    cam = bpy.context.object
    cam.name = 'SpriteCamera'
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = scale
    # Look straight down (-Z). Rotate camera around Z by +90° so world +X → screen bottom.
    cam.rotation_euler = (0.0, 0.0, math.pi / 2)
    bpy.context.scene.camera = cam
    return cam


def add_light(name, loc, energy, color, size=5, ltype='AREA'):
    bpy.ops.object.light_add(type=ltype, location=loc)
    l = bpy.context.object
    l.name = name
    l.data.energy = energy
    l.data.color  = color
    if ltype == 'AREA':
        l.data.shape = 'DISK'
        l.data.size  = size


def setup_lights():
    # Top-down camera view. Key light rebalanced for straight-down shot.
    # Neutral daylight primary + small cyberpunk rim accents (NOT primary color).
    # Body reads as REAL MILITARY FIGHTER first; cyberpunk lighting second.
    add_light('Key',       ( 4, -3,  9), 1200, (0.75, 0.85, 1.00), 5)   # neutral cool key
    add_light('Fill',      (-3,  2,  8),  600, (0.55, 0.65, 0.85), 5)   # soft cool fill
    add_light('TopSoft',   ( 0,  0, 12),  700, (0.65, 0.72, 0.90), 6)   # overhead soft light
    add_light('RimBlue',   (-6,  3,  4),  420, (0.10, 0.55, 1.00), 4)   # tail-side cyan rim accent
    add_light('RimMag',    ( 2,  6,  3),  260, (1.00, 0.15, 0.45), 4)   # side magenta rim accent
    add_light('FillWarm',  ( 3, -2, -3),  180, (1.00, 0.55, 0.30), 4)   # subtle warm underfill


setup_world()
setup_camera(6.9)   # fits full length (nose +2.80 → nozzle exhaust -3.23) with margin
setup_lights()

print('[VAN] Scene setup complete')


# ── RENDER CONFIG ────────────────────────────────────────────────────────────

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 192                        # cleaner PBR highlights (was 128)
scene.cycles.use_adaptive_sampling   = True
scene.cycles.adaptive_threshold      = 0.015      # tighter noise tolerance
scene.cycles.adaptive_min_samples    = 24
scene.cycles.max_bounces             = 5
scene.cycles.diffuse_bounces         = 3
scene.cycles.glossy_bounces          = 4
scene.cycles.transmission_bounces    = 2
scene.cycles.shadow_bounces          = 1
scene.cycles.volume_bounces          = 0
scene.cycles.use_denoising           = True
scene.cycles.denoiser                = 'OPENIMAGEDENOISE'
scene.render.use_persistent_data     = True

scene.render.resolution_x                      = 2048
scene.render.resolution_y                      = 2048
scene.render.resolution_percentage             = 100
scene.render.image_settings.file_format        = 'PNG'
scene.render.image_settings.color_mode         = 'RGBA'
scene.render.image_settings.color_depth        = '8'
scene.render.film_transparent                  = True
scene.view_settings.view_transform             = 'AgX'
scene.view_settings.look                       = 'AgX - Medium High Contrast'

# ── MULTI-FRAME RENDER PIPELINE ──────────────────────────────────────────────
# Parent every mesh to a single Empty (VanguardRoot) so we can rotate the
# entire aircraft as one rigid body between renders. Bevel/WeightedNormal
# modifiers remain applied per-object.
#
# NORVYX 8-angle convention (this project): frame_idx * 45° CCW around +Z.
#   Frame 0: nose → screen bottom  (base gameplay pose)
#   Frame 1: nose → screen bottom-right
#   Frame 2: nose → screen right
#   Frame 3: nose → screen top-right
#   Frame 4: nose → screen top      (180° opposite of frame 0)
#   Frame 5: nose → screen top-left
#   Frame 6: nose → screen left
#   Frame 7: nose → screen bottom-left
#
# Frames rendered are controlled by env var FRAMES (comma-separated indices).
# Default: "0,4" for the two-angle pipeline test.

bpy.ops.object.empty_add(location=(0.0, 0.0, 0.0))
root_empty = bpy.context.object
root_empty.name = 'VanguardRoot'
for ob in list(bpy.data.objects):
    if ob.type == 'MESH':
        ob.parent = root_empty

FRAMES_ENV = os.environ.get('FRAMES', '0,4')
FRAMES = [int(x.strip()) for x in FRAMES_ENV.split(',') if x.strip()]
print(f'[VAN] Rendering frames: {FRAMES}')

# Pre-compute geometry stats (evaluated mesh, post-modifier) — same for all frames.
deps = bpy.context.evaluated_depsgraph_get()
mesh_count = 0
tri_count  = 0
vert_count = 0
for ob in bpy.data.objects:
    if ob.type != 'MESH':
        continue
    mesh_count += 1
    eval_ob = ob.evaluated_get(deps)
    eval_me = eval_ob.to_mesh()
    if eval_me is None:
        continue
    vert_count += len(eval_me.vertices)
    for poly in eval_me.polygons:
        tri_count += max(0, len(poly.vertices) - 2)
    eval_ob.to_mesh_clear()

frame_results = []

for frame_idx in FRAMES:
    angle_deg = frame_idx * 45.0
    root_empty.rotation_euler[2] = math.radians(angle_deg)
    bpy.context.view_layer.update()

    OUT_PATH = os.path.join(BAKED, f'vanguard_{frame_idx:02d}.png')
    scene.render.filepath = OUT_PATH
    print(f'[VAN] Rendering frame {frame_idx:02d} (Z rot {angle_deg}°) → {OUT_PATH}')

    t_render = time.time()
    bpy.ops.render.render(write_still=True)
    elapsed = time.time() - t_render

    if not os.path.exists(OUT_PATH):
        print(f'[VAN] ERROR: frame {frame_idx:02d} output missing!')
        sys.exit(1)

    size_kb = os.path.getsize(OUT_PATH) // 1024
    print(f'[VAN] Frame {frame_idx:02d} done: {elapsed:.1f}s → {size_kb} KB')
    frame_results.append((frame_idx, angle_deg, elapsed, size_kb, OUT_PATH))

# ── QUALITY REPORT ───────────────────────────────────────────────────────────
print('')
print('══════════════════════════════════════════════════════════════')
print('  QUALITY REPORT — VANGUARD MULTI-FRAME PIPELINE')
print('══════════════════════════════════════════════════════════════')
print(f'  Mesh objects   : {mesh_count}')
print(f'  Vertices       : {vert_count}')
print(f'  Triangles      : {tri_count}')
print(f'  Resolution     : {scene.render.resolution_x}×{scene.render.resolution_y}')
print(f'  Samples (max)  : {scene.cycles.samples} (adaptive)')
print(f'  Ortho scale    : {bpy.context.scene.camera.data.ortho_scale}')
print(f'  Frames rendered: {[f[0] for f in frame_results]}')
for (idx, deg, sec, kb, path) in frame_results:
    print(f'    frame_{idx:02d} (Z={deg}°): {sec:.1f}s, {kb} KB, {path}')
print('══════════════════════════════════════════════════════════════')
