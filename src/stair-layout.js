export const STAIR_AXIS = 4.65;
export const STAIR_HALF_WIDTH = 2.70;
export const STAIR_LEVELS = Object.freeze([
  Object.freeze({floor:.89,top:5.05,name:'Gartengeschoss'}),
  Object.freeze({floor:5.34,top:10.16,name:'Hauptgeschoss'}),
  Object.freeze({floor:10.44,top:13.42,name:'Wohngeschoss'})
]);
export const STAIR_ENTRY = Object.freeze([1.88,1.40]);
export const STAIR_CORES = Object.freeze([-1,1].map(side=>{
  const center=side*STAIR_AXIS;
  return Object.freeze({
    name:side<0?'Westtreppe':'Osttreppe',center,
    left:center-STAIR_HALF_WIDTH,right:center+STAIR_HALF_WIDTH,
    laneA:center-1.26,laneB:center+1.26,width:2.36,
    start:1.43,groundStart:2.38,turn:6.28,far:7.865,mirror:side<0
  });
}));
export const GARDEN_ENTRANCE_OPENING = [-1.065,5.85];
export const STAIR_HALL_VIEW = {x:-3.39,z:1.87,yaw:Math.PI,pitch:.065,fov:48,eyeHeight:1.39};

export const WEST_CORE = STAIR_CORES[0];
