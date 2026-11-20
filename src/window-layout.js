import { STAIR_CORES, STAIR_LEVELS } from './stair-layout.js?v=96';

// V10: ONE shared source for the opening centres and storey dimensions.
// These match architecture.js's actual masonry window holes. Do not move
// decorative windows independently of the structural opening coordinates.
export const WINDOW_STOREYS = Object.freeze([
  Object.freeze({floor:0,y:2.75,height:2.75}),
  Object.freeze({floor:1,y:7.80,height:2.75}),
  Object.freeze({floor:2,y:11.90,height:1.70})
]);
export const SIDE_WINDOW_AXES = Object.freeze([-9,-5,-1,3,7]);
export const SOUTH_WINDOW_AXES = Object.freeze([-20,-15,-10,-5,0,5,10,15,20]);
export const NORTH_WINDOW_AXES = Object.freeze([-20,-15,-10,-5,0,5,10,15,20]);
export const PORTICO_DOOR_AXES = Object.freeze([-5,0,5]);
export const SIDE_OPENING_WIDTH = 1.72;
export const SOUTH_OPENING_WIDTH = 1.56;

export const NORTH_OPENING_WIDTH = 1.68;
export const northAxesForFloor = () => NORTH_WINDOW_AXES.filter(x=>x!==0&&Math.abs(x)!==5);
export const STAIR_WINDOWS = Object.freeze(STAIR_LEVELS.slice(0,-1).flatMap(({floor},stage)=>
  STAIR_CORES.map(({center:x})=>{
    const bottom=(floor+STAIR_LEVELS[stage+1].floor)/2+.88;
    return Object.freeze({x,bottom,top:bottom+2.15,width:2.05,stage});
  })
));
export function northOpeningsForBand(floor,low,high) {
  const height=openingHeight(floor,'north');
  const bottom=WINDOW_STOREYS[floor].y-height/2;
  return [
    ...northAxesForFloor(floor).map(x=>({x,bottom,top:bottom+height,width:NORTH_OPENING_WIDTH})),
    ...STAIR_WINDOWS.filter(w=>w.bottom<high&&w.top>low)
  ];
}

// Several levels meet the tall landing windows. Clip each strip to its own
// wall band and leave the solid masonry between stacked openings intact.
export function buildNorthWallBand(floor,low,high,left,right,portal,segment){
  const openings=northOpeningsForBand(floor,low,high);
  if(floor===0)openings.push(portal);
  const columns=new Map();
  for(const opening of openings){
    const group=columns.get(opening.x)??[];
    group.push(opening);
    columns.set(opening.x,group);
  }
  let edge=left;
  for(const [x,group] of [...columns].sort(([a],[b])=>a-b)){
    const half=group[0].width/2;
    segment(edge,x-half,low,high,true);
    let sill=low;
    for(const {bottom,top} of group.sort((a,b)=>a.bottom-b.bottom)){
      if(bottom>sill)segment(x-half,x+half,sill,bottom,sill===low);
      sill=Math.max(sill,Math.min(high,top));
    }
    if(sill<high)segment(x-half,x+half,sill,high,false);
    edge=x+half;
  }
  segment(edge,right,low,high,true);
}

export const southAxisForFloor = (x,floor) => floor===0&&Math.abs(x)===5 ? x*1.15 : x;

export function openingHeight(floor, wall) {
  if(wall==='north')return floor===2?1.60:2.24;
  if(wall==='side')return floor===2?1.62:2.28;
  return floor<2?2.22:1.58;
}

// Shared openings for the garden elevation and its real stone wall.
export function southOpening(axis,floor) {
  const door=floor<2&&Math.abs(axis)<=5;
  const mainGardenDoor=floor<2&&axis===0;
  const height=mainGardenDoor?3.55:floor===2?1.78:door?3.20:3.04;
  const y=door?(floor===0?.89:5.34)+.045+height/2:WINDOW_STOREYS[floor].y;
  return {x:axis,y,width:mainGardenDoor?2.45:floor===2?1.48:1.53,height,door};
}

// Original bay dimensions for the archived entrance-salon study.
export const ENTRY_WINDOW_BAYS = Object.freeze([
  Object.freeze({left:-5.97,right:-1.935,x:-4.65}),
  Object.freeze({left:1.935,right:5.97,x:4.65})
]);
export const ENTRY_WINDOW_INNER_FACE = 11.58;
