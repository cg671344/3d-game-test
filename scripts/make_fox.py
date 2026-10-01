"""Original Windbell Woods character. Run: blender -b --python scripts/make_fox.py"""
import bpy, math, os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1); m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.82; return m
orange=mat('Apricot fur',(.78,.26,.075)); cream=mat('Warm ivory',(.99,.86,.63)); brown=mat('Cocoa paws',(.16,.065,.043)); black=mat('Obsidian eyes',(.027,.025,.023)); pink=mat('Soft inner ear',(.57,.22,.16)); scarf=mat('Sage bandana',(.19,.40,.32))
def group(name,loc=(0,0,0)):
 o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=loc; return o
root=group('Fox')
def ell(name,loc,scale,material,parent=root):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=loc); o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 o.parent=parent; return o
# Blender Z is up; face towards -Y (glTF +Z).
ell('Body',(0,.09,.81),(.36,.58,.40),orange)
ell('Chest',(0,-.32,.85),(.30,.20,.32),cream)
head=group('Head',(0,-.45,1.16)); head.parent=root
ell('Cheek fur',(0,0,0),(.43,.32,.34),orange,head)
ell('Left cheek',(-.22,-.19,-.13),(.25,.18,.17),cream,head); ell('Right cheek',(.22,-.19,-.13),(.25,.18,.17),cream,head)
ell('Muzzle',(0,-.30,-.08),(.23,.25,.14),cream,head); ell('Nose',(0,-.52,-.045),(.093,.064,.063),black,head)
for side in [-1,1]:
 ell('Eye',(.235*side,-.273,.057),(.069,.041,.092),black,head); ell('Eye sparkle',(.22*side,-.309,.087),(.022,.012,.027),cream,head)
 # Rounded custom tapered ears with subdivision, not primitive cones.
 verts=[(side*.17,-.06,.17),(side*.43,.015,.17),(side*.33,.015,.65),(side*.18,.10,.17),(side*.42,.13,.17),(side*.33,.07,.62)]
 mesh=bpy.data.meshes.new('Ear mesh');mesh.from_pydata(verts,[],[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)]);mesh.update()
 o=bpy.data.objects.new('Sculpted ear',mesh);bpy.context.collection.objects.link(o);o.parent=head;o.data.materials.append(orange)
 bevel=o.modifiers.new('Soft edges','BEVEL');bevel.width=.055;bevel.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 ell('Inner ear',(side*.303,-.043,.345),(.066,.025,.16),pink,head)
for name,x,y in [('LegFL',-.25,-.30),('LegFR',.25,-.30),('LegBL',-.25,.43),('LegBR',.25,.43)]:
 g=group(name,(x,y,.72));g.parent=root
 ell('Leg',(0,0,-.22),(.12,.135,.27),orange,g);ell('Sock',(0,-.022,-.43),(.118,.148,.15),brown,g);ell('Paw',(0,-.077,-.53),(.135,.18,.09),brown,g)
tail=group('Tail',(0,.48,.80));tail.parent=root
# Continuous curved tail, ivory at its tip.
vs=[]; fs=[]; rings=22; sides=16
for i in range(rings):
 t=i/(rings-1); center=Vector((.15*math.sin(t*2),t*1.10,.12*math.sin(t*3)+t*.30));radius=.015+.27*(math.sin(math.pi*t)**.7)
 for j in range(sides):
  a=j*math.tau/sides;vs.append(tuple(center+Vector((math.cos(a)*radius,0,math.sin(a)*radius))))
for i in range(rings-1):
 for j in range(sides):fs.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
mesh=bpy.data.meshes.new('Flowing tail');mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new('Tail fur',mesh);bpy.context.collection.objects.link(o);o.parent=tail;o.data.materials.append(orange);o.data.materials.append(cream)
for p in mesh.polygons:p.use_smooth=True;p.material_index=1 if p.index//sides>13 else 0
sub=o.modifiers.new('Silhouette smoothing','SUBSURF');sub.levels=1
ell('Bandana',(0,-.325,1.01),(.32,.13,.17),scarf)
ell('Bandana knot',(.30,-.27,1.04),(.10,.12,.10),scarf)
os.makedirs('public/models',exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/fox.glb'),export_format='GLB')
