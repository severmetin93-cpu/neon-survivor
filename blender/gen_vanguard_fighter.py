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
M_ARMOR   = mkmat('armor',   (0.18, 0.20, 0.24), metal=0.75, rough=0.32)   # gunmetal fuselage
M_DARK    = mkmat('dark',    (0.05, 0.06, 0.08), metal=0.70, rough=0.42)   # graphite (tails, dark panels)
M_CARBON  = mkmat('carbon',  (0.07, 0.08, 0.10), metal=0.55, rough=0.36)
M_PANEL   = mkmat('panel',   (0.11, 0.12, 0.14), metal=0.15, rough=0.55)   # matte composite panel
M_FRAME   = mkmat('frame',   (0.08, 0.09, 0.11), metal=0.85, rough=0.28)   # canopy metallic frame
M_GLASS   = mkmat('glass',   (0.020, 0.028, 0.045), metal=0.10, rough=0.05)  # dark smoked canopy (no emission)
M_CYAN    = mkmat('cyan',    (0.00, 0.11, 0.20), metal=0.14, rough=0.18,
                  em=(0.00, 0.65, 1.00), ems=2.5)                          # small accent only
M_ORANGE  = mkmat('orange',  (0.10, 0.06, 0.02), metal=0.90, rough=0.14,
                  em=(1.00, 0.22, 0.00), ems=3.0)                          # nozzle interior only
M_INTAKE  = mkmat('dark_intake', (0.03, 0.04, 0.06), metal=0.60, rough=0.42)

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
    # y_pos: half-span at that station. Root buries into blended body (y=0.54 fuselage edge).
    # Root chord thicker (0.155) → tapers to 0.014 at tip. Wing-root fillet added separately.
    # Moderate swept wing — NOT a delta wing. F-22-class proportions.
    # Wingspan 4.10 units (half=2.05, was 2.50). LE sweep ~46°. TE forward sweep ~18°.
    # Root chord 1.45 (was 1.82). Tip chord 0.28 (was 0.76 → less blocky).
    # Root x_LE=0.60 → sits under mid-cockpit-to-mid-fuselage.
    SPAN = [
        # x_LE    x_TE    y       thick
        ( 0.60,  -0.85,  0.42,  0.135),   # root (buries slightly into blended body)
        ( 0.48,  -0.92,  0.58,  0.120),
        ( 0.30,  -1.00,  0.78,  0.104),
        ( 0.08,  -1.10,  1.00,  0.088),
        (-0.16,  -1.18,  1.22,  0.072),
        (-0.40,  -1.25,  1.42,  0.058),
        (-0.62,  -1.31,  1.60,  0.046),
        (-0.80,  -1.35,  1.76,  0.034),
        (-0.94,  -1.38,  1.88,  0.024),
        (-1.05,  -1.40,  1.97,  0.016),
        (-1.12,  -1.40,  2.05,  0.010),   # sharp aerodynamic tip, chord ~0.28
    ]

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

                # Biconvex NACA-like profile
                # Max thickness at c=0.35, zero at LE and TE
                if c < 0.35:
                    zf = math.sqrt(c / 0.35)
                else:
                    zf = math.sqrt((1.0 - c) / 0.65)

                # Slight camber: wing surface tilted upward at LE
                camber = 0.008 * (1.0 - c)

                z_top = camber + thick * 0.55 * zf + 0.05
                z_bot = camber - thick * 0.45 * zf + 0.05

                top_row.append(bm.verts.new((x, y, z_top)))
                bot_row.append(bm.verts.new((x, y, z_bot)))

            top_rows.append(top_row)
            bot_rows.append(bot_row)

        bm.verts.ensure_lookup_table()

        # Top surface
        for i in range(N_SPAN - 1):
            for m in range(N_CHORD - 1):
                try:
                    bm.faces.new([
                        top_rows[i][m],     top_rows[i + 1][m],
                        top_rows[i + 1][m + 1], top_rows[i][m + 1],
                    ])
                except Exception:
                    pass

        # Bottom surface
        for i in range(N_SPAN - 1):
            for m in range(N_CHORD - 1):
                try:
                    bm.faces.new([
                        bot_rows[i][m],     bot_rows[i][m + 1],
                        bot_rows[i + 1][m + 1], bot_rows[i + 1][m],
                    ])
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
    ob.data.materials.append(M_ARMOR)
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
    # Repositioned to sit on rear fuselage (X=-1.85 to -2.75) matching new compact body.
    # Root thickness 0.110 (was 0.068) → sturdier, less "paper triangle" look.
    FIN_STA = [
        # x_LE    x_TE    z_loc  thick
        (-1.85,  -2.75,  0.00,  0.110),   # root — thick, blends into fuselage
        (-1.95,  -2.75,  0.14,  0.098),
        (-2.05,  -2.75,  0.28,  0.084),
        (-2.15,  -2.75,  0.42,  0.070),
        (-2.24,  -2.75,  0.54,  0.056),
        (-2.32,  -2.75,  0.64,  0.044),
        (-2.38,  -2.75,  0.72,  0.032),
        (-2.44,  -2.75,  0.78,  0.020),
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
    # Compact bubble dome — total length 1.74 units (was 2.96 → too long).
    # Peak width 0.220, peak height 0.214 → true bubble (width ≈ height).
    # Sits between X=1.90 (front) and X=0.16 (rear), directly behind short nose.
    CAN_STA = [
        ( 1.90, 0.000, 0.000),   # front tip
        ( 1.82, 0.052, 0.026),
        ( 1.70, 0.108, 0.068),
        ( 1.55, 0.156, 0.118),
        ( 1.38, 0.190, 0.160),
        ( 1.20, 0.212, 0.196),
        ( 1.00, 0.220, 0.214),   # bubble PEAK — pilot position
        ( 0.80, 0.216, 0.212),
        ( 0.62, 0.198, 0.188),
        ( 0.48, 0.166, 0.154),
        ( 0.36, 0.126, 0.110),
        ( 0.26, 0.082, 0.064),
        ( 0.20, 0.036, 0.022),
        ( 0.16, 0.000, 0.000),   # rear tip
    ]

    N_ARC = 12  # smooth upper arc per station

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

    def make_nozzle(y_ctr):
        # Housing profile stations (X, radius). Rear = smaller (converging nozzle look).
        R_HOUSE = 0.170    # housing front (blends with engine bay)
        R_MID   = 0.148    # nozzle mid
        R_LIP   = 0.130    # nozzle lip (outer rim of exit)
        R_HOT   = 0.108    # inner exhaust ring (visible glow)
        Z_CTR   = 0.060

        # Outer housing: 3-ring loft
        p_house = ellipse_pts(N_NOZ, R_HOUSE, R_HOUSE * 0.90, y_ctr, Z_CTR)
        p_mid   = ellipse_pts(N_NOZ, R_MID,   R_MID   * 0.86, y_ctr, Z_CTR)
        p_lip   = ellipse_pts(N_NOZ, R_LIP,   R_LIP   * 0.80, y_ctr, Z_CTR)

        r_h = add_ring(bm_out, -2.30, p_house)
        r_m = add_ring(bm_out, -2.70, p_mid)
        r_l = add_ring(bm_out, -2.95, p_lip)
        close_strip(bm_out, r_h, r_m)
        close_strip(bm_out, r_m, r_l)

        # Rim closer: connect lip to inner-hot-ring position (small annular face)
        p_hot_outer = ellipse_pts(N_NOZ, R_HOT, R_HOT * 0.80, y_ctr, Z_CTR)
        r_ho = add_ring(bm_out, -2.97, p_hot_outer)
        close_strip(bm_out, r_l, r_ho)

        # Inner exhaust cavity — recessed deep dark chamber with orange emissive rim
        p_hot_in = ellipse_pts(N_NOZ, R_HOT * 0.98, R_HOT * 0.78, y_ctr, Z_CTR)
        p_deep   = ellipse_pts(N_NOZ, R_HOT * 0.55, R_HOT * 0.45, y_ctr, Z_CTR)
        r_hi = add_ring(bm_in, -2.98, p_hot_in)
        r_d  = add_ring(bm_in, -3.15, p_deep)
        close_strip(bm_in, r_hi, r_d)

        # Deep-end disc (fully closed hot core)
        cv = bm_in.verts.new((-3.20, y_ctr, Z_CTR))
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
        # Position: fuselage upper-shoulder, aft of cockpit, ahead of wing root.
        CY = s * 0.470    # Y center — on fuselage shoulder (fuselage ry at x=0.30 ≈ 0.500)
        CZ = 0.05         # Z center — sits above mid-line, visible from top
        W  = 0.150        # half-width
        H  = 0.110        # half-height

        # 8-point smooth D-shaped intake profile (top-outer canted, bottom flat)
        def duct_pts(x, scale=1.0):
            w = W * scale
            h = H * scale
            # Right side (s=+1): opening faces +Y outward
            return [
                (CY,             CZ + h),           # top center
                (CY + s*w*0.85,  CZ + h*0.75),      # top-outer canted
                (CY + s*w,       CZ + h*0.20),      # outer upper
                (CY + s*w,       CZ - h*0.40),      # outer lower
                (CY + s*w*0.75,  CZ - h*0.85),      # bottom-outer canted
                (CY,             CZ - h),           # bottom center
                (CY - s*w*0.20,  CZ - h*0.60),      # inner lower
                (CY - s*w*0.20,  CZ + h*0.60),      # inner upper
            ]

        # Deep cavity: lip → duct-interior → deep dark end (0.80 units back)
        lip_x     = 0.35     # opening front (behind cockpit)
        duct_mid  = 0.05
        deep_x    = -0.45    # deep interior recess

        lip_ring   = add_ring(bm, lip_x,    duct_pts(lip_x,    scale=1.00))
        duct_ring1 = add_ring(bm, duct_mid, duct_pts(duct_mid, scale=0.88))
        duct_ring2 = add_ring(bm, deep_x,   duct_pts(deep_x,   scale=0.72))

        bm.verts.ensure_lookup_table()
        close_strip(bm, lip_ring,   duct_ring1)
        close_strip(bm, duct_ring1, duct_ring2)

        # External lip frame — thin raised bevel around the opening.
        outer_ring = add_ring(bm, lip_x + 0.030, duct_pts(lip_x, scale=1.08))
        close_strip(bm, lip_ring, outer_ring)

        # Close deep duct exit — dark inner surface visible through opening
        exit_cv = bm.verts.new((deep_x - 0.02, CY, CZ))
        fan_tip(bm, exit_cv, duct_ring2)

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
# LE accents removed — user directive: no neon strip on wings.

print(f'[VAN] Geometry built in {time.time()-t_geom:.1f}s')

# ── APPLY BEVEL MODIFIERS ────────────────────────────────────────────────────
# Micro-bevel sharpens silhouette edges.

for ob in [ob_fuse, ob_wings, ob_fins, ob_canopy, ob_canframe,
           ob_nozhouse, ob_nozexh, ob_intakes]:
    bev = ob.modifiers.new('Bevel', 'BEVEL')
    bev.width = 0.014
    bev.segments = 3
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(35)
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


def setup_camera(scale=3.5):
    bpy.ops.object.camera_add(location=(8.5, -0.1, 7.5))
    cam = bpy.context.object
    cam.name = 'SpriteCamera'
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = scale
    from mathutils import Vector
    direction = Vector((0, 0, 0)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    return cam


def add_light(name, loc, energy, color, size=5):
    bpy.ops.object.light_add(type='AREA', location=loc)
    l = bpy.context.object
    l.name = name
    l.data.energy = energy
    l.data.color  = color
    l.data.shape  = 'DISK'
    l.data.size   = size


def setup_lights():
    add_light('Key',      ( 5, -5,  8),  950, (0.55, 0.75, 1.00), 5)
    add_light('RimBlue', (-4,  4,  5), 1150, (0.00, 0.45, 1.00), 4)
    add_light('RimMag',  (-2, -4,  3),  900, (1.00, 0.03, 0.35), 4)
    add_light('Top',      ( 0,  0, 10),  500, (0.35, 0.50, 1.00), 3)


setup_world()
setup_camera(6.5)
setup_lights()

print('[VAN] Scene setup complete')


# ── RENDER CONFIG ────────────────────────────────────────────────────────────

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 128
scene.cycles.use_adaptive_sampling   = True
scene.cycles.adaptive_threshold      = 0.02
scene.cycles.adaptive_min_samples    = 16
scene.cycles.max_bounces             = 4
scene.cycles.diffuse_bounces         = 2
scene.cycles.glossy_bounces          = 3
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

OUT_PATH = os.path.join(BAKED, 'vanguard_00.png')
scene.render.filepath = OUT_PATH

print(f'[VAN] Rendering → {OUT_PATH}')
t_render = time.time()
bpy.ops.render.render(write_still=True)
elapsed = time.time() - t_render

print(f'[VAN] Render done: {elapsed:.1f}s → {OUT_PATH}')
if os.path.exists(OUT_PATH):
    size_kb = os.path.getsize(OUT_PATH) // 1024
    print(f'[VAN] File size: {size_kb} KB')
else:
    print('[VAN] ERROR: output file not found!')
    sys.exit(1)
