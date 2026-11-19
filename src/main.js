import { STAIR_HALL_VIEW } from './stair-layout.js?v=78';
import { buildPrivateCinema } from './private-cinema.js?v=84';
import { SOUTH_GARDEN_TREES } from './south-garden.js?v=62';
import { SOUTH_TERRACE } from './south-portico.js?v=60';
import { buildEntryFinish } from './entry-finish.js?v=86';
import { ENTRY_WINDOW_BAYS, ENTRY_WINDOW_INNER_FACE } from './window-layout.js?v=33';
import { buildNorthWindowWall } from './north-window-wall.js?v=33';
import { cladStructuralExterior } from './exterior-skin.js?v=20261118-v11';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildFacade } from './facade.js?v=60';
import { addEntranceLamps } from './entrance-lamps.js?v=81';
import { buildOakEntrance } from './oak-door.js?v=20261119-v39-deckfalz';
import { buildSky } from './sky-atmosphere.js?v=20261118-stone-v14';
import { buildEmptyInterior } from './architecture.js?v=89';
import { loadGardenMaple } from './garden-maple.js?v=62';
import { buildGrounds } from './landscape.js?v=62';
import { stairSurface, inStairwell, beginStair, finishedStair } from './stair-navigation.js?v=76';

const status = document.getElementById('status');
const floorSelect = document.getElementById('floor-select');
const homeButton = document.getElementById('outside');
const entranceButton = document.getElementById('entrance');
const entranceStartZ = 18.1;
// Instancing cuts hundreds of individual architectural boxes down to a small
// number of draw calls, while keeping their dimensions, rotation and material.
// It also keeps the shell practical on mobile Safari.
function instanceStaticBoxes(parent) {
  const batches = new Map();
  for(const child of [...parent.children]) {
    if(!child.isMesh || child.geometry.type!=='BoxGeometry' || Array.isArray(child.material))continue;
    let group=batches.get(child.material);
    if(!group){group=[];batches.set(child.material,group);}
    group.push(child);
  }
  for(const [material,items] of batches){
    if(items.length<3) continue;
    const batch=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,items.length);
    batch.castShadow=items.some(o=>o.castShadow);
    batch.receiveShadow=items.some(o=>o.receiveShadow);
    batch.frustumCulled=false; // correct even for wide batches spanning the building
    const scale=new THREE.Matrix4();
    items.forEach((child,index)=>{
      child.updateMatrix();
      const {width,height,depth}=child.geometry.parameters;
      scale.makeScale(width,height,depth);
      const transform=child.matrix.clone().multiply(scale);
      batch.setMatrixAt(index,transform);
      parent.remove(child);
      child.geometry.dispose();
    });
    batch.instanceMatrix.needsUpdate=true;
    parent.add(batch);
  }
}

// Group repeated stone columns and metal railing bars into GPU instances.
// Dimensions are per-instance transforms; taper ratios and materials remain intact.
function instanceStaticCylinders(parent) {
  const groups=new Map();
  for(const child of [...parent.children]) {
    if(!child.isMesh || child.geometry.type!=='CylinderGeometry'||Array.isArray(child.material))continue;
    const p=child.geometry.parameters;
    if(!p.radiusTop || !p.radiusBottom || !p.height)continue;
    const ratio=p.radiusTop/p.radiusBottom;
    const key=`${child.material.id}:${ratio.toFixed(5)}:${p.radialSegments}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(child);
  }
  for(const items of groups.values()){
    if(items.length<3)continue;
    const p=items[0].geometry.parameters;
    const ratio=p.radiusTop/p.radiusBottom;
    const inst=new THREE.InstancedMesh(new THREE.CylinderGeometry(ratio,1,1,p.radialSegments),items[0].material,items.length);
    inst.castShadow=items.some(o=>o.castShadow);
    inst.receiveShadow=items.some(o=>o.receiveShadow);
    inst.frustumCulled=false;
    const scale=new THREE.Matrix4();
    items.forEach((child,i)=>{
      child.updateMatrix();
      const d=child.geometry.parameters;
      scale.makeScale(d.radiusBottom,d.height,d.radiusBottom);
      inst.setMatrixAt(i,child.matrix.clone().multiply(scale));
      parent.remove(child);child.geometry.dispose();
    });
    inst.instanceMatrix.needsUpdate=true;
    parent.add(inst);
  }
}

async function run() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8d3e7);
  scene.fog = new THREE.Fog(0xb8d3e7,125,220);
  const mobile=matchMedia('(pointer:coarse)').matches;
  const historicWindowPreview=new URLSearchParams(location.search).get('view')==='historic-window';
  const quality=new URLSearchParams(location.search).get('quality');
  const highQuality=quality==='high';
  const camera = new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.05,250);
  const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,highQuality?(mobile?1.65:1.90):(mobile?1.30:1.65)));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .94; // slightly calmer highlights for stone detail
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('viewport').appendChild(renderer.domElement);

  // Less fill light + warmer directional light gives texture, sculpted column
  // highlights and genuine contrast under window reveals and cornices.
  const atmosphere=buildSky(THREE,scene,camera);
  // A neutral daylight balance: slightly cool skylight and non-yellow ground bounce.
  // Avoid the cream wash seen in V5 without turning the stone artificially blue.
  scene.add(new THREE.HemisphereLight(0xeaf3ff,0xb4a586,1.00));
  const sun = new THREE.DirectionalLight(0xfff4df,2.48);
  sun.position.set(39,48,-53);
  sun.castShadow = true;
  const shadowSize=highQuality?(mobile?2048:3072):(mobile?1024:2048);
  sun.shadow.mapSize.set(shadowSize,shadowSize);
  sun.shadow.camera.left=-48;sun.shadow.camera.right=48;
  sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;
  sun.shadow.camera.near=1; sun.shadow.camera.far=160;
  sun.shadow.bias=-.0002;
  sun.shadow.normalBias=.023;
  sun.shadow.radius=1.25;
  scene.add(sun);
  // Natural bounced daylight under deep colonnades: intentionally no
  // shadow casting, and substantially weaker than the direct sun.
  // This improves visibility without flattening the sculptural stonework.
  const northBounce = new THREE.DirectionalLight(0xf0f4ff,.63);
  northBounce.position.set(10,18,28);
  scene.add(northBounce);
  const southBounce = new THREE.DirectionalLight(0xffecd5,.42);
  southBounce.position.set(20,19,-30);
  scene.add(southBounce);

  // Realistischere Außenfläche: Rasen über das gesamte Grundstück
  // plus glaubwürdige Wege im Vorderbereich.
  const maple=await loadGardenMaple(THREE,new GLTFLoader()).catch(error=>{
    console.warn('Südgarten: Ersatzbaum wird verwendet.',error);
    return null;
  });
  buildGrounds(THREE,scene,{mobile,maple});

  const model = (await new GLTFLoader().loadAsync('./assets/white-house-structure.glb')).scene;
  model.name = 'Weisses_Haus_Originalarchitektur';
  scene.add(model);
  const northColumnBases=[419,421,423,425,427,429].map(id=>
    new THREE.Box3().setFromObject(model.getObjectByName(`Cube${id}`)));
  const northSteps=[433,434,435,436,437,438].map(id=>
    new THREE.Box3().setFromObject(model.getObjectByName(`Cube${id}`)));
  const replacedMeshes=new Set(
    ['Cube.005','Cube.006','Cube.518','Cube.519','Cube.520','Cube.521']
      .map(name=>THREE.PropertyBinding.sanitizeNodeName(name))
  );
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    // The original solid slabs at y=5.2 and y=10.3 would fill every new stairwell.
    // We replace ONLY those two meshes with the notched floor geometry.
    // Four old original GLB lamp bodies survived the V16 interior cleanup.
    // 518/519 = left lamp, 520/521 = right lamp. Hide the source objects,
    // not a cosmetic overlay; the entire project remains fixture-free.
    if(replacedMeshes.has(obj.name)){obj.visible=false;return;}
    obj.castShadow = true;
    obj.receiveShadow = true;
    // Original object names of the facade have been kept, so the enhancement
    // can replace low-detail windows accurately as in the uploaded project.
  });
  const {exterior,southPortico,facadeWindows,materials:externalMaterials,
    glass:exteriorGlass} = buildFacade(THREE,scene,renderer,model);
  // V29 ACTIVE ENTRANCE: real rectangular solid-oak 3D double leaves; no imported arch.
  const door=buildOakEntrance(THREE,scene);
  await addEntranceLamps(THREE,new GLTFLoader(),scene).catch(error=>{
    console.warn('Nordportal: Wandleuchten konnten nicht geladen werden.',error);
  });
  if(door.userData.design!=='V30-Eichendoppeltuer-hell-bis-zum-Sturz')
    throw new Error('V29: Falsches Tuerobjekt geladen');
  for(const name of ['Cube001','Cube002','Cube003'])model.getObjectByName(name).visible=false;
  const northWall=new THREE.Group();
  northWall.name='Nordfassade_Mauerwerk';
  buildNorthWindowWall(THREE,northWall,externalMaterials.facadeWall);
  instanceStaticBoxes(northWall);
  exterior.add(northWall);
  if(historicWindowPreview){
    // Explicit experimental placement of one uploaded model. The model is NOT
    // duplicated across the facade and does not alter structural openings.
    const assetPath=mobile
      ? './assets/imported-window/nik-window-1024.glb'
      : './assets/imported-window/nik-window-2048.glb';
    const imported=(await new GLTFLoader().loadAsync(assetPath)).scene;
    imported.name='Imported_Window_Nik_One_Bay_Licensed_CC_BY_4_0';
    const bounds=new THREE.Box3().setFromObject(imported);
    const center=bounds.getCenter(new THREE.Vector3());
    const size=bounds.getSize(new THREE.Vector3());
    const holder=new THREE.Group();
    holder.name='Historic_Window_Preview_Only_North_Floor_1_X_minus_15';
    imported.position.sub(center);
    holder.add(imported);
    // Target width 1.80m, its tall historical surround ~3.14m.
    const fit=1.80/size.x;
    holder.scale.setScalar(fit);
    holder.position.set(-15,7.80,12.38);
    imported.traverse(mesh=>{
      if(!mesh.isMesh)return;
      mesh.castShadow=true;mesh.receiveShadow=true;
      // Keep the author's textured materials unmodified.
    });
    exterior.add(holder);
    const credit=document.getElementById('imported-model-credit');
    if(credit)credit.hidden=false;
  }

  // Match the ORIGINAL 3D shell to the same physically based materials as the
  // new geometry. Otherwise its earlier untextured parts remain flat white.
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    const oldName=obj.material?.name;
    if(oldName==='Kalkstein')obj.material=externalMaterials.facadeWall;
    else if(oldName==='Gesimse')obj.material=externalMaterials.trim;
    else if(oldName==='Fenster'){
      obj.material=exteriorGlass;
      obj.castShadow=false;
      obj.visible=false;
    }
  });
  const {levels,walls,structure,stairs,wells,secondFloorRooms,stateFloorRooms,gardenRooms}=buildEmptyInterior(THREE,scene);
  const cinemaRoom=gardenRooms.find(room=>room.name==='Privatkino');
  const cinema=buildPrivateCinema(scene,cinemaRoom,levels[0],walls[0]);
  // Sole finishing exception to the V16 plain interior: the short, north
  // entrance corridor directly behind the automatic double entrance door.
  buildEntryFinish(THREE,scene);

  // V9: physically align outdoor stone skin to each real structural wall span.
  // Reuses the *same* PBR limestone as the rest of the building.
  cladStructuralExterior(THREE,structure,exterior,externalMaterials.facadeWall);
  // V16 Rohbau: no interior furnishing, marble overlay, carpets, wall lights
  // or lamps are created. Keep structural slabs, collision walls and stairs.
  instanceStaticBoxes(exterior);
  instanceStaticBoxes(facadeWindows);
  instanceStaticBoxes(southPortico);
  instanceStaticCylinders(southPortico);
  // Door leaves rotate as independent hinge groups. Instance their repeated timber
  // rails inside each leaf to reduce GPU draw calls without changing animations.
  for(const leaf of [...door.userData.leaves]){
    instanceStaticBoxes(leaf);
    instanceStaticCylinders(leaf);
  }
  instanceStaticBoxes(structure);

  // Reproducible start camera for viewing the new straight Ionic south portico.
  // Append ?view=south to the GitHub Pages URL; it changes only the start camera.
  const startView=new URLSearchParams(location.search).get('view');
  const cinemaView=startView==='kino';
  const southView=startView==='south';
  const southAngle=startView==='landgut';
  const westView=startView==='west';
  const eastView=startView==='east';
  const hallView=startView==='mittelflur';
  const gardenStart={x:0,z:6.78,yaw:0,pitch:.035};
  const stairView=startView==='stairs';
  const eyeHeight=stairView?STAIR_HALL_VIEW.eyeHeight:1.65;
  if(stairView){
    camera.fov=STAIR_HALL_VIEW.fov;
    camera.updateProjectionMatrix();
  }
  const ovalView=startView==='oval';
  const basementView=startView==='basement';
  const doorView=startView==='door';
  const stateView=startView==='state';
  const westSalon=startView==='west-salon';
  const eastSalon=startView==='east-salon';
  const salonView=westSalon||eastSalon;
  const vestibuleView=startView==='vestibule';
  const entryView=startView==='entry'||startView==='marble'; // historic URL alias, bare vestibule
  const stateHallView=startView==='statehall'; // ceremonial State Floor Entrance Hall
  const pos={x:hallView?gardenStart.x:cinemaView?cinema.start.x:salonView?(westSalon?-12.5:12.5):westView?-52:eastView?52:southAngle?36:stairView?STAIR_HALL_VIEW.x:basementView?9.25:stateHallView?.3:0,
    z:hallView?gardenStart.z:cinemaView?cinema.start.z:salonView?(-6.5):westView||eastView?0:stairView?STAIR_HALL_VIEW.z:ovalView?-5.44:basementView?-.65:stateView?-1.3:stateHallView?6.55:vestibuleView?7.02:entryView?11.06:southAngle?-47:southView?-43:doorView?entranceStartZ:34};
  if(historicWindowPreview){pos.x=-15;pos.z=23.0;}
  let floor=(stateView||stateHallView)?1:0,
      outside=!(hallView||cinemaView||stairView||stateView||basementView||ovalView||salonView||vestibuleView||entryView||stateHallView),
      yaw=hallView?gardenStart.yaw:westView?-Math.PI/2:eastView?Math.PI/2:southAngle?2.36:stairView?STAIR_HALL_VIEW.yaw:southView||basementView||salonView||vestibuleView?Math.PI:0,
      pitch=hallView?gardenStart.pitch:stairView?STAIR_HALL_VIEW.pitch:historicWindowPreview?.52:southAngle?.125:southView?.245:westView||eastView?.16:doorView?.02:.07, last=performance.now();
  let doorAngle=0, entranceOccupied=false;
  const [leftLeaf,rightLeaf]=door.userData.leaves;
  const thresholdZ=leftLeaf.position.z;
  let foot=(stateView||stateHallView)?levels[1].floor:(hallView||cinemaView||stairView||entryView||vestibuleView||basementView||ovalView||salonView||doorView)?levels[0].floor:.02;
  let eye=foot+eyeHeight, targetEye=eye, activeStair=null;
  if(stateView||stateHallView)floorSelect.value='1';
  let pointer=null,prevX=0,prevY=0;
  const keyDown=new Set(),touchDown=new Map();
  const viewport=renderer.domElement;

  function isInside(x,z){
    return x>-22.85&&x<22.85&&z>-11.57&&z<12.17;
  }
  function wouldHitWall(x,z,whichFloor){
    const radius=.23;
    return walls[whichFloor].some(w=>{
      const dx=x-w.x,dz=z-w.z;
      const c=Math.cos(w.rotY||0),s=Math.sin(w.rotY||0);
      const localX=dx*c-dz*s, localZ=dx*s+dz*c;
      return Math.abs(localX)<w.hw+radius&&Math.abs(localZ)<w.hd+radius;
    });
  }
  function valid(x,z,proposedRoute=activeStair){
    const radius=.22;
    if(Math.abs(x)>70||z>75||z< -60)return false;
    if(floor===0&&z< -18&&SOUTH_GARDEN_TREES.some(([tx,tz,scale])=>
      (x-tx)**2+(z-tz)**2<(radius+.61*scale)**2))return false;
    if(floor===0&&!activeStair){
      if(northColumnBases.some(base=>
        x>base.min.x-radius&&x<base.max.x+radius&&z>base.min.z-radius&&z<base.max.z+radius))return false;
      if(z<12.18&&z>7.88&&Math.abs(x)>1.32&&Math.abs(x)<23.64){
        const inBay=z<=ENTRY_WINDOW_INNER_FACE-radius&&ENTRY_WINDOW_BAYS.some(b=>
          x>b.left+radius&&x<b.right-radius);
        if(!inBay)return false;
      }
      if(Math.abs(z-thresholdZ)<1.7 && Math.abs(x)<1.8){
        if(z>12.03&&z<12.40&&Math.abs(x)>1.12&&Math.abs(x)<1.56)return false;
        for(const leaf of door.userData.leaves){
          const dx=x-leaf.position.x, dz=z-leaf.position.z;
          const cos=Math.cos(leaf.rotation.y), sin=Math.sin(leaf.rotation.y);
          const along=(cos*dx-sin*dz)*-Math.sign(leaf.position.x);
          const across=sin*dx+cos*dz;
          // Include the projecting handle near the free edge of each leaf.
          const depth=along>1.05 ? .36 : .21;
          if(along>-radius&&along<1.32+radius&&Math.abs(across)<depth+radius)return false;
        }
      }
      if(z<7.88&&z> -11.90&&Math.abs(x)>23-radius&&Math.abs(x)<23.68)return false;
      if(z< -11.56&&z> -12.19&&Math.abs(x)<23.60)return false;
    }else{
      if(Math.abs(x)>23.0-radius||z< -11.56+radius||z>7.95)return false;
    }
    const candidate=proposedRoute||beginStair(stairs,floor,x,z);
    if(inStairwell(wells,x,z,floor)){
      if(!candidate||stairSurface(candidate,x,z)===null)return false;
    }
    if(proposedRoute&&stairSurface(proposedRoute,x,z)===null&&z>=Math.min(proposedRoute.startA,proposedRoute.start)-.20)return false;
    const sample=proposedRoute?stairSurface(proposedRoute,x,z):null;
    const collisionFloor=sample===null?floor:Math.max(0,Math.min(2,Math.round((sample-.89)/4.6)));
    if(isInside(x,z)&&wouldHitWall(x,z,collisionFloor))return false;
    return true;
  }
  function outsideGround(x,z) {
    let height=.02;
    for(const step of SOUTH_TERRACE){
      if(Math.abs(x)<=step.halfWidth&&z>=step.front&&z<=-11.96)height=step.top;
    }
    for(const step of northSteps){
      if(x>=step.min.x&&x<=step.max.x&&z>=step.min.z&&z<=step.max.z){
        height=Math.max(height,step.max.y);
      }
    }
    return height;
  }
  function setStatus(label){
    if(status.textContent!==label)status.textContent=label;
  }
  function updateLabel(){
    if(activeStair){
      setStatus(`Herrenhaus · ${activeStair.well} · Treppe`);
    }else{
      const rooms=[gardenRooms,stateFloorRooms,secondFloorRooms][floor];
      const roomZ=floor===0&&ENTRY_WINDOW_BAYS.some(b=>pos.x>b.left&&pos.x<b.right)
        ?Math.min(pos.z,7.94):pos.z;
      const room=isInside(pos.x,pos.z)
        ?rooms.find(r=>pos.x>=r.x1&&pos.x<=r.x2&&roomZ>=r.z1&&roomZ<=r.z2)
        :null;
      setStatus((isInside(pos.x,pos.z)||!outside)
        ?`Herrenhaus · ${levels[floor].name} · ${room?room.name:'Rundgang'}`
        :'Herrenhaus · Außenansicht');
    }
  }
  function setFloor(index){
    if(!Number.isInteger(index)||index<0||index>=levels.length)return;
    floor=index;
    activeStair=null;outside=false;
    floorSelect.value=String(floor);
    pos.x=floor===0?gardenStart.x:0;pos.z=floor===0?gardenStart.z:-1.25;
    yaw=floor===0?gardenStart.yaw:0;pitch=floor===0?gardenStart.pitch:.02;foot=levels[floor].floor;eye=foot+eyeHeight;
    updateLabel();
  }
  floorSelect.addEventListener('change',()=>setFloor(Number(floorSelect.value)));
  function showNorthView(z,pitchAngle){
    outside=true;floor=0;activeStair=null;floorSelect.value='0';
    pos.x=0;pos.z=z;yaw=0;pitch=pitchAngle;foot=outsideGround(0,z);eye=foot+eyeHeight;
    updateLabel();
  }
  homeButton.addEventListener('click',()=>showNorthView(34,.08));
  entranceButton.addEventListener('click',()=>showNorthView(entranceStartZ,.02));
  addEventListener('keydown',e=>{
    if(e.target.closest?.('select,input,textarea,a'))return;
    const k=e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    keyDown.add(k);
  });
  addEventListener('keyup',e=>keyDown.delete(e.key.toLowerCase()));
  addEventListener('blur',()=>{keyDown.clear();touchDown.clear();pointer=null;});
  for(const b of document.querySelectorAll('[data-key]')){
    b.addEventListener('pointerdown',e=>{
      e.preventDefault();b.setPointerCapture(e.pointerId);touchDown.set(e.pointerId,b.dataset.key);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture']){
      b.addEventListener(type,e=>touchDown.delete(e.pointerId));
    }
  }
  viewport.addEventListener('pointerdown',e=>{
    if(pointer!==null)return;
    pointer=e.pointerId;prevX=e.clientX;prevY=e.clientY;
    viewport.setPointerCapture(pointer);
  });
  viewport.addEventListener('pointermove',e=>{
    if(pointer!==e.pointerId)return;
    yaw-=(e.clientX-prevX)*.0045;
    pitch=THREE.MathUtils.clamp(pitch-(e.clientY-prevY)*.0045,-1.32,1.32);
    prevX=e.clientX;prevY=e.clientY;
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
    viewport.addEventListener(type,e=>{if(pointer===e.pointerId)pointer=null;});
  }
  function pressed(a,b) {return keyDown.has(a)||keyDown.has(b)||[...touchDown.values()].includes(a)||[...touchDown.values()].includes(b);}
  function frame(now) {
    const dt=Math.min(.05,(now-last)/1000);last=now;
    // Bidirectional proximity sensor, with hysteresis: approach from the
    // forecourt OR from the hallway, then close only after walking away.
    // No button/key is needed. Floor previews must not activate the entrance.
    const distance=Math.hypot(pos.x*1.25,pos.z-thresholdZ);
    if(floor!==0)entranceOccupied=false;
    else if(distance<4.5)entranceOccupied=true;
    else if(distance>5.3)entranceOccupied=false;
    const goal=entranceOccupied?1.38:0;
    const previousAngle=doorAngle;
    doorAngle=THREE.MathUtils.damp(doorAngle,goal,6.5,dt);
    if(Math.abs(doorAngle-goal)<.002)doorAngle=goal;
    if(doorAngle!==previousAngle)renderer.shadowMap.needsUpdate=true;
    leftLeaf.rotation.y=-doorAngle;
    rightLeaf.rotation.y=doorAngle;
    const forward=Number(pressed('w','arrowup'))-Number(pressed('s','arrowdown'));
    const right=Number(pressed('d','arrowright'))-Number(pressed('a','arrowleft'));
    if(forward||right){
      const speed=3.15*dt/Math.max(1,Math.hypot(forward,right));
      const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed;
      const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed;
      function attempt(nx,nz){
        const entering=activeStair||beginStair(stairs,floor,nx,nz);
        if(!valid(nx,nz,entering))return;
        if(!activeStair&&entering)activeStair=entering;
        pos.x=nx;pos.z=nz;
      }
      attempt(pos.x+dx,pos.z);
      attempt(pos.x,pos.z+dz);
    }
    if(activeStair){
      const h=stairSurface(activeStair,pos.x,pos.z);
      if(h!==null)foot=h;
      const completed=finishedStair(activeStair,pos.x,pos.z);
      if(completed!==null){
        floor=completed;floorSelect.value=String(floor);
        activeStair=null;foot=levels[floor].floor;
      }
      outside=false;
    }else if(floor===0){
      outside=!isInside(pos.x,pos.z);
      foot=outside?outsideGround(pos.x,pos.z):levels[0].floor+cinema.floorOffset(pos.x,pos.z);
    }else{
      outside=false;foot=levels[floor].floor;
    }
    cinema.setLit(floor===0&&!outside&&cinema.contains(pos.x,pos.z));
    targetEye=foot+eyeHeight;
    eye=THREE.MathUtils.lerp(eye,targetEye,1-Math.exp(-dt*16));
    camera.position.set(pos.x,eye,pos.z);
    camera.rotation.set(pitch,yaw,0,'YXZ');
    updateLabel();
    atmosphere.update();
    renderer.render(scene,camera);
  }
  updateLabel();
  renderer.setAnimationLoop(frame);
  addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
  document.documentElement.dataset.ready='true';
}

await run();
