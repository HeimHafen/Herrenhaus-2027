import { WEST_CORE, GARDEN_ENTRANCE_OPENING } from './stair-layout.js?v=72';

export const GARDEN_HALL_NORTH_OPENINGS=[
  [-21.55,1.65],[-15.65,2.45],[-9.5,1.75],[WEST_CORE.center,5.65],GARDEN_ENTRANCE_OPENING,
  [9.25,5.36],[15.02,1.75],[21.1,1.6]
];

// Interior proportions traced from the supplied illustration, fitted to the
// existing garden-level shell. The two existing stair cores are retained.
export function buildGardenPlan(THREE, {level, box, horizontal, vertical, oval}) {
  const north=7.95, south=-11.79, west=-23.15, east=23.15;
  const hallNorth=.62, hallSouth=-4.36;
  const ovalZ=-7.99, ovalDepth=3.69, ovalWidth=4.15;
  horizontal(0,hallNorth,west,east,GARDEN_HALL_NORTH_OPENINGS);
  horizontal(0,hallSouth,west,east,[
    [-21.5,1.7],[-15.2,2.5],[-8.1,1.8],[0,3.13],[7.9,1.8],
    [14.85,1.9],[21.15,1.65]
  ]);
  for (const [x,doors] of [
    [-18.45,[[2.1,1.5]]],[-11.75,[[2.6,1.5]]],
    [WEST_CORE.left,[]],
    [5.97,[[2.45,1.5]]],
    [11.95,[[2.4,1.5]]],[18.55,[[2.25,1.55]]]
  ]) {
    vertical(0,x,hallNorth,north,doors);
  }
  for (const [x,doors] of [
    [-18.45,[[-7,1.55]]],[-11.55,[[-7,1.55]]],
    [-4.55,[]],[4.67,[]],[11.5,[[-7.1,1.45]]],[18.55,[[-7,1.48]]]
  ]) {
    vertical(0,x,south,hallSouth,doors);
  }
  // Short returns mark the sitting halls without severing the main interior route.
  vertical(0,-11.55,hallSouth,hallNorth,[[-1.8,2.65]]);
  vertical(0,11.5,hallSouth,hallNorth,[[-1.8,2.65]]);
  oval(0,{cx:0,cz:ovalZ,rx:ovalWidth,rz:ovalDepth,openingHalfAngle:.38,southWindow:true});

  const y=level.floor;
  const wood=new THREE.MeshStandardMaterial({color:0x684136,roughness:.55});
  const leather=new THREE.MeshStandardMaterial({color:0x42564f,roughness:.8});
  const rug=new THREE.MeshStandardMaterial({color:0x365270,roughness:1});
  const trim=new THREE.MeshStandardMaterial({color:0xa6854d,roughness:.5,metalness:.3});
  const ovalRug=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.014,64),rug);
  ovalRug.scale.set(3.12,1,2.56);
  ovalRug.position.set(0,y+.052,ovalZ);
  ovalRug.receiveShadow=true;
  // Add alongside the collision-aware boxes via their shared parent.
  const desk=box(0,y+.76,-9.52,2.14,.12,.92,wood,0,true,'Oval_Office_Schreibtisch');
  desk.parent.add(ovalRug);
  for (const x of [-.82,.82]) {
    box(x,y+.38,-9.52,.39,.73,.80,wood,-1,false,'Oval_Office_Schreibtisch_Sockel');
  }
  box(0,y+.45,-10.45,.61,.15,.61,leather,0,true,'Oval_Office_Schreibtischstuhl_Sitz');
  box(0,y+.78,-10.71,.61,.61,.12,leather,0,true,'Oval_Office_Schreibtischstuhl_Lehne');
  for (const x of [-2.36,2.36]) {
    box(x,y+.38,-7.8,.84,.30,1.95,leather,0,true,'Oval_Office_Sofa_Sitz');
    box(x+Math.sign(x)*.38,y+.67,-7.8,.18,.53,1.95,leather,0,true,'Oval_Office_Sofa_Lehne');
    for (const z of [-8.68,-6.92]) {
      box(x,y+.59,z,.82,.24,.19,leather,0,true,'Oval_Office_Sofa_Armlehne');
    }
  }
  box(0,y+.43,-7.58,.94,.10,1.24,wood,0,true,'Oval_Office_Couchtisch');
  for (const x of [-.37,.37]) for (const z of [-8.07,-7.09]) {
    box(x,y+.21,z,.075,.41,.075,wood,-1,false,'Oval_Office_Tischbein');
  }
  box(.65,y+.85,-9.57,.31,.065,.23,trim,-1,false,'Oval_Office_Schreibset');

  function row(names,edges,z1,z2) {
    return names.map((name,i)=>({name,x1:edges[i],x2:edges[i+1],z1,z2}));
  }
  return [
    ...row(['Küche','Speisezimmer','Westzimmer','Kosmetikraum / Westtreppe','Nordflur','Ostzimmer','Osttreppe','Queen’s Bedroom','Queen’s Sitting Room'],
      [west,-18.45,-11.75,WEST_CORE.left,-1.72,1.69,5.97,11.95,18.55,east],hallNorth,north),
    ...row(['Westlicher Salonflur','Mittelflur','Östlicher Salonflur'],
      [west,-11.55,11.5,east],hallSouth,hallNorth),
    ...row(['Ankleidezimmer','Schlafzimmer des Präsidenten','Privater Salon','Oval Office','Treaty Room','Lincoln Bedroom','Lincoln Sitting Room'],
      [west,-18.45,-11.55,-4.55,4.67,11.5,18.55,east],south,hallSouth)
  ];
}
