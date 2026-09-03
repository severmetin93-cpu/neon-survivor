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


M_ARMOR   = mkmat('armor',   (0.34, 0.39, 0.46), metal=0.90, rough=0.20)
M_DARK    = mkmat('dark',    (0.04, 0.05, 0.07), metal=0.78, rough=0.34)
M_CARBON  = mkmat('carbon',  (0.07, 0.08, 0.10), metal=0.55, rough=0.36)
M_GLASS   = mkmat('glass',   (0.01, 0.04, 0.09), metal=0.18, rough=0.08,
                  em=(0.00, 0.18, 0.42), ems=1.6)
M_CYAN    = mkmat('cyan',    (0.00, 0.11, 0.20), metal=0.14, rough=0.18,
                  em=(0.00, 0.65, 1.00), ems=8.0)
M_ORANGE  = mkmat('orange',  (0.10, 0.06, 0.02), metal=0.90, rough=0.14,
                  em=(1.00, 0.22, 0.00), ems=5.0)
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
# Lofted elliptical cross-sections: X+ = nose, X- = tail
# All sections 12-sided except tips (nose=pt, tail=pt) and transition zones (8-sided)

FUSE_STA = [
    # (  x,     ry,     rz,   cy,   cz,  n)
    #  ry=Y half-width  rz=Z half-height  cy=Y center  cz=Z center
    ( 3.40,  0.000,  0.000, 0.00, 0.06,  1),   # nose tip  → single vert
    ( 3.26,  0.026,  0.016, 0.00, 0.06,  8),
    ( 3.06,  0.068,  0.042, 0.00, 0.07,  8),
    ( 2.78,  0.138,  0.082, 0.00, 0.08, 12),   # 8→12 transition here
    ( 2.44,  0.212,  0.122, 0.00, 0.08, 12),
    ( 2.06,  0.280,  0.156, 0.00, 0.07, 12),
    ( 1.68,  0.332,  0.176, 0.00, 0.06, 12),   # canopy zone
    ( 1.30,  0.360,  0.186, 0.00, 0.05, 12),
    ( 0.94,  0.378,  0.190, 0.00, 0.05, 12),
    ( 0.58,  0.388,  0.188, 0.00, 0.05, 12),
    ( 0.22,  0.394,  0.185, 0.00, 0.05, 12),
    (-0.18,  0.398,  0.183, 0.00, 0.05, 12),   # wing attachment zone
    (-0.58,  0.402,  0.184, 0.00, 0.05, 12),
    (-0.98,  0.408,  0.188, 0.00, 0.05, 12),
    (-1.38,  0.416,  0.194, 0.00, 0.05, 12),
    (-1.76,  0.420,  0.198, 0.00, 0.05, 12),   # engine bays — widest
    (-2.10,  0.412,  0.192, 0.00, 0.05, 12),
    (-2.42,  0.372,  0.172, 0.00, 0.04, 12),
    (-2.70,  0.306,  0.144, 0.00, 0.04, 12),
    (-2.94,  0.226,  0.108, 0.00, 0.03, 12),
    (-3.14,  0.142,  0.070, 0.00, 0.02,  8),   # 12→8 transition here
    (-3.30,  0.074,  0.036, 0.00, 0.01,  8),
    (-3.40,  0.000,  0.000, 0.00, 0.00,  1),   # tail tip → single vert
]


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

    N_SPAN  = 9   # spanwise sections (root → tip)
    N_CHORD = 7   # chordwise sections (LE → TE)

    # Span stations: (x_LE, x_TE, y_pos, thickness_root_fraction)
    # y_pos: half-span at that station
    SPAN = [
        # x_LE    x_TE    y       thick
        ( 0.94,  -0.88,  0.40,  0.130),   # root (butts against fuselage)
        ( 0.52,  -1.18,  0.74,  0.112),
        ( 0.06,  -1.50,  1.12,  0.092),
        (-0.40,  -1.82,  1.52,  0.074),
        (-0.84,  -2.10,  1.90,  0.058),
        (-1.22,  -2.30,  2.18,  0.044),
        (-1.52,  -2.44,  2.36,  0.032),
        (-1.72,  -2.54,  2.46,  0.022),   # wingtip station
        (-1.82,  -2.58,  2.50,  0.016),   # tip
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

    CANT   = 0.50   # Y/Z ratio — outward lean per unit of height
    N_HGT  = 7     # height sections (root → tip)
    N_CHOR = 5     # chordwise sections (LE → TE)

    # Height stations: (x_LE, x_TE, z_local, thickness)
    # z_local: height above fuselage top (0 = root)
    FIN_STA = [
        # x_LE    x_TE    z_loc  thick
        (-2.28,  -3.26,  0.00,  0.068),   # root
        (-2.40,  -3.26,  0.12,  0.062),
        (-2.54,  -3.26,  0.26,  0.054),
        (-2.66,  -3.26,  0.40,  0.044),
        (-2.76,  -3.26,  0.52,  0.034),
        (-2.84,  -3.26,  0.62,  0.024),
        (-2.90,  -3.26,  0.68,  0.014),   # tip
    ]

    def half_fin(side):
        s = side   # +1 or -1

        # Fuselage top Z at root X position (approx)
        fuse_top = 0.24  # conservative estimate

        top_rows = []
        bot_rows = []

        for (x_le, x_te, z_loc, thick) in FIN_STA:
            chord = x_le - x_te
            base_y = s * (0.30 + z_loc * CANT)
            z_abs = fuse_top + z_loc

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

    # Approximate fuselage top Z at given X (linear interpolation of FUSE_STA)
    def fuse_top(x):
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
        return 0.19

    # Canopy stations: (x, Y half-width, Z height above fuselage top)
    CAN_STA = [
        ( 2.28, 0.000, 0.000),   # nose tip
        ( 2.12, 0.048, 0.018),
        ( 1.88, 0.092, 0.060),
        ( 1.60, 0.132, 0.104),
        ( 1.28, 0.155, 0.132),
        ( 0.96, 0.164, 0.144),
        ( 0.66, 0.160, 0.136),
        ( 0.38, 0.144, 0.110),
        ( 0.12, 0.118, 0.076),
        (-0.10, 0.084, 0.044),
        (-0.26, 0.046, 0.016),
        (-0.36, 0.000, 0.000),   # tail end
    ]

    N_ARC = 8  # points in upper arc per station

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
    return ob


# ── ENGINE NOZZLES ───────────────────────────────────────────────────────────
# Two circular nozzles at tail (X-), slight Y offset. Glow orange.

def build_nozzles():
    bm = bmesh.new()
    N_NOZ = 14

    def make_nozzle(y_ctr):
        R_FRONT = 0.118
        R_REAR  = 0.096
        Z_CTR   = 0.048

        pts_f = ellipse_pts(N_NOZ, R_FRONT, R_FRONT * 0.82, y_ctr, Z_CTR)
        pts_r = ellipse_pts(N_NOZ, R_REAR,  R_REAR  * 0.72, y_ctr, Z_CTR)

        r_f = add_ring(bm, -2.96, pts_f)
        r_r = add_ring(bm, -3.40, pts_r)

        close_strip(bm, r_f, r_r)

        # Rear disc
        cv = bm.verts.new((-3.40, y_ctr, Z_CTR))
        fan_tip(bm, cv, r_r)

    make_nozzle(+0.220)
    make_nozzle(-0.220)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    me = bpy.data.meshes.new('noz_me')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True

    ob = bpy.data.objects.new('Nozzles', me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(M_ORANGE)
    print(f'[VAN] Nozzles: {len(me.vertices)}v {len(me.polygons)}f')
    return ob


# ── AIR INTAKES ──────────────────────────────────────────────────────────────
# DSI-style side intakes below fuselage mid-line.

def build_intakes():
    bm = bmesh.new()

    # Intake lip cross-section: 6-point trapezoidal shape
    # Two intakes, mirrored in Y

    def make_intake(side):
        s  = side
        CY = s * 0.400   # Y center
        CZ = -0.035      # Z center (below mid-line)
        W  = 0.190       # half-width
        H  = 0.130       # half-height

        # 6-point lip profile (outer shape of intake duct)
        def duct_pts(x, scale=1.0):
            w = W * scale
            h = H * scale
            return [
                (CY,          CZ + h),          # top center
                (CY + s*w,    CZ + h*0.55),      # top outer
                (CY + s*w,    CZ - h*0.50),      # bot outer
                (CY,          CZ - h),           # bot center
                (CY - s*w*0.3, CZ - h*0.50),     # bot inner
                (CY - s*w*0.3, CZ + h*0.55),     # top inner
            ]

        lip_x  = 0.64
        duct_x = -0.28

        lip_ring  = add_ring(bm, lip_x,  duct_pts(lip_x))
        duct_ring = add_ring(bm, duct_x, duct_pts(duct_x, scale=0.82))

        bm.verts.ensure_lookup_table()
        close_strip(bm, lip_ring, duct_ring)

        # Outer lip frame (thin band around opening)
        outer_pts = duct_pts(lip_x, scale=1.06)
        outer_ring = add_ring(bm, lip_x + 0.025, outer_pts)
        close_strip(bm, lip_ring, outer_ring)

        # Close duct exit
        exit_cv = bm.verts.new((duct_x, CY, CZ))
        fan_tip(bm, exit_cv, duct_ring)

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

ob_fuse    = build_fuselage()
ob_wings   = build_wings()
ob_fins    = build_fins()
ob_canopy  = build_canopy()
ob_nozzles = build_nozzles()
ob_intakes = build_intakes()
ob_accents = build_le_accents()

print(f'[VAN] Geometry built in {time.time()-t_geom:.1f}s')

# ── APPLY BEVEL MODIFIERS ────────────────────────────────────────────────────
# Micro-bevel sharpens silhouette edges.

for ob in [ob_fuse, ob_wings, ob_fins, ob_canopy, ob_nozzles, ob_intakes]:
    bev = ob.modifiers.new('Bevel', 'BEVEL')
    bev.width = 0.016
    bev.segments = 2
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(38)
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
setup_camera(3.5)
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
