import { WINDOW_STOREYS, buildNorthWallBand, northOpeningsForBand, STAIR_WINDOWS } from './window-layout.js?v=96';
import { portalLintelY } from './north-portal.js?v=29';

// Replace the solid imported north blocks with masonry around real apertures.
export function buildNorthWindowWall(THREE, target, material) {
  function masonry(x1,x2,y1,y2,innerZ) {
    if(x2<=x1||y2<=y1)return;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y2-y1,12-innerZ),material);
    mesh.name='Nordfassade_Mauerwerk';
    mesh.position.set((x1+x2)/2,(y1+y2)/2,(12+innerZ)/2);
    mesh.castShadow=mesh.receiveShadow=true;
    target.add(mesh);
  }
  const reveal=new THREE.MeshStandardMaterial({
    color:0xe6dac7,roughness:.92,emissive:0x544939,emissiveIntensity:.18
  });
  function lineWindow(x,bottom,top,width){
    const start=7.94,end=11.96,depth=end-start;
    function lining(name,w,h,px,py){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),reveal);
      mesh.name=name;
      mesh.position.set(px,py,(start+end)/2);
      mesh.receiveShadow=true;
      target.add(mesh);
    }
    for(const side of [-1,1]){
      lining('Nordfenster_Helle_Laibung',.027,top-bottom,x+side*(width/2+.005),(bottom+top)/2);
    }
    lining('Nordfenster_Heller_Sturz',width,.027,x,top+.005);
    lining('Nordfenster_Helle_Sohlbank',width,.036,x,bottom-.008);
  }
  for(const {floor} of WINDOW_STOREYS){
    const low=[0,5.16,10.33][floor],high=[5.16,10.33,14][floor];
    const portal={x:0,width:2.68,bottom:.89,top:portalLintelY};
    buildNorthWallBand(floor,low,high,-23.5,23.5,portal,(a,b,bottom,top)=>{
      masonry(a,b,bottom,top,8);
    });
    for(const {x,bottom,top,width,stage} of northOpeningsForBand(floor,low,high)){
      if(stage===undefined)lineWindow(x,bottom,top,width);
    }
  }
  for(const {x,bottom,top,width} of STAIR_WINDOWS)lineWindow(x,bottom,top,width);
}
