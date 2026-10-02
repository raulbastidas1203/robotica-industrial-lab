import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {forward,jacobian,inverseScara,eulerZYX,rad,deg,robots} from '../src/kinematics.js';
import {animationPose} from '../src/animation.js';
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

const fixtures=JSON.parse(readFileSync(new URL('./fixtures/course-reference.json',import.meta.url),'utf8'));
test('21 poses agree with independent Rz/translation/Rx evaluation of original MATLAB notebooks',()=>{
  for(const fixture of fixtures){
    const original=readFileSync(new URL('../'+fixture.source,import.meta.url));
    assert.equal(createHash('sha256').update(original).digest('hex'),fixture.sourceSha256,'Regenerate reference after a source change');
    const actual=forward(fixture.robot,fixture.q).end;
    actual.forEach((row,i)=>row.forEach((value,j)=>near(value,fixture.end[i][j],1e-9)));
  }
});

test('published originals and MATLAB text match the course materials exactly',()=>{
  const materials=JSON.parse(readFileSync(new URL('../src/materials.json',import.meta.url),'utf8'));
  assert.equal(materials.length,12);
  for(const file of materials){
    assert.deepEqual(readFileSync(new URL('../'+file.id,import.meta.url)),readFileSync(new URL('../public/'+file.path,import.meta.url)));
    if(file.type==='mlx')assert.equal(readFileSync(new URL('../public/'+file.mPath,import.meta.url),'utf8'),file.code);
    for(const asset of [...file.pages||[],...file.images||[]])assert.ok(readFileSync(new URL('../public/'+asset,import.meta.url)).length>0);
  }
});

test('inverse SCARA reconstructs both branches across quadrants and wrapped orientations',()=>{
  for(const t1 of [-180,-135,-90,-5,0,60,135,180])for(const t2 of [-150,-90,-.001,0,.001,90,150])for(const yaw of [-720,-180,0,180,725]){
    const {end}=forward('scara',[t1,t2,-75,yaw-t1-t2]);
    for(const branch of [-1,1]){
      const result=inverseScara({x:end[0][3],y:end[1][3],z:-75,yaw},branch);
      assert.equal(result.error,undefined);assert.equal(result.warning,null);
      const rebuilt=forward('scara',result.q).end;
      rebuilt.forEach((row,i)=>row.forEach((value,j)=>near(value,end[i][j],1e-7)));
    }
  }
});

test('geometric reach, slider limits and singular boundaries are distinguished',()=>{
  for(const branch of [-1,1]){
    for(const x of [50,400]){
      const result=inverseScara({x,y:0,z:-150,yaw:180},branch);
      assert.equal(result.error,undefined);near(forward('scara',result.q).end[0][3],x);
      assert.equal(Boolean(result.warning),x===50); // 180° elbow exceeds the didactic ±150° range.
    }
    for(const z of [-150.01,.01])assert.ok(inverseScara({x:300,y:0,z,yaw:0},branch).warning);
    for(const x of [49.999,400.001])assert.ok(inverseScara({x,y:0,z:-70,yaw:0},branch).error);
  }
  for(const value of ['',NaN,Infinity,-Infinity])assert.ok(inverseScara({x:260,y:90,z:-70,yaw:value}).error);
});

test('SCARA analytic Jacobian and determinant expose both planar singularities',()=>{
  for(const q of [[30,55,-70,20],[-170,-110,-150,90],[0,0,0,0],[20,180,-80,30]]){
    const [a,b]=q.map(rad),J=jacobian('scara',q);
    const expected=[[-225*Math.sin(a)-175*Math.sin(a+b),-175*Math.sin(a+b),0,0],[225*Math.cos(a)+175*Math.cos(a+b),175*Math.cos(a+b),0,0],[0,0,1,0],[0,0,0,0],[0,0,0,0],[1,1,0,1]];
    J.forEach((row,i)=>row.forEach((value,j)=>near(value,expected[i][j])));
    near(J[0][0]*J[1][1]-J[0][1]*J[1][0],225*175*Math.sin(b),1e-8);
  }
});

test('Jacobians agree with finite differences at boundaries and wrist singularities',()=>{
  for(const {robot:name,q} of fixtures){
    const robot=robots[name],J=jacobian(name,q),T=forward(name,q).end,h=1e-6;
    for(let j=0;j<q.length;j++){
      const qp=[...q],qm=[...q],step=j===robot.prism?h:deg(h);qp[j]+=step;qm[j]-=step;
      const Tp=forward(name,qp).end,Tm=forward(name,qm).end;
      for(let i=0;i<3;i++)near(J[i][j],(Tp[i][3]-Tm[i][3])/(2*h),1e-4);
      const W=Array.from({length:3},(_,i)=>Array.from({length:3},(_,k)=>T[k].slice(0,3).reduce((sum,x,l)=>sum+(Tp[i][l]-Tm[i][l])*x/(2*h),0)));
      [W[2][1],W[0][2],W[1][0]].forEach((value,i)=>near(value,J[i+3][j],1e-6));
    }
  }
});

// Independent closed-form Rz(yaw)*Ry(pitch)*Rx(roll), including both gimbal locks.
const rotationZYX=([yaw,pitch,roll])=>{
  const [z,y,x]=[yaw,pitch,roll].map(rad),cz=Math.cos(z),sz=Math.sin(z),cy=Math.cos(y),sy=Math.sin(y),cx=Math.cos(x),sx=Math.sin(x);
  return [[cz*cy,cz*sy*sx-sz*cx,cz*sy*cx+sz*sx],[sz*cy,sz*sy*sx+cz*cx,sz*sy*cx-cz*sx],[-sy,cy*sx,cy*cx]];
};
test('Euler ZYX reconstructs rotation, including ±90° gimbal lock and nearby orientations',()=>{
  for(const yaw of [-175,0,47,180])for(const pitch of [-90,-89.9999999,-89.999,0,89.999,89.9999999,90])for(const roll of [-170,0,63,180]){
    const R=rotationZYX([yaw,pitch,roll]),result=eulerZYX(R),rebuilt=rotationZYX(result.angles);
    R.forEach((row,i)=>row.forEach((value,j)=>near(value,rebuilt[i][j],2e-8)));
    if(Math.abs(pitch)===90){assert.equal(result.singular,true);assert.equal(result.angles[2],0);}
  }
});

test('complete demo cycles stay inside controls and SCARA preserves its circular path and yaw',()=>{
  for(const name of Object.keys(robots))for(const branch of [-1,1])for(let i=0;i<=360;i++){
    const elapsed=i/360*2*Math.PI/(name==='scara'?.55:.65),q=animationPose(name,elapsed,branch);
    assert.ok(q);
    q.forEach((value,j)=>assert.ok(Number.isFinite(value)&&value>=robots[name].joints[j][1]&&value<=robots[name].joints[j][2]));
    if(name==='scara'){
      const {end}=forward(name,q);
      near(Math.hypot(end[0][3]-235,end[1][3]-70),65);
      near(end[0][0],1);near(end[1][0],0);near(end[2][3],-70+15*Math.sin(2*elapsed*.55));
    }
  }
});
