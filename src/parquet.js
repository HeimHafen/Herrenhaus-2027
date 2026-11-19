export function addOakParquet(THREE,group,slab,y,material){
  const {width,depth}=slab.geometry.parameters;
  const {x,z}=slab.position;
  const minX=x-width/2,maxX=x+width/2,minZ=z-depth/2,maxZ=z+depth/2;
  const bounds=[[0,minX,1],[0,maxX,-1],[1,minZ,1],[1,maxZ,-1]];
  const unit=.078, ratio=5, diagonal=Math.SQRT1_2;
  // The two rectangles occupy complementary residues of (u-v) modulo 2*ratio.
  const radius=Math.hypot(Math.max(Math.abs(minX),Math.abs(maxX)),
    Math.max(Math.abs(minZ),Math.abs(maxZ)))/unit;
  const positions=[],uv=[],colors=[],indices=[];
  function clip(polygon,axis,edge,sign){
    const result=[];
    for(let index=0;index<polygon.length;index++){
      const a=polygon[index],b=polygon[(index+1)%polygon.length];
      const A=(a[axis]-edge)*sign,B=(b[axis]-edge)*sign;
      if(A>=0)result.push(a);
      if((A>=0)!==(B>=0)){
        const t=A/(A-B);
        result.push(a.map((value,i)=>value+(b[i]-value)*t));
      }
    }
    return result;
  }
  function board(u,v,longU,key){
    const w=longU?ratio:1,d=longU?1:ratio;
    const jitter=((Math.imul(key,1597334677)>>>0)%997)/997;
    const shade=(longU ? 1.0 : .88)*(.73+.25*jitter);
    const start=positions.length/3;
    let poly=[[0,0],[0,d],[w,d],[w,0]]
      .map(([a,b])=>[(u+a-v-b)*unit*diagonal,(u+a+v+b)*unit*diagonal,
        longU?a/ratio:b/ratio,longU?b:a]);
    for(const bound of bounds)poly=clip(poly,...bound);
    if(poly.length<3)return;
    for(const [px,pz,s,t] of poly){
      positions.push(px,y,pz);
      uv.push(t*.31+jitter*.62,s*.77+jitter*.21);
      colors.push(shade*.84,shade*.98,shade);
    }
    for(let i=1;i<poly.length-1;i++)indices.push(start,start+i,start+i+1);
  }
  for(let row=-Math.ceil(radius);row<=radius;row++){
    for(let offset=-Math.ceil(radius/ratio);offset<=radius/ratio;offset++){
      const u=row+offset*ratio,v=row-offset*ratio;
      const key=row*7919+offset*1021;
      board(u,v,true,key);
      board(u+ratio,v-ratio+1,false,key+1);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const floor=new THREE.Mesh(geometry,material);
  floor.name='Gartengeschoss_Fischgraet_Eichenstaebe';
  floor.receiveShadow=true;
  group.add(floor);
  return floor;
}
