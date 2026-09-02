import bpy, os, math, sys
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODELS = os.path.join(ROOT, 'models')
OUT = os.path.join(ROOT, 'baked')
os.makedirs(OUT, exist_ok=True)

SHIP_ORDER = ['vanguard','striker','controller','scout','dasher','hunter',
              'assault','elite','tank','weaver','orbiter','boss']

quick = '--quick' in sys.argv
size = 1024 if quick else 2048

# Detect CI/headless: prefer CYCLES (no display needed) unless EEVEE forced
FORCE_EEVEE = '--eevee' in sys.argv
USE_CYCLES = not FORCE_EEVEE


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def mat(name, base, metallic=0.0, rough=0.4, emission=None, estrength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    bs = nodes.get('Principled BSDF')
    if not bs:
        bs = nodes.new('ShaderNodeBsdfPrincipled')
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
    root = bpy.data.objects.new(os.path.basename(path).split('.')[0] + '_ROOT', None)
    bpy.context.collection.objects.link(root)
    for o in objs:
        o.parent = root
    return root, objs


def add_bevel(objs):
    for o in objs:
        if o.type != 'MESH':
            continue
        bev = o.modifiers.new('Micro bevel', 'BEVEL')
        bev.width = 0.025
        bev.segments = 3
        try:
            o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
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
    cam.data.ortho_scale = 8.6
    target = Vector((0, 0, 0))
    direction = target - cam.location
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
    light('Key',        ( 5, -5,  8), 950,  (0.55, 0.75, 1.0), 5)
    light('RimBlue',   (-4,  4,  5), 1150, (0.0,  0.45, 1.0), 4)
    light('RimMagenta',(-2, -4,  3), 900,  (1.0,  0.03, 0.35), 4)
    light('Top',       ( 0,  0, 10), 500,  (0.35, 0.5,  1.0), 3)


def assign_render_materials():
    mats = {
        'armor':   mat('NVX_Armor',   (0.38, 0.43, 0.50), 0.86, 0.28),
        'dark':    mat('NVX_Dark',    (0.012, 0.018, 0.028), 0.78, 0.24),
        'carbon':  mat('NVX_Carbon',  (0.035, 0.045, 0.06), 0.55, 0.34),
        'cyan':    mat('NVX_Cyan',    (0.005, 0.15, 0.22), 0.15, 0.22, (0.0, 0.65, 1.0), 8.0),
        'red':     mat('NVX_Red',     (0.28, 0.01, 0.015), 0.2, 0.25, (1.0, 0.01, 0.01), 7.0),
        'magenta': mat('NVX_Magenta', (0.28, 0.01, 0.12), 0.2, 0.25, (1.0, 0.01, 0.35), 7.0),
        'orange':  mat('NVX_Orange',  (0.3,  0.04, 0.005), 0.2, 0.25, (1.0, 0.08, 0.01), 8.0),
        'glass':   mat('NVX_Glass',   (0.015, 0.06, 0.10), 0.2, 0.12, (0.0, 0.18, 0.35), 1.5),
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


def configure_render_engine(scene, sz):
    if USE_CYCLES:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 128
        scene.cycles.use_denoising = True
    else:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
        scene.eevee.taa_render_samples = 64

    scene.render.resolution_x = sz
    scene.render.resolution_y = sz
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'


def render_ship(name, angle_index=0, sz=1024):
    clear()
    setup_world()
    setup_camera()
    setup_lights()
    root, objs = import_obj(os.path.join(MODELS, name + '.obj'))
    add_bevel(objs)
    assign_render_materials()
    root.rotation_euler[2] = math.radians(angle_index * 15.0)
    scene = bpy.context.scene
    configure_render_engine(scene, sz)
    scene.render.filepath = os.path.join(OUT, f'{name}_{angle_index:02d}.png')
    bpy.ops.render.render(write_still=True)
    print(f'[NORVYX] Rendered: {name}_{angle_index:02d}.png ({sz}x{sz})')


print(f'[NORVYX] Bake start — engine={"CYCLES/CPU" if USE_CYCLES else "EEVEE_NEXT"} size={size}')
for ship in SHIP_ORDER:
    obj_path = os.path.join(MODELS, ship + '.obj')
    if not os.path.exists(obj_path):
        print(f'[NORVYX] WARNING: {ship}.obj not found, skipping')
        continue
    for i in range(8):
        render_ship(ship, i, size)
    print(f'[NORVYX] {ship}: 8 frames done')

print(f'[NORVYX] Bake complete → {OUT}')
