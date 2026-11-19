import { WINDOW_PAINT } from './window-finish.js?v=40';
// Herrenhaus 2027 V24: harmonised 6-over-6 windows.
// The imported CC0 sash windows remain the source assets, but their placement
// is refined so the mansion shell reads more coherent around the real models.
import { WINDOW_STOREYS, SIDE_WINDOW_AXES, northAxesForFloor, NORTH_OPENING_WIDTH, SIDE_OPENING_WIDTH, SOUTH_OPENING_WIDTH, southAxisForFloor, openingHeight,
  SOUTH_WINDOW_AXES, PORTICO_DOOR_AXES } from './window-layout.js?v=33';
export function getSixOverSixPlacements() {
  const placements=[];
  for(const side of [-1,1])for(const z of SIDE_WINDOW_AXES)for(const storey of WINDOW_STOREYS){
    const h=openingHeight(storey.floor,'side');
    placements.push({wall:'side',floor:storey.floor,x:side*23.42,y:storey.y,z,
      rotation:side===1?-Math.PI/2:Math.PI/2,h,width:SIDE_OPENING_WIDTH});
  }
  for(const storey of WINDOW_STOREYS)for(const axis of northAxesForFloor(storey.floor)){
    placements.push({wall:'north',floor:storey.floor,x:axis,y:storey.y,z:12.08,
      rotation:Math.PI,h:openingHeight(storey.floor,'north'),width:NORTH_OPENING_WIDTH});
  }
  for(const axis of SOUTH_WINDOW_AXES)for(const storey of WINDOW_STOREYS){
    if(storey.floor<2&&PORTICO_DOOR_AXES.includes(axis))continue;
    const h=openingHeight(storey.floor,'south');
    placements.push({wall:'south',floor:storey.floor,x:southAxisForFloor(axis,storey.floor),y:storey.y,z:-12.01,
      rotation:0,h,width:SOUTH_OPENING_WIDTH});
  }
  return placements;
}
export async function loadSixOverSixWindows(THREE, GLTFLoader, scene) {
  const gltf=await new GLTFLoader().loadAsync('./assets/imported-window/double-hung-6over6-cc0.glb');
  const model=gltf.scene;
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model,true);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const offset=new THREE.Matrix4().makeTranslation(-center.x,-center.y,-center.z);
  const placements=getSixOverSixPlacements();
  // Only FOUR instanced draw calls for all openings, rather than 4 x 74 meshes.
  const group=new THREE.Group();group.name='V24_74_Reale_Double_Hung_6over6_Fenster_CC0';
  const baseMatrix=new THREE.Matrix4();
  const pos=new THREE.Vector3(),rot=new THREE.Quaternion(),sca=new THREE.Vector3();
  const instanceMatrix=new THREE.Matrix4();
  const yaxis=new THREE.Vector3(0,1,0);
  const parts=[];
  model.traverse(part=>{
    if(part.isMesh)parts.push(part);
  });
  if(parts.length!==4)throw new Error('Fenstermodell: vier Geometriegruppen erwartet');
  for(const part of parts){
    const material=part.material.clone();
    if(material.name?.includes('Glazing')){
      material.transparent=true;material.opacity=.13;material.depthWrite=false;
      material.color.set(0xd8edf2);material.roughness=.20;material.metalness=0;
      material.side=THREE.DoubleSide;
    }else if(material.name?.startsWith('Frame, sashes and casing')){
      material.name=WINDOW_PAINT.name;
      material.color.set(WINDOW_PAINT.color);
      material.roughness=WINDOW_PAINT.roughness;
      material.metalness=WINDOW_PAINT.metalness;
    }
    const im=new THREE.InstancedMesh(part.geometry,material,placements.length);
    im.name='V24_Fenster_Originalteil_'+part.name;
    im.castShadow=!material.transparent;
    im.receiveShadow=true;
    im.frustumCulled=false;
    placements.forEach((p,i)=>{
      pos.set(p.x,p.y,p.z);
      rot.setFromAxisAngle(yaxis,p.rotation);
      sca.set((p.width+.09)/size.x,(p.h+.09)/size.y,1);
      baseMatrix.compose(pos,rot,sca).multiply(offset);
      instanceMatrix.multiplyMatrices(baseMatrix,part.matrixWorld);
      im.setMatrixAt(i,instanceMatrix);
    });
    im.instanceMatrix.needsUpdate=true;
    group.add(im);
  }
  group.userData={count:placements.length,model:'Double-hung window 1219x1524mm 6-over-6',
    aspectPreserved:false,layout:'V24-harmonised-mansion',openings:placements};
  scene.add(group);
  return group;
}
