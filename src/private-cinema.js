import * as THREE from 'three';

export function buildPrivateCinema(scene, room, level, obstacles) {
  const {x1,x2,z1,z2}=room;
  const x=(x1+x2)/2, y=level.floor;
  const group=new THREE.Group();
  group.name='Privatkino';
  scene.add(group);

  const loader=new THREE.TextureLoader();
  function texture(path,color=false){
    const map=loader.load('./assets/'+path);
    if(color)map.colorSpace=THREE.SRGBColorSpace;
    return map;
  }
  const weave=texture('entry-finish/westtreppe-wollgewebe.jpg');
  const fabric=new THREE.MeshStandardMaterial({color:0x242126,roughness:.96,bumpMap:weave,bumpScale:.018});
  const velvet=new THREE.MeshPhysicalMaterial({color:0x551120,roughness:.89,sheen:1,sheenColor:0x94344b,
    sheenRoughness:.75,bumpMap:weave,bumpScale:.012});
  const wood=new THREE.MeshStandardMaterial({color:0x866047,map:texture('wood/eiche-dunkel-v26.jpg',true),
    bumpMap:texture('wood/oak-2027-bump.jpg'),bumpScale:.015,roughness:.61});
  const wool=weave.clone();
  wool.wrapS=wool.wrapT=THREE.RepeatWrapping;
  wool.repeat.set(8,9);
  const carpet=new THREE.MeshStandardMaterial({color:0x282121,roughness:1,bumpMap:wool,bumpScale:.016});
  const black=new THREE.MeshStandardMaterial({color:0x100e10,roughness:.94});
  const brass=new THREE.MeshStandardMaterial({color:0x9a6c3c,roughness:.5,metalness:.57});
  const amber=new THREE.MeshStandardMaterial({color:0xf1bb75,emissive:0xffaa4e,emissiveIntensity:.65});
  function mesh(name,geometry,material,px,py,pz){
    const model=new THREE.Mesh(geometry,material);
    model.name=name;
    model.position.set(px,py,pz);
    model.receiveShadow=true;
    group.add(model);
    return model;
  }
  function box(name,w,h,d,material,px,py,pz){
    return mesh(name,new THREE.BoxGeometry(w,h,d),material,px,py,pz);
  }

  const front=z1+.22, rear=z2-.095, left=x1+.095, right=x2-.095;
  const width=right-left, length=rear-front, midZ=(front+rear)/2;
  const ceiling=level.top-.10;
  box('Kino_Wollteppich',width,.024,length,carpet,x,y+.055,midZ);
  box('Kino_Matte_Decke',width,.075,length,black,x,ceiling,midZ);
  for(const side of [left,right]){
    box('Kino_Akustikverkleidung',.036,ceiling-y,length,fabric,side,(ceiling+y)/2,midZ);
    box('Kino_Nussbaum_Sockel',.074,.98,length,wood,side,y+.54,midZ);
    box('Kino_Handlaufprofil',.11,.055,length,wood,side,y+1.045,midZ);
    box('Kino_Deckenprofil',.095,.044,length,brass,side,ceiling-.07,midZ);
    const toward=side===left?1:-1;
    for(let i=0;i<8;i++){
      const z=front+(i+.5)*length/8;
      box('Kino_Holzkassette',.032,.70,length/8-.125,wood,side+toward*.046,y+.52,z);
      box('Kino_Stoffpaneel',.030,2.72,length/8-.075,fabric,side+toward*.025,y+2.49,z);
    }
  }
  const entryCenter=x, entryHalf=.90;
  for(const [from,to] of [[left,entryCenter-entryHalf],[entryCenter+entryHalf,right]]){
    box('Kino_Rueckwand_Stoff',to-from,ceiling-y,.035,fabric,(from+to)/2,(ceiling+y)/2,rear);
    box('Kino_Rueckwand_Holz',to-from,.98,.078,wood,(from+to)/2,y+.54,rear-.024);
  }
  box('Kino_Tuersturz_Stoff',width,ceiling-y-2.60,.035,fabric,x,(ceiling+y+2.60)/2,rear);

  // A folded full-width blackout wall conceals the south glazing.
  const curtain=new THREE.PlaneGeometry(width,ceiling-y-.14,192,15);
  const vertices=curtain.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const u=vertices.getX(i),v=vertices.getY(i);
    vertices.setZ(i,.038*Math.cos(u*27)+.013*Math.sin(u*53+v*.4));
  }
  curtain.computeVertexNormals();
  const liner=box('Kino_Lichtdichter_Hintergrund',width,ceiling-y,.045,black,x,(ceiling+y)/2,front-.075);
  liner.castShadow=true;
  mesh('Kino_Verdunkelungsvorhang',curtain,velvet,x,(ceiling+y-.14)/2+.11,front);
  box('Kino_Leinwandrahmen',3.48,1.64,.13,black,x,y+2.24,front+.22);
  const still=texture('entry-finish/flussufer.jpg',true);
  const projection=new THREE.MeshBasicMaterial({map:still,color:0xbfb3a0});
  mesh('Kino_Leinwand',new THREE.PlaneGeometry(3.30,1.46),projection,x,y+2.24,front+.29);
  box('Kino_Frontvertäfelung',3.51,.80,.105,wood,x,y+.46,front+.21);

  const platform={x0:x-1.91,x1:x+1.91,z0:-6.75,z1:-5.16,height:.18};
  box('Kino_Podest',platform.x1-platform.x0,platform.height,platform.z1-platform.z0,
    carpet,x,y+.066+platform.height/2,(platform.z0+platform.z1)/2);
  for(const sx of [-1,1]){
    box('Kino_Podestlicht',.115,.027,.015,amber,x+sx*1.71,y+.144,platform.z1+.01);
  }

  function cushion(w,h,d,r){
    const cx=w/2-r,cy=h/2-r;
    const outline=new THREE.Shape();
    outline.moveTo(-cx,-cy-r);
    outline.lineTo(cx,-cy-r);outline.quadraticCurveTo(cx+r,-cy-r,cx+r,-cy);
    outline.lineTo(cx+r,cy);outline.quadraticCurveTo(cx+r,cy+r,cx,cy+r);
    outline.lineTo(-cx,cy+r);outline.quadraticCurveTo(-cx-r,cy+r,-cx-r,cy);
    outline.lineTo(-cx-r,-cy);outline.quadraticCurveTo(-cx-r,-cy-r,-cx,-cy-r);
    return new THREE.ExtrudeGeometry(outline,{
      depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.023,bevelThickness:.023,curveSegments:5
    }).translate(0,0,-d/2);
  }
  const seat=cushion(.68,.22,.68,.095);
  const backrest=cushion(.75,.77,.17,.16);
  const armrest=cushion(.14,.22,.67,.06);
  const cupGeometry=new THREE.TorusGeometry(.048,.009,8,16);
  for(const [z,rise] of [[-8.13,0],[-5.96,platform.height]]){
    for(const offset of [-1.07,0,1.07]){
      const cx=x+offset, base=y+.067+rise;
      box('Kino_Sessel_Fuss',.71,.175,.63,wood,cx,base+.088,z);
      mesh('Kino_Samtsessel_Sitz',seat,velvet,cx,base+.35,z-.03);
      const back=mesh('Kino_Samtsessel_Lehne',backrest,velvet,cx,base+.67,z+.33);
      back.rotation.x=.12;
      for(const side of [-1,1]){
        const ax=cx+side*.42;
        mesh('Kino_Samtsessel_Armlehne',armrest,velvet,ax,base+.49,z);
        mesh('Kino_Messingbecherring',cupGeometry,brass,ax,base+.616,z-.18).rotation.x=-Math.PI/2;
      }
      obstacles.push({x:cx,z:z+.015,hw:.53,hd:.48});
    }
  }

  const lighting=new THREE.Group();
  lighting.visible=false;
  group.add(lighting);
  const screenGlow=new THREE.PointLight(0xd2baa1,4,3.1,2);
  screenGlow.position.set(x,y+1.83,front+.73);
  lighting.add(screenGlow);
  for(const side of [left,right]){
    const toward=side===left?1:-1;
    for(const z of [-9.38,-6.33]){
      const px=side+toward*.13;
      box('Kino_Messing_Wandleuchte',.10,.32,.15,brass,px,y+1.75,z);
      mesh('Kino_Leuchtenschirm',new THREE.CylinderGeometry(.09,.12,.20,20),amber,px+toward*.085,y+1.92,z);
      const light=new THREE.PointLight(0xffb36e,7.5,3.1,2);
      light.position.set(px+toward*.26,y+1.91,z);
      lighting.add(light);
    }
  }
  const inside=(px,pz)=>px>x1&&px<x2&&pz>z1&&pz<z2;
  return {
    contains:inside,
    setLit(visible){lighting.visible=visible;},
    floorOffset(px,pz){
      return (px>platform.x0&&px<platform.x1&&pz>platform.z0&&pz<platform.z1)?platform.height:0;
    },
    start:{x,z:z2-.46}
  };
}
