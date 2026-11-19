// The walkable shell has separate plaster wall segments surrounding the real
// south and side openings. Previously those exposed *interior* beige/grey plaster
// while the decorative facade used PBR limestone. Thin skins precisely trace
// each wall segment without blocking apertures or modifying collisions.
export function cladStructuralExterior(THREE, structure, exterior, material){
  let count=0;
  for(const wall of structure.children){
    if(!wall.isMesh || wall.geometry.type!=='BoxGeometry')continue;
    const {width,height,depth}=wall.geometry.parameters;
    const name=wall.name||'';
    let x=wall.position.x,y=wall.position.y,z=wall.position.z;
    let w,h=height,d;
    if(name.startsWith('Aussenwand_')){
      const side=Math.sign(x);
      if(!side)continue;
      x=side*23.431; w=.021;d=depth-.006;h=height-.006;
    }else if(name.startsWith('Suedwand_')){
      z=-11.946; d=.021;w=width-.006;h=height-.006;
    }else continue;
    const skin=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    skin.position.set(x,y,z);
    skin.name='Aussenputz_PBR_'+wall.name+'_'+count;
    skin.castShadow=false;
    skin.receiveShadow=true;
    exterior.add(skin);
    count++;
  }
  exterior.userData.exteriorSkins=count;
  return count;
}
