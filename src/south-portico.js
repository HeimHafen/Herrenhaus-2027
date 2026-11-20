export const SOUTH_BALCONY = Object.freeze({halfWidth:11.57, railZ:-16.145, deck:5.34});

export const SOUTH_TERRACE = Object.freeze([
  { halfWidth:12.76, front:-18.20, top:.225 },
  { halfWidth:12.42, front:-17.85, top:.445 },
  { halfWidth:12.08, front:-17.50, top:.665 },
  { halfWidth:11.74, front:-17.15, top:.89 }
]);

export function buildSouthPortico(THREE, exterior, originalModel, mats) {
  const group=new THREE.Group();
  group.name='Suedfassade_Landgut_V54';
  exterior.add(group);

  originalModel.traverse(part=>{
    const match=part.isMesh && /^Cube\.?(\d+)$/.exec(part.name);
    if(match && Number(match[1])>=75 && Number(match[1])<=140)part.visible=false;
  });

  const stone=mats.facadeWall, trim=mats.trim, column=mats.columnFinish;
  const iron=new THREE.MeshStandardMaterial({color:0x302921,roughness:.48,metalness:.57});
  function mesh(name,geometry,x,y,z,material){
    const obj=new THREE.Mesh(geometry,material);
    obj.name=name;
    obj.position.set(x,y,z);
    obj.castShadow=true;
    obj.receiveShadow=true;
    group.add(obj);
    return obj;
  }
  function box(name,x,y,z,w,h,d,material=stone){
    return mesh(name,new THREE.BoxGeometry(w,h,d),x,y,z,material);
  }

  const wall=-11.96;
  let bottom=.005;
  for(const step of SOUTH_TERRACE){
    const depth=wall-step.front;
    box('Suedterrasse_Stufe',0,(step.top+bottom)/2,(wall+step.front)/2,
      step.halfWidth*2,step.top-bottom,depth,mats.stairStone);
    box('Suedterrasse_Stufenkante',0,step.top-.023,step.front+.018,
      step.halfWidth*2+.035,.046,.075,trim);
    bottom=step.top;
  }

  const columnZ=-16.35;
  const shaftBottom=1.20, shaftTop=13.25;
  const foot=new THREE.LatheGeometry([
    [0,0],[.49,0],[.49,.035],[.46,.052],[.436,.079],[.41,.108],[.39,.155],[.392,.215],[.40,.225]
  ].map(([x,y])=>new THREE.Vector2(x,y)),48);
  const capital=new THREE.LatheGeometry([
    [.345,0],[.365,.025],[.374,.11],[.40,.137],[.414,.166],[.45,.194],[.475,.222],[.475,.256],[0,.256]
  ].map(([x,y])=>new THREE.Vector2(x,y)),48);
  const shaft=new THREE.CylinderGeometry(.345,.40,shaftTop-shaftBottom,56);
  const columnAxes=[-10,-6,-2,2,6,10];
  for(const x of columnAxes){
    box('Suedportikus_Saeulenplinthe',x,.943,columnZ,1.05,.106,1.05,trim);
    mesh('Suedportikus_Profilbasis',foot,x,.99,columnZ,column);
    mesh('Suedportikus_Glatter_Saeulenschaft',shaft,x,(shaftTop+shaftBottom)/2,columnZ,column);
    mesh('Suedportikus_Rundkapitell',capital,x,shaftTop,columnZ,column);
    box('Suedportikus_Abakus',x,13.529,columnZ,1.02,.054,1.00,trim);
  }
  // Shallow limestone panels sit below the continuous roof slab. Keep the
  // original soffit height at the column heads and expose only fine joints.
  const soffit=mats.soffit.clone();
  soffit.name='Suedportikus_Matter_Kalkstein';
  soffit.roughness=1;
  soffit.roughnessMap=null;
  soffit.normalScale.multiplyScalar(.45);
  soffit.emissiveIntensity=.045;
  const soffitBottom=13.554, panelDepth=.021, joint=.014;
  const soffitFront=-17.11, soffitBack=-11.93, soffitHalf=11.125;
  box('Suedportikus_Dachplatte',0,13.637,-14.52,soffitHalf*2,.13,soffitBack-soffitFront,soffit);
  const spotTrim=new THREE.MeshStandardMaterial({color:0x7c674c,metalness:.55,roughness:.46});
  const spotLens=new THREE.MeshBasicMaterial({color:0xffdda9});
  // One recessed downlight in each bay between adjacent columns.
  for(let i=1;i<columnAxes.length;i++){
    const x=(columnAxes[i-1]+columnAxes[i])/2,z=-15.72;
    mesh('Suedportikus_Strahler_Fassung',new THREE.CylinderGeometry(.105,.105,.035,24),
      x,soffitBottom-.012,z,spotTrim);
    mesh('Suedportikus_Strahler_Linse',new THREE.CylinderGeometry(.082,.082,.009,24),
      x,soffitBottom-.034,z,spotLens);
    const spot=new THREE.SpotLight(0xffd2a0,100,15,.40,.70,2);
    spot.name='Suedportikus_Strahler_Warmweiss';
    spot.position.set(x,soffitBottom-.046,z);
    spot.target.position.set(x,4.4,-13.40);
    group.add(spot,spot.target);
  }
  const border=.15;
  const panelY=soffitBottom+panelDepth/2;
  const xEdges=[-soffitHalf+border,...columnAxes,soffitHalf-border];
  const zEdges=[soffitFront+border,columnZ,-14.92,-13.48,soffitBack-border];
  for(let i=0;i<xEdges.length-1;i++){
    const x0=xEdges[i],x1=xEdges[i+1];
    for(let j=0;j<zEdges.length-1;j++){
      const z0=zEdges[j],z1=zEdges[j+1];
      box('Suedportikus_Kalkstein_Deckenfeld',(x0+x1)/2,panelY,(z0+z1)/2,
        x1-x0-joint,panelDepth,z1-z0-joint,soffit);
    }
  }
  for(const z of [soffitFront+border/2,soffitBack-border/2]){
    box('Suedportikus_Deckenrand',0,panelY,z,soffitHalf*2,panelDepth,border,soffit);
  }
  for(const side of [-1,1]){
    box('Suedportikus_Deckenrand',side*(soffitHalf-border/2),panelY,-14.52,
      border,panelDepth,soffitBack-soffitFront-2*border,soffit);
  }
  box('Suedportikus_Schlanke_Blende',0,13.79,-14.51,22.30,.22,5.25,stone);
  box('Suedportikus_Tropfkante',0,13.922,-14.53,22.45,.048,5.32,trim);
  box('Suedportikus_Dunkle_Dachkante',0,13.965,-14.53,22.54,.046,5.37,mats.roof);

  // The edge of the balcony enters the rear quadrant of every shaft.
  // The full-height columns remain visible in front of the balcony.
  const {halfWidth:half,deck,railZ}=SOUTH_BALCONY, railTop=6.38;
  const front=columnZ+.13;
  const back=wall+.04;
  const deckWidth=half*2+.12, depth=back-front;
  // Use the same limestone as the elevation so the edge and underside read
  // as one piece of stone. The drip moulding returns along both flank edges.
  box('Suedbalkon_Kalksteinplatte',0,deck-.103,(back+front)/2,deckWidth,.206,depth,stone);
  const drip=.026;
  box('Suedbalkon_Profilkante',0,deck-.044,front,deckWidth+drip,.031,drip,stone);
  for(const side of [-1,1]){
    box('Suedbalkon_Seitliche_Profilkante',side*deckWidth/2,deck-.044,
      (back+front+drip/2)/2,drip,.031,depth-drip/2,stone);
  }
  const railRadius=THREE.MathUtils.lerp(.40,.345,(railTop-shaftBottom)/(shaftTop-shaftBottom));
  const contact=Math.sqrt(railRadius**2-(railZ-columnZ)**2)-.016;
  const postPositions=[];
  function rail(x0,z0,x1,z1){
    const length=Math.hypot(x1-x0,z1-z0);
    for(const [y,h] of [[deck+.08,.034],[railTop,.040]]){
      const obj=box('Suedbalkon_Eisenholm',(x0+x1)/2,y,(z0+z1)/2,length,h,.056,iron);
      obj.rotation.y=-Math.atan2(z1-z0,x1-x0);
    }
    const count=Math.round(length/.205);
    for(let i=1;i<count;i++){
      const t=i/count;
      postPositions.push([x0+(x1-x0)*t,z0+(z1-z0)*t]);
    }
  }
  let start=-half;
  for(const x of columnAxes){
    rail(start,railZ,x-contact,railZ);
    start=x+contact;
  }
  rail(start,railZ,half,railZ);
  for(const side of [-1,1]){
    const x=side*half;
    const anchorZ=wall-.009;
    rail(x,railZ,x,anchorZ);
    for(const y of [deck+.08,railTop]){
      box('Suedbalkon_Wandanker',x,y,anchorZ,.105,.102,.036,iron);
    }
  }
  const rods=new THREE.InstancedMesh(new THREE.CylinderGeometry(.013,.013,railTop-deck-.05,8),iron,postPositions.length);
  const matrix=new THREE.Matrix4();
  postPositions.forEach(([x,z],index)=>rods.setMatrixAt(index,matrix.makeTranslation(x,(railTop+deck+.05)/2,z)));
  rods.name='Suedbalkon_Eisenstaebe';
  rods.castShadow=true;
  group.add(rods);
  for(const x of [-half,half]){
    box('Suedbalkon_Eisenpfosten',x,(deck+railTop)/2,railZ,.065,railTop-deck+.055,.065,iron);
    mesh('Suedbalkon_Knauf',new THREE.SphereGeometry(.052,12,8),x,railTop+.065,railZ,iron);
  }
  group.userData={columns:6,balconies:1,geometryVersion:'Suedfassade-Landgut-V54'};
  return group;
}
