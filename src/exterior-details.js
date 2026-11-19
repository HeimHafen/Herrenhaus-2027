// Weisses Haus 2027 – exterior detailing pass V5.
// Focus: cleaner quoins, stronger socle, sharper attic silhouette and more
// believable corner articulation on all elevations.
export function buildExteriorDetails(THREE, exterior, mats){
  const light=mats.trim, wall=mats.dressedStone;
  const group = exterior;
  let count=0;
  function box(name,x,y,z,w,h,d,material=light){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.name=name;mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;
    group.add(mesh);count++;
    return mesh;
  }
  const halfWidth=23.50, north=12, south=-11.956;
  for(const side of [-1,1]){
    box('Aussenecke_Fluchtstein',side*23.245,6.96,north-.162,.51,14,.324,mats.facadeWall);
    box('Aussenecke_Fluchtstein',side*23.215,6.96,south+.162,.45,14,.324,mats.facadeWall);
  }

  // Each course forms one rectangular outline. The transverse pieces terminate
  // against the inside face of the north and south pieces at both ends.
  function perimeter(name,y,height,projection,material,northOpening=0){
    const overlap=.10;
    const front=north+projection, back=south-projection;
    const width=2*(halfWidth+projection);
    const faceDepth=projection+overlap;
    box(name,0,y,back+faceDepth/2,width,height,faceDepth,material);
    if(northOpening){
      const span=width/2-northOpening;
      for(const side of [-1,1]){
        box(name,side*(northOpening+span/2),y,front-faceDepth/2,span,height,faceDepth,material);
      }
    }else{
      box(name,0,y,front-faceDepth/2,width,height,faceDepth,material);
    }
    const z0=back+faceDepth,z1=front-faceDepth;
    for(const side of [-1,1]){
      box(name,side*(halfWidth+projection-faceDepth/2),y,(z0+z1)/2,
        faceDepth,height,z1-z0,material);
    }
  }
  perimeter('Sockel_Durchgehender_Kalkstein',.39,.88,.136,mats.facadeWall,1.38);
  perimeter('Sockel_Abschlusskante',.84,.065,.16,light,1.38);
  for(const [y,h,projection] of [[4.91,.085,.115],[5.02,.055,.15],[9.47,.075,.115],[9.57,.048,.15]]){
    perimeter('Gesims_Umlaufend',y,h,projection,light);
  }
  perimeter('Dachgesims_Architrav',13.83,.12,.19,wall);
  perimeter('Dachgesims_Steinband',14.02,.23,.23,light);
  perimeter('Dachgesims_Tropfkante',14.18,.075,.28,light);
  perimeter('Attika_Kalksteinband',14.445,.39,.045,mats.facadeWall);
  perimeter('Attika_Deckstein',14.68,.08,.12,light);
  // Folded standing seams and perimeter flashings on the raised zinc roof.
  // The dimensions follow the roof slab defined in facade.js.
  const zinc=mats.zincDetail;
  const roofY=15.70;
  for(let x=-16.77;x<=16.78;x+=.78){
    box('Zinkdach_Stehfalz',x,roofY+.012,-2,.026,.029,16.48,zinc);
  }
  for(const end of [-1,1]){
    box('Zinkdach_Traufblech',0,roofY+.019,-2+end*8.27,35.6,.032,.11,zinc);
    box('Zinkdach_Ortgang',end*17.77,roofY+.019,-2,.12,.046,16.6,zinc);
  }
  // Chimney cap slabs, recessed flue collars and stepped base flashing.
  const flue=new THREE.MeshStandardMaterial({name:'Kaminzug_Schatten',color:0x302d29,roughness:1});
  for(const x of [-17,-10,10,17])for(const z of [-8,5]){
    box('Kamin_Blechschuerze',x,15.73,z,1.36,.08,1.22,zinc);
    for(const dx of [-.30,.30]){
      const centre=x+dx;
      box('Kaminzug_Tiefe',centre,17.203,z,.33,.012,.49,flue);
      for(const side of [-1,1]){
        box('Kaminzug_Kragen',centre+side*.19,17.265,z,.055,.124,.51,mats.dressedStone);
        box('Kaminzug_Kragen',centre,17.265,z+side*.227,.33,.124,.055,mats.dressedStone);
      }
    }
  }
  // Corner downpipes keep windows and both portico approaches clear.
  for(const side of [-1,1])for(const end of [-1,1]){
    const z=end*10.72,x=side*23.62;
    const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.058,.058,12.51,12),zinc);
    pipe.name='Fallrohr_Titanzink';
    pipe.position.set(x,7.30,z);
    pipe.castShadow=pipe.receiveShadow=true;
    group.add(pipe);
    count++;
    for(const y of [1.51,4.21,6.91,9.61,12.31]){
      box('Fallrohr_Schelle',x,y,z,.135,.047,.135,zinc);
      box('Fallrohr_Wandhalter',x-side*.105,y,z,.19,.043,.06,zinc);
    }
    box('Fallrohr_Einlauf',x,13.63,z,.19,.22,.22,zinc);
  }
  exterior.userData.detailCount=count;
  exterior.userData.exteriorPass='All-Elevations-Architectural-Detail-V43';
  return {detailCount:count};
}
