// The original scanned stone pattern is tiled on one world-aligned grid.
export function buildEntranceFloor(THREE, group, y, regions, threshold) {
  const loader=new THREE.TextureLoader();
  const load=(name,color=false)=>{
    const map=loader.load('./assets/entrance-floor/'+name);
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.anisotropy=8;
    if(color)map.colorSpace=THREE.SRGBColorSpace;
    return map;
  };
  const material=new THREE.MeshPhysicalMaterial({
    color:0xf3e6d2,map:load('historische-fliesen-raster.jpg',true),
    bumpMap:load('historische-fliesen-raster-bump.jpg'),bumpScale:.006,
    roughness:.89,clearcoat:.18,clearcoatRoughness:.46
  });
  for(const {x1,x2,z1,z2} of [...regions,threshold]){
    const geometry=new THREE.PlaneGeometry(x2-x1,z2-z1);
    geometry.rotateX(-Math.PI/2);
    geometry.translate((x1+x2)/2,y,(z1+z2)/2);
    const p=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/2.10,-p.getZ(i)/3.36);
    const mesh=new THREE.Mesh(geometry,material);
    mesh.name='Historische_Steinplatten';
    mesh.receiveShadow=true;
    group.add(mesh);
  }
}
