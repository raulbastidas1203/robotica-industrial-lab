import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {forward,robots,rad} from './kinematics';

const vector=(p,offset)=>new THREE.Vector3(p[0],p[2]+offset,-p[1]);
export default function RobotScene({robot,q,showFrames,showWorkspace,resetCamera}) {
  const host=useRef(),engine=useRef();const [error,setError]=useState(false);
  useEffect(()=>{
    let renderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor('#101c2d');
    host.current.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.fog=new THREE.Fog('#101c2d',1800,4200);
    const camera=new THREE.PerspectiveCamera(38,1,1,6000);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=300;controls.maxDistance=2800;
    scene.add(new THREE.HemisphereLight('#dcefff','#344257',2.6));
    const light=new THREE.DirectionalLight('#fff0d5',3);light.position.set(700,1000,500);scene.add(light);
    const cyan=new THREE.PointLight('#60e9e2',3,1800);cyan.position.set(-400,400,-400);scene.add(cyan);
    const grid=new THREE.GridHelper(2400,48,'#35516e','#1e334d');grid.position.y=-1;scene.add(grid);
    const group=new THREE.Group();scene.add(group);
    const resize=()=>{const {clientWidth:w,clientHeight:h}=host.current;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(host.current);resize();
    let frame;const render=()=>{frame=requestAnimationFrame(render);controls.update();renderer.render(scene,camera);};render();
    engine.current={scene,group,camera,controls,renderer};
    return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});renderer.dispose();renderer.domElement.remove();engine.current=null;};
  },[]);
  useEffect(()=>{
    if(!engine.current)return;const {camera,controls}=engine.current,s=robots[robot].scale;
    const points=forward(robot,q).points.map(p=>vector(p,robot==='scara'?200:0));
    points.push(new THREE.Vector3(0,0,0));
    const bounds=new THREE.Box3().setFromPoints(points),center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2+60;
    const halfVertical=THREE.MathUtils.degToRad(camera.fov/2),halfHorizontal=Math.atan(Math.tan(halfVertical)*camera.aspect);
    const distance=radius/Math.sin(Math.min(halfVertical,halfHorizontal))*1.15;
    camera.position.copy(center).add(new THREE.Vector3(1,.8,1.3).normalize().multiplyScalar(distance));controls.target.copy(center);controls.update();
  },[robot,resetCamera]);
  useEffect(()=>{
    if(!engine.current)return;const {group}=engine.current;
    while(group.children.length){const o=group.children[0];o.traverse(child=>{child.geometry?.dispose();if(child.material){for(const m of Array.isArray(child.material)?child.material:[child.material]){m.map?.dispose();m.dispose();}}});group.remove(o);}
    const off=robot==='scara'?200:0,{points,frames}=forward(robot,q),ps=points.map(p=>vector(p,off));
    const mat=color=>new THREE.MeshStandardMaterial({color,metalness:.38,roughness:.35});
    const addCylinder=(a,b,r,color)=>{
      const dist=a.distanceTo(b);if(dist<.01)return;
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dist,24),mat(color));mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());group.add(mesh);
    };
    const base=new THREE.Mesh(new THREE.CylinderGeometry(robot==='scara'?55:90,robot==='scara'?75:115,32,48),mat('#253951'));base.position.set(0,16,0);group.add(base);
    if(robot==='scara')addCylinder(new THREE.Vector3(0,32,0),ps[0],30,'#b7c5d6');
    for(let i=1;i<ps.length;i++)addCylinder(ps[i-1],ps[i],robot==='scara'?(i===3?10:17):(i>3?17:28),i===1?'#51d7cd':i===2?'#e7edf4':'#f3a75d');
    ps.forEach((p,i)=>{const sphere=new THREE.Mesh(new THREE.SphereGeometry(i===ps.length-1?13:robot==='scara'?22:34,24,16),mat(i===ps.length-1?'#f6b26b':'#527088'));sphere.position.copy(p);group.add(sphere);});
    // Tool orientation is visible even when consecutive DH origins coincide.
    const tip=ps.at(-1),R=frames.at(-1),direction=vector([R[0][0]*55,R[1][0]*55,R[2][0]*55],0);
    group.add(new THREE.ArrowHelper(direction.clone().normalize(),tip,55,0xf8b366,15,8));
    addCylinder(tip,tip.clone().add(new THREE.Vector3(0,-25,0)),8,'#f3a75d');
    if(showFrames){
      frames.forEach((T,i)=>{const origin=ps[i],length=robot==='scara'?55:80;
        ['#fa797d','#63dbb2','#6bafff'].forEach((color,j)=>{const d=vector([T[0][j],T[1][j],T[2][j]],0);group.add(new THREE.ArrowHelper(d,origin,length,color,12,6));});
        const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#d5e7f8';ctx.font='500 28px sans-serif';ctx.fillText(`{${i}}`,20,40);
        const texture=new THREE.CanvasTexture(c),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(55,27,1);sprite.position.copy(origin).add(new THREE.Vector3(0,40,0));group.add(sprite);
      });
    }
    if(showWorkspace&&robot==='scara'){
      const geometry=new THREE.RingGeometry(50,400,100),m=new THREE.MeshBasicMaterial({color:'#57dcd0',transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false});
      const disk=new THREE.Mesh(geometry,m);disk.rotation.x=-Math.PI/2;disk.position.y=off+q[2];group.add(disk);
      for(const radius of [50,400]){const pts=Array.from({length:101},(_,i)=>new THREE.Vector3(radius*Math.cos(i/100*2*Math.PI),off+q[2],radius*Math.sin(i/100*2*Math.PI)));group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#469f9e',transparent:true,opacity:.5})));}
    }
  },[robot,q,showFrames,showWorkspace]);
  return <div className="scene-canvas" ref={host} aria-label={`Modelo cinemático 3D de ${robots[robot].name}`}>{error&&<div className="webgl-error">Tu navegador no pudo activar WebGL. Las matrices y los controles siguen disponibles; prueba con aceleración gráfica activada.</div>}</div>;
}
