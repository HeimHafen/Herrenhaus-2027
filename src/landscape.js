import { buildSouthGarden } from './south-garden.js?v=62';
import { aroundCellarShaft } from './cellar.js?v=52';
import { applyProceduralFinish } from './exterior-materials.js?v=20261118-stone-v14';
// Weisses-Haus-2027 / exterior landscape V3.
// All PBR textures are bundled locally: no third-party texture hosts.
// The path layout is an intentionally simplified visitor landscape, not a
// surveyed site plan of the present-day White House grounds.

function rng32(seed=20271117){
  return ()=>{
    seed|=0;seed=(seed+0x6D2B79F5)|0;
    let t=Math.imul(seed^(seed>>>15),1|seed);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

export function buildGrounds(THREE,scene,{mobile=false,maple=null}={}){
  const loader=new THREE.TextureLoader();
  const root='./assets/materials/';
  function texture(name,repeat=1,isColor=false){
    const tex=loader.load(`${root}${name}`);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    tex.repeat.set(repeat,repeat);
    tex.anisotropy=Math.min(8,THREE.WebGLRenderer?8:4);
    if(isColor)tex.colorSpace=THREE.SRGBColorSpace;
    return tex;
  }
  function material(name,roughness,scale){
    return new THREE.MeshStandardMaterial({
      map:texture(`${name}_albedo.jpg`,scale,true),
      normalMap:texture(`${name}_normal.jpg`,scale),
      normalScale:new THREE.Vector2(.42,.42),
      roughnessMap:texture(`${name}_roughness.jpg`,scale),
      roughness,metalness:0,side:THREE.DoubleSide
    });
  }
  const turf=material('grass',.96,24);
  const gravel=material('gravel',.90,1.35);
  const paving=material('paving',.80,1.1);
  applyProceduralFinish(THREE,turf,'grassBreakup');
  applyProceduralFinish(THREE,gravel,'pathBreakup');
  applyProceduralFinish(THREE,paving,'pathBreakup');
  const border=new THREE.MeshStandardMaterial({color:0xbdb7a8,roughness:.88});
  const soil=new THREE.MeshStandardMaterial({color:0x817354,roughness:1,transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide});
  const grounds=new THREE.Group();grounds.name='Aussenanlagen_Rasen_Wege_PBR';scene.add(grounds);

  for(const [a,b,c,d] of aroundCellarShaft(-125,125,-112.5,112.5)){
    const geometry=new THREE.PlaneGeometry(b-a,d-c);
    const uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(a+125+uv.getX(i)*(b-a))/250,(112.5-d+uv.getY(i)*(d-c))/225);
    const lawn=new THREE.Mesh(geometry,turf);
    lawn.name='Realistischer_Rasen_PBR';
    lawn.rotation.x=-Math.PI/2;
    lawn.position.set((a+b)/2,-.056,(c+d)/2);
    lawn.receiveShadow=true;
    grounds.add(lawn);
  }

  const pathSpecs=[];
  function strip(name,source,width,mat,{height=-.018,edge=false,soilEdge=true}={}){
    const curve=new THREE.CatmullRomCurve3(source.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'centripetal');
    const N=Math.max(22,source.length*22);
    const samples=curve.getSpacedPoints(N);
    const tangentAt=i=>{
      const p=samples[Math.min(N,i+1)],q=samples[Math.max(0,i-1)];
      const dx=p.x-q.x,dz=p.z-q.z,len=Math.max(.0001,Math.hypot(dx,dz));
      return [dx/len,dz/len];
    };
    function makeRibbon(w,y,material,label){
      const verts=[],uv=[],ids=[];
      let accumulated=0;
      for(let i=0;i<=N;i++){
        const [dx,dz]=tangentAt(i);const nX=dz,nZ=-dx;
        const center=samples[i];
        if(i) accumulated+=center.distanceTo(samples[i-1]);
        for(const side of [1,-1]){
          verts.push(center.x+side*nX*w*.5,y,center.z+side*nZ*w*.5);
          // Explicit metres-based UV: realistic paver/gravel scale along curves.
          uv.push((side*w*.5)/2.2,accumulated/2.2);
        }
        if(i<N){const j=i*2;ids.push(j,j+1,j+2,j+1,j+3,j+2);}
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      geo.setIndex(ids);geo.computeVertexNormals();
      const obj=new THREE.Mesh(geo,material);
      obj.name=label;obj.receiveShadow=true;grounds.add(obj);
      return obj;
    }
    if(soilEdge)makeRibbon(width+.50,height-.016,soil,`${name}_erdiger_Uebergang`);
    const surface=makeRibbon(width,height,mat,name);
    if(edge){
      for(const side of [-1,1]){
        const pts=samples.map((p,i)=>{
          const [dx,dz]=tangentAt(i);return new THREE.Vector3(p.x+side*dz*(width*.5+.045),height+.012,p.z-side*dx*(width*.5+.045));
        });
        const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(24,N),.041,5,false),border);
        tube.receiveShadow=true;tube.name=`${name}_Naturstein_Einfassung`;grounds.add(tube);
      }
    }
    const parts=[];
    for(let i=0;i<N;i++)parts.push([samples[i],samples[i+1]]);
    pathSpecs.push({name,width,parts});
    return surface;
  }

  // NORTH: restrained approach to the entrance with limestone footpath and
  // naturally curved gravel drives; SOUTH: paths lead to the straight portico.
  // (No external staircases remain.)
  strip('Nordportal_Podiumanschluss',[[0,12.2],[0,14.8],[0,17.0]],8.4,paving,{edge:true,soilEdge:true});
  strip('Nordportal_Natursteinweg',[[0,16.8],[0,22],[0,31.0],[0,40.5]],5.9,paving,{edge:true});
  strip('Nordportal_Vorplatz',[[0,26],[.2,31],[0,35]],11.2,gravel,{soilEdge:true});
  strip('Westliche_Kieszufahrt',[[-63,18],[-52,20],[-40,26],[-25,34],[-11,39],[0,42]],6.0,gravel);
  strip('Oestliche_Kieszufahrt',[[63,18],[52,20],[40,26],[25,34],[11,39],[0,42]],6.0,gravel);
  // Stone and gravel use the same sampled boundary; the curved edge never
  // leaves a strip of lawn between the steps, apron and garden approach.
  const terraceHalf=13.10, gardenHalf=33, stepsZ=-18.12;
  const jointZ=x=>-23.35+.0072*x*x;
  const gravelInner=x=>jointZ(THREE.MathUtils.clamp(x,-terraceHalf,terraceHalf))+
    1.55*Math.pow(Math.max(0,Math.abs(x)-terraceHalf)/(gardenHalf-terraceHalf),1.35);
  const lawnEdge=x=>{
    const t=(x+gardenHalf)/(2*gardenHalf);
    const end=1-THREE.MathUtils.smoothstep(Math.abs(x),gardenHalf-8,gardenHalf);
    const width=2.6+3.1*Math.pow(t,1.35)+.7*Math.sin(t*Math.PI);
    return gravelInner(x)-width*(.32+.68*end);
  };
  function gardenSurface(name,samples,inner,outer,mat,height,metresPerTile){
    const positions=[],uv=[],indices=[];
    samples.forEach((x,i)=>{
      for(const z of [inner(x),outer(x)]){
        positions.push(x,height,z);
        uv.push(x/metresPerTile,-z/metresPerTile);
      }
      const j=i*2;
      if(i<samples.length-1)indices.push(j,j+2,j+1,j+1,j+2,j+3);
    });
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,mat);
    mesh.name=name;
    mesh.receiveShadow=true;
    grounds.add(mesh);
  }
  const samples=(from,to,n)=>Array.from({length:n+1},(_,i)=>from+(to-from)*i/n);
  const apronX=samples(-terraceHalf,terraceHalf,96);
  const pathX=[...samples(-gardenHalf,-terraceHalf,52).slice(0,-1),...apronX,...samples(terraceHalf,gardenHalf,52).slice(1)];
  gardenSurface('Suedterrasse_Naturstein',apronX,()=>stepsZ,jointZ,paving,-.009,2.7);
  gardenSurface('Suedterrasse_Kiesweg',pathX,gravelInner,lawnEdge,gravel,-.009,.76);

  // Small setts follow the lawn edge and break up the change in materials.
  const curb=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),paving,180);
  curb.name='Suedgarten_Natursteinpflaster_Rasenkante';
  const block=new THREE.Object3D(), blockColor=new THREE.Color(), curbRandom=rng32(921);
  for(let i=0;i<curb.count;i++){
    const x=-gardenHalf+(i+.5)*2*gardenHalf/curb.count;
    const z=lawnEdge(x), slope=(lawnEdge(x+.05)-lawnEdge(x-.05))/.10;
    block.position.set(x,-.025+curbRandom()*.012,z);
    block.rotation.y=-Math.atan(slope);
    block.scale.set((2*gardenHalf/curb.count-.013)*Math.hypot(1,slope),.055,.18+curbRandom()*.04);
    block.updateMatrix();
    curb.setMatrixAt(i,block.matrix);
    curb.setColorAt(i,blockColor.setScalar(.72+curbRandom()*.24));
  }
  curb.receiveShadow=true;
  grounds.add(curb);
  function inSouthPaving(x,z){
    if(Math.abs(x)>gardenHalf)return false;
    const inner=Math.abs(x)<=terraceHalf?stepsZ:gravelInner(x);
    return z<=inner && z>=lawnEdge(x)-.12;
  }

  // Low-cost 3D grass blades around the building and pedestrian approaches.
  // A few thousand instanced *real triangles*, not millions of meshes.
  const tufts=mobile?3000:6200;
  const geo=new THREE.BufferGeometry();
  const positions=[];
  for(let j=0;j<3;j++){
    const a=j*Math.PI/3,c=Math.cos(a),s=Math.sin(a);
    const half=.044;
    positions.push(-c*half,0,-s*half,c*half,0,s*half,.010*c,.19,.010*s);
  }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.computeVertexNormals();
  const bladeMat=new THREE.MeshStandardMaterial({color:0xa8bf93,roughness:1,side:THREE.DoubleSide});
  applyProceduralFinish(THREE,bladeMat,'grassBreakup');
  const blades=new THREE.InstancedMesh(geo,bladeMat,tufts);
  blades.name='Dreidimensionale_Grashalme_Instanzen';
  const prng=rng32(),dummy=new THREE.Object3D(),c=new THREE.Color();
  let n=0,tries=0;
  function nearPath(x,z){
    for(const path of pathSpecs){
      const limit=Math.pow(path.width*.5+.42,2);
      for(const [a,b] of path.parts){
        const dx=b.x-a.x,dz=b.z-a.z;
        const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz+1e-6)));
        const px=a.x+t*dx,pz=a.z+t*dz;
        if((x-px)*(x-px)+(z-pz)*(z-pz)<limit)return true;
      }
    }
    return false;
  }
  while(n<tufts && tries<tufts*15){
    tries++;
    const local=tries%3===0;
    const x=(prng()-.5)*(local?75:143),z=local?-15-prng()*43:(prng()-.50)*142;
    // No blades below the model or on stone and gravel.
    if(Math.abs(x)<24.3&&z>-12.8&&z<13.2)continue;
    if(nearPath(x,z)||inSouthPaving(x,z))continue;
    dummy.position.set(x,-.044,z);
    dummy.rotation.set(0,prng()*Math.PI*2,0);
    const size=.28+prng()*.53;
    dummy.scale.set(size,size*(.7+prng()*.9),size);
    dummy.updateMatrix();blades.setMatrixAt(n,dummy.matrix);
    const hue=(102+prng()*20)/360,light=.29+prng()*.19;
    c.setHSL(hue,.38+prng()*.19,light);
    blades.setColorAt(n,c);
    n++;
  }
  blades.count=n;
  blades.instanceMatrix.needsUpdate=true;
  if(blades.instanceColor)blades.instanceColor.needsUpdate=true;
  blades.frustumCulled=false;
  grounds.add(blades);
  buildSouthGarden(THREE,grounds,rng32(154237),mobile,inSouthPaving,maple);
  grounds.userData={materialVersion:'PBR-Grass-Stone-v3',grassInstances:n,paths:pathSpecs.map(p=>p.name)};
  return {grounds,grass:blades,paths:pathSpecs};
}
