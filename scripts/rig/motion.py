"""Deterministic joint trajectories. Equipment shares the same grip coordinates."""
import math
from mathutils import Quaternion
from model import V, cube, rod, sphere, move_rod, material, aim

def direction(angle,spread=0):
    a=math.radians(angle);return V((spread,-math.sin(a),-math.cos(a)))

def family(e):
    i=e['id']
    groups={
      'dip':['bench-dip','assisted-chest-dip'],
      'bridge':['glute-bridge','single-leg-glute-bridge','dumbbell-hip-thrust','barbell-hip-thrust'],
      'legcurl':['lying-leg-curl','seated-leg-curl'],
      'legextension':['leg-extension'],
      'legpress':['leg-press','hack-squat'],
      'abduction':['machine-hip-abduction'],
      'kickback':['cable-glute-kickback'],
      'pullover':['dumbbell-pullover','straight-arm-pulldown'],
      'upright':['barbell-upright-row','face-pull'],
      'shrug':['dumbbell-shrug'],
      'hanging':['hanging-leg-raise','hanging-knee-raise'],
      'floorlegs':['lying-leg-raise','reverse-crunch','dead-bug','bicycle-crunch'],
    }
    for k,ids in groups.items():
        if i in ids:return k
    if e['movement']=='press':return 'benchpress' if 'chest' in e['primaryMuscles'] or 'bench-press' in i else 'overhead'
    if e['movement']=='fly':return 'reversefly' if 'reverse' in i else 'fly'
    if e['movement']=='pulldown':return 'pullup' if i in ['chin-up','pull-up','assisted-pull-up'] else 'pulldown'
    if e['movement']=='extension':return 'triceps'
    return e['movement']

def pose(e,t,h):
    i=e['id'];f=family(e);q=(1-math.cos(t*2*math.pi))*.5
    root=V((0,0,.94));tilt=0;hands={};feet={'L':(.13,0,.075),'R':(-.13,0,.075)};elbows={};knees={};arms=None;legs=None
    for s,sgn in [('L',1),('R',-1)]:hands[s]=V((sgn*.22,-.04,.91))
    if f=='squat' or f=='legpress':
        width=.25 if 'sumo' in i else .16
        if i=='wall-sit':q=.8
        root=V((0,.16*q,.94-.31*q));tilt=.22*q
        feet={s:(sgn*width,0,.075) for s,sgn in [('L',1),('R',-1)]}
        for s,sgn in [('L',1),('R',-1)]:hands[s]=V((sgn*.16,-.26,root.z+.29))
        if 'goblet' in i:hands={s:root+V((sgn*.055,-.24,.29)) for s,sgn in [('L',1),('R',-1)]}
        if i=='dumbbell-sumo-squat':hands={s:root+V((sgn*.035,-.16,-.04)) for s,sgn in [('L',1),('R',-1)]}
        if 'back-squat' in i: hands={s:V((sgn*.3,.025,root.z+.41)) for s,sgn in [('L',1),('R',-1)]}
        if f=='legpress':
            if i=='hack-squat':root.y=.15+.12*q;tilt=-.2
            else:
                root=V((0,.28,.47));tilt=-.55
                feet={s:(sgn*.15,-.42+.23*q,.47-.15*q) for s,sgn in [('L',1),('R',-1)]}
                hands={s:(sgn*.24,.22,.51) for s,sgn in [('L',1),('R',-1)]}
    elif f=='lunge':
        root.z-=.28*q
        for s,sgn in [('L',1),('R',-1)]:feet[s]=(sgn*.12,-.28 if s=='L' else .37,.075)
        root.y=.02
        if 'lateral' in i:
            feet={'L':(.52,0,.075),'R':(-.32,0,.075)};root.x=.22*q;root.z=.94-.26*q
        if 'curtsy' in i:feet['R']=(.26,.4,.075)
        if 'bulgarian' in i:feet['R']=(-.13,.48,.35)
        if 'step-up' in i:
            feet={'L':(.13,-.2,.35),'R':(-.13,.18,.075+.275*q)};root=V((0,-.1*q,.94+.25*q))
        hands={s:root+V((sgn*.25,-.02,-.01)) for s,sgn in [('L',1),('R',-1)]}
    elif f=='hinge':
        tilt=.1+.9*q;root=V((0,.25*q,.94-.15*q))
        if i=='back-extension':tilt=.2+.8*q;root=V((0,0,.92))
        if i=='single-leg-dumbbell-rdl':legs={'L':((0,0,-1),(0,0,-1)),'R':((0,math.sin(tilt),-math.cos(tilt)),(0,math.sin(tilt),-math.cos(tilt)))}
        if 'sumo' in i:feet={'L':(.28,0,.075),'R':(-.28,0,.075)}
        hands={s:root+V((sgn*.19,-.5*math.sin(tilt),.46*math.cos(tilt)-.51)) for s,sgn in [('L',1),('R',-1)]}
        if i=='good-morning':
            hands={s:root+V((sgn*.29,-.4*math.sin(tilt),.4*math.cos(tilt))) for s,sgn in [('L',1),('R',-1)]}
            elbows={s:root+V((sgn*.5,.1*math.cos(tilt)-.2*math.sin(tilt),.2*math.cos(tilt)+.1*math.sin(tilt))) for s,sgn in [('L',1),('R',-1)]}
        if i=='kettlebell-swing':hands={s:V((sgn*.045,-.27-.4*(1-q),root.z+.32*(1-q)-.33*q)) for s,sgn in [('L',1),('R',-1)]}
    elif f in ['curl','triceps','raise','shrug']:
        seated='seated' in i or 'incline-dumbbell-curl' in i or 'concentration' in i or 'machine-biceps' in i or 'machine-triceps' in i
        if seated:
            root=V((0,.05,.54));feet={s:(sgn*.13,-.36,.075) for s,sgn in [('L',1),('R',-1)]}
            if 'incline' in i:tilt=-.25
        arms={}
        for s,sgn in [('L',1),('R',-1)]:
            if f=='curl':upper=direction(5);lower=direction(8+125*q)
            elif f=='shrug':
                hands[s]=V((sgn*.24,-.04,.9+.06*q));continue
            elif f=='raise':
                a=math.radians(8+78*q)
                upper=V((sgn*math.sin(a),0,-math.cos(a))) if 'front' not in i else direction(8+85*q)
                lower=upper+V((0,-.12,0))
            else:
                if 'overhead' in i:upper=direction(170);lower=direction(45+115*q)
                elif 'lying' in i:
                    root=V((0,.15,.50));tilt=math.pi/2;feet={s:(sgn*.14,.5,.075) for s,sgn in [('L',1),('R',-1)]}
                    upper=V((0,0,1));lower=V((0,-math.cos(q*math.pi/2),math.sin(q*math.pi/2)))
                elif 'kickback' in i:
                    root=V((0,.12,.85));tilt=.8;upper=V((0,.6,-.6));lower=direction(5-95*q)
                else:upper=direction(4);lower=direction(95-90*q)
            arms[s]=(upper,lower)
        if f=='shrug':arms=None
        if i=='cable-lateral-raise':arms['R']=(direction(0),direction(0))
        if f=='triceps' and 'overhead' in i:
            arms=None;hands={s:root+V((sgn*.035,.05-.10*(1-q),.66+.28*q)) for s,sgn in [('L',1),('R',-1)]};elbows={s:root+V((sgn*.25,.08,.75)) for s,sgn in [('L',1),('R',-1)]}
        if i=='concentration-curl':
            upper,lower=arms['L'];shoulder=root+V((.188,-.02,.461));hands['L']=shoulder+upper.normalized()*.254+lower.normalized()*.263;hands['R']=V((-.16,-.29,.55));arms=None
    elif f in ['benchpress','fly','pullover','overhead']:
        if f=='benchpress' and 'machine' in e['equipment']:
            root=V((0,.05,.54));feet={s:(sgn*.14,-.35,.075) for s,sgn in [('L',1),('R',-1)]}
            for s,sgn in [('L',1),('R',-1)]:hands[s]=V((sgn*.24,-.12-.30*q,1.0+.25*q));elbows[s]=V((sgn*.5,.2,.96))
        elif f=='benchpress' or (f in ['fly','pullover'] and 'bench' in e['equipment']):
            root=V((0,.18,.53));tilt=1.10 if 'incline' in i else math.pi/2
            feet={s:(sgn*.15,.58,.075) for s,sgn in [('L',1),('R',-1)]}
            for s,sgn in [('L',1),('R',-1)]:
                if f=='fly':hands[s]=V((sgn*(.5-.43*q),-.28,.56+.47*q))
                elif f=='pullover':
                    a=-1.3+1.3*q;hands[s]=V((sgn*.035,-.3+math.sin(a)*.5,.58+math.cos(a)*.5))
                else:hands[s]=V((sgn*.23,-.27,.64+.43*q))
                if f=='benchpress' and 'incline' in i:hands[s]=V((sgn*.23,-.31,.81+.4*q))
                elbows[s]=V((sgn*.6,-.23,.45))
        elif f=='overhead':
            if 'seated' in i or 'arnold' in i or 'machine' in i:root.z=.54;feet={s:(sgn*.13,-.35,.075) for s,sgn in [('L',1),('R',-1)]}
            if i=='barbell-push-press':root.z-=.08*(1-q)
            for s,sgn in [('L',1),('R',-1)]:hands[s]=V((sgn*(.28-.05*q),-.08,root.z+.46+.43*q));elbows[s]=V((sgn*.55,0,root.z+.32))
            if i=='kettlebell-overhead-press':hands['R']=V((-.23,-.02,.93))
        elif f=='pullover':
            arms={s:(direction(155-130*q),direction(155-130*q)) for s in ['L','R']}
        else:
            if 'machine' in e['equipment']:root.z=.54;feet={s:(sgn*.14,-.35,.075) for s,sgn in [('L',1),('R',-1)]}
            for s,sgn in [('L',1),('R',-1)]:hands[s]=V((sgn*(.54-.48*q),-.03-.4*q,root.z+.36));elbows[s]=V((sgn*.65,.02,root.z+.36))
    elif f in ['row','reversefly','upright']:
        seated='seated' in i or i in ['machine-high-row','reverse-pec-deck-fly'] or 'cable' in i
        if seated:root=V((0,.1,.54));feet={s:(sgn*.14,-.42,.075) for s,sgn in [('L',1),('R',-1)]}
        elif f!='upright':tilt=.9;root=V((0,.15,.86))
        if i in ['chest-supported-dumbbell-row','incline-reverse-fly']:root.z=.72
        for s,sgn in [('L',1),('R',-1)]:
            if f=='upright':hands[s]=V((sgn*.17,-.18,1.0+.35*q));elbows[s]=V((sgn*.55,0,1.35))
            elif f=='reversefly':hands[s]=V((sgn*(.18+.4*q),-.44+.23*q,root.z+.10+.22*q))
            elif seated:hands[s]=V((sgn*.17,-.42+.31*q,.93));elbows[s]=V((sgn*.3,.4,.95))
            else:hands[s]=V((sgn*.21,-.45+.18*q,.61+.36*q));elbows[s]=V((sgn*.3,.2,.95))
            if i=='face-pull':hands[s]=V((sgn*.17,-.48+.34*q,1.35+.07*q));elbows[s]=V((sgn*.5,0,1.4))
            if i=='machine-high-row':hands[s]=V((sgn*.22,-.38+.28*q,1.20-.25*q))
            if i=='reverse-pec-deck-fly':hands[s]=V((sgn*(.2+.4*q),-.45+.3*q,1.0))
        if 'one-arm' in i:
            hands['R']=V((-.22,-.4,.62));feet['R']=(-.14,.15,.075)
    elif f in ['pulldown','pullup','hanging']:
        if f=='pulldown':
            root=V((0,.08,.55));feet={s:(sgn*.14,-.35,.075) for s,sgn in [('L',1),('R',-1)]}
            hands={s:V((sgn*.34,-.08,1.5-.44*q)) for s,sgn in [('L',1),('R',-1)]}
        else:
            root=V((0,0,1.08+(.31*q if f=='pullup' else 0)));hands={s:V((sgn*.28,-.025,2.04)) for s,sgn in [('L',1),('R',-1)]}
            legs={s:(direction(-12),direction(35)) for s in ['L','R']}
            if f=='hanging':legs={s:(direction(10+80*q),direction(10+80*q if 'leg-raise' in i else 10+160*q)) for s in ['L','R']}
        elbows={s:V((sgn*.55,-.04,1.5)) for s,sgn in [('L',1),('R',-1)]}
    elif f in ['legcurl','legextension','abduction']:
        root=V((0,.13,.56));feet={};legs={};hands={s:V((sgn*.25,.1,.58)) for s,sgn in [('L',1),('R',-1)]}
        for s,sgn in [('L',1),('R',-1)]:
            if f=='legextension':legs[s]=((0,-1,0),direction(5+80*q))
            elif f=='abduction':legs[s]=((sgn*.8*q,-1,-.05),(0,0,-1))
            elif 'lying' in i:
                root=V((0,0,.57));tilt=-math.pi/2;legs[s]=((0,-1,0),(0,-math.cos(q*1.7),math.sin(q*1.7)))
                hands[s]=V((sgn*.18,.48,.48))
            else:legs[s]=((0,-1,0),direction(80-105*q))
    elif f=='calf-raise':
        root.z+=.085*q;feet={s:(sgn*.13,-.01*q,.075+.085*q) for s,sgn in [('L',1),('R',-1)]}
        if 'single-leg' in i:feet['R']=(-.13,.22,.27+.085*q)
        if 'seated' in i:
            root.z=.54;feet={s:(sgn*.13,-.35,.075+.07*q) for s,sgn in [('L',1),('R',-1)]}
        hands={s:root+V((sgn*.25,-.02,-.02)) for s,sgn in [('L',1),('R',-1)]}
        if 'barbell' in i:hands={s:root+V((sgn*.3,.015,.4)) for s,sgn in [('L',1),('R',-1)]}
    elif f=='kickback':
        tilt=.2;legs={'L':((0,0,-1),(0,0,-1)),'R':(direction(-5-35*q),direction(-5-35*q))}
        hands={s:V((sgn*.2,-.44,1.30)) for s,sgn in [('L',1),('R',-1)]}
    elif f=='dip':
        root=V((0,-.1,.78-.22*q));hands={s:V((sgn*.27,0,1.05 if 'assisted' in i else .46)) for s,sgn in [('L',1),('R',-1)]}
        if i=='bench-dip':root=V((0,-.22,.39-.13*q));feet={s:(sgn*.13,-.8,.075) for s,sgn in [('L',1),('R',-1)]}
        else:legs={s:(direction(-15),direction(75)) for s in ['L','R']}
        elbows={s:V((sgn*.4,.35,.7)) for s,sgn in [('L',1),('R',-1)]}
    elif f in ['pushup','plank'] and i!='dead-bug':
        if i=='side-plank':
            # Static supported side hold; no artificial repetitions.
            root=V((0,0,.35));tilt=-1.25;hands={'L':(.263,.50,.063),'R':(0,.38,1.16)};feet={'L':(.02,-.77,.07),'R':(-.02,-.77,.10)};elbows={'L':(0,.5,.063),'R':(-.3,.3,1)}
        else:
            root=V((0,-.05,.24+.18*q if f=='pushup' else .28));tilt=-math.pi/2
            hz=.35 if i=='incline-push-up' else .065;fz=.37 if i=='decline-push-up' else .065
            hands={s:V((sgn*(.065 if i=='diamond-push-up' else .23),.55,hz)) for s,sgn in [('L',1),('R',-1)]}
            feet={s:(sgn*.10,-.78,fz) for s,sgn in [('L',1),('R',-1)]}
            elbows={s:V((sgn*.43,.33,.2)) for s,sgn in [('L',1),('R',-1)]}
            if i=='knee-push-up':feet={s:(sgn*.13,-.53,.075) for s,sgn in [('L',1),('R',-1)]}
            if i=='pike-push-up':root.z=.68-.12*q;tilt=-.7;feet={s:(sgn*.13,-.47,.075) for s,sgn in [('L',1),('R',-1)]}
            if i=='mountain-climber':feet['L']=(.13,-.78+.55*q,.075+.12*q);feet['R']=(-.13,-.78+.55*(1-q),.075+.12*(1-q))
    elif f in ['bridge','floorlegs','crunch']:
        root=V((0,0,.15));tilt=math.pi/2
        feet={s:(sgn*.14,.56,.075) for s,sgn in [('L',1),('R',-1)]}
        hands={s:V((sgn*.23,-.3,.075)) for s,sgn in [('L',1),('R',-1)]}
        if f=='bridge':
            root=V((0,.04,.15+.25*q));tilt=math.pi/2+.45*q
            tilt=math.acos((.12-root.z)/.46)
            if 'thrust' in i:root.z=.4+.18*q;tilt=math.acos((.48-root.z)/.46)
            if 'single-leg' in i:feet['R']=(-.13,.55,.28+.2*q)
            hands={s:root+V((sgn*.19,-.02,.08)) for s,sgn in [('L',1),('R',-1)]}
        elif f=='floorlegs':
            legs={s:(direction(270-80*q),direction(270-80*q)) for s in ['L','R']}
            if i in ['dead-bug','bicycle-crunch']:
                legs={'L':(direction(180+85*q),direction(270-5*q)),'R':(direction(265-85*q),direction(265+5*q))}
                arms={'L':(direction(95+85*q),direction(95+85*q)),'R':(direction(180-85*q),direction(180-85*q))}
                if i=='bicycle-crunch':arms=None;hands={s:(sgn*.15,-.48,.24) for s,sgn in [('L',1),('R',-1)]};tilt-=.2
            if i=='reverse-crunch':
                root.z+=.06*q;tilt+=.15*q;legs={s:(direction(205-25*q),direction(270-45*q)) for s in ['L','R']}
        else:
            if i in ['cable-crunch','machine-crunch']:
                root=V((0,0,.53));tilt=.18+.65*q;hands={s:root+V((sgn*.12,-.3,.36-.2*q)) for s,sgn in [('L',1),('R',-1)]}
            else:
                tilt=math.pi/2-(1.0 if i=='sit-up' else .28)*q
                hands={s:V((sgn*.18,-.5+.10*q,.23+.20*q)) for s,sgn in [('L',1),('R',-1)]}
                if i=='heel-taps':hands['L']=(.18,-.05+.28*q,.08);hands['R']=(-.18,.23-.28*q,.08)
                if i=='kettlebell-russian-twist':
                    tilt=.7;root.z=.22;hands={s:(sgn*.035+.2*math.sin(t*2*math.pi),-.52,.48) for s,sgn in [('L',1),('R',-1)]};elbows={s:(sgn*.55,-.15,.35) for s,sgn in [('L',1),('R',-1)]}
    roll=0
    horizontal=(f in ['pushup','plank','bridge','floorlegs'] or (f in ['benchpress','fly','pullover'] and 'bench' in e['equipment']) or ('lying' in i) or (f=='crunch' and i not in ['cable-crunch','machine-crunch']))
    if horizontal:roll=math.pi
    if i=='side-plank':roll=math.pi/2
    if f=='pushup' or (f=='plank' and i not in ['side-plank','dead-bug']):
        if i=='front-plank':root.z=.22
        if f=='pushup' and i not in ['incline-push-up','decline-push-up','pike-push-up','knee-push-up']:root.z=.14+.24*q
        for s,sgn in [('L',1),('R',-1)]:
            if i not in ['knee-push-up','decline-push-up','mountain-climber']:feet[s]=(sgn*.1,-.9,.065)
        root.y=-.9+math.sqrt(max(.1,.86**2-(root.z-.065)**2));tilt=-math.pi/2+math.asin(min(.9,(root.z-.065)/.86))
        knees={s:(sgn*.1,-.5,.8) for s,sgn in [('L',1),('R',-1)]}
        if i=='front-plank':arms={s:((0,.1,-1),(0,1,0)) for s in ['L','R']}
    if (f=='benchpress' and 'bench' in e['equipment']) or (f in ['fly','pullover'] and 'bench' in e['equipment']) or ('lying' in i and 'triceps' in i):knees={s:(sgn*.15,.85,.8) for s,sgn in [('L',1),('R',-1)]}
    if f in ['bridge','crunch'] and i not in ['cable-crunch','machine-crunch']:knees={s:(sgn*.15,.6,.9) for s,sgn in [('L',1),('R',-1)]}
    pitch=0
    if f=='calf-raise':
        pitch=math.asin((.055+.07*q)/.18)-math.asin(.055/.18)
        for s in ['L','R']:
            x,y,z=feet[s];feet[s]=(x,y-.17+math.sqrt(.18**2-(.055+.07*q)**2),z)
    twist=.4*math.sin(t*2*math.pi) if i=='kettlebell-russian-twist' else .12*math.sin(t*2*math.pi) if i=='bicycle-crunch' else 0
    plane='y' if f in ['benchpress','fly','reversefly','overhead','pushup'] or (f=='raise' and 'front' not in i) else 'x'
    return dict(root=root,tilt=tilt,roll=roll,hands=hands,feet=feet,elbows=elbows,knees=knees,arms=arms,legs=legs,foot_pitch=pitch,twist=twist,arm_plane=plane,shoulder_lift=.06*q if f=='shrug' else 0)

class Equipment:
    def __init__(self,e,h,cam):
        self.e=e;self.h=h;self.f=family(e);self.parts=[];self.cables=[];self.equipment=e['equipment'];self.mat=material('Equipment steel',(.25,.28,.31));self.dark=material('Rubber and upholstery',(.065,.08,.095));self.accent=material('Pivot caps',(.58,.62,.65));self.movers=[]
        f=self.f;i=e['id'];eq=self.equipment
        floor=f in ['pushup','plank','crunch','floorlegs','bridge']
        if floor:
            cube('Exercise mat',(0,0,.018),(1.05,1.9,.025),material('Mat',(.88,.89,.90)),.015)
            cam.location=(3,-4,3.3);cam.data.ortho_scale=2.2;aim(cam,(0,0,.12))
        bench='bench' in eq or f in ['legcurl','legextension','legpress','abduction'] or ('machine' in eq and f not in ['pullup','dip','calf-raise','kickback']) or f=='pulldown' or i=='seated-calf-raise'
        if bench:
            if i in ['chest-supported-dumbbell-row','incline-reverse-fly']:
                pad=cube('Inclined chest support',(0,-.10,.66),(.35,1.0,.085),self.dark);pad.rotation_euler.x=-.67
                for y in [-.4,.25]:rod('Bench support',(0,y,.05),(0,y,.6),.035,self.mat)
            elif i=='one-arm-dumbbell-row':cube('Support bench',(-.24,-.18,.52),(.34,1.0,.12),self.dark)
            elif i=='back-extension':
                cube('Hip support',(0,0,.87),(.38,.25,.12),self.dark);rod('Roman chair',(0,.3,.05),(0,0,.8),.045,self.mat);rod('Foot brace',(-.3,0,.09),(.3,0,.09),.04,self.dark)
            elif (f in ['benchpress','fly','pullover'] and 'bench' in eq) or ('lying' in i):
                top=cube('Bench pad',(0,-.12,.445),(.36,1.2,.085),self.dark)
                if 'incline' in i:top.rotation_euler.x=.45
                for y in [-.5,.35]:rod('Bench leg',(0,y,.06),(0,y,.4),.035,self.mat);cube('Bench foot',(0,y,.04),(.7,.12,.06),self.mat)
            elif f=='bridge':
                cube('Hip thrust bench',(0,-.52,.3),(.8,.35,.36),self.dark)
            elif i=='bulgarian-split-squat':cube('Rear foot bench',(0,.55,.24),(.8,.3,.25),self.dark)
            elif i=='dumbbell-step-up':cube('Step',(0,-.24,.16),(.75,.48,.3),self.dark)
            elif i in ['incline-push-up','decline-push-up']:cube('Support bench',(0,.55 if 'incline' in i else -.78,.17),(.8,.4,.32),self.dark)
            elif i=='bench-dip':cube('Bench',(0,.15,.26),(.9,.5,.4),self.dark)
            elif f not in ['lunge','row','reversefly'] or 'seated' in i or 'machine' in eq:
                cube('Seat',(0,.13,.46),(.44,.45,.08),self.dark);rod('Seat support',(0,.17,.05),(0,.17,.42),.045,self.mat);cube('Seat base',(0,.15,.04),(.65,.6,.06),self.mat)
                if f in ['benchpress','overhead','legpress','abduction']:cube('Back rest',(0,.32,.74),(.4,.085,.6),self.dark)
        if f in ['pullup','hanging','dip'] and i!='bench-dip':
            for x in [-.48,.48]:rod('Station upright',(x,.17,.04),(x,.17,2.12),.034,self.mat);rod('Station foot',(x,-.28,.04),(x,.48,.04),.04,self.mat)
            rod('Pull-up bar',(-.51,-.025,2.04),(.51,-.025,2.04),.024,self.dark)
            if f=='dip' and i!='bench-dip':
                for x in [-.27,.27]:rod('Dip support',(x,.17,1.05),(x,-.22,1.05),.028,self.dark)
        if 'cable' in eq:
            x=-.62;y=.65 if i=='cable-pull-through' else -.58
            for dx in [-.13,.13]:rod('Tower rail',(x+dx,y,.06),(x+dx,y,2.02),.024,self.mat)
            cube('Tower top',(x,y,2.04),(.40,.25,.07),self.mat);cube('Tower base',(x,y,.035),(.49,.48,.07),self.mat)
            self.stack=cube('Weight stack',(x,y,.32),(.23,.19,.45),self.dark)
            low=f in ['curl','row','hinge','kickback','raise']
            self.pulley=V((x,y,.18 if low else 1.99));sphere('Pulley',self.pulley,(.047,.025,.047),self.accent)
            cable=rod('Taut cable',self.pulley,self.pulley+V((0,.2,-.3)),.006,self.dark);cable.data['length']=(V((0,.2,-.3))).length;self.cables.append(cable)
            self.cable_rest=None
            self.return_cable=rod('Stack return cable',(x,y,1.99),(x,y,.55),.005,self.dark);self.return_cable.data['length']=1.44
            cam.data.ortho_scale=2.55;aim(cam,(-.15,-.1,1.03))
        if 'dumbbell' in eq or 'kettlebell' in eq:
            count=1 if any(s in i for s in ['goblet','pullover','overhead-dumbbell-triceps','sumo-squat','kettlebell','hip-thrust','one-arm','concentration']) else 2
            for k in range(count):
                bpy_empty=self.empty('Free weight')
                handle=rod('Grip shaft',(-.09,0,0),(.09,0,0),.014,self.accent);handle.parent=bpy_empty
                if 'kettlebell' in eq:
                    ball=sphere('Kettlebell',(0,0,-.08),(.09,.075,.09),self.dark);ball.parent=bpy_empty
                else:
                    for x in [-.085,.085]:
                        p=cube('Dumbbell end',(x,0,0),(.055,.12,.12),self.dark,.012);p.parent=bpy_empty
                self.movers.append((bpy_empty,'single' if any(s in i for s in ['one-arm','concentration','kettlebell-overhead']) else 'hand',k,count))
        if 'barbell' in eq:
            self.bar=self.empty('Rigid barbell')
            bar=rod('Bar',(-.65,0,0),(.65,0,0),.016,self.accent);bar.parent=self.bar
            for x in [-.52,.52]:
                p=rod('Plate',(x-.035,0,0),(x+.035,0,0),.15 if f in ['squat','hinge'] else .11,self.dark);p.parent=self.bar
            self.movers.append((self.bar,'bar',0,1))
        self.handle=None
        self.independent_handles=[]
        independent=i in ['cable-crossover','cable-lateral-raise'] or ('machine' in eq and f in ['benchpress','overhead','row','curl','triceps','fly','reversefly','pulldown'])
        if 'cable' in eq and not independent:
            self.handle=rod('Rigid grip bar',(-.2,0,0),(.2,0,0),.018,self.dark);self.handle.data['length']=.4
        if independent:
            for s in ['L'] if i=='cable-lateral-raise' else ['L','R']:
                grip=rod('Independent grip',(0,0,-.055),(0,0,.055),.017,self.dark);grip.data['length']=.11;self.independent_handles.append((s,grip))
        if i=='cable-glute-kickback':
            for x in [-.2,.2]:rod('Fixed balance support',(x,-.44,.04),(x,-.44,1.30),.022,self.mat)
        if i=='cable-crossover':
            x=.72;y=-.58
            for dx in [-.13,.13]:rod('Second tower rail',(x+dx,y,.06),(x+dx,y,2.02),.024,self.mat)
            cube('Second tower top',(x,y,2.04),(.40,.25,.07),self.mat);cube('Second tower base',(x,y,.035),(.49,.48,.07),self.mat)
            self.pulley2=V((x,y,1.99));sphere('Second pulley',self.pulley2,(.047,.025,.047),self.accent)
            self.stack2=cube('Second weight stack',(x,y,.32),(.23,.19,.45),self.dark)
            cable=rod('Second taut cable',self.pulley2,self.pulley2+V((0,.2,-.3)),.006,self.dark);cable.data['length']=V((0,.2,-.3)).length;self.cables.append(cable)
            self.return2=rod('Second return cable',(x,y,1.99),(x,y,.55),.005,self.dark);self.return2.data['length']=1.44;self.cable_rest2=None
            cam.data.ortho_scale=2.7;aim(cam,(0,-.1,1.03))
        self.rollers=[]
        if f in ['legcurl','legextension','abduction']:
            for s in ['L','R']:
                roller=sphere('Contact pad',(0,0,0),(.08,.07,.10),self.dark);link=rod('Fixed length lever',(0,0,0),(0,0,.4),.025,self.mat);link.data['length']=.4
                self.rollers.append((s,roller,link))
        self.sled=None
        if f=='legpress':
            for x in [-.34,.34]:rod('Fixed sled rail',(x,-.7,.68),(x,.2,.08),.025,self.mat)
            self.sled=cube('Sled contact plate',(0,-.45,.46),(.56,.07,.38),self.dark)
            self.sled.rotation_euler.x=.55
        self.assist=None
        if i in ['assisted-pull-up','assisted-chest-dip']:
            rod('Assistance guide',(0,.24,.1),(0,.24,1.0),.025,self.mat)
            self.assist=cube('Assisted knee pad',(0,.2,.5),(.45,.3,.07),self.dark)
        self.calfpads=[]
        if f=='calf-raise':
            cube('Calf platform',(0,-.10,.025),(.65,.3,.04),self.dark)
            if 'machine' in eq:
                for x in [-.32,.32]:rod('Fixed pad guide',(x,.16,.04),(x,.16,1.65),.024,self.mat)
                for s in ['L','R']:
                    pad=cube('Load pad',(0,0,0),(.12,.2,.09),self.dark);self.calfpads.append((s,pad))
        if i=='wall-sit':cube('Wall',(0,.35,1.0),(1.0,.08,1.95),material('Wall grey',(.91,.92,.93)))
        if 'machine' in eq and f in ['benchpress','overhead','row','curl','triceps','fly','reversefly']:
            self.levers=[]
            for s,sgn in [('L',1),('R',-1)]:
                pivot=V((sgn*.4,.31,.95 if f!='overhead' else 1.1))
                if f=='benchpress':pivot=V((sgn*.28,.10,1.53))
                if f in ['fly','reversefly']:pivot=V((sgn*.2,0,.98))
                sphere('Fixed pivot',pivot,(.055,.055,.055),self.accent)
                rod('Fixed machine frame',(sgn*.4,.31,.05),pivot,.032,self.mat)
                link=rod('Machine linkage',pivot,pivot+V((0,-.4,0)),.025,self.mat);link.data['length']=.4;self.levers.append((s,pivot,link))
        else:self.levers=[]
        if any(n in e['primaryMuscles'] for n in ['back','triceps','glutes','hamstrings']) and not floor:
            cam.location=(5,2,2.4);aim(cam,(-.12,-.1,1.0))
        if not floor and not self.cables and f not in ['pullup','hanging','dip']:
            if ('bench' in eq and f in ['benchpress','fly','pullover']) or 'lying' in i:
                cam.location=(3,-4,2.8);cam.data.ortho_scale=2.1;aim(cam,(0,-.05,.65))
            elif bench and f not in ['lunge','hinge','calf-raise']:
                cam.data.ortho_scale=2.0;aim(cam,(0,0,.72))
    def empty(self,name):
        import bpy
        o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o
    def constrain(self,p):
        # A rigid lever rotates around one hinge. The human hands target that
        # same endpoint, rather than independently animating the apparatus.
        if self.levers and p['arms']:
            from mathutils import Matrix
            T=Matrix.Translation(V(p['root']))@Matrix.Rotation(p['tilt'],4,'X')@Matrix.Translation(-self.h.hip)
            for s,(upper,lower) in p['arms'].items():
                p['hands'][s]=T@self.h.rest['upperarm.'+s][0]+V(upper).normalized()*self.h.lengths['upperarm.'+s]+V(lower).normalized()*self.h.lengths['forearm.'+s]
            p['arms']=None
        for s,pivot,link in self.levers:
            d=V(p['hands'][s])-pivot
            p['hands'][s]=pivot+d.normalized()*(.56 if self.f=='benchpress' else .42 if self.f=='reversefly' else .48)
        return p
    def update(self,j,root,t=0):
        a,b=j['L']['hand'],j['R']['hand'];mid=(a+b)/2
        def grip_axis(s,rotation=0):
            name='forearm.'+s;ra,rb=self.h.rest[name];direction=(rb-ra).normalized()
            reference=V((1,0,0));reference=(reference-direction*reference.dot(direction)).normalized()
            transform=self.h.rig.pose.bones[name].matrix@self.h.restmat[name].inverted()
            axis=(transform.to_3x3()@reference).normalized()
            return Quaternion((j[s]['hand']-j[s]['elbow']).normalized(),rotation)@axis
        for o,kind,k,count in self.movers:
            if kind=='bar':
                o.location=mid;o.rotation_mode='QUATERNION';o.rotation_quaternion=(a-b).to_track_quat('X','Z')
            else:
                o.location=a if kind=='single' else mid if count==1 else a if k==0 else b
                i=self.e['id'];q=(1-math.cos(t*2*math.pi))*.5
                if 'dumbbell' in self.equipment and (count==2 or kind=='single'):
                    rotation=math.pi/2 if 'hammer' in i else math.pi*q if 'zottman' in i else math.pi/2*(1-q) if i=='arnold-press' else 0
                    axis=grip_axis('L' if k==0 else 'R',rotation);o.rotation_mode='QUATERNION';o.rotation_quaternion=axis.to_track_quat('X','Z')
            if self.f=='bridge':o.location=V(root)+V((0,0,.10))
        if self.handle:move_rod(self.handle,a,b)
        for s,grip in self.independent_handles:
            axis=grip_axis(s)*.055;move_rod(grip,j[s]['hand']-axis,j[s]['hand']+axis)
        if self.cables:
            point=j['R']['ankle'] if self.f=='kickback' else j['L']['hand'] if self.e['id']=='cable-lateral-raise' else j['R']['hand'] if len(self.cables)>1 else mid
            move_rod(self.cables[0],self.pulley,point)
            length=(point-self.pulley).length
            if self.cable_rest is None:self.cable_rest=length
            self.stack.location.z=.32+max(-.10,min(.45,length-self.cable_rest))
            move_rod(self.return_cable,(self.pulley.x,self.pulley.y,1.99),(self.pulley.x,self.pulley.y,self.stack.location.z+.225))
            if len(self.cables)>1:
                move_rod(self.cables[1],self.pulley2,a);length2=(a-self.pulley2).length
                if self.cable_rest2 is None:self.cable_rest2=length2
                self.stack2.location.z=.32+max(-.1,min(.45,length2-self.cable_rest2));move_rod(self.return2,self.pulley2,(self.pulley2.x,self.pulley2.y,self.stack2.location.z+.225))
        for s,pivot,link in self.levers:move_rod(link,pivot,j[s]['hand'])
        for s,pad,link in self.rollers:
            end=j[s]['knee'] if self.f=='abduction' else j[s]['ankle'];start=j[s]['hip'] if self.f=='abduction' else j[s]['knee']
            pad.location=end;move_rod(link,start,end)
        if self.sled:self.sled.location=(j['L']['ankle']+j['R']['ankle'])/2+V((0,-.08,0))
        if self.assist:self.assist.location=(j['L']['knee']+j['R']['knee'])/2-V((0,0,.065))
        for s,pad in self.calfpads:
            pad.location=j[s]['knee']+V((0,0,.09)) if 'seated' in self.e['id'] else j[s]['shoulder']+V((0,0,.065))
