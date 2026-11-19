// Herrenhaus 2027 V19 – integrated entrance fanlight with continuous arch.
// True extruded stone arch (one closed planar outline), no exposed open-ended
// TubeGeometry joints, no free-floating side brackets or superimposed third ring.
export function buildEntranceFanlight(THREE, exterior, {stone,sash,glass}) {
  const portal = new THREE.Group();
  portal.name = 'Nordportal_Geschlossener_Halbkreisbogen_V19';
  exterior.add(portal);
  const BASE_Y=4.245;
  const STONE_OUT={rx:1.585,ry:.595};
  const STONE_IN ={rx:1.455,ry:.476};
  const segments=96;
  // Follow the same spring line for both curves. The 0.13 m wide ring has
  // planar end caps so that it meets the vertical jambs without visible nubs.
  function ringShape(outer,inner){
    const outline = new THREE.Shape();
    outline.moveTo(outer.rx,0);
    for(let i=1;i<=segments;i++){
      const t=Math.PI*i/segments;
      outline.lineTo(outer.rx*Math.cos(t),outer.ry*Math.sin(t));
    }
    outline.lineTo(-inner.rx,0);
    for(let i=segments-1;i>=0;i--){
      const t=Math.PI*i/segments;
      outline.lineTo(inner.rx*Math.cos(t),inner.ry*Math.sin(t));
    }
    outline.closePath();
    return outline;
  }
  function extrudedRing(name,outer,inner,z,depth,mat,parent=portal){
    const geo=new THREE.ExtrudeGeometry(ringShape(outer,inner),{
      depth,steps:1,bevelEnabled:true,bevelSize:.004,
      bevelThickness:.004,bevelSegments:2,curveSegments:16
    });
    const obj=new THREE.Mesh(geo,mat);
    obj.name=name;
    obj.position.set(0,BASE_Y,z);
    obj.castShadow=true;obj.receiveShadow=true;
    parent.add(obj);
    return obj;
  }
  function box(name,x,y,z,w,h,d,mat,parent=portal){
    const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    obj.name=name;obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;
    parent.add(obj);return obj;
  }
  // The stone outline ends exactly on the jamb spring line; no vertical
  // cubes project above the ring. The door lintel under this element in
  // facade.js is the same support for the entire fanlight span.
  extrudedRing('Oberlicht_Aeussere_Steinlaibung',STONE_OUT,STONE_IN,12.505,.066,stone);
  const sashOut={rx:1.462,ry:.482};
  const sashIn={rx:1.417,ry:.441};
  extrudedRing('Oberlicht_Innenrahmen_Lackiert',sashOut,sashIn,12.573,.028,sash);

  const pane = new THREE.Shape();
  pane.moveTo(sashIn.rx,0);
  for(let i=1;i<=segments;i++){
    const t=Math.PI*i/segments;
    pane.lineTo(sashIn.rx*Math.cos(t),sashIn.ry*Math.sin(t));
  }
  pane.lineTo(sashIn.rx,0);pane.closePath();
  const glassObj=new THREE.Mesh(new THREE.ShapeGeometry(pane),glass);
  glassObj.name='Oberlicht_Einzelne_Glasscheibe';
  glassObj.position.set(0,BASE_Y,12.559);
  glassObj.castShadow=false;glassObj.receiveShadow=false;
  portal.add(glassObj);
  // A slim horizontal timber glazing bar, fully inside the arched stone frame.
  box('Oberlicht_Gerade_Sprossenbasis',0,BASE_Y+.017,12.595,2.83,.033,.040,sash);

  // Seven true radial glazing bars ending INSIDE the inset sash, without
  // crossing the stone curvature or causing floating termini.
  const originY=BASE_Y+.028;
  for(let i=1;i<=7;i++){
    const t=Math.PI*i/8;
    const x=(sashIn.rx-.035)*Math.cos(t);
    const y=BASE_Y+(sashIn.ry-.037)*Math.sin(t);
    const dx=x,dy=y-originY;
    const len=Math.hypot(dx,dy);
    const member=box('Oberlicht_Sonnenstrahl_'+i,dx/2,(originY+y)/2,
      12.599,.023,len,.030,sash);
    member.rotation.z=-Math.atan2(dx,dy);
  }
  const hub=new THREE.Mesh(new THREE.SphereGeometry(.034,16,10),sash);
  hub.name='Oberlicht_Mittelpunkt';hub.position.set(0,originY,12.609);
  hub.scale.set(1,.63,.45);portal.add(hub);

  // Matching interior view is ONLY a frame. The glass is shared, not doubled.
  const inner=new THREE.Group();
  inner.name='Nordportal_Innenseite_Stimmiger_Oberlichtbogen';
  portal.add(inner);
  extrudedRing('Innenportal_Geschlossene_Steinlaibung',STONE_OUT,STONE_IN,11.935,.052,stone,inner);
  extrudedRing('Innenportal_Passender_Sprossenrahmen',sashOut,sashIn,11.991,.021,sash,inner);
  portal.userData={version:'V19',archBase:BASE_Y,archCrown:BASE_Y+STONE_OUT.ry,
    glassParts:1,radials:7,stoneRings:2,continuousArch:true,freeEndcaps:0};
  return portal;
}
