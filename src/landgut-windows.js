import { WINDOW_STOREYS, SIDE_WINDOW_AXES, SOUTH_WINDOW_AXES, southOpening,
  northAxesForFloor, NORTH_OPENING_WIDTH, SIDE_OPENING_WIDTH, openingHeight } from './window-layout.js?v=54';

export function buildLandgutWindows(THREE, exterior, mats, glass, {studyPreview=false}={}){
  const group=new THREE.Group();
  group.name='Landgut_Fenster_V54';
  exterior.add(group);
  const trim=mats.trim, iron=mats.brass;
  const sash=new THREE.MeshStandardMaterial({color:0x26231d,roughness:.57,metalness:.18});
  const openings=[];
  function window(elevation,floor,x,y,z,width,height,angle=0,door=false){
    const c=Math.cos(angle), s=Math.sin(angle);
    function box(name,dx,dy,dz,w,h,d,material){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      mesh.name=name;
      mesh.position.set(x+c*dx+s*dz,y+dy,z-s*dx+c*dz);
      mesh.rotation.y=angle;
      mesh.castShadow=material!==glass;
      mesh.receiveShadow=true;
      group.add(mesh);
    }
    openings.push({elevation,floor,x,y,z,width,height,door});
    const name=`Landgutfenster_${elevation}_${floor}`;
    const outer=-.054, zGlass=-.018, bars=-.071;
    const frame=.078, w=width+.024, h=height+.024;
    box(name+'_Glas',0,0,zGlass,w-.06,h-.06,.022,glass);
    for(const side of [-1,1]){
      box(name+'_Rahmen_V',side*(w-frame)/2,0,outer,frame,h,.13,sash);
      box(name+'_Rahmen_H',0,side*(h-frame)/2,outer,w,frame,.13,sash);
      box(name+'_Laibung',side*(width/2+.018),0,-.031,.037,h+.06,.087,trim);
    }
    box(name+'_Sohlbank',0,-height/2-.026,-.066,width+.126,.052,.21,trim);
    const rows=floor===2?4:6, span=w-2*frame, rise=h-2*frame;
    for(let col=1;col<4;col++){
      box(name+'_Sprosse_V_'+col,span*(col/4-.5),0,bars,door&&col===2?.057:.027,rise,.054,sash);
    }
    for(let row=1;row<rows;row++){
      box(name+'_Sprosse_H_'+row,0,rise*(row/rows-.5),bars,span,.027,.051,sash);
    }
    if(door)for(const side of [-1,1])
      box(name+'_Bronzegriff',side*.074,-.20,-.142,.021,.13,.036,iron);
  }

  for(const {floor,y} of WINDOW_STOREYS){
    for(const axis of SOUTH_WINDOW_AXES){
      const south=southOpening(axis,floor);
      window('Sued',floor,south.x,south.y,-11.96,south.width,south.height,0,south.door);
    }
    for(const x of northAxesForFloor(floor)){
      if(studyPreview&&floor===1&&x===-15)continue;
      window('Nord',floor,x,y,12,NORTH_OPENING_WIDTH,openingHeight(floor,'north'),Math.PI);
    }
    for(const side of [-1,1])for(const z of SIDE_WINDOW_AXES){
      window(side<0?'West':'Ost',floor,side*23.43,y,z,SIDE_OPENING_WIDTH,openingHeight(floor,'side'),-side*Math.PI/2);
    }
  }
  group.userData.openings=openings;
  return group;
}
