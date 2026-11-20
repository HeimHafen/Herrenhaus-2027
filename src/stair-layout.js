// The west stair core adjoins the north entrance corridor.
export const WEST_CORE = Object.freeze({
  center:-4.55,
  get laneA(){return this.center-1.48;},
  get laneB(){return this.center+1.48;},
  get left(){return this.center-2.70;},
  get right(){return this.center+2.70;}
});
export const GARDEN_ENTRANCE_OPENING = [-1.065,5.85];
export const STAIR_HALL_VIEW = {x:-6.68,z:-3.81,yaw:3.64,pitch:.065,fov:48,eyeHeight:1.39};
