import { portalThresholdY, portalLintelY, portalHeadClearance } from './north-portal.js?v=29';

// Herrenhaus 2027 – V26. Massive rectangular oak double door, based on the user's
// approved straight-topped, heavy double-oak-door visual reference.
// The 3D asset is built from actual 3D geometry, not an image plane.
// Coordinates are aligned to the real V25 stone portal and automatic
// proximity-based door animation. Both leaves remain individually hinged.
export function buildOakEntrance(THREE, scene) {
  const door = new THREE.Group();
  door.name = 'Nordportal_V26_Massive_Rechteckige_Eichen_Doppeltuer';
  scene.add(door);

  const loader = new THREE.TextureLoader();
  const albedo = loader.load('./assets/wood/eiche-hell-v30.jpg');
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = 8;
  const bump = loader.load('./assets/wood/eiche-hell-relief-v30.jpg');
  bump.anisotropy = 8;

  function crossGrain(texture) {
    const rotated = texture.clone();
    rotated.center.set(.5,.5);
    rotated.rotation = Math.PI/2;
    rotated.needsUpdate = true;
    return rotated;
  }
  const crossAlbedo = crossGrain(albedo);
  const crossBump = crossGrain(bump);
  const mkOak = (color, roughness, horizontal=false) => new THREE.MeshStandardMaterial({
    color, map:horizontal?crossAlbedo:albedo,
    bumpMap:horizontal?crossBump:bump, bumpScale:.005, metalness:0,
    roughness, side:THREE.DoubleSide
  });
  const oak = mkOak(0xe4cfb2,.57);
  const oakPanel = mkOak(0xe7d2b5,.59);
  const oakMoulding = mkOak(0xeed9bd,.53);
  const oakEdges = mkOak(0xebdcca,.61);
  const oakRail = mkOak(0xe4cfb2,.57,true);
  const oakRailMoulding = mkOak(0xeed9bd,.53,true);
  const oakRailEdge = mkOak(0xebdcca,.61,true);
  const shadow = new THREE.MeshStandardMaterial({color:0x63503a,roughness:.95});
  const bronze = new THREE.MeshStandardMaterial({color:0x59442f,metalness:.78,roughness:.33});
  const bronzeHighlight = new THREE.MeshStandardMaterial({color:0x9b7851,metalness:.79,roughness:.30});
  const bronzeDark = new THREE.MeshStandardMaterial({color:0x30261e,metalness:.68,roughness:.42});

  function prism(parent,name,x,y,z,w,h,d,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.name=name;
    mesh.position.set(x,y,z);
    mesh.castShadow=mesh.receiveShadow=true;
    parent.add(mesh);
    return mesh;
  }
  function shapeRect(w,h,r){
    const s=new THREE.Shape(), x=-w/2,y=-h/2;
    const rr=Math.min(r,w/2,h/2);
    s.moveTo(x+rr,y);
    s.lineTo(x+w-rr,y);s.quadraticCurveTo(x+w,y,x+w,y+rr);
    s.lineTo(x+w,y+h-rr);s.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
    s.lineTo(x+rr,y+h);s.quadraticCurveTo(x,y+h,x,y+h-rr);
    s.lineTo(x,y+rr);s.quadraticCurveTo(x,y,x+rr,y);
    return s;
  }
  // All panel rails have actual depth and real cast shadows, rather than
  // painted lines over a flat slab. The back has the same workmanship.
  function recessedAndRaisedPanel(parent,cx,cy,f,w,h){
    prism(parent,'Fuellung_Schattenvertiefung',cx,cy,f*.103,w+.084,h+.082,.020,shadow);
    prism(parent,'Fuellung_Eichen_Feld',cx,cy,f*.117,w,h,.022,oakPanel);
    for(const [inset,thickness,depth,material,crossMaterial] of [
      [0,.054,.142,oak,oakRail], [.051,.031,.167,oakMoulding,oakRailMoulding],
      [.110,.018,.184,oakEdges,oakRailEdge]
    ]){
      const ww=w-2*inset,hh=h-2*inset;
      prism(parent,'Kassettenprofil_oben',cx,cy+hh/2,f*depth,ww,thickness,.025,crossMaterial);
      prism(parent,'Kassettenprofil_unten',cx,cy-hh/2,f*depth,ww,thickness,.025,crossMaterial);
      prism(parent,'Kassettenprofil_links',cx-ww/2,cy,f*depth,thickness,hh,.025,material);
      prism(parent,'Kassettenprofil_rechts',cx+ww/2,cy,f*depth,thickness,hh,.025,material);
    }
    // Use normalized face coordinates. Three's default extrusion UVs can
    // exceed [0,1] and stretch the border pixels across tall panels.
    const faceWidth=w-.251, faceHeight=h-.252;
    const faceUV=(vertices,index)=>new THREE.Vector2(
      vertices[index*3]/faceWidth+.5, vertices[index*3+1]/faceHeight+.5
    );
    const panelUV={
      generateTopUV(_geometry,vertices,a,b,c){
        return [a,b,c].map(i=>faceUV(vertices,i));
      },
      generateSideWallUV(_geometry,vertices,a,b,c,d){
        return [a,b,c,d].map(i=>faceUV(vertices,i));
      }
    };
    const surface=new THREE.Mesh(new THREE.ExtrudeGeometry(shapeRect(w-.285,h-.286,.017),{
      depth:.014,bevelEnabled:true,bevelThickness:.014,bevelSize:.017,
      bevelSegments:2,steps:1,curveSegments:3,UVGenerator:panelUV
    }),oakPanel);
    surface.name='Kassette_Eiche_mit_echter_3D_Fase';
    surface.position.set(cx,cy,f*.174);
    surface.scale.z=f;
    surface.castShadow=surface.receiveShadow=true;
    parent.add(surface);
  }
  function cylinder(parent,name,x,y,z,top,bottom,height,material,rotX=0){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,12),material);
    mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.x=rotX;
    mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function metalPull(parent,x,face){
    const f=face;
    // Very tall forged-bronze backplate, vertical grip and two standoffs.
    const lockY=1.48;
    const plate=new THREE.Mesh(new THREE.ExtrudeGeometry(shapeRect(.132,.83,.023),{
      depth:.016,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,
      bevelSegments:2,curveSegments:3
    }),bronze);
    plate.position.set(x,lockY,f*.185);plate.scale.z=f;
    plate.name='Beschlag_Langschild_schwarzbronze';plate.castShadow=true;parent.add(plate);
    for(const y of [1.14,1.80]){
      cylinder(parent,'Distanzstueck_Zuggriff',x,y,f*.235,.031,.035,.085,bronzeDark,Math.PI/2);
      cylinder(parent,'Griff_Montagerosette',x,y,f*.254,.057,.057,.015,bronzeHighlight,Math.PI/2);
    }
    cylinder(parent,'Massiver_langer_Zuggriff',x,1.47,f*.304,.036,.036,.60,bronzeHighlight);
    for(const y of [1.155,1.785]){
      const finial=new THREE.Mesh(new THREE.SphereGeometry(.049,10,8),bronzeDark);
      finial.name='Zuggriff_Guss_Endkappe';finial.position.set(x,y,f*.304);
      finial.castShadow=true;parent.add(finial);
    }
    // Independent oversized locking plate and keyhole below pull handle.
    prism(parent,'Schlossplatte',x,.99,f*.197,.119,.159,.024,bronze);
    prism(parent,'Schloss_Kerbe',x,.999,f*.217,.016,.052,.005,shadow);
    cylinder(parent,'Schloss_Schraube',x,.941,f*.218,.012,.012,.012,bronzeHighlight,Math.PI/2);
  }
  // Two inward offset hinges and strong iron bolt heads, instanced to keep
  // mobile Safari's number of draw calls low.
  const heightScale=1.085;
  const leafHeight=portalLintelY-portalHeadClearance-portalThresholdY;
  const extra=leafHeight/heightScale-3.06;

  function decorativeStuds(parent,cx){
    const locations=[];
    const offsets=[-.52,-.31,-.10,.10,.31,.52];
    for(const yy of [.185,2.867+extra])for(const dx of offsets){
      locations.push([cx+dx,yy,.198]);
    }
    const studs=new THREE.InstancedMesh(new THREE.SphereGeometry(.041,10,6),bronzeDark,locations.length);
    studs.name='Geschmiedete_Nieten_Oben_und_Unten';
    studs.castShadow=true;
    const matrix=new THREE.Matrix4();
    for(let i=0;i<locations.length;i++){
      const [x,y,z]=locations[i];
      matrix.compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(1,1,.43));
      studs.setMatrixAt(i,matrix);
    }
    studs.instanceMatrix.needsUpdate=true;
    parent.add(studs);
  }

  const leaves=[];
  for(const side of [-1,1]){
    const leaf=new THREE.Group();
    leaf.name=side===-1?'Tuerfluegel_links':'Tuerfluegel_rechts';
    // hinge pivots are unchanged: animation in main.js needs no alteration
    leaf.position.set(side*1.32,portalThresholdY,12.13);
    leaf.scale.set(.88,heightScale,1.0);
    door.add(leaf);
    const cx=-side*.747;
    // 17 cm actual timber thickness. Overall opening remains rectangular.
    prism(leaf,'Massiver_Eichenkern_17cm',cx,1.53+extra/2,0,1.49,3.06+extra,.17,oak);
    for(const f of [-1,1]){
      // Entirely flat horizontal head, no round arch or fanlight.
      for(const dx of [-.654,.654]){
        prism(leaf,'Tragender_Rahmen_Laengsfries',cx+dx,1.53+extra/2,f*.104,.179,3.00+extra,.046,oak);
        prism(leaf,'Rahmen_Profilkante',cx+dx,1.53+extra/2,f*.140,.027,2.93+extra,.018,oakMoulding);
      }
      for(const [y,h] of [[.125,.250],[1.014,.232],[2.898+extra,.318]]){
        prism(leaf,'Tragender_Eichen_Querfries',cx,y,f*.107,1.38,h,.049,oakRail);
        prism(leaf,'Querfries_Fasenkante',cx,y+h*.36,f*.144,1.255,.019,.018,oakRailMoulding);
      }
      recessedAndRaisedPanel(leaf,cx,.585,f,1.080,.572);
      recessedAndRaisedPanel(leaf,cx,1.929+extra/2,f,1.080,1.594+extra);
      // Long solid bronze handles seen in the approved reference, both sides.
      metalPull(leaf,-side*1.337,f);
      for(const y of [.36,1.55,2.71+extra]){
        prism(leaf,'Scharnierblatt',-side*.084,y,f*.100,.12,.200,.032,bronze);
        cylinder(leaf,'Scharnierachse',-side*.029,y,f*.106,.032,.032,.21,bronzeHighlight);
      }
    }
    decorativeStuds(leaf,cx);
    prism(leaf,'Dunkler_Mittelfalz',-side*1.462,1.53+extra/2,0,.031,3.00+extra,.18,oakEdges);
    if(side===-1){
      // The astragal rides on one leaf and covers the light line from inside.
      prism(leaf,'Eichen_Deckfalz',1.494,1.53+extra/2,-.158,
        .042,3.032+extra,.031,oakEdges);
    }
    leaves.push(leaf);
  }
  door.userData.leaves=leaves;
  door.userData.design='V30-Eichendoppeltuer-hell-bis-zum-Sturz';
  door.userData.material='17 cm massive Eiche, 2 tiefe Kassetten je Fluegel, hell matt geoelt, geschmiedete Bronze';
  door.userData.opening={width:2.638,height:leafHeight,thresholdY:portalThresholdY,lintelY:portalLintelY};
  door.userData.reference='Vom Nutzer freigegebene V25-Konzeptabbildung; als echtes 3D-Modell nachgebaut';
  return door;
}
