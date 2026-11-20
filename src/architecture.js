import { STAIR_CORES, STAIR_ENTRY, STAIR_LEVELS } from './stair-layout.js?v=96';
import { addOakPanelling, lightOakFinish, buildGardenHall } from './garden-hall.js?v=96';
import { WEST_STAIR } from './stair-navigation.js?v=96';
import { buildManorPlan } from './manor-plan.js?v=96';
import { portalLintelY } from './north-portal.js?v=29';
import { WINDOW_STOREYS, SIDE_WINDOW_AXES, SOUTH_WINDOW_AXES, SIDE_OPENING_WIDTH, buildNorthWallBand, northOpeningsForBand, southOpening, openingHeight, STAIR_WINDOWS } from './window-layout.js?v=96';
export function buildEmptyInterior(THREE, scene) {
  const plaster = new THREE.MeshStandardMaterial({color:0xeae9e5,roughness:.97});
  const floorStone = new THREE.MeshStandardMaterial({color:0xd0cfcb,roughness:.96});
  const ceilingTrim = new THREE.MeshStandardMaterial({color:0xece4d7,roughness:.96});
  const jamb = new THREE.MeshStandardMaterial({color:0xf7f2e9,roughness:.70});
  const structure = new THREE.Group();
  structure.name='Begehbare_Leere_Innenraeume'; scene.add(structure);
  const walls=[[],[],[]];
  const levels=STAIR_LEVELS;
  const stairs=[];
  const hallWalls=[], gardenSlabs=[];
  function box(cx,cy,cz,w,h,d,mat=floorStone,level=-1,blocking=false,name='Rohbau'){
    const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    obj.name=name;obj.position.set(cx,cy,cz);obj.castShadow=h>.22&&!mat.transparent;
    obj.receiveShadow=true;structure.add(obj);
    if(blocking&&level>=0)walls[level].push({x:cx,z:cz,hw:w/2,hd:d/2});
    if(name==='Gartengeschoss_Boden')gardenSlabs.push(obj);
    if(level===0&&(name==='Trennwand'))hallWalls.push(obj);
    return obj;
  }
  function beam(from,to,r,material,name){
    const delta=new THREE.Vector3().subVectors(to,from);
    const obj=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),9),material);
    obj.position.copy(from).add(to).multiplyScalar(.5);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    obj.name=name;obj.castShadow=true;structure.add(obj);return obj;
  }
  const wells=STAIR_CORES;
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
  function finishOpening(axis,face,a,b,sill,head,inward,hasSill=true){
    const upright=.045, depth=.115;
    const finish=(u,y,w,h,projection,name)=>{
      const normal=face+inward*(projection/2-.012);
      if(axis==='x')box(u,y,normal,w,h,projection,jamb,-1,false,name);
      else box(normal,y,u,projection,h,w,jamb,-1,false,name);
    };
    for(const edge of [a-upright/2,b+upright/2]){
      finish(edge,(sill+head)/2,upright,head-sill,depth,'Fenster_Innenlaibung');
    }
    finish((a+b)/2,head+upright/2,b-a+2*upright,upright,depth,'Fenster_Innensturz');
    if(hasSill)finish((a+b)/2,sill-.028,b-a+.14,.056,.19,'Fenster_Inneres_Sohlbrett');
  }

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

        finishOpening('z',x-side*.135,a,b,bottom,top,-side);
        prev=b;
      }
      const corner=8.035;
      if(prev<corner)box(x,(lo+hi)/2,(prev+corner)/2,.27,ht,corner-prev,plaster,level,true,'Aussenwand_Pfeiler');
    }
    // Südseite: Durchgehende öffentliche Außenfassade mit den bisherigen Fensterachsen.
    const southZ=-11.80, openings=SOUTH_WINDOW_AXES.map(axis=>{
      const {x,y,width,height}=southOpening(axis,level);
      return [x-width/2,x+width/2,y-height/2,y+height/2,level<2&&axis===0];
    });
    let prev=-23.15;
    for(const [a,b,bottom,top,gardenDoor] of openings){
      if(a>prev)box((prev+a)/2,(lo+hi)/2,southZ,a-prev,ht,.27,plaster,level,true,'Suedwand_Pfeiler');
      if(bottom>lo)box((a+b)/2,(lo+bottom)/2,southZ,b-a,bottom-lo,.27,plaster,level,!gardenDoor,'Suedwand_Fensterbruestung');
      if(hi>top)box((a+b)/2,(top+hi)/2,southZ,b-a,hi-top,.27,plaster,level,!gardenDoor,'Suedwand_Fenstersturz');

      finishOpening('x',southZ+.135,a,b,bottom,top,1,bottom>lo+.1);
      if(gardenDoor)box((a+b)/2,lo+.012,-11.86,b-a,.024,.23,jamb,-1,false,'Gartentuer_Schwelle');
      prev=b;
    }
    if(prev<23.15)box((prev+23.15)/2,(lo+hi)/2,southZ,23.15-prev,ht,.27,plaster,level,true,'Suedwand_Pfeiler');
    const northZ=7.95;
    const portal={x:0,width:2.68,bottom:lo,top:portalLintelY+.01};
    buildNorthWallBand(level,lo,hi,-23.15,23.15,portal,(a,b,bottom,top,blocking)=>{
      box((a+b)/2,(bottom+top)/2,northZ,b-a,top-bottom,.17,plaster,level,blocking,'Nordwand_Mauerwerk');
    });
    for(const {x,width,bottom,top,stage} of northOpeningsForBand(level,lo,hi)){
      if(stage===undefined)finishOpening('x',7.865,x-width/2,x+width/2,bottom,top,-1);
    }
  }
  for(const {x,width,bottom,top} of STAIR_WINDOWS){
    finishOpening('x',7.865,x-width/2,x+width/2,bottom,top,-1);
  }

  // The ground storey previously had open north edges and did not have a
  // complete soffit or aligned stairwell/opening junctions. Close the actual
  // lower-floor envelope without placing floors inside either stairwell void.
  function closeGroundFloor(){
    const lev=0,L=levels[lev];
    const low=L.floor, high=L.top;
    const lowerH=high-low;
    const ceilingY=L.top-.025;
    // The entrance passage from the existing automatic double door (z=12.18)
    // to the main hall is enclosed on both sides instead of opening into space.
    // Walls are at x=±1.55, farther out than the original 1.32 m doorway passage.
    for(const x of [-1.56,1.56]){
      box(x, (low+high)/2,10.05,.18,lowerH,4.25,plaster,lev,true,'Eingangsgang_Wand');
    }
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
    box(0,high-.10,-11.55,46,.13,.14,jamb,-1,false,'Untergeschoss_Wand_Deckenabschluss');
    for(const x of [-23.03,23.03]){
      box(x,high-.10,-1.97,.14,.13,19.65,jamb,-1,false,'Untergeschoss_Aussenwand_Deckengesims');
    }
  }
  closeGroundFloor();
  
  // The two stair cores share the same stonework and runner construction.
  function finishBox(material,x,y,z,width,height,depth,level,blocking,name){
    return box(x,y,z,width,height,depth,material,level,blocking,name);
  }
  const STEPS_PER_RUN=14;
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
  const finial=new THREE.LatheGeometry([
    [0,0],[.083,0],[.083,.07],[.053,.10],[.044,.24],[.059,.35],[.081,.43],
    [.075,.49],[.041,.57],[.032,.73],[.046,.80],[.073,.84],[.073,.89],[0,.89]
  ].map(([x,y])=>new THREE.Vector2(x,y)),12);
  const balusters=[];
  const garden=levels[0];
  const oakRail=lightOakFinish(THREE);
  buildGardenHall(THREE,structure,garden,hallWalls,plaster,gardenSlabs,gardenRooms);
  const [entryZ,entryWidth]=STAIR_ENTRY;
  for(const side of [-1,1]){
    const x=side*(STAIR_CORES[1].left-.085);
    const base=garden.floor+.046, lintel=garden.floor+2.60;
    for(const edge of [-1,1]){
      box(x,(base+lintel)/2,entryZ+edge*(entryWidth/2+.039),
        .054,lintel-base,.078,jamb,-1,false,'Windfang_Treppenportal_Gewände');
    }
    box(x,lintel+.049,entryZ,.070,.103,entryWidth+.156,jamb,-1,false,'Windfang_Treppenportal_Sturz');
  }
  for(const well of wells){
    for(const level of levels){
      const light=new THREE.PointLight(0xffedda,14,7,2);
      light.position.set(well.center,level.floor+2.35,5.3);
      structure.add(light);
      const z1=level===garden?2.58:1.48,z2=7.85;
      addOakPanelling(THREE,structure,level.floor+.046,[-1,1].map(side=>({
        x:well.center+side*(2.70-.085),z:(z1+z2)/2,length:z2-z1,alongX:false,side:-side
      })),true);
    }
    for(let stage=0;stage<2;stage++){
      const level=levels[stage],mid=(level.floor+levels[stage+1].floor)/2;
      addOakPanelling(THREE,structure,mid,[-1,1].map(side=>({
        x:well.center+side*(2.70-.085),z:(well.turn+well.far)/2,
        length:well.far-well.turn,alongX:false,side:-side
      })),true);
    }
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
    const handrail=new THREE.Mesh(railGeometry,oakRail);
    handrail.name='Treppenhaus_Eichenhandlauf';
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
    const firstMesh=structure.children.length;
    const firstBaluster=balusters.length;
    for(let stage=0;stage<2;stage++){
      const lo=levels[stage].floor,hi=levels[stage+1].floor,mid=(lo+hi)/2;
      const run=well.turn-well.start;
      const runStep=run/STEPS_PER_RUN;
      const laneWidth=well.width;
      const startA=stage===0?well.groundStart:well.start;
      const widthA=laneWidth;
      const laneA=well.laneA;
      const stepA=(well.turn-startA)/STEPS_PER_RUN;
      const stepMat = dressed;
      const noseMat = railStone;
      for(let i=0;i<STEPS_PER_RUN;i++){
        const z=well.start+(i+.5)*runStep;
        // First flight climbs towards the northern turning landing.
        const zA=startA+(i+.5)*stepA;
        const yA=lo+(i+1)/STEPS_PER_RUN*(mid-lo);
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
            const rodZ=stepZ+direction*(depth/2-.042);
            beam(new THREE.Vector3(lane-width/2-.047,top+.032,rodZ),
              new THREE.Vector3(lane+width/2+.047,top+.032,rodZ),.013,brass,'Teppichstange_Messing');
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
          {
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
        box(well.center,lo-.065,(1.09+startA)/2,5.3,.13,startA-1.09+.022,stepMat,-1,false,'Treppenpodest_unten');
      }
      box(well.center,hi-.065,(.68+well.start)/2,5.3,.13,well.start-.68+.09,stepMat,-1,false,'Treppenpodest_oben');
      {
        for(const [side,y] of [[-1,lo],[1,hi]]){
          const wallX=well.center+side*WEST_STAIR.sideWall;
          const x=wallX-side*.145;
          const start=side<0?startA:well.start;
          const rise=(mid-y)/(well.turn-start);
          const first=start+.12;
          const from=new THREE.Vector3(x,y+.94+rise*(first-start),first);
          const to=new THREE.Vector3(x,mid+.94-rise*.12,well.turn-.12);
          beam(from,to,.043,brass,'Treppenhaus_Messinghandlauf');
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
          z=>lo+(Math.floor((z-startA)/stepA)+1)*(mid-lo)/STEPS_PER_RUN,stage===0);
        balustrade(well.laneB-laneWidth/2,well.start,hi,well.laneB-laneWidth/2,well.turn,mid,
          z=>hi-treadIndex(z)*(hi-mid)/STEPS_PER_RUN,stage===0);
        balustrade(innerA,well.turn,mid,well.laneB-laneWidth/2,well.turn,mid);
        // A finished fascia hides the exposed edge of the turning slab.
        finishBox(railStone,well.center,mid-.109,well.turn-.045,5.21,.123,.095,-1,false,'Westtreppe_Podestprofil');
        // Close the open edge between the mouths of the two flights.
        if(stage!==0)for(const y of [lo,hi]){
          balustrade(well.laneA+laneWidth/2,well.start,y,well.laneB-laneWidth/2,well.start,y);
        }
      }
      stairs.push({stoneRail:true,well:well.name,center:well.center,laneA,laneB:well.laneB,startA,widthA,
        width:well.width,start:well.start,turn:well.turn,far:well.far,
        mirror:well.mirror,stage,lo,hi,mid});
    }
    if(well.mirror){
      const reflection=new THREE.Matrix4().makeScale(-1,1,1);
      reflection.setPosition(2*well.center,0,0);
      const mirrored=new THREE.Group();
      mirrored.name='Westtreppe_Gespiegelte_Laeufe';
      mirrored.add(...structure.children.slice(firstMesh));
      mirrored.applyMatrix4(reflection);
      structure.add(mirrored);
      for(const baluster of balusters.slice(firstBaluster))baluster[0]=2*well.center-baluster[0];
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
