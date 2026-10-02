import test from 'node:test';
import assert from 'node:assert/strict';
import {forward,jacobian,inverseScara,rad,robots} from '../src/kinematics.js';
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
test('SCARA home matches analytic position and vertical convention',()=>{
  const {end}=forward('scara',[0,0,-70,0]);near(end[0][3],400);near(end[1][3],0);near(end[2][3],-70);
});
test('both inverse branches reconstruct position and orientation',()=>{
  for(const branch of [-1,1]) for(const target of [{x:260,y:90,z:-70,yaw:20},{x:-200,y:160,z:-100,yaw:-40}]){
    const {q,error}=inverseScara(target,branch);assert.equal(error,undefined);
    const {end}=forward('scara',q);near(end[0][3],target.x);near(end[1][3],target.y);near(end[2][3],target.z);near(end[0][0],Math.cos(rad(target.yaw)));near(end[1][0],Math.sin(rad(target.yaw)));
  }
});
test('unreachable and malformed inverse inputs return errors',()=>{
  assert.ok(inverseScara({x:401,y:0,z:0,yaw:0}).error);assert.ok(inverseScara({x:0,y:0,z:0,yaw:0}).error);assert.ok(inverseScara({x:NaN,y:0,z:0,yaw:0}).error);
});
test('geometric Jacobians match translation and rotation finite differences for all robots',()=>{
  for(const [name,robot] of Object.entries(robots)){
    const q=robot.initial,J=jacobian(name,q),T=forward(name,q).end,h=1e-6;
    for(let j=0;j<q.length;j++){
      const qp=[...q],qm=[...q],step=j===robot.prism?h:h*180/Math.PI;qp[j]+=step;qm[j]-=step;
      const Tp=forward(name,qp).end,Tm=forward(name,qm).end;
      for(let i=0;i<3;i++)near(J[i][j],(Tp[i][3]-Tm[i][3])/(2*h),1e-4);
      const dR=Tp.slice(0,3).map((r,i)=>r.slice(0,3).map((x,k)=>(x-Tm[i][k])/(2*h)));
      const omega=dR.map(row=>Array.from({length:3},(_,k)=>row.reduce((a,x,l)=>a+x*T[k][l],0)));
      [omega[2][1],omega[0][2],omega[1][0]].forEach((w,i)=>near(J[i+3][j],w,1e-6));
    }
  }
});
test('all DH rotations are orthonormal and homogeneous',()=>{
  for(const [name,robot] of Object.entries(robots))for(const T of forward(name,robot.initial).frames){
    assert.deepEqual(T[3],[0,0,0,1]);for(let i=0;i<3;i++)for(let j=0;j<3;j++)near(T[i].slice(0,3).reduce((v,x,k)=>v+x*T[j][k],0),i===j?1:0);
  }
});
