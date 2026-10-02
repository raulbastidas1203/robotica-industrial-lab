export const rad = x => x * Math.PI / 180;
export const deg = x => x * 180 / Math.PI;
export const identity = () => [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
export const multiply = (a,b) => a.map(row => b[0].map((_,j) => row.reduce((v,x,k) => v+x*b[k][j],0)));
export const dh = (theta,d,a,alpha) => {
  const c=Math.cos(theta),s=Math.sin(theta),ca=Math.cos(rad(alpha)),sa=Math.sin(rad(alpha));
  return [[c,-s*ca,s*sa,a*c],[s,c*ca,-c*sa,a*s],[0,sa,ca,d],[0,0,0,1]];
};
export const robots = {
  scara: { name:'SCARA T3-401S', short:'SCARA', dof:4, description:'Dos giros, un desplazamiento y un giro de herramienta.', lengths:[225,175],
    initial:[30,55,-70,20], joints:[['θ₁',-180,180,'°'],['θ₂',-150,150,'°'],['d₃',-150,0,'mm'],['θ₄',-180,180,'°']],
    source:'semana2/T3_401S_DH.mlx', jacobianSource:'semana5/T3_401S_DH_Jacobiano.mlx',
    table:q=>[[rad(q[0]),0,225,0],[rad(q[1]),0,175,0],[0,q[2],0,0],[rad(q[3]),0,0,0]], signs:[1,1,1,1], prism:2, scale:500 },
  vt6: { name:'VT6L-901S', short:'VT6L', dof:6, description:'Manipulador de seis articulaciones de revolución.',
    initial:[0,-25,20,0,35,0], joints:[['θ₁',-180,180,'°'],['θ₂',-100,100,'°'],['θ₃',-120,120,'°'],['θ₄',-180,180,'°'],['θ₅',-120,120,'°'],['θ₆',-180,180,'°']],
    source:'semana2/DHL_VTL_901S.mlx',
    table:q=>[[rad(q[0])+Math.PI/2,412,100,90],[rad(q[1])+Math.PI/2,0,420,0],[rad(q[2]),0,0,-90],[rad(q[3]),-400,0,90],[rad(q[4]),0,0,-90],[rad(q[5]),-80,0,180]], signs:[1,1,1,1,1,1], scale:1100 },
  agilus: { name:'Agilus C4', short:'Agilus', dof:6, description:'Modelo DH con inversión del sentido de la primera articulación.',
    initial:[20,25,-20,0,40,10], joints:[['θ₁',-180,180,'°'],['θ₂',-110,110,'°'],['θ₃',-120,120,'°'],['θ₄',-180,180,'°'],['θ₅',-120,120,'°'],['θ₆',-180,180,'°']],
    source:'semana2/Agilus_C4.mlx', jacobianSource:'semana5/Agilus_C4_DH_Jacobiano.mlx',
    table:q=>[[rad(-q[0]),330,0,-90],[rad(q[1]),0,290,0],[rad(q[2])-Math.PI/2,0,20,90],[rad(q[3]),-310,0,-90],[rad(q[4]),0,0,90],[rad(q[5])+Math.PI,-75,0,180]], signs:[-1,1,1,1,1,1], scale:850 }
};
export const position = t => t.slice(0,3).map(r=>r[3]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function forward(robot,q) {
  const config=robots[robot], table=config.table(q), frames=[identity()];
  const local=table.map(row=>dh(...row));
  local.forEach(t=>frames.push(multiply(frames.at(-1),t)));
  return {table,local,frames,end:frames.at(-1),points:frames.map(position)};
}
export function jacobian(robot,q) {
  const config=robots[robot], {frames,end}=forward(robot,q), p=position(end);
  const cols=q.map((_,i)=>{
    const z=frames[i].slice(0,3).map(r=>r[2]*config.signs[i]);
    const origin=position(frames[i]);
    return i===config.prism ? [...z,0,0,0] : [...cross(z,p.map((x,j)=>x-origin[j])),...z];
  });
  return Array.from({length:6},(_,r)=>cols.map(c=>c[r]));
}
export function inverseScara({x,y,z,yaw},branch=1) {
  if (![x,y,z,yaw].every(Number.isFinite)) return {error:'Introduce números válidos para el objetivo.'};
  const L1=225,L2=175,c2=(x*x+y*y-L1*L1-L2*L2)/(2*L1*L2);
  if (Math.abs(c2)>1+1e-10) return {error:'Punto fuera del alcance geométrico: la distancia XY debe estar entre 50 y 400 mm.'};
  const t2=Math.atan2(branch*Math.sqrt(Math.max(0,1-c2*c2)),Math.max(-1,Math.min(1,c2)));
  const t1=Math.atan2(y,x)-Math.atan2(L2*Math.sin(t2),L1+L2*Math.cos(t2));
  const wrap=a=>((a+180)%360+360)%360-180;
  const q=[wrap(deg(t1)),deg(t2),z,wrap(yaw-deg(t1)-deg(t2))];
  const outside=q.some((v,i)=>v<robots.scara.joints[i][1]-1e-8||v>robots.scara.joints[i][2]+1e-8);
  return {q,warning:outside?'Solución geométrica fuera de los rangos didácticos de los controles. No se aplicará al robot.':null};
}
export function eulerZYX(t) {
  const pitch=Math.atan2(-t[2][0],Math.hypot(t[0][0],t[1][0]));
  const singular=Math.abs(Math.cos(pitch))<1e-8;
  return {angles: singular ? [deg(Math.atan2(-t[0][1],t[1][1])),deg(pitch),0] : [deg(Math.atan2(t[1][0],t[0][0])),deg(pitch),deg(Math.atan2(t[2][1],t[2][2]))],singular};
}
