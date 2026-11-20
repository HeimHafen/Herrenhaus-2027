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
export const northAxesForFloor = floor => NORTH_WINDOW_AXES
  .filter(x=>floor===0 ? x!==0 : floor!==2 || Math.abs(x)>5)
  .map(x=>floor===0&&Math.abs(x)===5 ? Math.sign(x)*4.65 : x);

export const southAxisForFloor = (x,floor) => floor===0&&Math.abs(x)===5 ? x*1.15 : x;

export function openingHeight(floor, wall) {
  if(wall==='north')return floor===2?1.60:2.24;
  if(wall==='side')return floor===2?1.62:2.28;
  return floor<2?2.22:1.58;
}

// Room returns for the two garden-level windows flanking the entrance.
export const ENTRY_WINDOW_BAYS = Object.freeze([
  Object.freeze({left:-5.72,right:-1.39,x:-4.65}),
  Object.freeze({left:1.69,right:5.97,x:4.65})
]);
export const ENTRY_WINDOW_INNER_FACE = 11.58;

// Shared openings for the garden elevation and its real stone wall.
export function southOpening(axis,floor) {
  const door=floor<2&&Math.abs(axis)<=5;
  const mainGardenDoor=floor===0&&axis===0;
  const height=mainGardenDoor?3.55:floor===2?1.78:door?3.20:3.04;
  const y=door?(floor===0?.89:5.34)+.045+height/2:WINDOW_STOREYS[floor].y;
  return {x:axis,y,width:mainGardenDoor?2.45:floor===2?1.48:1.53,height,door};
}
