import { addManorWallFinish } from './garden-hall.js?v=93';
import { portalLintelY } from './north-portal.js?v=29';

export function buildEntryFinish(THREE,scene){
  const group=new THREE.Group();
  group.name='Eingangsflur_Wandabschluss';
  scene.add(group);
  const trim=new THREE.MeshStandardMaterial({color:0xe1d4bf,roughness:.76});
  const start=8.037,end=12.17,depth=end-start,center=(start+end)/2;
  const faces=[-1.47,1.47];
  const spans=faces.map(x=>({x,z:center,length:depth,alongX:false,side:-Math.sign(x),top:portalLintelY}));
  for(const side of [-1,1]){
    // The two solid jambs join the narrower portal to the windfang partitions.
    spans.push({x:side*1.594,z:7.865,length:.508,alongX:true,side:-1,top:5.02});
  }
  addManorWallFinish(THREE,group,.936,spans);
  for(const x of faces){
    const cornice=new THREE.Mesh(new THREE.BoxGeometry(.105,.085,depth),trim);
    cornice.position.set(x-Math.sign(x)*.025,portalLintelY-.035,center);
    cornice.receiveShadow=true;
    group.add(cornice);
  }
}
