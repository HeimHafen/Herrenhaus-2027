// Herrenhaus 2027 V23 – Castle Style Door / GLTFLoader name-safe hinge fix.
// Source: Visthétique / Sketchfab, CC BY 4.0; author's original meshes retained.
// Three.js / GLTFLoader may sanitize dots in names: Frame.002 -> Frame_002.
// Therefore identify the ORIGINAL leaf assemblies by their normalized names,
// with a geometry-based fallback, not by the raw Sketchfab spelling alone.
export async function loadCastleDoor(THREE, GLTFLoader, scene) {
  const loaded = await new GLTFLoader().loadAsync('./assets/imported-door/castle-style-door-optimized.glb');
  const root = loaded.scene;
  root.name = 'V23_Castle_Style_Door_Visthétique_CC_BY_4';
  root.updateMatrixWorld(true);
  // Preserve the original model's aspect ratio and existing V22 placement.
  const factor = 1.245;
  root.scale.setScalar(factor);
  root.position.set(0, .935, 12.19);

  const keyOf = name => String(name || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  function meshParts(node) {
    const meshes=[];
    node.traverse(child=>{ if(child.isMesh) meshes.push(child); });
    return meshes;
  }
  function findLeaf(sourceName) {
    const key=keyOf(sourceName);
    let result=null;
    // Works with both original GLB names and GLTFLoader's sanitized names.
    root.traverse(node=>{
      if(!result && keyOf(node.name)===key && meshParts(node).length>=2)
        result=node;
    });
    if(result)return result;
    // Protect against future GLTFLoader renaming: identify the group that
    // contains the corresponding wood and glass meshes (same original id).
    root.traverse(node=>{
      if(result || node.isMesh || !node.children?.length)return;
      const parts=meshParts(node);
      if(parts.length!==2)return;
      const names=parts.map(part=>keyOf(part.name));
      if(names.some(name=>name.startsWith(key) && name.includes('wood')) &&
         names.some(name=>name.startsWith(key) && name.includes('glass')))
        result=node;
    });
    return result;
  }
  const leaves=[];
  const warnings=[];
  for(const [originalName,hingeX,label] of [
    ['Frame.002',-.7074,'Tuerfluegel_links'],
    ['Frame.001', .7074,'Tuerfluegel_rechts']
  ]) {
    const source=findLeaf(originalName);
    const pivot=new THREE.Group();
    pivot.name=label;
    pivot.position.set(hingeX,0,0);
    root.add(pivot);
    root.updateMatrixWorld(true);
    if(source) {
      // Attach preserves the current mesh world transform / closed pose.
      pivot.attach(source);
    } else {
      // Keep the building running if an artist or exporter changes node names.
      // In that exceptional case the original leaf remains visually static.
      warnings.push(originalName);
      console.warn('Türflügel konnte nicht animiert werden:',originalName);
    }
    leaves.push(pivot);
  }
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=true;
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const material of materials){
      if(!material || !/glass/i.test(material.name||''))continue;
      obj.castShadow=false;
      material.side=THREE.DoubleSide;
      material.transparent=true;
      material.depthWrite=false;
    }
  });
  root.userData.leaves=leaves;
  root.userData.design='V23-Original-Castle-Style-Door-Visthétique';
  root.userData.originalMeters={width:2.124248,height:2.667218};
  root.userData.installedMeters={width:2.64469,height:3.32069};
  root.userData.missingLeafAssemblies=warnings;
  scene.add(root);
  return root;
}
