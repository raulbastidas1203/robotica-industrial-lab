import {inverseScara,robots} from './kinematics.js';

// The elapsed time is accumulated by the UI, so pause and speed changes preserve phase.
export function animationPose(robot,elapsed,branch=1){
  if(robot==='scara'){
    const a=elapsed*.55;
    const result=inverseScara({x:235+65*Math.cos(a),y:70+65*Math.sin(a),z:-70+15*Math.sin(a*2),yaw:0},branch);
    return result.q&&!result.warning?result.q:null;
  }
  return robots[robot].initial.map((value,i)=>value+Math.sin(elapsed*.65+i*.6)*(i<3?18:30));
}
