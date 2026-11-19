import { WEST_CORE } from './stair-layout.js?v=76';
import { addManorWallFinish, buildGardenHall } from './garden-hall.js?v=87';
import { WEST_STAIR } from './stair-navigation.js?v=76';
import { buildManorPlan } from './manor-plan.js?v=84';
import { portalLintelY } from './north-portal.js?v=29';
import { WINDOW_STOREYS, SIDE_WINDOW_AXES, SOUTH_WINDOW_AXES, SIDE_OPENING_WIDTH, NORTH_OPENING_WIDTH, northAxesForFloor, southOpening, openingHeight, ENTRY_WINDOW_BAYS, ENTRY_WINDOW_INNER_FACE } from './window-layout.js?v=54';
export function buildEmptyInterior(THREE, scene) {
  const plaster = new THREE.MeshStandardMaterial({color:0xeae9e5,roughness:.97});
  const floorStone = new THREE.MeshStandardMaterial({color:0xd0cfcb,roughness:.96});
  const ceilingTrim = plaster; // blank plaster underside, never a marble or patterned surface
  const jamb = new THREE.MeshStandardMaterial({color:0xf7f2e9,roughness:.70});
  const structure = new THREE.Group();
  structure.name='Begehbare_Leere_Innenraeume'; scene.add(structure);
  const walls=[[],[],[]];
  const levels=[
    {floor:.89,top:5.05,name:'Gartengeschoss'},
    {floor:5.34,top:10.16,name:'Hauptgeschoss'},
    {floor:10.44,top:13.42,name:'Wohngeschoss'}
  ];
  const stairs=[];
  const hallWalls=[], gardenSlabs=[];
  function box(cx,cy,cz,w,h,d,mat=floorStone,level=-1,blocking=false,name='Rohbau'){
    const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    obj.name=name;obj.position.set(cx,cy,cz);obj.castShadow=h>.22&&!mat.transparent;
    obj.receiveShadow=true;structure.add(obj);
    if(blocking&&level>=0)walls[level].push({x:cx,z:cz,hw:w/2,hd:d/2});
    if(name==='Gartengeschoss_Boden')gardenSlabs.push(obj);
    if(level===0&&name==='Trennwand')hallWalls.push(obj);
    return obj;
  }
  function beam(from,to,r,material,name){
    const delta=new THREE.Vector3().subVectors(to,from);
    const obj=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),9),material);
    obj.position.copy(from).add(to).multiplyScalar(.5);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    obj.name=name;obj.castShadow=true;structure.add(obj);return obj;
  }
  const wells=[
    {name:'Nebentreppe',center:9.25,laneA:7.77,laneB:10.73,width:1.84,
      start:1.13,turn:5.57,far:7.65},
    {name:'Haupttreppe',center:WEST_CORE.center,laneA:WEST_CORE.laneA,laneB:WEST_CORE.laneB,width:1.67,
      start:1.13,startA:.04,widthA:2.54,edgeInsetA:.27,turn:5.57,far:7.65}
  ];
  // Hauptplatte, darüber jeweils zwei echte Treppenhausöffnungen.
  box(0,.42,0,47,.84,24.10,floorStone,-1,false,'Bestehendes_Fundament');
  for(let i=0;i<levels.length;i++){
    const y=levels[i].floor;
    if(i===0){
      box(0,y+.018,(-11.81+7.89)/2,46.30,.05,19.70,floorStone,-1,false,'Gartengeschoss_Boden');
    } else {
      box(0,y+.018,(-11.78+1.09)/2,46.3,.05,1.09+11.78,floorStone,-1,false,'Geschossdecke_Suedzone');
      // Statically segmented slabs with openings directly derived from the
      // staircase positions: prevent floor/flight intersections after plan edits.
      const xMin=-23.15,xMax=23.15;
      const gaps=wells.map(w=>[w.center-2.68,w.center+2.68]).sort((u,v)=>u[0]-v[0]);
      let cursor=xMin;
      for(const [left,right] of gaps){
        if(left>cursor+.01)box((cursor+left)/2,y+.018,(1.09+7.9)/2,left-cursor,.05,7.9-1.09,floorStone,-1,false,'Geschossdecke_mit_Treppenloch');
        cursor=Math.max(cursor,right);
      }
      if(cursor<xMax-.01)box((cursor+xMax)/2,y+.018,(1.09+7.9)/2,xMax-cursor,.05,7.9-1.09,floorStone,-1,false,'Geschossdecke_mit_Treppenloch');
    }
  }
  // V16: matte, continuous interior ceilings on the State Floor and upper
  // living storey. Floor slabs below remain functional; no carpet or floor
  // finish is created. Stairwell rectangles are deliberately NOT covered.
  function closeUpperCeilings() {
    const y=levels[1].top-.025,thick=.055;
    box(0,y,(-11.78+1.09)/2,46.30,thick,12.87,plaster,-1,false,'State_Floor_Glatte_Decke_Suedzone');
    const sorted=wells.map(w=>[w.center-2.70,w.center+2.70]).sort((a,b)=>a[0]-b[0]);
    let cursor=-23.13;
    for(const [left,right] of sorted){
      if(left>cursor+.02)box((cursor+left)/2,y,(1.09+7.96)/2,left-cursor,thick,6.87,plaster,-1,false,'State_Floor_Glatte_Decke_Nordsegment');
      cursor=Math.max(cursor,right);
    }
    if(cursor<23.13-.02)box((cursor+23.13)/2,y,(1.09+7.96)/2,23.13-cursor,thick,6.87,plaster,-1,false,'State_Floor_Glatte_Decke_Nordsegment');
    // The third storey does not have a walkable fourth-storey stair shaft.
    box(0,levels[2].top-.035,(-11.78+7.96)/2,46.3,.065,19.74,plaster,-1,false,'Wohngeschoss_Glatte_Dachuntersicht');
  }
  closeUpperCeilings();
  function horizontal(level,z,left,right,doors){
    const low=levels[level].floor,high=levels[level].top-.015;
    let at=left;
    for(const [cx,width] of [...doors].sort((a,b)=>a[0]-b[0])){
      const a=Math.max(at,cx-width/2),b=Math.min(right,cx+width/2);
      if(a>at+.03)box((a+at)/2,(low+high)/2,z,a-at,high-low,.17,plaster,level,true,'Trennwand');
      const lintel=Math.min(low+2.60,high-.20);
      if(high>lintel)box((a+b)/2,(lintel+high)/2,z,b-a,high-lintel,.17,plaster,level,false,'Tuersturz');
      at=b;
    }
    if(at<right-.03)box((at+right)/2,(low+high)/2,z,right-at,high-low,.17,plaster,level,true,'Trennwand');
  }
  function vertical(level,x,back,front,doors){
    const low=levels[level].floor,high=levels[level].top-.015;
    let at=back;
    for(const [cz,width] of [...doors].sort((a,b)=>a[0]-b[0])){
      const a=Math.max(at,cz-width/2),b=Math.min(front,cz+width/2);
      if(a>at+.03)box(x,(low+high)/2,(at+a)/2,.17,high-low,a-at,plaster,level,true,'Trennwand');
      const lintel=Math.min(low+2.6,high-.20);
      if(high>lintel)box(x,(lintel+high)/2,(a+b)/2,.17,high-lintel,b-a,plaster,level,false,'Tuersturz');
      at=b;
    }
    if(at<front-.03)box(x,(low+high)/2,(at+front)/2,.17,high-low,front-at,plaster,level,true,'Trennwand');
  }

  const [gardenRooms,stateFloorRooms,secondFloorRooms]=buildManorPlan(THREE,{
    levels,box,horizontal,vertical,structure
  });
  // Align the envelope with the facade openings on every level.
  for(let level=0;level<3;level++){
    const L=levels[level],lo=L.floor,hi=L.top,ht=hi-lo;
    const wy=WINDOW_STOREYS[level].y, wh=openingHeight(level,'side');
    const bottom=Math.max(lo+.48,wy-wh/2),top=Math.min(hi-.28,wy+wh/2);
    for(const side of [-1,1]){
      const x=side*23.28, openings=SIDE_WINDOW_AXES.map(z=>[z-SIDE_OPENING_WIDTH/2,z+SIDE_OPENING_WIDTH/2]);
      let prev=-11.83;
      for(const [a,b] of openings){
        if(a>prev)box(x,(lo+hi)/2,(a+prev)/2,.27,ht,a-prev,plaster,level,true,'Aussenwand_Pfeiler');
        if(bottom>lo)box(x,(lo+bottom)/2,(a+b)/2,.27,bottom-lo,b-a,plaster,level,true,'Aussenwand_Fensterbruestung');
        if(hi>top)box(x,(top+hi)/2,(a+b)/2,.27,hi-top,b-a,plaster,level,true,'Aussenwand_Fenstersturz');

        prev=b;
      }
      if(prev<7.85)box(x,(lo+hi)/2,(prev+7.85)/2,.27,ht,7.85-prev,plaster,level,true,'Aussenwand_Pfeiler');
    }
    // Südseite: Durchgehende öffentliche Außenfassade mit den bisherigen Fensterachsen.
    const southZ=-11.80, openings=SOUTH_WINDOW_AXES.map(axis=>{
      const {x,y,width,height}=southOpening(axis,level);
      return [x-width/2,x+width/2,y-height/2,y+height/2];
    });
    let prev=-23.12;
    for(const [a,b,bottom,top] of openings){
      if(a>prev)box((prev+a)/2,(lo+hi)/2,southZ,a-prev,ht,.27,plaster,level,true,'Suedwand_Pfeiler');
      if(bottom>lo)box((a+b)/2,(lo+bottom)/2,southZ,b-a,bottom-lo,.27,plaster,level,true,'Suedwand_Fensterbruestung');
      if(hi>top)box((a+b)/2,(top+hi)/2,southZ,b-a,hi-top,.27,plaster,level,true,'Suedwand_Fenstersturz');

      prev=b;
    }
    if(prev<23.12)box((prev+23.12)/2,(lo+hi)/2,southZ,23.12-prev,ht,.27,plaster,level,true,'Suedwand_Pfeiler');
    if(level>0){
      const z=7.95, height=openingHeight(level,'north');
      const sill=wy-height/2, head=wy+height/2;
      let edge=-23.15;
      for(const x of northAxesForFloor(level)){
        const left=x-NORTH_OPENING_WIDTH/2, right=x+NORTH_OPENING_WIDTH/2;
        box((edge+left)/2,(lo+hi)/2,z,left-edge,ht,.17,plaster,level,true,'Nordwand_Pfeiler');
        box(x,(lo+sill)/2,z,NORTH_OPENING_WIDTH,sill-lo,.17,plaster,level,true,'Nordwand_Bruestung');
        box(x,(head+hi)/2,z,NORTH_OPENING_WIDTH,hi-head,.17,plaster,level,false,'Nordwand_Sturz');
        edge=right;
      }
      box((edge+23.15)/2,(lo+hi)/2,z,23.15-edge,ht,.17,plaster,level,true,'Nordwand_Pfeiler');
    }
  }

  // The ground storey previously had open north edges and did not have a
  // complete soffit or aligned stairwell/opening junctions. Close the actual
  // lower-floor envelope without placing floors inside either stairwell void.
  function closeGroundFloor(){
    const lev=0,L=levels[lev];
    const low=L.floor, high=L.top;
    const lowerH=high-low;
    const ceilingY=L.top-.025;
    const northZ=7.95;
    // North perimeter: central entrance passage remains physically open,
    // and both stairwells have space behind their turning landings.
    // V20: the inner passage gets a calmer, taller rectangular opening
    // so the entrance axis feels cleaner and less visually blocked.
    // Side wall geometry and collision boxes remain unchanged outside gap.
    const entryGapHalf=1.34, corridorLid=portalLintelY+.01;
    const northHeight=openingHeight(0,'north');
    const northBottom=WINDOW_STOREYS[0].y-northHeight/2;
    const northTop=northBottom+northHeight;
    for(const side of [-1,1]){
      const left=side<0?-23.13:entryGapHalf;
      const right=side<0?-entryGapHalf:23.13;
      let edge=left;
      const bay=ENTRY_WINDOW_BAYS.find(b=>Math.sign(b.x)===side);
      const openings=northAxesForFloor(0).filter(x=>Math.sign(x)===side&&x!==bay.x)
        .map(x=>({x,start:x-NORTH_OPENING_WIDTH/2,end:x+NORTH_OPENING_WIDTH/2}));
      openings.push({start:side<0?bay.left:1.935,end:side<0?-1.935:bay.right});
      for(const {x,start,end} of openings.sort((a,b)=>a.start-b.start)){
        box((edge+start)/2,(low+high)/2,northZ,start-edge,lowerH,.17,plaster,lev,true,'Nordwand_Pfeiler');
        if(x!==undefined){
          box(x,(low+northBottom)/2,northZ,end-start,northBottom-low,.17,plaster,lev,true,'Nordwand_Bruestung');
          box(x,(northTop+high)/2,northZ,end-start,high-northTop,.17,plaster,lev,false,'Nordwand_Sturz');
        }
        edge=end;
      }
      box((edge+right)/2,(low+high)/2,northZ,right-edge,lowerH,.17,plaster,lev,true,'Nordwand_Pfeiler');
    }
    box(0,(corridorLid+high)/2,northZ,
      entryGapHalf*2,high-corridorLid,.17,plaster,lev,false,
      'Eingangshalle_Hoeherer_Rohbau_Durchgang');
    // The entrance passage from the existing automatic double door (z=12.18)
    // to the main hall is enclosed on both sides instead of opening into space.
    // Walls are at x=±1.55, farther out than the original 1.32 m doorway passage.
    for(const x of [-1.56,1.56]){
      box(x, (low+high)/2,10.05,.18,lowerH,4.25,plaster,lev,true,'Eingangsgang_Wand');
    }
    for(const {left,right,x} of ENTRY_WINDOW_BAYS){
      const front=ENTRY_WINDOW_INNER_FACE, back=7.875;
      const width=right-left, depth=front-back, center=(left+right)/2;
      box(center,low+.018,(front+back)/2,width,.05,depth,floorStone,-1,false,'Fensterzimmer_Boden');
      box(center,ceilingY,(front+back)/2,width,.055,depth,ceilingTrim,-1,false,'Fensterzimmer_Decke');
      for(const edge of [left,right]){
        // Keep the entire inner return on the room side of its boundary.
        // A centered 17 cm wall used to protrude into the west entry lining.
        const innerEdge=x<0?right:left;
        const wallX=edge===innerEdge?Math.sign(x)*1.85:edge;
        box(wallX,(low+high)/2,(front+back)/2,.17,lowerH,depth,plaster,lev,true,'Fensterzimmer_Ruecklauf');
      }
      const w=NORTH_OPENING_WIDTH, yc=(northBottom+northTop)/2;
      box(x,northBottom-.028,front+.12,w+.16,.056,.48,jamb,-1,false,'Fensterzimmer_Fensterbank');
      for(const sign of [-1,1]){
        box(x+sign*(w/2+.035),yc,front-.023,.07,northHeight+.12,.046,jamb,-1,false,'Fensterzimmer_Fensterfutter');
      }
      box(x,northTop+.035,front-.023,w+.14,.07,.046,jamb,-1,false,'Fensterzimmer_Fensterfutter');
    }
    // The original front facade contains the automatic double door;
    // no new northern wall crosses the door opening.

    // Lower-floor ceiling: match the slab cutouts at both staircase shafts.
    // South continuous portion and segmented north zone form a closed soffit.
    const y=ceilingY, thick=.055;
    box(0,y,(-11.78+1.09)/2,46.30,thick,12.87,ceilingTrim,-1,false,'Untergeschoss_Decke_Suedzone');
    const xMin=-23.13,xMax=23.13;
    const gaps=wells.map(w=>[w.center-2.70,w.center+2.70]).sort((a,b)=>a[0]-b[0]);
    let cursor=xMin;
    for(const [left,right] of gaps){
      if(left>cursor+.02)box((cursor+left)/2,y,(1.09+7.96)/2,left-cursor,thick,6.87,ceilingTrim,-1,false,'Untergeschoss_Decke_Nordsegment');
      cursor=Math.max(cursor,right);
    }
    if(cursor<xMax-.02)box((cursor+xMax)/2,y,(1.09+7.96)/2,xMax-cursor,thick,6.87,ceilingTrim,-1,false,'Untergeschoss_Decke_Nordsegment');
    box(0,y,(7.96+12.17)/2,3.04,thick,4.21,ceilingTrim,-1,false,'Untergeschoss_Eingangsgang_Decke');
    // Plaster finish directly above the higher stone portal.
    const entranceSoffit = new THREE.MeshStandardMaterial({
      color:0xf0ede6,roughness:.99,metalness:0,
      emissive:0xa8a39a,emissiveIntensity:.28,side:THREE.DoubleSide
    });
    box(0,portalLintelY+.011,10.10,2.94,.022,4.14,entranceSoffit,-1,false,
      'Rohbau_Eingangsgang_Glatte_Untersicht');

    // The perimeter meets the top of the walls; no visible horizontal gap.
    for(const [z,a,b] of [[-11.55,-23,23],[7.83,-23,WEST_CORE.left],[7.83,WEST_CORE.right,6.51],[7.83,11.98,23]]){
      box((a+b)/2,high-.10,z,b-a,.13,.14,jamb,-1,false,'Untergeschoss_Wand_Deckenabschluss');
    }
    for(const x of [-23.03,23.03]){
      box(x,high-.10,-1.97,.14,.13,19.65,jamb,-1,false,'Untergeschoss_Aussenwand_Deckengesims');
    }
    // Stairwell side walls now continue to the new underside of floor one;
    // the rear (north) side is shut by the north perimeter, while the south
    // stair entrances and their two walking lanes remain completely open.
    for(const well of wells){
      // A thin visible front architrave above each portal, never across the
      // walking volume or low enough to block upper-flight headroom.
      for(const side of well.center<0?[-1]:[-1,1]){
        const x=well.center+side*2.61;
        box(x,low+1.13,1.09,.18,2.26,.22,plaster,-1,false,'Untergeschoss_Treppenportal_Wange');
      }
    }

  }
  closeGroundFloor();
  
  // The two stair cores share the same stonework and runner construction.
  function finishBox(material,x,y,z,width,height,depth,level,blocking,name){
    return box(x,y,z,width,height,depth,material,level,blocking,name);
  }
  const STEPS_PER_RUN=16;
  const stairTextures=new THREE.TextureLoader();
  function stairMap(path,srgb=false){
    const map=stairTextures.load(path);
    if(srgb)map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=8;
    return map;
  }
  const stoneMap=stairMap('./assets/heritage-v14/trim_limestone_albedo.jpg',true);
  const stoneNormal=stairMap('./assets/heritage-v14/trim_limestone_normal.jpg');
  const stoneRoughness=stairMap('./assets/heritage-v14/trim_limestone_roughness.jpg');
  const stoneFinish={map:stoneMap,normalMap:stoneNormal,roughnessMap:stoneRoughness};
  const dressed=new THREE.MeshStandardMaterial({...stoneFinish,color:0xe4dbcd,roughness:.88,
    normalScale:new THREE.Vector2(.55,.55)});
  const railStone=new THREE.MeshStandardMaterial({...stoneFinish,color:0xe8dfd0,roughness:.81,
    normalScale:new THREE.Vector2(.32,.32)});
  const warmPlaster=new THREE.MeshStandardMaterial({
    bumpMap:stairMap('./assets/entry-finish/kalkputz-relief.jpg'),
    color:0xe3d2bb,bumpScale:.00085,roughness:.96
  });
  const runner=new THREE.MeshStandardMaterial({
    map:stairMap('./assets/entry-finish/westtreppe-wollgewebe.jpg',true),
    color:0x657b63,roughness:.98
  });
  const binding=new THREE.MeshStandardMaterial({color:0xa18a56,roughness:.77});
  const brass=new THREE.MeshStandardMaterial({color:0x967146,roughness:.42,metalness:.54});
  const paintingFrame=new THREE.MeshStandardMaterial({color:0x584339,roughness:.56});
  const paintings=['allee','flussufer'].map(name=>{
    const map=stairTextures.load('./assets/entry-finish/'+name+'.jpg');
    map.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({map,roughness:.89});
  });
  const finial=new THREE.LatheGeometry([
    [0,0],[.083,0],[.083,.07],[.053,.10],[.044,.24],[.059,.35],[.081,.43],
    [.075,.49],[.041,.57],[.032,.73],[.046,.80],[.073,.84],[.073,.89],[0,.89]
  ].map(([x,y])=>new THREE.Vector2(x,y)),12);
  const balusters=[];
  const garden=levels[0];
  const wallLeft=WEST_CORE.laneA+1.435;
  const wallRight=WEST_CORE.right-.05;
  const wallWidth=wallRight-wallLeft;
  const wallX=(wallLeft+wallRight)/2;
  const wallZ=4.61;
  const westWell=wells[1];
  const lowerLanding=(garden.floor+levels[1].floor)/2;
  const returnSlope=(lowerLanding-levels[1].floor)/(westWell.turn-westWell.start);
  const soffitY=z=>levels[1].floor+(z-westWell.start)*returnSlope-.28;
  const wallFront=wallZ-.085;
  const wallTop=soffitY(wallFront)+.012;
  const undersideEdge=westWell.laneB-westWell.width/2-.018;
  const shoulder=wallTop-.53;
  const profile=new THREE.Shape();
  profile.moveTo(wallLeft,garden.floor);
  profile.lineTo(wallRight,garden.floor);
  profile.lineTo(wallRight,wallTop);
  profile.lineTo(undersideEdge,wallTop);
  profile.lineTo(undersideEdge,shoulder+.17);
  profile.quadraticCurveTo(undersideEdge,shoulder,undersideEdge-.17,shoulder);
  profile.lineTo(wallLeft,shoulder);
  profile.closePath();
  const infill=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:.17,bevelEnabled:false,curveSegments:12}),warmPlaster);
  const vertices=infill.geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    if(vertices.getY(i)>shoulder){
      vertices.setY(i,Math.min(vertices.getY(i),soffitY(wallFront+vertices.getZ(i))+.012));
    }
  }
  infill.geometry.computeVertexNormals();
  infill.position.z=wallFront;
  infill.name='Westtreppe_Profilierte_Podestwand';
  infill.castShadow=infill.receiveShadow=true;
  structure.add(infill);
  walls[0].push({x:wallX,z:wallZ,hw:wallWidth/2,hd:.085});
  // The exposed shoulder stays below the adjacent stair rail.
  const capWidth=undersideEdge-.17-wallLeft;
  finishBox(railStone,wallLeft+capWidth/2,shoulder+.023,wallZ,
    capWidth,.046,.19,-1,false,'Westtreppe_Steinabdeckung');
  addManorWallFinish(THREE,structure,garden.floor+.046,[
    {x:wallX,z:wallFront,length:wallWidth,alongX:true,side:-1,top:shoulder}
  ]);
  buildGardenHall(THREE,structure,garden,hallWalls,plaster,gardenSlabs,gardenRooms,wallFront);

  const well=wells.find(w=>w.center<0);
  // Inlaid stone extends to the portal and meets the surrounding floor flush.
  const landingStone=new THREE.MeshStandardMaterial({map:stoneMap,color:0xc5ac91,roughness:.89});
  const inlay=new THREE.MeshStandardMaterial({color:0x665e53,roughness:.84});
  function landing(x0,x1,z0,z1,y){
    finishBox(inlay,(x0+x1)/2,y-.01,(z0+z1)/2,x1-x0,.02,z1-z0,-1,false,'Westtreppe_Podest_Einfassung');
    const cols=Math.ceil((x1-x0)/.66), rows=Math.ceil((z1-z0)/.59);
    const w=(x1-x0-.12)/cols,d=(z1-z0-.12)/rows;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      finishBox((row+col)%2?dressed:landingStone,x0+.06+(col+.5)*w,y+.003,z0+.06+(row+.5)*d,
        w-.009,.013,d-.009,-1,false,'Westtreppe_Podest_Steinplatten');
    }
  }
  for(const lev of levels){
    const y=lev.floor;
    // Close the stair core behind the turning galleries and carry the finish
    // continuously past the intermediate slabs.
    const back=well.far+.08;
    const top=levels[levels.indexOf(lev)+1]?.floor??lev.top;
    if(lev===levels[0]){
      // Connect the moved core to the original west facade window bay.
      const sill=y+2.23, head=y+3.62, windowX=-4.46, opening=.69;
      const glazing=new THREE.MeshPhysicalMaterial({color:0xe2edf2,roughness:.17,
        transparent:true,opacity:.29,depthWrite:false,side:THREE.DoubleSide});
      const sash=new THREE.MeshStandardMaterial({color:0x78634c,roughness:.56});
      for(const [a,b] of [[well.center-2.63,windowX-opening/2],[windowX+opening/2,well.center+2.63]]){
        finishBox(warmPlaster,(a+b)/2,(y+top)/2,back,b-a,top-y,.16,-1,false,'Westtreppe_Fensterlaibung');
      }
      finishBox(warmPlaster,windowX,(head+top)/2,back,opening,top-head,.16,-1,false,'Westtreppe_Fenstersturz');
      finishBox(dressed,windowX,(sill+y)/2,back,opening,sill-y,.16,-1,false,'Westtreppe_Fensterbruestung');
      const sashZ=back+.09,windowHeight=head-sill;
      finishBox(glazing,windowX,(head+sill)/2,sashZ+.027,opening-.06,windowHeight-.06,.012,
        -1,false,'Westtreppe_Podestfenster_Verglasung');
      for(const side of [-1,1]){
        finishBox(sash,windowX+side*(opening/2-.038),(head+sill)/2,sashZ,
          .076,windowHeight,.09,-1,false,'Westtreppe_Fensterfutter');
      }
      for(const rail of [sill+.034,sill+windowHeight/3,sill+windowHeight*2/3,head-.034]){
        finishBox(sash,windowX,rail,sashZ,opening,.033,.052,-1,false,'Westtreppe_Fensterquerholz');
      }
      finishBox(sash,windowX,(head+sill)/2,sashZ,.034,windowHeight,.054,-1,false,'Westtreppe_Fenstermittelpfosten');
      finishBox(railStone,windowX,sill-.017,back-.119,opening+.16,.071,.27,-1,false,'Westtreppe_Fensterbank');
    }else{
      finishBox(warmPlaster,well.center,(y+top)/2,back,5.26,top-y,.16,-1,false,'Westtreppe_Rueckwand');
      finishBox(dressed,well.center,y+.45,back-.105,5.24,.9,.08,-1,false,'Westtreppe_Steinsockel');
      finishBox(railStone,well.center,y+.925,back-.139,5.25,.07,.13,-1,false,'Westtreppe_Sockelgesims');
      finishBox(railStone,well.center,top-.13,back-.133,5.25,.13,.12,-1,false,'Westtreppe_Rueckwandgesims');

    }

    // On the garden level the continuous limestone floor already extends
    // to the stair and around the cellar opening.
    if(lev!==levels[0])landing(well.center-2.65,well.center+2.65,.14,well.start-.025,y+.048);
    if(lev!==levels[0]){
      // Dressed jambs and pilaster bases mask the raw structural ends at the portal.
      for(const side of [-1,1]){
        const x=well.center+side*2.59;
        finishBox(dressed,x,y+1.40,1.23,.14,2.80,.68,-1,false,'Westtreppe_Laibung');
        finishBox(railStone,x,y+.095,1.23,.19,.19,.68,-1,false,'Westtreppe_Sockelprofil');
      }
      for(const x of [well.center-2.49,well.center+2.49]){
        finishBox(railStone,x,y+1.27,.88,.27,2.54,.24,-1,false,'Westtreppe_Gewaende');
        finishBox(railStone,x,y+.11,.86,.37,.22,.34,-1,false,'Westtreppe_Pfeilersockel');
        finishBox(railStone,x,y+2.52,.86,.38,.13,.34,-1,false,'Westtreppe_Kapitell');
      }
      finishBox(dressed,well.center,y+2.675,.88,5.36,.18,.24,-1,false,'Westtreppe_Architrav');
      finishBox(railStone,well.center,y+2.79,.88,5.40,.063,.30,-1,false,'Westtreppe_Gesims');
      const panelWidth=2.08,panelHeight=Math.min(2.36,top-y-1.34);
      const panelY=y+1.0+panelHeight/2;
      for(const x of [well.center-panelWidth/2,well.center+panelWidth/2]){
        finishBox(dressed,x,panelY,back-.102,.056,panelHeight,.049,-1,false,'Westtreppe_Wandfeldrahmen');
      }
      for(const edge of [-1,1]){
        finishBox(dressed,well.center,panelY+edge*panelHeight/2,back-.102,panelWidth,.056,.049,-1,false,'Westtreppe_Wandfeldrahmen');
      }
    }
    if(lev!==levels[0]){
      const artX=well.center-WEST_STAIR.sideWall+.029, artZ=3.55, artY=y+2.65;
      finishBox(paintingFrame,artX,artY,artZ,.067,.72,1.01,-1,false,'Westtreppe_Bilderrahmen');
      finishBox(brass,artX+.036,artY,artZ,.014,.66,.95,-1,false,'Westtreppe_Bilderrahmen_Innenkante');
      const picture=new THREE.Mesh(new THREE.PlaneGeometry(.91,.62),paintings[y<6?0:1]);
      picture.position.set(artX+.047,artY,artZ);
      picture.rotation.y=Math.PI/2;
      structure.add(picture);
    }
    const light=new THREE.PointLight(0xffead5,17,6,2);
    light.position.set(well.center,y+1.92,2.75);structure.add(light);
    const galleryLight=new THREE.PointLight(0xffead5,11,5.3,2);
    galleryLight.position.set(well.center,y+1.93,6.20);structure.add(galleryLight);
  }
  const east=wells.find(w=>w.center>0);
  const blocks=stairMap('./assets/heritage-v14/facade_limestone_albedo.jpg',true);
  blocks.wrapS=blocks.wrapT=THREE.RepeatWrapping;
  blocks.repeat.set(2,1);
  const stoneWall=new THREE.MeshStandardMaterial({map:blocks,color:0xcdb695,roughness:.9});
  const eastWallX=east.center+WEST_STAIR.sideWall;
  finishBox(stoneWall,eastWallX-.006,levels[1].floor+1.92,4.60,
    .018,1.35,5.66,-1,false,'Osttreppe_Kalkstein_Wandband');

  for(const lev of levels){
    const light=new THREE.PointLight(0xffebd5,12,6.8,2);
    light.position.set(east.center,lev.floor+2.3,4.7);
    structure.add(light);
  }
  const westAshlar=new THREE.MeshStandardMaterial({...stoneFinish,color:0xd3c1ab,roughness:.91});
  const courseHeight=.327, stoneWidth=.95;
  for(let course=0;course<10;course++){
    const y=levels[1].floor+.06+(course+.5)*courseHeight;
    const left=well.center-2.625,right=well.center+2.625;
    for(let edge=left-(course%2)*stoneWidth/2;edge<right;edge+=stoneWidth){
      const a=Math.max(edge,left),b=Math.min(edge+stoneWidth,right);
      finishBox(westAshlar,(a+b)/2,y,well.far-.043,b-a-.004,courseHeight-.004,.036,
        -1,false,'Westtreppe_Kalksteinquader');
    }
  }
  for(const [height,depth] of [[.035,.14],[.052,.115],[.075,.09]]){
    finishBox(railStone,well.center,levels[0].top+height/2,1.09,5.30,height,depth,
      -1,false,'Westtreppe_Deckenprofil');
  }
  const postPositions=new Set();
  function balustrade(x0,z0,y0,x1,z1,y1,treadHeight,ornate=false){
    const length=Math.hypot(x1-x0,z1-z0), count=Math.ceil(length/.265);
    const axis=new THREE.Vector3(x1-x0,y1-y0,z1-z0).normalize();
    const railLength=Math.hypot(length,y1-y0);
    const profile=new THREE.Shape();
    profile.moveTo(-.065,-.048);
    for(const [x,y] of [[.065,-.048],[.065,-.027],[.092,-.016],[.103,.014],
      [.098,.037],[.08,.052],[-.08,.052],[-.098,.037],[-.103,.014],[-.092,-.016],[-.065,-.027]])profile.lineTo(x,y);
    profile.closePath();
    const railGeometry=new THREE.ExtrudeGeometry(profile,{depth:railLength,bevelEnabled:ornate,bevelSize:.006,bevelThickness:.006,bevelSegments:2});
    const handrail=new THREE.Mesh(railGeometry,railStone);
    handrail.name='Westtreppe_Steinhandlauf';
    handrail.position.set(x0,y0+.928,z0);
    handrail.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);
    handrail.castShadow=handrail.receiveShadow=true;
    structure.add(handrail);
    const intervals=treadHeight?STEPS_PER_RUN+1:count;
    for(let i=0;i<=intervals;i++){
      const t=treadHeight&&i>0&&i<intervals?(i-.5)/STEPS_PER_RUN:i/intervals;
      const x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,y=y0+(y1-y0)*t;
      if(i===0||i===intervals){
        const key=[x,y,z].map(value=>value.toFixed(4)).join(',');
        if(postPositions.has(key))continue;
        postPositions.add(key);
        finishBox(dressed,x,y+.46,z,.205,.92,.205,-1,false,'Westtreppe_Antrittspfosten');
        finishBox(railStone,x,y+.944,z,WEST_STAIR.postHalf*2,.085,WEST_STAIR.postHalf*2,-1,false,'Westtreppe_Pfostenabdeckung');
        if(ornate&&y===garden.floor){
          finishBox(dressed,x,y+1.026,z,.223,.117,.223,-1,false,'Westtreppe_Antritt_Kopf');
          finishBox(railStone,x,y+1.102,z,.251,.049,.251,-1,false,'Westtreppe_Antritt_Deckprofil');
        }
        if(ornate){
          for(const side of [-1,1]){
            for(const offset of [-.067,.067]){
              finishBox(railStone,x+side*.104,y+.49,z+offset,.015,.57,.019,-1,false,'Westtreppe_Pfosten_Kassettenkante');
              finishBox(railStone,x+offset,y+.49,z+side*.104,.019,.57,.015,-1,false,'Westtreppe_Pfosten_Kassettenkante');
            }
            for(const level of [.21,.77]){
              finishBox(railStone,x+side*.104,y+level,z,.015,.020,.151,-1,false,'Westtreppe_Pfosten_Kassettenkante');
              finishBox(railStone,x,y+level,z+side*.104,.151,.020,.015,-1,false,'Westtreppe_Pfosten_Kassettenkante');
            }
          }
        }
        if(treadHeight){
          finishBox(railStone,x,y+.068,z,.248,.136,.248,-1,false,'Treppenpfosten_Sockel');
          finishBox(dressed,x,y+.178,z,.232,.083,.232,-1,false,'Treppenpfosten_Sockelprofil');
          finishBox(dressed,x,y+.878,z,.235,.052,.235,-1,false,'Treppenpfosten_Kopfprofil');
        }
      }else {
        const base=treadHeight?.(z)??y;
        if(ornate){
          finishBox(dressed,x,base+.022,z,.114,.044,.112,-1,false,'Westtreppe_Balusterplinthe');
          finishBox(railStone,x,y+.853,z,.123,.035,.112,-1,false,'Westtreppe_Balusterkapitell');
        }
        balusters.push([x,base,z,1+(y-base)/.89]);
      }
    }
  }
  for(const well of wells){
    for(let stage=0;stage<2;stage++){
      const lo=levels[stage].floor,hi=levels[stage+1].floor,mid=(lo+hi)/2;
      const run=well.turn-well.start;
      const runStep=run/STEPS_PER_RUN;
      const laneWidth=well.width;
      const startA=stage===0?well.startA??well.start:well.start;
      const widthA=stage===0?well.widthA??laneWidth:laneWidth;
      const laneA=well.laneA+(widthA-laneWidth)/2-(stage===0?well.edgeInsetA??0:0);
      const stepA=(well.turn-startA)/STEPS_PER_RUN;
      const stepMat = dressed;
      const noseMat = railStone;
      for(let i=0;i<STEPS_PER_RUN;i++){
        const z=well.start+(i+.5)*runStep;
        // First flight climbs towards the northern turning landing.
        const zA=startA+(i+.5)*stepA;
        const yA=lo+(i+1)/STEPS_PER_RUN*(mid-lo);
        if(i===0&&well===westWell&&stage===0){
          // Rounded stone return beneath the newel at the foot of the flight.
          const capX=laneA+widthA/2-.035,capZ=startA+.052;
          const height=yA-lo-.010;
          const nose=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,height,32),dressed);
          nose.name='Westtreppe_Gerundeter_Antritt';
          nose.position.set(capX,lo+height/2,capZ);
          nose.castShadow=nose.receiveShadow=true;
          structure.add(nose);
        }
        box(laneA,yA-.065,zA,widthA,.13,stepA+.008,stepMat,-1,false,'Rohbau_Treppenstufe_A');
        box(laneA,yA-.046,zA-.48*stepA,widthA,.04,.045,noseMat,-1,false,'Stufenkante_A');
        {
          const prevY=lo+i/STEPS_PER_RUN*(mid-lo);
          box(laneA,(yA+prevY)/2-.075,zA-stepA/2+.018,widthA,.045+Math.abs(yA-prevY),.085,
            stepMat,-1,false,'Untergeschoss_Geschlossene_Setzstufe_A');
        }
        // Second flight climbs in the opposite walking direction.
        const yB=mid+(STEPS_PER_RUN-i)/STEPS_PER_RUN*(hi-mid);
        box(well.laneB,yB-.065,z,laneWidth,.13,runStep+.008,stepMat,-1,false,'Rohbau_Treppenstufe_B');
        box(well.laneB,yB-(.046),z+(.48)*runStep,laneWidth,.04,.045,noseMat,-1,false,'Stufenkante_B');
        {
          const rise=(mid-lo)/STEPS_PER_RUN;
          for(const [lane,top,direction,stepZ,depth,flightWidth] of [[laneA,yA,-1,zA,stepA,widthA],[well.laneB,yB,1,z,runStep,laneWidth]]){
            const width=flightWidth*.71;
            finishBox(runner,lane,top+.012,stepZ,width,.024,depth+.011,-1,false,'Westtreppe_Laeufer_Auftritt');
            finishBox(runner,lane,top-rise/2+.004,stepZ+direction*(depth/2+.014),width,rise+.018,.024,-1,false,'Westtreppe_Laeufer_Setzstufe');
            for(const side of [-1,1]){
              finishBox(binding,lane+side*(width/2-.032),top+.025,stepZ,.019,.005,depth,-1,false,'Westtreppe_Laeufer_Borte');
            }
          }
        }
        {
          const nextY=mid+(STEPS_PER_RUN-i-1)/STEPS_PER_RUN*(hi-mid);
          box(well.laneB,(yB+nextY)/2-.075,z+runStep/2-.018,laneWidth,.045+Math.abs(yB-nextY),.085,
            stepMat,-1,false,'Untergeschoss_Geschlossene_Setzstufe_B');
        }
      }
      // Two real enclosed inclined undersides instead of a visually open
      // floating-step construction. These correspond to the lower storey only.
      {
        for(const [lane,yCenter,direction,suffix,start,width] of [
          [laneA,(lo+mid)/2,-1,'A',startA,widthA],
          [well.laneB,(hi+mid)/2,1,'B',well.start,laneWidth]
        ]){
          const flightRun=well.turn-start;
          const rotation=direction*Math.atan2(mid-lo,flightRun);
          const length=Math.hypot(flightRun,mid-lo);
          const centerZ=(start+well.turn)/2;
          if(well===westWell&&stage===0&&suffix==='B'){
            // Extrude the section with plumb end faces. Joins meet the
            // ceiling and landing directly, with a closed stone stringer.
            const xLeft=lane-width/2-.018;
            const xRight=westWell.center+2.58;
            const section=new THREE.Shape();
            const startZ=start-.08,endZ=well.turn+.022;
            section.moveTo(-startZ,soffitY(startZ));
            section.lineTo(-endZ,soffitY(endZ));
            section.lineTo(-endZ,mid-.055);
            section.lineTo(-startZ,hi-.062);
            section.closePath();
            const soffit=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{
              depth:xRight-xLeft,bevelEnabled:false
            }),warmPlaster);
            soffit.name='Westtreppe_Gegenlauf_Durchgehende_Untersicht';
            soffit.rotation.y=Math.PI/2;
            soffit.position.x=xLeft;
            soffit.castShadow=soffit.receiveShadow=true;
            structure.add(soffit);
            // The stepped cornice closes the opening along the head of the
            // return flight, continuous to the wall on the corridor side.
            for(const [drop,depth,height] of [[0,.31,.25],[.137,.36,.038],[.164,.30,.027]]){
              finishBox(railStone,(xLeft+xRight)/2,soffitY(startZ)-.125-drop,startZ-.105,
                xRight-xLeft,height,depth,-1,false,'Westtreppe_Gegenlauf_Deckenrahmen');
            }
            const railX=xLeft-.006;
            const from=new THREE.Vector3(railX,soffitY(startZ)+.068,startZ);
            const to=new THREE.Vector3(railX,soffitY(endZ)+.068,endZ);
            const delta=to.clone().sub(from);
            const molding=finishBox(railStone,railX,(from.y+to.y)/2,(startZ+endZ)/2,
              .058,.072,delta.length(),-1,false,'Westtreppe_Gegenlauf_Wangenprofil');
            molding.rotation.x=-Math.atan2(delta.y,delta.z);
            const border=finishBox(dressed,railX+.024,yCenter-.085,centerZ,.065,.28,length+.01,
              -1,false,'Westtreppe_Gegenlauf_Geschlossene_Wange');
            border.rotation.x=rotation;
          }else{
            const underside=box(lane,yCenter-.19,centerZ,width-.08,.19,length+.06,stepMat,-1,false,
              'Untergeschoss_Geschlossene_Treppenuntersicht_'+suffix);
            underside.rotation.x=rotation;
            for(const sign of [-1,1]){
              const edge=box(lane+sign*(width/2-.07),yCenter-.08,centerZ,
                .13,.30,length+.08,railStone,-1,false,'Untergeschoss_Treppenwange_'+suffix);
              edge.rotation.x=rotation;
            }
          }
        }
      }
      const platformDepth=well.far-well.turn;
      box(well.center,mid-.09,(well.turn+well.far)/2,5.3,.18,
        platformDepth,stepMat,-1,false,'Wendepodest');
      // Kurze geschlossene Eingangs- und Ausgangspodeste pro Etage.
      if(stage===0){
        box(well.center,lo-.065,(.68+well.start)/2,5.3,.13,well.start-.68+.09,stepMat,-1,false,'Treppenpodest_unten');
      }
      box(well.center,hi-.065,(.68+well.start)/2,5.3,.13,well.start-.68+.09,stepMat,-1,false,'Treppenpodest_oben');
      {
        for(const [side,y] of [[-1,lo],[1,hi]]){
          const wallX=well.center+side*WEST_STAIR.sideWall;
          const x=wallX-side*.145;
          const start=side<0?startA:well.start;
          const rise=(mid-y)/(well.turn-start);
          const first=stage===0&&well.center<0&&side<0?start+(well.turn-start)*.47:start+.12;
          const from=new THREE.Vector3(x,y+.94+rise*(first-start),first);
          const to=new THREE.Vector3(x,mid+.94-rise*.12,well.turn-.12);
          beam(from,to,.043,brass,'Treppenhaus_Messinghandlauf');
          if(stage===0&&well.center<0&&side<0){
            const corner=new THREE.Vector3(x,to.y,well.far-.22);
            const end=new THREE.Vector3(well.center-.48,to.y,corner.z);
            beam(to,corner,.035,brass,'Westtreppe_Podesthandlauf_Seite');
            beam(corner,end,.035,brass,'Westtreppe_Podesthandlauf_Rueckwand');
            for(const t of [.18,.55,.88]){
              const mount=new THREE.Vector3().lerpVectors(corner,end,t);
              beam(new THREE.Vector3(mount.x,mount.y-.05,well.far),mount,.014,brass,
                'Westtreppe_Podesthandlauf_Konsole');
            }
          }
          for(const point of [from,to]){
            const endcap=new THREE.Mesh(new THREE.SphereGeometry(.043,14,8),brass);
            endcap.position.copy(point);
            endcap.name='Westtreppe_Handlaufabschluss';
            structure.add(endcap);
          }
          for(const t of [.09,.31,.53,.75,.91]){
            const point=new THREE.Vector3().lerpVectors(from,to,t);
            beam(new THREE.Vector3(wallX,point.y-.085,point.z),point,.020,brass,'Westtreppe_Handlaufkonsole');
            finishBox(brass,wallX,point.y-.085,point.z,.025,.102,.075,-1,false,'Westtreppe_Handlaufrosette');
          }
        }
        const treadIndex=z=>Math.floor((z-well.start)/runStep);
        const innerA=laneA+widthA/2;
        balustrade(innerA,startA,lo,innerA,well.turn,mid,
          z=>lo+(Math.floor((z-startA)/stepA)+1)*(mid-lo)/STEPS_PER_RUN,well.center<0&&stage===0);
        balustrade(well.laneB-laneWidth/2,well.start,hi,well.laneB-laneWidth/2,well.turn,mid,
          z=>hi-treadIndex(z)*(hi-mid)/STEPS_PER_RUN,well.center<0&&stage===0);
        balustrade(innerA,well.turn,mid,well.laneB-laneWidth/2,well.turn,mid);
        // Two matching strips turn into one transverse runner behind the guard.
        const runnerWidth=laneWidth*.71;
        const acrossStart=well.turn+.55, acrossEnd=acrossStart+runnerWidth;
        const right=well.laneB+runnerWidth/2;
        const left=laneA-widthA*.71/2;
        for(const [lane,stripWidth] of [[laneA,widthA*.71],[well.laneB,runnerWidth]]){
          finishBox(runner,lane,mid+.012,(well.turn+acrossStart)/2,stripWidth,.024,.55,-1,false,'Westtreppe_Wendepodest_Laeufer');
          finishBox(binding,lane+Math.sign(lane-well.center)*(stripWidth/2-.032),mid+.025,
            (well.turn+acrossStart)/2,.019,.005,.55,-1,false,'Westtreppe_Wendepodest_Borte');
          finishBox(binding,lane-Math.sign(lane-well.center)*(stripWidth/2-.032),mid+.025,
            (well.turn+acrossStart+.032)/2,.019,.005,.582,-1,false,'Westtreppe_Wendepodest_Borte');
        }
        finishBox(runner,(left+right)/2,mid+.012,(acrossStart+acrossEnd)/2,right-left,.024,runnerWidth,-1,false,'Westtreppe_Wendepodest_Laeufer');
        finishBox(binding,(left+right)/2,mid+.025,acrossEnd-.032,right-left-.064,.005,.019,-1,false,'Westtreppe_Wendepodest_Borte');
        finishBox(binding,(laneA+widthA*.71/2+well.laneB-runnerWidth/2)/2,mid+.025,acrossStart+.032,well.laneB-runnerWidth/2-laneA-widthA*.71/2+.064,.005,.019,-1,false,'Westtreppe_Wendepodest_Borte');
        for(const x of [left+.032,right-.032]){
          finishBox(binding,x,mid+.025,(acrossStart+acrossEnd-.032)/2,.019,.005,runnerWidth-.032,-1,false,'Westtreppe_Wendepodest_Borte');
        }
        // A finished fascia hides the exposed edge of the turning slab.
        finishBox(railStone,well.center,mid-.109,well.turn-.045,5.21,.123,.095,-1,false,'Westtreppe_Podestprofil');
        // Close the open edge between the mouths of the two flights.
        if(stage!==0)for(const y of [lo,hi]){
          balustrade(well.laneA+laneWidth/2,well.start,y,well.laneB-laneWidth/2,well.start,y);
        }
      }
      stairs.push({stoneRail:true,well:well.name,center:well.center,laneA,laneB:well.laneB,startA,widthA,
        width:well.width,start:well.start,turn:well.turn,far:well.far,
        rearRailInset:stage===0&&well.center<0 ? .255 : 0,stage,lo,hi,mid});
    }
    for(const x of [well.center-2.65,well.center+2.65]){
      {
        // One flush interior face from the garden floor to the top ceiling.
        // The rear return overlaps the backing wall so there is no open seam.
        const bottom=levels[0].floor-.032, top=levels.at(-1).top;
        const west=well===wells[1];
        const corridorSide=west&&x>well.center;
        const front=west&&x<well.center?-.24:.50, back=well.far+.08;
        const wallBottom=corridorSide?levels[1].floor:bottom;
        box(x,(wallBottom+top)/2,(front+back)/2,.13,top-wallBottom,back-front,
          warmPlaster,-1,false,'Westtreppe_Durchgehende_Wand');
        const inner=x+Math.sign(well.center-x)*.082;
        for(const lev of levels.slice(corridorSide?1:0)){
          finishBox(railStone,inner,lev.top-.13,4.22,.126,.15,6.16,-1,false,'Westtreppe_Wandgesims');
        }
      }
    }
  }
  const row=new THREE.InstancedMesh(finial,railStone,balusters.length);
  const transform=new THREE.Matrix4();
  balusters.forEach(([x,y,z,scale],index)=>{
    transform.makeScale(1,scale,1).setPosition(x,y,z);
    row.setMatrixAt(index,transform);
  });
  row.castShadow=row.receiveShadow=true;
  structure.add(row);
  return {levels,walls,structure,stairs,wells,secondFloorRooms,stateFloorRooms,gardenRooms};
}
