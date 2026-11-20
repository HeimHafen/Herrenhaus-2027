// Shared dimensions for the modeled guards and their walking clearance.
export const WEST_STAIR = {
  playerRadius: .22,
  sideWall: 2.585,
  postHalf: .126,
  railHalf: .110
};
const guardClearance=WEST_STAIR.playerRadius+WEST_STAIR.postHalf;

function laneStart(stair,side){
  return side<0?stair.startA??stair.start:stair.start;
}

function inLane(stair,x,z,side){
  if(stair.mirror)x=2*stair.center-x;
  const nearPost=Math.abs(z-laneStart(stair,side))<guardClearance||
    Math.abs(z-stair.turn)<guardClearance;
  const inset=WEST_STAIR.playerRadius+(nearPost?WEST_STAIR.postHalf:WEST_STAIR.railHalf);
  const lane=side<0?stair.laneA:stair.laneB;
  const width=side<0?stair.widthA??stair.width:stair.width;
  return side*(x-lane)>-width/2+inset &&
    side*(x-stair.center)<WEST_STAIR.sideWall-WEST_STAIR.playerRadius;
}

export function stairSurface(stair,x,z){
  if(z>stair.far-(stair.rearRailInset??0)-WEST_STAIR.playerRadius||
    Math.abs(x-stair.center)>WEST_STAIR.sideWall-WEST_STAIR.playerRadius)return null;
  if(z>=stair.turn+guardClearance)return stair.mid;
  for(const [side,y] of [[-1,stair.lo],[1,stair.hi]]){
    const start=laneStart(stair,side);
    if(z<start-.32||!inLane(stair,x,z,side))continue;
    const t=Math.max(0,Math.min(1,(z-start)/(stair.turn-start)));
    return y+(stair.mid-y)*t;
  }
  return null;
}

export function inStairwell(wells,x,z,floor){
  return wells.some(w=>Math.abs(x-w.center)<2.70&&
    z>(floor===0?w.groundStart:w.start)-.05&&z<w.far);
}

export function beginStair(stairs,currentFloor,x,z){
  for(const stair of stairs){
    for(const [side,floor] of [[-1,stair.stage],[1,stair.stage+1]]){
      const start=laneStart(stair,side);
      if(currentFloor===floor&&z>=start-.13&&z<=start+.57&&inLane(stair,x,z,side))return stair;
    }
  }
  return null;
}

export function finishedStair(stair,x,z){
  for(const [side,floor] of [[-1,stair.stage],[1,stair.stage+1]]){
    if(z<laneStart(stair,side)-.14&&inLane(stair,x,z,side))return floor;
  }
  return null;
}
