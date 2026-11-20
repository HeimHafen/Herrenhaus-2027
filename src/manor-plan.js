import { WEST_CORE } from './stair-layout.js?v=76';

const west=-23.15, east=23.15, south=-11.79, north=7.95;
export const HALL_NORTH=1.09;
const wingSouth=-2.25, hallSouth=-4.20;
const hallHalfWidth=11.95;
const northEdges=[west,-17.5,-12.5,WEST_CORE.left,WEST_CORE.right,1.85,6.55,11.95,17.5,east];
const southEdges=[west,-17.5,-7.5,7.5,17.5,east];
const northNames=[
  ['Garderobe und Gäste-WC','Hauswirtschaft','Teeküche','Haupttreppe','Windfang','Kaminzimmer','Nebentreppe','Spielzimmer','Werkraum'],
  ['Vorrat und Wäsche','Spülküche','Anrichte','Haupttreppe','Fensternische','Teesalon','Nebentreppe','Gästezimmer','Gästebad'],
  ['Familienbad','Wäsche','Ankleide','Haupttreppe','Bücher und Wäsche','Schrankraum','Nebentreppe','Kinderzimmer Ost','Duschbad']
];
const southNames=[
  ['Lager','Privatkino','Gartensalon','Bibliothek','Lesezimmer'],
  ['Frühstückszimmer','Wohnküche','Großer Salon','Speisezimmer','Musikzimmer'],
  ['Lesezimmer','Elternzimmer','Familienzimmer','Kinderzimmer Süd','Atelier']
];
const middle=(a,b)=>(a+b)/2;
export const northOpenings=northNames.map((names,level)=>names.flatMap((_,i)=>{
  if(level===1&&i===8)return [];
  const width=i===3||i===6?5.22:level===0&&i===4?2.75:1.22;
  return [[middle(northEdges[i],northEdges[i+1]),width]];
}));

export function buildManorPlan(THREE,{levels,box,horizontal,vertical,structure}) {
  const wood=new THREE.MeshStandardMaterial({color:0x72503b,roughness:.72});
  const cushion=new THREE.MeshStandardMaterial({color:0x7c8167,roughness:.92});
  return levels.map(({floor},level)=>{
    const rooms=[];
    const room=(name,x1,x2,z1,z2)=>rooms.push({name,x1,x2,z1,z2});
    horizontal(level,HALL_NORTH,west,east,northOpenings[level]);
    for(const [i,name] of northNames[level].entries()){
      const a=northEdges[i],b=northEdges[i+1];
      room(name,a,b,HALL_NORTH,north);
      if(i>0){
        const connecting=(level===0&&i===5)||(level===1&&i===8);
        vertical(level,a,HALL_NORTH,north,connecting?[[4.9,1.18]]:[]);
      }
    }
    for(const [i,name] of southNames[level].entries()){
      const a=southEdges[i],b=southEdges[i+1];
      const top=i===2?hallSouth:wingSouth;
      room(name,a,b,south,top);
      const width=i===2?2.8:level===0&&(i===1||i===3)?1.8:1.35;
      horizontal(level,top,a,b,[[middle(a,b),width]]);
      if(i>0)vertical(level,a,south,wingSouth,level===1&&(i===1||i===3)?[[-7,1.85]]:[]);
    }
    for(const x of [-hallHalfWidth,hallHalfWidth])vertical(level,x,wingSouth,HALL_NORTH,[[-.58,2.15]]);
    room('Westflur',west,-hallHalfWidth,wingSouth,HALL_NORTH);
    room('Halle',-hallHalfWidth,hallHalfWidth,wingSouth,HALL_NORTH);
    room('Halle',-7.5,7.5,hallSouth,wingSouth);
    room('Ostflur',hallHalfWidth,east,wingSouth,HALL_NORTH);
    if(level===0)room('Eingang',-1.56,1.56,north,12.18);
    for(const x of [-22.76,22.76]){
      box(x,floor+.24,-1.05,.56,.40,1.62,wood,level,true,'Fensterbank_Sitzbank');
      box(x,floor+.46,-1.05,.53,.12,1.54,cushion,-1,false,'Fensterbank_Sitzpolster');
    }
    for(const x of level===0?[]:[-17,-8,0,8,17]){
      const light=new THREE.PointLight(0xffe1bd,10,9,2);
      light.position.set(x,floor+2.16,-.65);
      structure.add(light);
    }
    return rooms;
  });
}
