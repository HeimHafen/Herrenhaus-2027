export async function addEntranceLamps(THREE,loader,scene){
  const {scene:fixture}=await loader.loadAsync('./assets/lighting/victorian-street-lamp.glb');
  const mountZ=12.012, mountX=1.91, centerY=3.19, scale=.43;
  fixture.rotation.y=Math.PI;
  fixture.scale.setScalar(scale);
  fixture.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(fixture);
  const center=bounds.getCenter(new THREE.Vector3());
  const lamps=new THREE.Group();
  lamps.name='Nordportal_Viktorianische_Wandleuchten';
  fixture.traverse(object=>{
    if(object.isMesh){
      object.castShadow=true;
      object.receiveShadow=true;
    }
  });
  for(const side of [-1,1]){
    const lamp=fixture.clone(true);
    lamp.position.set(side*mountX-center.x,centerY-center.y,mountZ-bounds.min.z);
    lamp.name=side<0?'Nordportal_Wandleuchte_West':'Nordportal_Wandleuchte_Ost';
    lamps.add(lamp);
  }
  scene.add(lamps);
  return lamps;
}
