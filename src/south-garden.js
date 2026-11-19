import { applyProceduralFinish } from './exterior-materials.js?v=59';

export const SOUTH_GARDEN_TREES=Object.freeze([
  [22.5,-39,1.75],[-25,-24,.83],[-33,-42,1.16],[-41,-22,1.28],
  [-44,-34,.91],[-55,-41,1.29],[-30,-54,.74],[-59,-53,1.15],[-20,-47,.68]
]);

// Low garden borders and branching deciduous trees, modelled in world space.
export function buildSouthGarden(THREE, grounds, random, mobile, isPaved, maple){
  const group=new THREE.Group();
  group.name='Suedgarten_Lavendel_und_Laubbaeume';
  grounds.add(group);
  const stemMaterial=new THREE.MeshStandardMaterial({color:0x63503c,roughness:1});
  applyProceduralFinish(THREE,stemMaterial,'bark');
  const leafMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,side:THREE.DoubleSide});
  const leaf=new THREE.BufferGeometry();
  leaf.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0,-.22,.19,0,-.44,.42,-.03,-.35,.66,.01,-.18,.84,-.02,
    0,1,0,.19,.84,-.02,.35,.66,.01,.44,.42,-.03,.22,.19,0,0,.51,.12
  ],3));
  leaf.setIndex(Array.from({length:10},(_,i)=>[i,(i+1)%10,10]).flat());
  leaf.computeVertexNormals();
  const dummy=new THREE.Object3D(), tint=new THREE.Color();
  const clusters=[];
  const branches=new Map();
  const up=new THREE.Vector3(0,1,0);
  function branch(a,b,lower,upper){
    const path=new THREE.Vector3().subVectors(b,a);
    dummy.position.copy(a).lerp(b,.5);
    dummy.scale.set(lower,path.length(),lower);
    dummy.quaternion.setFromUnitVectors(up,path.normalize());
    dummy.updateMatrix();
    const taper=(upper/lower).toFixed(4);
    if(!branches.has(taper))branches.set(taper,[]);
    branches.get(taper).push(dummy.matrix.clone());
  }
  const modelTrees=new Set([0,1,3,5,7]);
  SOUTH_GARDEN_TREES.forEach(([x,z,scale],index)=>{
    if(maple&&modelTrees.has(index)){
      const tree=index===0?maple:maple.clone();
      tree.getObjectByName("sugar_maple_leaf").customDepthMaterial=maple.getObjectByName("sugar_maple_leaf").customDepthMaterial;
      tree.position.set(x,0,z);
      tree.rotation.y=.28+index*1.83;
      if(index>0)tree.scale.set(scale*.84,scale*.92,scale*.78);
      group.add(tree);
      return;
    }
    const crotch=new THREE.Vector3(x+.24,3.5*scale,z);
    const base=new THREE.Vector3(x,-.06,z);
    const flare=new THREE.Vector3(x,.62*scale,z);
    branch(base,flare,.61*scale,.40*scale);
    branch(flare,crotch,.40*scale,.28*scale);
    const foreground=scale>1.5;
    const limbCount=foreground?10:7;
    for(let limb=0;limb<limbCount;limb++){
      const angle=limb*Math.PI*2/limbCount+random()*.38;
      const spread=(1.1+random()*2.1)*scale*(foreground?1.27:1);
      const elbow=new THREE.Vector3(x+Math.cos(angle)*spread,(5.7+random()*2.7)*scale,z+Math.sin(angle)*spread);
      branch(crotch,elbow,.19*scale,.083*scale);
      for(let twig=0;twig<3;twig++){
        const offset=angle+(twig-1)*1.32;
        const tip=elbow.clone().add(new THREE.Vector3(Math.cos(offset)*1.7*scale,(1.2+random())*scale,Math.sin(offset)*1.7*scale));
        branch(elbow,tip,.069*scale,.016*scale);
        clusters.push({tip,scale});
      }
    }
  });
  for(const [taper,matrices] of branches){
    const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(Number(taper),1,1,11),stemMaterial,matrices.length);
    mesh.name='Suedgarten_Baumrinde';
    matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));
    mesh.castShadow=mesh.receiveShadow=true;
    group.add(mesh);
  }
  const perCluster=mobile?96:152;
  const canopy=new THREE.InstancedMesh(leaf,leafMaterial,clusters.length*perCluster);
  canopy.name='Laubbaeume_Blaetter';
  clusters.forEach(({tip,scale},cluster)=>{
    for(let n=0;n<perCluster;n++){
      const a=random()*Math.PI*2, elevation=random()*2-1, r=Math.sqrt(1-elevation*elevation)*Math.cbrt(random())*scale;
      dummy.position.set(tip.x+Math.cos(a)*r*1.48,tip.y+elevation*scale*1.12,tip.z+Math.sin(a)*r*1.48);
      dummy.rotation.set(random()*2.7,a,random()-.5);
      dummy.scale.setScalar((.13+random()*.21)*Math.sqrt(scale));
      dummy.updateMatrix();
      const i=cluster*perCluster+n;
      canopy.setMatrixAt(i,dummy.matrix);
      canopy.setColorAt(i,tint.setHSL(.17+random()*.10,.30+random()*.26,.20+random()*.23));
    }
  });
  canopy.castShadow=canopy.receiveShadow=true;
  group.add(canopy);

  const tufts=[];
  // Elliptical drifts overlap in depth, with low lavender between taller grasses.
  const beds=[[15.5,-16.8,2.4,1.6],[18.8,-16.9,2.6,1.85],
    [21.2,-18.3,2.6,1.45],[15.7,-19.75,2.2,1.32],
    [-15.4,-16.1,2.4,1.7],[-18.5,-17.25,2.8,2.0],[-21.7,-18.8,2.15,1.45]];
  for(const [cx,cz,wide,deep] of beds){
    for(let i=0;i<(mobile?18:26);i++){
      const angle=random()*Math.PI*2, r=Math.sqrt(random());
      const x=cx+wide*Math.cos(angle)*r,z=cz+deep*Math.sin(angle)*r;
      if(isPaved(x,z)||Math.abs(x)<12.98)continue;
      tufts.push([x,z,random()>.27,.72+random()*.59]);
    }
  }
  const bladesPerTuft=mobile?18:28;
  const stems=new THREE.InstancedMesh(leaf,leafMaterial,tufts.length*bladesPerTuft);
  const flowers=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),leafMaterial,tufts.length*bladesPerTuft);
  const lean=new THREE.Vector3();
  let flowersUsed=0;
  tufts.forEach(([x,z,lavender,size],tuft)=>{
    for(let n=0;n<bladesPerTuft;n++){
      const angle=random()*Math.PI*2, r=Math.sqrt(random())*.31;
      const dx=r*Math.cos(angle),dz=r*Math.sin(angle),height=size*(.27+random()*(lavender?.35:.62));
      const px=x+dx,pz=z+dz;
      lean.set(dx*.48,height,dz*.48);
      dummy.position.set(px,-.054,pz);
      dummy.quaternion.setFromUnitVectors(up,lean.clone().normalize());
      dummy.scale.set(lavender?.037:.074,lean.length(),.06);
      dummy.updateMatrix();
      const i=tuft*bladesPerTuft+n;
      stems.setMatrixAt(i,dummy.matrix);
      stems.setColorAt(i,tint.setHSL(lavender?.26:.15,.24+random()*.21,.27+random()*.19));
      if(lavender){
        dummy.position.add(lean);
        dummy.scale.set(.019,.072,.019);
        dummy.updateMatrix();
        flowers.setMatrixAt(flowersUsed,dummy.matrix);
        flowers.setColorAt(flowersUsed++,tint.setHSL(.72+random()*.065,.26+random()*.25,.37+random()*.17));
      }
    }
  });
  flowers.count=flowersUsed;
  stems.name='Lavendel_und_Graeser_Halme';
  flowers.name='Lavendel_Blueten';
  group.add(stems,flowers);
  // Low hydrangeas add irregular masses of green and cream flower heads.
  const shrubCenters=[[18.4,-14.4],[19.5,-15.5],[16.7,-14.2],[-16.8,-15.4],[-19,-16.4],
    [-29,-25],[-25,-32],[-35,-36],[-30,-43]];
  const nShrub=mobile?56:88;
  const shrubs=new THREE.InstancedMesh(leaf,leafMaterial,shrubCenters.length*nShrub);
  const blooms=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leafMaterial,shrubCenters.length*15*7);
  shrubs.name='Suedgarten_Hortensien_Laub';
  blooms.name='Suedgarten_Hortensien_Blueten';
  let bloom=0;
  shrubCenters.forEach(([x,z],index)=>{
    for(let n=0;n<nShrub;n++){
      const angle=random()*Math.PI*2,r=Math.sqrt(random());
      dummy.position.set(x+Math.cos(angle)*r*.91,.22+(1-r*r)*.71+random()*.15,z+Math.sin(angle)*r*.87);
      dummy.rotation.set(.55+random(),angle,random()-.5);
      dummy.scale.setScalar(.17+random()*.17);
      dummy.updateMatrix();
      const i=index*nShrub+n;
      shrubs.setMatrixAt(i,dummy.matrix);
      shrubs.setColorAt(i,tint.setHSL(.23+random()*.06,.33,.19+random()*.17));
      if(n<15){
        const head=dummy.position.clone();
        head.y+=.11;
        const radius=.07+random()*.055;
        for(let floret=0;floret<7;floret++){
          const angle=floret*2.39996;
          const offset=radius*Math.sqrt(floret/7);
          dummy.position.set(head.x+Math.cos(angle)*offset,head.y+radius*(1-floret/9),head.z+Math.sin(angle)*offset);
          dummy.scale.set(.033,.015,.033);
          dummy.rotation.set(.3*Math.sin(angle),angle,.3*Math.cos(angle));
          dummy.updateMatrix();
          blooms.setMatrixAt(bloom,dummy.matrix);
          blooms.setColorAt(bloom++,tint.setHSL(.15+random()*.09,.25,.60+random()*.23));
        }
      }
    }
  });
  shrubs.castShadow=shrubs.receiveShadow=true;
  blooms.receiveShadow=true;
  group.add(shrubs,blooms);
  return group;
}
