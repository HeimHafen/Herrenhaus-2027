import {
  WINDOW_STOREYS, NORTH_WINDOW_AXES, SOUTH_WINDOW_AXES, SIDE_WINDOW_AXES
} from './window-layout.js?v=20261118-v12';

// V12: Every ornament is genuine 3D geometry, oriented to its facade.
// The masonry rhythm is quiet; ornate surrounds occur only in selected bays.
// No copied geometry, inscriptions, or textures from the Sketchfab screenshot.
export function buildHeritageOrnaments(THREE, exterior, southPortico, mats, {skipNorthAxis=null,skipWindowSurrounds=false}={}) {
  const stone=mats.ornamentStone, edge=mats.windowStone;
  let sculptedWindows=0, addedMeshes=0, north=0, south=0, sides=0;
  const colZFront=[18.10,14.90];
  function boxAt(label, origin,angle,dx,y,dz,w,h,d,material=stone) {
    // local facade coordinates (dx, y, dz) rotated around the building Y axis
    const c=Math.cos(angle),s=Math.sin(angle);
    const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    part.name='Heritage_'+label;
    part.position.set(origin[0]+c*dx+s*dz,y,origin[1]-s*dx+c*dz);
    part.rotation.y=angle;
    part.castShadow=part.receiveShadow=true;
    exterior.add(part);addedMeshes++;
    return part;
  }
  function curveAt(label,origin,angle,curvePoints,tubeRadius,material=stone) {
    const c=Math.cos(angle),s=Math.sin(angle);
    const points=curvePoints.map(([x,y,z])=>new THREE.Vector3(
      origin[0]+c*x+s*z,y,origin[1]-s*x+c*z));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),
      18,tubeRadius,6,false),material);
    mesh.name='Heritage_'+label;
    mesh.castShadow=mesh.receiveShadow=true;
    exterior.add(mesh);addedMeshes++;
  }
  function rosette(label,origin,angle,x,y,depth,r=.095) {
    const c=Math.cos(angle),s=Math.sin(angle);
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),stone);
    mesh.name='Heritage_'+label;
    mesh.position.set(origin[0]+c*x+s*depth,y,origin[1]-s*x+c*depth);
    // flattened along facade normal, slightly elongated vertically
    mesh.scale.set(1.0,.75,.34);
    mesh.rotation.y=angle;
    mesh.castShadow=mesh.receiveShadow=true;
    exterior.add(mesh);addedMeshes++;
  }
  function ornamentWindow(face,axis) {
    let origin,angle,kind;
    if(face==='north'){origin=[axis,12.265];angle=0;kind='North';north++;}
    else if(face==='south'){origin=[axis,-12.150];angle=Math.PI;kind='South';south++;}
    else {const side=face==='east'?1:-1;
      origin=[side*23.540,axis];angle=side*Math.PI/2;kind='Side';sides++;}
    // The first-floor window is 2.5m tall, centred on y=7.80.
    // Its crown stays BELOW the shared upper stringcourse at y=9.49.
    const base=WINDOW_STOREYS[1].y;
    const top=base+1.25;
    const id=`${kind}_${axis}`;
    const width=(face==='east'||face==='west')?1.76:1.72;
    const outer=width+.38;
    const w2=outer/2;
    // Deep sand-stone architrave with a recessed shadow reveal.
    for(const dir of [-1,1]){
      boxAt(id+'_StoneJamb_'+dir,origin,angle,dir*(width/2+.14),base,.09,
        .095,2.66,.11,edge);
      boxAt(id+'_Jamb_Rebate_'+dir,origin,angle,dir*(width/2+.06),base,.15,
        .048,2.52,.07,stone);
      // Organic relief is small and restrained: one stylised leaf on each bracket.
      boxAt(id+'_Consoles_'+dir,origin,angle,dir*(w2-.06),top+.16,.17,
        .16,.25,.14,stone);
      rosette(id+'_Leaf_'+dir,origin,angle,dir*(w2-.06),top+.17,.255,.080);
    }
    boxAt(id+'_CrownLintel',origin,angle,0,top+.15,.17,outer+.15,.115,.19,edge);
    boxAt(id+'_CrownFrieze',origin,angle,0,top+.245,.15,outer+.10,.115,.13,stone);
    boxAt(id+'_CrownCap',origin,angle,0,top+.322,.165,outer+.23,.045,.22,edge);
    // A carved central cartouche and a low relief, without writing or symbols.
    boxAt(id+'_CartouchePanel',origin,angle,0,top+.249,.235,.51,.115,.055,edge);
    rosette(id+'_Cartouche',origin,angle,0,top+.256,.282,.083);
    for(const dir of [-1,1]) {
      const start=dir*.22;
      curveAt(id+'_LeafScroll_'+dir,origin,angle,
        [[start,top+.24,.272],[dir*.32,top+.30,.280],
         [dir*.42,top+.24,.275],[dir*.36,top+.20,.282]],.018,stone);
    }
    // Below the glass: shallow sandstone apron, tied to the existing sill.
    const bottom=base-1.25;
    boxAt(id+'_Apron',origin,angle,0,bottom-.202,.16,outer-.10,.18,.10,stone);
    boxAt(id+'_ApronLowerEdge',origin,angle,0,bottom-.315,.18,outer,.045,.14,edge);
    sculptedWindows++;
  }

  // V25: Real 6-over-6 GLB windows have their OWN complete frames.
  // Extra historical jambs/crowns would produce double borders and floating
  // stone posts (visible in the user's V24 screenshots). Suppress those ONLY
  // when using the real-window mode. Column details remain untouched.
  if(!skipWindowSurrounds){
    for(const a of NORTH_WINDOW_AXES.filter(a=>Math.abs(a)>=10 && a!==skipNorthAxis))ornamentWindow('north',a);
    for(const a of SOUTH_WINDOW_AXES.filter(a=>Math.abs(a)>=10))ornamentWindow('south',a);
    for(const a of SIDE_WINDOW_AXES.filter((_,i)=>i%2===0)){
      ornamentWindow('west',a);
      ornamentWindow('east',a);
    }
  }

  // The existing monumental columns are preserved. These smaller complementary
  // 3D mouldings dress their bases/capitals without changing the original shafts.
  let columnDetails=0;
  const ringGeo=new THREE.TorusGeometry(.63,.065,8,36);
  for(const [x,z] of [...[-7.40,-2.47,2.47,7.40].map(x=>[x,colZFront[0]]), ...[-7.40,7.40].map(x=>[x,colZFront[1]])]) {
    if(typeof x!=='number')continue;
    const torus=new THREE.Mesh(ringGeo,mats.capitalFinish);
    torus.name='Heritage_Front_Capital_Echinus';
    torus.rotation.x=-Math.PI/2;
    torus.position.set(x,10.93,z);
    torus.castShadow=torus.receiveShadow=true;
    exterior.add(torus);addedMeshes++;
    boxAt('Front_Capital_Abacus',[x,z],0,0,11.21,0,1.34,.15,1.34,mats.capitalFinish);
    boxAt('Front_Capital_Bead',[x,z],0,0,11.08,0,1.15,.07,1.15,mats.capitalFinish);
    for(const dir of [-1,1]) {
      rosette('Front_Capital_Acanthus_'+dir,[x,z],0,dir*.29,11.10,.63,.074);
    }
    columnDetails++;
  }

  // Existing Ionic scrolls on the SOUTH columns remain unchanged. Small
  // sculpted flowers bring the carved material closer to the palatial windows.
  for(const x of [-6.60,-3.96,-1.32,1.32,3.96,6.60]){
    rosette('Rear_Capital_Rosette',[x,-15.76],Math.PI,0,12.77,.62,.085);
    columnDetails++;
  }
  const stats={version:'V25',sculptedWindows,addedMeshes,columnDetails,
    north,south,sides,maintainStructuralOpenings:true};
  exterior.userData.heritage=stats;
  return stats;
}
