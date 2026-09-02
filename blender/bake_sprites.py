import bpy, os, math, sys
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODELS = os.path.join(ROOT, 'models')
OUT = os.path.join(ROOT, 'baked')
os.makedirs(OUT, exist_ok=True)

ALL_SHIPS = ['vanguard','striker','controller','scout','dasher','hunter',
             'assault','elite','tank','weaver','orbiter','boss']

# --- CLI args (passed after Blender's own -- separator) ---
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []

TEST_MODE  = '--test'  in argv   # render only vanguard_00
FORCE_EEVEE = '--eevee' in argv

# --ships vanguard,striker,controller
if '--ships' in argv:
    idx = argv.index('--ships')
    SHIP_LIST = argv[idx + 1].split(',')
else:
    SHIP_LIST = ['vanguard'] if TEST_MODE else ALL_SHIPS

SIZE = 2048  # MASTER resolution — never changes

print(f'[NORVYX] mode={"TEST" if TEST_MODE else "BAKE"} '
      f'engine={"EEVEE_NEXT" if FORCE_EEVEE else "CYCLES/CPU"} '
      f'size={SIZE} ships={SHIP_LIST}')


# ---------- scene helpers ----------

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(
        do_local_ids=True, do_linked_ids=True, do_recursive=True)


def mat(name, base, metallic=0.0, rough=0.4, emission=None, estrength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if not bs:
        bs = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    bs.inputs['Base Color'].default_value = (*base, 1)
    bs.inputs['Metallic'].default_value = metallic
    bs.inputs['Roughness'].default_value = rough
    if emission:
        bs.inputs['Emission Color'].default_value = (*emission, 1)
        bs.inputs['Emission Strength'].default_value = estrength
    return m


def import_obj(path):
    bpy.ops.wm.obj_import(filepath=path)
    objs = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    root = bpy.data.objects.new(
        os.path.basename(path).split('.')[0] + '_ROOT', None)
    bpy.context.collection.objects.link(root)
    for o in objs:
        o.parent = root

    # Center ship geometry at world origin so ortho camera frames it correctly.
    # OBJ exporters often don't center geometry; without this, ships fall outside
    # the ortho frustum when ortho_scale is tightened.
    coords = []
    for o in objs:
        mw = o.matrix_world
        coords.extend(mw @ v.co for v in o.data.vertices)
    if coords:
        xs = [c[0] for c in coords]
        ys = [c[1] for c in coords]
        zs = [c[2] for c in coords]
        cx = (min(xs) + max(xs)) / 2.0
        cy = (min(ys) + max(ys)) / 2.0
        cz = (min(zs) + max(zs)) / 2.0
        root.location = (-cx, -cy, -cz)
        bpy.context.view_layer.update()
        print(f'[NORVYX] centered ship: offset=({-cx:.2f},{-cy:.2f},{-cz:.2f})')

    return root, objs


def add_bevel(objs):
    for o in objs:
        if o.type != 'MESH':
            continue
        bev = o.modifiers.new('MicroBevel', 'BEVEL')
        bev.width = 0.025
        bev.segments = 3
        try:
            o.modifiers.new('WeightedNormals', 'WEIGHTED_NORMAL')
        except Exception:
            pass


def setup_world():
    w = bpy.context.scene.world
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.003, 0.006, 0.015, 1)
    bg.inputs['Strength'].default_value = 0.08


def setup_camera():
    bpy.ops.object.camera_add(location=(8.5, -0.1, 7.5))
    cam = bpy.context.object
    cam.name = 'SpriteCamera'
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 3.5
    direction = Vector((0, 0, 0)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    return cam


def light(name, loc, energy, color, size=5):
    bpy.ops.object.light_add(type='AREA', location=loc)
    l = bpy.context.object
    l.name = name
    l.data.energy = energy
    l.data.color = color
    l.data.shape = 'DISK'
    l.data.size = size
    return l


def setup_lights():
    light('Key',         ( 5, -5,  8),  950,  (0.55, 0.75, 1.0), 5)
    light('RimBlue',    (-4,  4,  5),  1150, (0.0,  0.45, 1.0), 4)
    light('RimMagenta', (-2, -4,  3),   900, (1.0,  0.03, 0.35), 4)
    light('Top',         ( 0,  0, 10),  500,  (0.35, 0.5,  1.0), 3)


def assign_render_materials():
    mats = {
        'armor':   mat('NVX_Armor',   (0.38, 0.43, 0.50), 0.86, 0.28),
        'dark':    mat('NVX_Dark',    (0.060, 0.075, 0.100), 0.78, 0.24),
        'carbon':  mat('NVX_Carbon',  (0.090, 0.100, 0.130), 0.55, 0.34),
        'cyan':    mat('NVX_Cyan',    (0.005, 0.15, 0.22), 0.15, 0.22,
                       (0.0, 0.65, 1.0), 8.0),
        'red':     mat('NVX_Red',     (0.28, 0.01, 0.015), 0.2, 0.25,
                       (1.0, 0.01, 0.01), 7.0),
        'magenta': mat('NVX_Magenta', (0.28, 0.01, 0.12), 0.2, 0.25,
                       (1.0, 0.01, 0.35), 7.0),
        'orange':  mat('NVX_Orange',  (0.3, 0.04, 0.005), 0.2, 0.25,
                       (1.0, 0.08, 0.01), 8.0),
        'glass':   mat('NVX_Glass',   (0.015, 0.06, 0.10), 0.2, 0.12,
                       (0.0, 0.18, 0.35), 1.5),
    }
    for o in bpy.context.scene.objects:
        if o.type != 'MESH':
            continue
        for slot in o.material_slots:
            old = slot.material.name.lower() if slot.material else ''
            for k, v in mats.items():
                if k in old:
                    slot.material = v
                    break


def configure_render_engine(scene):
    if FORCE_EEVEE:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
        scene.eevee.taa_render_samples = 64
    else:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'

        # Adaptive sampling: base 128, stops early when noise < threshold
        scene.cycles.samples = 128
        scene.cycles.use_adaptive_sampling = True
        scene.cycles.adaptive_threshold = 0.02
        scene.cycles.adaptive_min_samples = 16

        # Reduce light bounces — metallic/emissive ships don't need deep GI
        scene.cycles.max_bounces = 4
        scene.cycles.diffuse_bounces = 2
        scene.cycles.glossy_bounces = 3
        scene.cycles.transmission_bounces = 2
        scene.cycles.shadow_bounces = 1
        scene.cycles.volume_bounces = 0

        # OIDN denoiser (CPU, no GPU required)
        scene.cycles.use_denoising = True
        scene.cycles.denoiser = 'OPENIMAGEDENOISE'

        # Reuse BVH/shader cache across frames in the same session
        scene.render.use_persistent_data = True

    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'


# ---------- main render loop ----------
# Import each ship ONCE, render all 8 angles, then clear.
# use_persistent_data reuses BVH between angle renders → ~40% faster.

import time

for ship in SHIP_LIST:
    obj_path = os.path.join(MODELS, ship + '.obj')
    if not os.path.exists(obj_path):
        print(f'[NORVYX] WARNING: {ship}.obj not found — skipping')
        continue

    clear()
    setup_world()
    setup_camera()
    setup_lights()
    root, objs = import_obj(obj_path)
    add_bevel(objs)
    assign_render_materials()

    scene = bpy.context.scene
    configure_render_engine(scene)

    angles = [0] if TEST_MODE else range(8)
    for i in angles:
        root.rotation_euler[2] = math.radians(i * 15.0)
        scene.render.filepath = os.path.join(OUT, f'{ship}_{i:02d}.png')
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        elapsed = time.time() - t0
        print(f'[NORVYX] {ship}_{i:02d}.png — {elapsed:.1f}s')

    print(f'[NORVYX] {ship}: {"test frame" if TEST_MODE else "8 frames"} done')

print(f'[NORVYX] Bake complete → {OUT}')
