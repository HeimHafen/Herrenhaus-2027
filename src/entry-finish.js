import { addStonePanelling, addLimestoneFloor, createLimestoneFloor } from './garden-hall.js?v=68';
import { portalLintelY } from './north-portal.js?v=29';

export function buildEntryFinish(THREE,scene){
  const loader=new THREE.TextureLoader();
  const plasterRelief=loader.load('./assets/entry-finish/kalkputz-relief.jpg');
  plasterRelief.wrapS=plasterRelief.wrapT=THREE.RepeatWrapping;
  plasterRelief.repeat.set(2,2);
  const plasterTone=loader.load('./assets/entry-finish/kalkputz-farbton-v38.jpg');
  plasterTone.colorSpace=THREE.SRGBColorSpace;
  const plaster=new THREE.MeshStandardMaterial({
    color:0xe1c7a4,map:plasterTone,bumpMap:plasterRelief,bumpScale:.008,roughness:.91,
    emissive:0xc6a780,emissiveIntensity:.12
  });
  const ivory=new THREE.MeshStandardMaterial({
    color:0xe9d6b9,roughness:.77,emissive:0xe6ddcb,emissiveIntensity:.13
  });
  const ceiling=new THREE.MeshStandardMaterial({
    color:0xebd6b9,roughness:.92,emissive:0xd8bc98,emissiveIntensity:.23
  });
  const finish=new THREE.Group();
  finish.name='Eingangsflur_Ausbau';
  scene.add(finish);
  function piece(name,x,y,z,w,h,d,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.name=name;
    mesh.position.set(x,y,z);
    mesh.receiveShadow=true;
    finish.add(mesh);
  }

  const start=7.985,end=12.015;
  const depth=end-start, center=(start+end)/2;
  const floor=.937, underside=portalLintelY-.010;
  piece('Helle_Deckenuntersicht',0,underside+.022,center,2.70,.044,depth,ceiling);
  piece('Portal_Deckenabschluss',0,underside+.056,start-.093,2.86,.166,.16,ivory);
  piece('Portal_Deckenprofil',0,underside+.134,start-.174,2.92,.060,.10,ivory);
  addStonePanelling(THREE,finish,floor,[-1,1].map(side=>({
    x:side*1.346,z:center,length:depth,alongX:false,side:-side
  })));
  const approachStart=6.37, approachEnd=7.959;
  const approachDepth=approachEnd-approachStart;
  const approachZ=(approachStart+approachEnd)/2;
  piece('Nordflur_Deckenanschluss',0,4.992,approachZ,2.72,.026,approachDepth,ceiling);
  addLimestoneFloor(THREE,finish,createLimestoneFloor(THREE),0,.938,(7.89+8.02)/2,2.67,.13);
  addStonePanelling(THREE,finish,floor,[-1,1].map(side=>({
    x:side*1.299,z:approachZ,length:approachDepth,alongX:false,side:-side
  })));
  for(const side of [-1,1]){
    piece('Nordflur_Wandanschluss',side*1.318,(floor+4.99)/2,approachZ,
      .038,4.99-floor,approachDepth,plaster);
    piece('Nordflur_Deckenprofil',side*1.285,4.958,approachZ,.11,.049,approachDepth,ivory);
  }
  for(const side of [-1,1]){
    piece('Eingang_Portalwange',side*1.369,(floor+underside)/2,start-.026,
      .116,underside-floor,.080,ivory);
    const lower=floor+.895;
    piece('Kalkputz',side*1.346,(lower+underside)/2,center,
      .022,underside-lower,depth,plaster);
    piece('Deckenprofil_Wandleiste',side*1.312,underside-.052,center,.061,.085,depth,ivory);
    piece('Deckenprofil_Deckleiste',side*1.284,underside-.017,center,.113,.035,depth,ivory);
  }
}
