export function addStairNiche(THREE,structure,walls,{left,right,wallFace,floor}){
  const group=new THREE.Group();
  group.name='Treppennische';
  group.position.set((left+right)/2,floor,wallFace);
  structure.add(group);

  const loader=new THREE.TextureLoader();
  const grain=loader.load('./assets/wood/eiche-dunkel-v26.jpg');
  grain.colorSpace=THREE.SRGBColorSpace;
  const walnut=new THREE.MeshStandardMaterial({map:grain,color:0x987253,roughness:.5});
  const dark=new THREE.MeshStandardMaterial({color:0x382117,roughness:.48});
  const red=new THREE.MeshStandardMaterial({color:0x712c1d,roughness:.58});
  const gold=new THREE.MeshStandardMaterial({color:0xad8551,metalness:.64,roughness:.4});

  function add(geometry,material,x,y,z,name){
    const object=new THREE.Mesh(geometry,material);
    object.name=name;
    object.position.set(x,y,z);
    object.castShadow=object.receiveShadow=true;
    group.add(object);
    return object;
  }
  function box(material,x,y,z,w,h,d,name='Konsolenprofil'){
    return add(new THREE.BoxGeometry(w,h,d),material,x,y,z,name);
  }
  const tableZ=-.27;
  box(walnut,0,.867,tableZ,1.33,.046,.44,'Walnusskonsole');
  box(dark,0,.834,tableZ,1.29,.027,.417);
  box(walnut,0,.735,tableZ,1.225,.17,.37);
  box(dark,0,.643,tableZ,1.245,.027,.391);
  box(red,0,.736,-.459,1.03,.109,.018,'Rot_lackierte_Schublade');
  for(const y of [.686,.787])box(gold,0,y,-.470,1.015,.007,.01);
  for(const x of [-.505,.505])box(gold,x,.736,-.470,.007,.106,.01);
  add(new THREE.SphereGeometry(.021,16,10),gold,0,.736,-.479,'Messingknopf');
  const leg=new THREE.LatheGeometry([
    [0,0],[.035,0],[.042,.021],[.03,.055],[.02,.103],[.03,.16],[.025,.20],
    [.025,.43],[.037,.48],[.033,.52],[.045,.57],[.05,.615],[.042,.66],[0,.66]
  ].map(([r,y])=>new THREE.Vector2(r,y)),18);
  for(const x of [-.54,.54]){
    for(const z of [-.11,-.427])add(leg,walnut,x,0,z,'Gedrechseltes_Konsolenbein');
    box(walnut,x,.164,tableZ,.034,.038,.317,'Seitliche_Strebe');
  }
  box(walnut,0,.164,tableZ,1.08,.037,.044,'Querstrebe');
  add(new THREE.SphereGeometry(.04,16,10),dark,0,.194,tableZ,'Zierknauf');

  const art=loader.load('./assets/treppennische/waldfluss.jpg');
  art.colorSpace=THREE.SRGBColorSpace;
  const picture=add(new THREE.PlaneGeometry(.64,.97),
    new THREE.MeshStandardMaterial({map:art,roughness:.91}),0,1.53,-.037,'Waldfluss_Hochformat');
  picture.rotation.y=Math.PI;
  picture.castShadow=false;
  // Both layered frame profiles share the center axis of the recess.
  for(const [w,h,edge,d,z,material] of [
    [.76,1.09,.055,.042,-.027,dark],
    [.685,1.015,.023,.020,-.051,gold]
  ]){
    for(const side of [-1,1]){
      box(material,side*(w-edge)/2,1.53,z,edge,h,d,'Bilderrahmen');
      box(material,0,1.53+side*(h-edge)/2,z,w-2*edge,edge,d,'Bilderrahmen');
    }
  }
  walls.push({x:group.position.x,z:wallFace+tableZ,hw:1.33/2,hd:.22});
}
