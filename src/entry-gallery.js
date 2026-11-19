export function buildEntryGallery(THREE, scene) {
  const gallery = new THREE.Group();
  gallery.name = 'Herrenhausgalerie';
  scene.add(gallery);
  const bronze = new THREE.MeshStandardMaterial({color:0x725337,metalness:.56,roughness:.38});
  const walnut = new THREE.MeshStandardMaterial({color:0x432b19,roughness:.56});
  const frameEdge = new THREE.MeshStandardMaterial({color:0x90673e,metalness:.28,roughness:.45});
  const opal = new THREE.MeshStandardMaterial({
    color:0xffead1,emissive:0xffcd8c,emissiveIntensity:.60,roughness:.42
  });
  const loader = new THREE.TextureLoader();
  function contactMaterial(name){
    const map=loader.load('./assets/entry-finish/'+name+'-kontaktschatten-v39.png');
    map.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map,transparent:true,depthWrite:false,opacity:.77,polygonOffset:true,polygonOffsetFactor:-1
    });
  }
  const pictureContact=contactMaterial('rahmen');
  const lampContact=contactMaterial('leuchte');
  // Broad, warm secondary illumination from the surrounding plaster.
  const bounce=new THREE.PointLight(0xffdfbf,4.8,5.6,2);
  bounce.position.set(0,3.48,9.35);
  gallery.add(bounce);

  function mesh(parent, geometry, material, x, y, z) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x,y,z);
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(parent, material, x,y,z,width,height,depth) {
    return mesh(parent,new THREE.BoxGeometry(width,height,depth),material,x,y,z);
  }

  for (const [side,motif] of [[-1,'flussufer'],[1,'allee']]) {
    const picture = new THREE.Group();
    picture.name = 'Landschaft_'+motif;
    picture.position.set(side*1.332,2.92,9.58);
    picture.rotation.y = -side*Math.PI/2;
    gallery.add(picture);
    const width=1.08, height=.80;
    mesh(picture,new THREE.PlaneGeometry(1.43,1.16),pictureContact,0,-.022,.004);
    const art=loader.load('./assets/entry-finish/'+motif+'.jpg');
    art.colorSpace=THREE.SRGBColorSpace;
    art.anisotropy=4;
    box(picture,walnut,0,0,.012,width+.086,height+.086,.025);
    mesh(picture,new THREE.PlaneGeometry(width,height),
      new THREE.MeshStandardMaterial({map:art,roughness:.78,emissive:0xffe6c8,
        emissiveMap:art,emissiveIntensity:.14}),0,0,.027);
    for (const sign of [-1,1]) {
      box(picture,walnut,sign*(width/2+.022),0,.029,.044,height+.088,.026);
      box(picture,walnut,0,sign*(height/2+.022),.029,width,.044,.026);
      box(picture,frameEdge,sign*(width/2+.007),0,.043,.012,height+.026,.010);
      box(picture,frameEdge,0,sign*(height/2+.007),.043,width,.012,.010);
    }

    const lamp=new THREE.Group();
    lamp.name='Opalglasleuchte';
    lamp.position.set(side*1.332,3.38,11.12);
    lamp.rotation.y=-side*Math.PI/2;
    gallery.add(lamp);
    mesh(lamp,new THREE.PlaneGeometry(.41,.82),lampContact,0,-.048,.004);
    box(lamp,bronze,0,-.04,.014,.151,.55,.033);
    box(lamp,bronze,0,-.177,.076,.073,.051,.123);
    const foot=[[0,-.257],[.025,-.253],[.042,-.227],[.047,-.194],
      [.067,-.179],[.081,-.168],[.081,-.151],[0,-.151]]
      .map(([r,y])=>new THREE.Vector2(r,y));
    mesh(lamp,new THREE.LatheGeometry(foot,20),bronze,0,0,.137);
    mesh(lamp,new THREE.CylinderGeometry(.069,.072,.372,24),opal,0,.036,.137);
    mesh(lamp,new THREE.CylinderGeometry(.072,.072,.012,24),bronze,0,-.151,.137);
    const warmLight=new THREE.PointLight(0xffbf75,2.75,3.9,2);
    warmLight.position.set(side*1.064,3.45,10.92);
    gallery.add(warmLight);
  }
}
