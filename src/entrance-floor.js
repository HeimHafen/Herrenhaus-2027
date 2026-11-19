// Herrenhaus 2027 V19 – original photogrammetry stone MATERIAL localized in entrance only.
// Source: Entrance Floor Tiles by Vasilis Haroupas (user-supplied GLB).
// The original 59 MB scan also contains stairs and wall fragments; those are
// deliberately NOT imported into a separate functioning hallway.
// No other floor, stairs, architecture or collision is modified.
export function buildEntranceFloor(THREE, scene, renderer) {
  const width = 2.92;
  // Finish extends right to the oak threshold at z=12.34. No former 27 cm
  // unfinished apron behind the doors; the rest of the building stays bare.
  const depth = 4.32;
  const nearDoorZ = 12.34;
  const farEndZ = nearDoorZ - depth;
  const slabTop = .89 + .018 + .025;
  const finishOffset = .004;
  const loader = new THREE.TextureLoader();
  const path = './assets/entrance-floor/';
  const texture = loader.load(path + 'historische-eingangsfliesen.jpg', undefined,
    undefined, error => console.error('Fliesen-Textur nicht geladen:', error));
  const relief = loader.load(path + 'historische-eingangsfliesen-bump.jpg', undefined,
    undefined, error => console.error('Fliesen-Relief nicht geladen:', error));
  const roughnessMap=loader.load('./assets/entry-finish/fliesen-rauheit-v38.jpg');
  roughnessMap.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  const contactMap=loader.load('./assets/entry-finish/fliesen-kontaktschatten-v39.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  for (const tex of [texture, relief]) {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth),
    new THREE.MeshPhysicalMaterial({
      name: 'V19_Eingangsflur_Originalfotogrammetrie_Naturstein',
      color: 0xf3e6d2, map: texture, bumpMap: relief, bumpScale: 0.006,
      aoMap:contactMap, aoMapIntensity:.88, roughness: 1, roughnessMap, clearcoat: .23, clearcoatRoughness: .46, metalness: 0, side: THREE.FrontSide, depthWrite: true
    })
  );
  floor.name = 'V19_NUR_Eingangsflur_Echte_Steinmaterialien';
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, slabTop + finishOffset, (nearDoorZ + farEndZ) / 2);
  floor.receiveShadow = true;
  floor.castShadow = false;
  scene.add(floor);
  return floor;
}
