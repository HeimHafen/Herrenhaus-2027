import { WINDOW_STOREYS, NORTH_OPENING_WIDTH, northAxesForFloor, openingHeight, ENTRY_WINDOW_BAYS, ENTRY_WINDOW_INNER_FACE } from './window-layout.js?v=95';
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
  function piece(x1,x2,y1,y2,floor){
    let edge=x1;
    if(floor===0){
      for(const {left,right} of ENTRY_WINDOW_BAYS){
        const start=Math.max(x1,left),end=Math.min(x2,right);
        if(end<=start)continue;
        masonry(edge,start,y1,y2,8);
        masonry(start,end,y1,y2,ENTRY_WINDOW_INNER_FACE);
        edge=end;
      }
    }
    masonry(edge,x2,y1,y2,8);
  }
  const reveal=new THREE.MeshStandardMaterial({
    color:0xe6dac7,roughness:.92,emissive:0x544939,emissiveIntensity:.18
  });
  function lineWindow(x,bottom,top,start){
    const end=11.91, depth=end-start;
    const width=NORTH_OPENING_WIDTH;
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
  for(const {floor,y} of WINDOW_STOREYS) {
    const low=[0,5.16,10.33][floor],high=[5.16,10.33,14][floor];
    const h=openingHeight(floor,'north');
    const openings=northAxesForFloor(floor).map(x=>({
      x,r:NORTH_OPENING_WIDTH/2,bottom:y-h/2,top:y+h/2
    }));
    if(floor===0)openings.push({x:0,r:1.34,bottom:.89,top:portalLintelY});
    let edge=-23.5;
    for(const {x,r,bottom,top} of openings.sort((a,b)=>a.x-b.x)){
      piece(edge,x-r,low,high,floor);
      piece(x-r,x+r,low,bottom,floor);
      piece(x-r,x+r,top,high,floor);
      if(floor!==0||x!==0){
        const bay=floor===0&&ENTRY_WINDOW_BAYS.find(entry=>entry.x===x);
        lineWindow(x,bottom,top,bay?ENTRY_WINDOW_INNER_FACE:8);
      }
      edge=x+r;
    }
    piece(edge,23.5,low,high,floor);
  }
}
