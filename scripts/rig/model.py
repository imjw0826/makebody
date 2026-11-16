"""One persistent, skinned CC0 human; no image morphing or per-frame generation."""
import json, math
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector, Matrix

ASSETS = Path(__file__).parent / 'assets'
V = Vector

def material(name, color, roughness=.65):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    return m

def cube(name, location, scale, mat, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=3
        o.modifiers.new('Normals','WEIGHTED_NORMAL')
    return o

def sphere(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=location)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def rod(name, a, b, radius, mat):
    a,b=V(a),V(b);d=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=d.length, location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_mode='QUATERNION';o.rotation_quaternion=d.to_track_quat('Z','Y');o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def move_rod(o,a,b):
    a,b=V(a),V(b);d=b-a
    o.location=(a+b)/2;o.rotation_quaternion=d.to_track_quat('Z','Y');o.scale.z=d.length/o.data['length']

def frame(a,b,up=(0,-1,0)):
    """Bone Y axis points from a to b; fixed pole prevents axial flipping."""
    y=(V(b)-V(a)).normalized();x=V(up).cross(y).normalized()
    if x.length<.1:x=V((1,0,0))
    z=x.cross(y).normalized()
    return Matrix(((x.x,y.x,z.x,a[0]),(x.y,y.y,z.y,a[1]),(x.z,y.z,z.z,a[2]),(0,0,0,1)))

def ik(a, target, l1, l2, pole):
    a,t=V(a),V(target);d=t-a;dist=min(d.length,l1+l2-1e-5)
    u=d.normalized();p=V(pole)-a;p=(p-u*p.dot(u)).normalized()
    along=(l1*l1-l2*l2+dist*dist)/(2*dist)
    elbow=a+u*along+p*math.sqrt(max(0,l1*l1-along*along))
    return elbow,a+u*dist

class Human:
    def __init__(self, primary, secondary):
        raw=[];faces=[];group=''
        for line in (ASSETS/'base.obj').read_text().splitlines():
            a=line.split()
            if not a:continue
            if a[0]=='v':raw.append(list(map(float,a[1:4])))
            elif a[0]=='g':group=a[1]
            elif a[0]=='f' and group=='body':faces.append([int(s.split('/')[0])-1 for s in a[1:]])
        raw=np.array(raw)
        for target in ['male.target','muscle.target']:
            for line in (ASSETS/target).read_text().splitlines():
                a=line.split()
                if a and not a[0].startswith('#'):raw[int(a[0])]+=np.array(list(map(float,a[1:4])))
        # MakeHuman is Y-up, decimetres; use metres, Z-up, looking toward -Y.
        verts=raw[:,[0,2,1]]/10;verts[:,1]*=-1
        floor=verts[:13380,2].min();verts[:,2]-=floor
        # Flatten the neutral chest into a broad pectoral plane, once in rest pose.
        for co in verts:
            x,y,z=co
            if y<-.04 and 1.32<z<1.49 and abs(x)<.16:
                amount=max(0,1-((z-1.405)/.085)**2)*max(0,1-(x/.17)**4)
                co[1]=y*.35+(-.108)*.65*amount+y*.65*(1-amount)
        sk=json.loads((ASSETS/'default.mhskel').read_text())
        def joint(b,end):return V(np.mean(verts[sk['joints'][sk['bones'][b][end]]],axis=0))
        self.rest={};self.rest['torso']=(joint('spine05','head'),joint('neck01','head'))
        self.rest['pelvis']=(joint('spine05','head'),joint('spine04','tail'))
        self.rest['head']=(joint('head','head'),joint('head','tail'))
        for s in ['L','R']:
            self.rest['upperarm.'+s]=(joint('upperarm01.'+s,'head'),joint('lowerarm01.'+s,'head'))
            self.rest['forearm.'+s]=(joint('lowerarm01.'+s,'head'),joint('wrist.'+s,'head'))
            self.rest['thigh.'+s]=(joint('upperleg01.'+s,'head'),joint('lowerleg01.'+s,'head'))
            self.rest['shin.'+s]=(joint('lowerleg01.'+s,'head'),joint('foot.'+s,'head'))
            self.rest['foot.'+s]=(joint('foot.'+s,'head'),joint('foot.'+s,'tail'))
        self.hip=V(self.rest['torso'][0]);self.lengths={n:(b-a).length for n,(a,b) in self.rest.items()}
        weights=json.loads((ASSETS/'default_weights.mhw').read_text())['weights']
        def mapped(n):
            s=n[-2:]
            if n.startswith('upperarm'):return 'upperarm'+s
            if n.startswith('lowerarm'):return 'forearm'+s
            if n.startswith('upperleg'):return 'thigh'+s
            if n.startswith('lowerleg'):return 'shin'+s
            if n.startswith(('foot','toe')):return 'foot'+s
            if n.startswith(('wrist','finger','metacarpal')):return 'forearm'+s
            if n.startswith(('head','neck','special','jaw','eye','tongue')):return 'head'
            if n.startswith(('root','pelvis','spine05','spine04')):return 'pelvis'
            return 'torso'
        W=np.zeros((len(verts),len(self.rest)),dtype=np.float32);names=list(self.rest)
        for bone,items in weights.items():
            j=names.index(mapped(bone))
            for i,w in items:W[i,j]+=w
        total=W.sum(axis=1);total[total==0]=1;W/=total[:,None]
        # Replace spread fingers with closed grips, integrated at the wrists.
        hand=np.zeros(len(verts),bool)
        for bone,items in weights.items():
            if bone.startswith(('finger','metacarpal','wrist')):
                for i,w in items:
                    if w>.35:hand[i]=True
        faces=[f for f in faces if not any(hand[i] for i in f)]
        mesh=bpy.data.meshes.new('single-anatomical-mesh');mesh.from_pydata(verts.tolist(),[],faces);mesh.update()
        self.body=bpy.data.objects.new('Anatomical human',mesh);bpy.context.collection.objects.link(self.body)
        skin=material('Graphite anatomy',(.53,.55,.57));red=material('Working muscle',(.68,.07,.055));pink=material('Supporting muscle',(.72,.30,.25));shorts=material('Training shorts',(.065,.075,.085))
        for m in [skin,red,pink,shorts]:mesh.materials.append(m)
        colors=mesh.color_attributes.new(name='Anatomy',type='FLOAT_COLOR',domain='CORNER')
        def fade(a,b,x):
            t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
        def muscle_mask(name,co,weights):
            x,y,z=co;ax=abs(x)
            arm=sum(weights[names.index('upperarm.'+s)] for s in ['L','R'])
            thigh=sum(weights[names.index('thigh.'+s)] for s in ['L','R'])
            shin=sum(weights[names.index('shin.'+s)] for s in ['L','R'])
            front=1-fade(-.025,.025,y)
            if name=='chest':return max(0,1-(((ax-.083)/.105)**4+((z-1.405)/.092)**4))*front
            if name=='shoulders':return max(0,1-((ax-.193)/.088)**4-((z-1.41)/.087)**4)
            if name=='biceps':return arm*front*fade(1.08,1.16,z)*(1-fade(1.34,1.39,z))
            if name=='triceps':return arm*(1-front)*fade(1.08,1.16,z)*(1-fade(1.35,1.4,z))
            if name=='quads':return thigh*front*fade(.51,.59,z)*(1-fade(.84,.94,z))
            if name=='hamstrings':return thigh*(1-front)*fade(.52,.59,z)*(1-fade(.85,.94,z))
            if name=='calves':return shin*(1-front)*fade(.14,.22,z)*(1-fade(.43,.51,z))
            if name=='abs':return (1-fade(.07,.105,ax))*front*fade(1.05,1.12,z)*(1-fade(1.30,1.35,z))
            if name=='back':return (1-front)*(1-fade(.16,.22,ax))*fade(1.08,1.15,z)*(1-fade(1.44,1.5,z))
            if name=='glutes':return (1-front)*fade(.84,.9,z)*(1-fade(1.02,1.07,z))
            return 0
        painted=[]
        for i,co in enumerate(verts):
            m=max([muscle_mask(n,co,W[i]) for n in primary] or [0]);support=max([muscle_mask(n,co,W[i]) for n in secondary] or [0])*.45
            t=max(m,support);base=np.array([.53,.55,.57]);target=np.array([.72,.075,.055])
            # A fixed central tendon line and subtle fixed fiber lines, never animated.
            t*=.88+.12*math.cos(co[2]*380+abs(co[0])*30)**2
            painted.append(tuple(base*(1-t)+target*t)+(1,))
        for p in mesh.polygons:
            co=np.mean(verts[list(p.vertices)],axis=0);x,y,z=co;ax=abs(x)
            region=None
            influences=W[list(p.vertices)].mean(axis=0);dominant=names[int(influences.argmax())]
            if dominant.startswith('upperarm'):region='biceps' if y<-.02 else 'triceps'
            elif dominant.startswith('thigh'):region='quads' if y<0 else 'hamstrings'
            elif dominant.startswith('shin'):region='calves' if y>-.015 else None
            elif dominant=='torso':
                if z>1.34 and ax>.14:region='shoulders' if ax>.19 and z>1.38 else ('chest' if y<-.02 else 'back')
                elif 1.25<z<1.53:region='chest' if y<-.015 and z>1.33 else ('back' if y>.02 else 'abs')
                elif 1.02<z<1.34:region='abs' if y<-.015 else 'back'
                elif .86<z<1.02:region='glutes' if y>.015 else None
            # Rounded anatomical regions; preserve a grey tendon zone at joints.
            p.material_index=0
            if .79<z<1.035 and ax<.23:p.material_index=3
            for li in p.loop_indices:
                vi=mesh.loops[li].vertex_index
                if p.material_index==3:
                    gm=muscle_mask('glutes',verts[vi],W[vi]) if 'glutes' in primary else 0
                    colors.data[li].color=tuple(np.array([.065,.075,.085])*(1-gm*.85)+np.array([.65,.065,.045])*gm*.85)+(1,)
                else:colors.data[li].color=painted[vi]
            p.use_smooth=True
        arm=bpy.data.armatures.new('Fixed proportions');self.rig=bpy.data.objects.new('Human rig',arm);bpy.context.collection.objects.link(self.rig)
        bpy.context.view_layer.objects.active=self.rig;self.rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
        for name,(a,b) in self.rest.items():
            bone=arm.edit_bones.new(name);bone.head=a;bone.tail=b
        bpy.ops.object.mode_set(mode='OBJECT');self.rig.select_set(False)
        for j,name in enumerate(names):
            group=self.body.vertex_groups.new(name=name)
            for i in np.nonzero(W[:,j]>.0001)[0]:group.add([int(i)],float(W[i,j]),'REPLACE')
        mod=self.body.modifiers.new('Stable skin weights','ARMATURE');mod.object=self.rig;mod.use_deform_preserve_volume=True
        sub=self.body.modifiers.new('Continuous surface','SUBSURF');sub.levels=1;sub.render_levels=1
        self.grips={s:sphere('Closed grip '+s,(0,0,0),(.037,.047,.055),skin) for s in ['L','R']}
        self.eyes=[]
        for s in ['L','R']:
            a=joint('eye.'+s,'head');o=sphere('Eye '+s,a,(.011,.011,.011),material('Eye white '+s,(.78,.79,.8)))
            self.eyes.append((o,a))
        self.restmat={n:self.rig.data.bones[n].matrix_local.copy() for n in names}
        self.skin=skin
        self.poles={}

    def choose_poles(self, poses):
        """Choose ONE fixed roll reference per segment for the whole loop.

        A fixed world axis can become parallel to a moving forearm and flip its
        roll by 180 degrees. Maximise clearance from every segment direction,
        including the rest pose; do not change the reference between frames.
        """
        candidates=[]
        for k in range(96):
            z=1-2*(k+.5)/96;a=k*math.pi*(3-math.sqrt(5));r=math.sqrt(1-z*z)
            candidates.append((r*math.cos(a),r*math.sin(a),z))
        candidates=np.array(candidates+[(1,0,0),(0,1,0),(0,0,1)])
        for s in ['L','R']:
            for bone,a,b in [('upperarm','shoulder','elbow'),('forearm','elbow','hand'),('thigh','hip','knee'),('shin','knee','ankle')]:
                name=bone+'.'+s
                directions=[np.array(p[s][b])-p[s][a] for p in poses]+[np.array(self.rest[name][1]-self.rest[name][0])]
                directions=np.array(directions);directions/=np.linalg.norm(directions,axis=1)[:,None]
                clearance=(1-(candidates@directions.T)**2).min(axis=1)
                self.poles[name]=V(candidates[int(clearance.argmax())])

    def pose(self, root, tilt=0, roll=0, hands=None, feet=None, elbows=None, knees=None, arms=None, legs=None, foot_pitch=0, twist=0, arm_plane='x', shoulder_lift=0):
        if abs(roll-math.pi)<.01:
            def swap(values):return {'L':values['R'],'R':values['L']} if values and 'L' in values and 'R' in values else values
            hands,feet,elbows,knees,arms,legs=map(swap,[hands,feet,elbows,knees,arms,legs])
        R=Matrix.Rotation(tilt,4,'X')@Matrix.Rotation(roll,4,'Z');T=Matrix.Translation(V(root))@R@Matrix.Translation(-self.hip)
        upper_matrix=Matrix.Translation(V(root))@R@Matrix.Rotation(twist,4,'Z')@Matrix.Translation(-self.hip)
        def transform(p):return T@V(p)
        transforms={'torso':upper_matrix,'pelvis':T,'head':upper_matrix};joints={}
        for s,sign in [('L',1),('R',-1)]:
            shoulder=upper_matrix@self.rest['upperarm.'+s][0];hip=transform(self.rest['thigh.'+s][0])
            shoulder.z+=shoulder_lift
            if arms and s in arms:
                upper,lower=arms[s];elbow=shoulder+V(upper).normalized()*self.lengths['upperarm.'+s];hand=elbow+V(lower).normalized()*self.lengths['forearm.'+s]
            else:
                target=hands[s] if hands else shoulder+V((sign*.03,0,-.51))
                elbow,hand=ik(shoulder,target,self.lengths['upperarm.'+s],self.lengths['forearm.'+s],(elbows or {}).get(s,shoulder+V((sign*.4,.15,-.15))))
            if legs and s in legs:
                upper,lower=legs[s];knee=hip+V(upper).normalized()*self.lengths['thigh.'+s];ankle=knee+V(lower).normalized()*self.lengths['shin.'+s]
            else:
                target=feet[s] if feet else (sign*.12,0,.085)
                knee,ankle=ik(hip,target,self.lengths['thigh.'+s],self.lengths['shin.'+s],(knees or {}).get(s,hip+V((0,-1,.5))))
            for n,a,b in [('upperarm',shoulder,elbow),('forearm',elbow,hand),('thigh',hip,knee),('shin',knee,ankle)]:
                name=n+'.'+s;ra,rb=self.rest[name]
                # Rotation maps the rest segment to the new segment without stretch.
                pole=(0,-1,0) if n in ['upperarm','forearm'] and arm_plane=='y' else (sign,0,0)
                pole=self.poles.get(name,pole)
                transforms[name]=frame(a,b,pole)@frame(ra,rb,pole).inverted()
            name='foot.'+s;transforms[name]=transforms['shin.'+s] if legs else Matrix.Translation(ankle-self.rest[name][0])
            if foot_pitch:transforms[name]=Matrix.Translation(ankle)@Matrix.Rotation(foot_pitch,4,'X')@Matrix.Translation(-self.rest[name][0])
            self.grips[s].location=hand;self.grips[s].rotation_mode='QUATERNION';self.grips[s].rotation_quaternion=(hand-elbow).to_track_quat('Z','Y')
            joints[s]={'shoulder':shoulder,'elbow':elbow,'hand':hand,'hip':hip,'knee':knee,'ankle':ankle}
        for n,Tn in transforms.items():self.rig.pose.bones[n].matrix=Tn@self.restmat[n]
        for o,p in self.eyes:o.location=upper_matrix@p
        bpy.context.view_layer.update()
        return joints

def setup(size=480):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH'
    scene.render.resolution_x=size;scene.render.resolution_y=size;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    scene.world.color=(1,1,1)
    shading=scene.display.shading;shading.light='STUDIO';shading.studiolight_rotate_z=.5;shading.color_type='VERTEX'
    shading.show_shadows=True;shading.show_cavity=True;shading.cavity_type='BOTH';shading.curvature_ridge_factor=1.3;shading.curvature_valley_factor=1.1
    shading.show_specular_highlight=True;shading.background_type='WORLD';shading.show_object_outline=True;shading.object_outline_color=(.22,.24,.26)
    scene.display.render_aa='16';scene.view_settings.view_transform='Standard'
    bpy.ops.object.camera_add(location=(3,-5,2.5));cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=2.35
    aim(cam,(0,0,.95));return scene,cam

def aim(cam,target):cam.rotation_euler=(V(target)-cam.location).to_track_quat('-Z','Y').to_euler()
