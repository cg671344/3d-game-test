import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const height = (x:number,z:number)=> .5+1.05*Math.sin(x*.105)*Math.cos(z*.09)+2.5*Math.exp(-((x+14)**2+(z+13)**2)/120)+1.4*Math.exp(-((x-13)**2+(z+15)**2)/90);
export const inside=(x:number,z:number)=> x*x/31**2+z*z/30**2<1;
let seed=7461;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const material=(color:T.ColorRepresentation)=>new T.MeshStandardMaterial({color,roughness:1});
export const mats={wood:material('#775c43'),leaf:material('#80a975'),dark:material('#4b795b'),grass:material('#adbf80'),cream:material('#fff0c1'),stone:material('#a6b1a2'),gold:material('#e7b553')};
export function mesh(g:T.BufferGeometry,m:T.Material,parent:T.Object3D,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export const orb=(parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material)=>{const o=mesh(new T.SphereGeometry(1,12,9),m,parent,x,y,z);o.scale.set(sx,sy,sz);return o};
export const foliageFocus=new T.Vector3();
export const colliders:{x:number,z:number,r:number}[]=[];
export const animated:T.Object3D[]=[];
export function buildWorld(scene:T.Scene){
 const ground=new T.PlaneGeometry(70,70,110,110);ground.rotateX(-Math.PI/2);const p=ground.attributes.position;const colors=[];const c=new T.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.sqrt(x*x/31**2+z*z/30**2);p.setY(i,r>1?-.65:height(x,z)-Math.max(0,r-.91)*14);c.set(r>.93?'#d8cf9b': '#a7bd7c');c.lerp(new T.Color('#789763'),Math.max(0,Math.sin(x*.31)*Math.cos(z*.27))*.22);colors.push(c.r,c.g,c.b)}
 ground.setAttribute('color',new T.Float32BufferAttribute(colors,3));ground.computeVertexNormals();mesh(ground,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),scene);
 const water=mesh(new T.PlaneGeometry(600,600),new T.MeshStandardMaterial({color:'#88beb3',roughness:.35,metalness:.12,transparent:true,opacity:.9}),scene,0,-.48,0);water.rotation.x=-Math.PI/2;water.receiveShadow=false;
 // Hand-directed paths connect the three exploration landmarks.
 function path(points:number[][]){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,height(x,z)+.035,z)));const vs=[],ix=[];for(let i=0;i<=160;i++){let t=i/160;const a=curve.getPoint(t),d=curve.getTangent(t);for(const s of [-1,1]){const x=a.x+d.z*s*.85,z=a.z-d.x*s*.85;vs.push(x,height(x,z)+.047,z)}if(i<160){let j=i*2;ix.push(j,j+2,j+1,j+1,j+2,j+3)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setIndex(ix);g.computeVertexNormals();mesh(g,material('#d6d0a0'),scene)}
 path([[0,20],[0,12],[3,5],[0,-3],[0,-12]]);path([[1,7],[-7,4],[-14,-3],[-16,-12]]);path([[2,6],[12,7],[18,-2],[15,-13]]);
 const trunkGeo=new T.CylinderGeometry(.18,.34,3,8);const leafGeo=new T.IcosahedronGeometry(1,2);const leafMats=['#71976a','#86a576','#9cb580','#56846a'].map(material);
 for(const m of [...leafMats,mats.leaf,mats.dark]){m.onBeforeCompile=shader=>{shader.uniforms.foliageFocus={value:foliageFocus};shader.vertexShader='varying vec3 foliageWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfoliageWorld=(modelMatrix*vec4(position,1.0)).xyz;');shader.fragmentShader='uniform vec3 foliageFocus;\nvarying vec3 foliageWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
 vec3 viewLine=cameraPosition-foliageFocus; float along=dot(foliageWorld-foliageFocus,viewLine)/dot(viewLine,viewLine);
 float proximity=distance(foliageWorld,foliageFocus+viewLine*clamp(along,0.0,1.0));
 if(along>0.05 && along<1.15 && proximity<1.7 && fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)>.12)discard;`)};}

 for(let i=0;i<100;i++){const x=(rand()-.5)*57,z=(rand()-.5)*54;if(!inside(x,z)||Math.abs(x)<4||Math.hypot(x+14,z+10)<6||Math.hypot(x-15,z+12)<5||Math.hypot(x-10,z-7)<5||Math.abs(z-5)<3)continue;const y=height(x,z),s=.8+rand()*.8;const g=new T.Group();g.position.set(x,y,z);scene.add(g);mesh(trunkGeo,mats.wood,g,0,1.4*s,0).scale.set(s,s,s);for(let k=0;k<4;k++){const o=mesh(leafGeo,leafMats[i%4],g,Math.sin(k*2)*.85*s,(3.6+k*.24)*s,Math.cos(k*2)*.65*s);o.scale.set(1.55*s,1.5*s,1.35*s)}colliders.push({x,z,r:.55*s})}
 // Grass and wildflowers are instanced to keep the world inexpensive to draw.
 const blade=new T.ConeGeometry(.055,.45,3);const grass=new T.InstancedMesh(blade,material('#829d66'),2200);const flower=new T.InstancedMesh(new T.SphereGeometry(.075,5,4),material('#fff0ba'),450);const dummy=new T.Object3D();let gc=0,fc=0;
 for(let i=0;i<2800&&gc<2200;i++){let x=(rand()-.5)*59,z=(rand()-.5)*57;if(!inside(x,z)||Math.abs(x)<2)continue;dummy.position.set(x,height(x,z)+.16,z);dummy.rotation.set((rand()-.5)*.4,rand()*6,(rand()-.5)*.4);dummy.scale.setScalar(.6+rand()*.8);dummy.updateMatrix();grass.setMatrixAt(gc++,dummy.matrix);if(fc<450&&i%4===0){dummy.position.y+=.18;dummy.scale.set(1.2,.65,1.2);dummy.updateMatrix();flower.setMatrixAt(fc++,dummy.matrix)}}grass.count=gc;flower.count=fc;scene.add(grass,flower);
 for(let i=0;i<50;i++){const a=rand()*Math.PI*2,r=27+rand()*2,x=Math.sin(a)*r,z=Math.cos(a)*r;if(!inside(x,z))continue;const o=orb(scene,x,height(x,z)-.15,z,.5+rand(),.3+rand()*.6,.5+rand(),mats.stone);o.rotation.y=rand()*6}
 // Pond with a small wooden crossing.
 const pond=mesh(new T.CircleGeometry(4,48),new T.MeshStandardMaterial({color:'#78b6a9',roughness:.25,metalness:.1}),scene,12,height(12,7)+.08,7);pond.rotation.x=-Math.PI/2;pond.scale.set(1,.72,1);
 for(let i=0;i<15;i++){let x=7.8+i*.59;mesh(new T.BoxGeometry(.55,.12,1.7),mats.wood,scene,x,height(x,7)+.22,7)}
 // Old windbell tree at the destination.
 const tree=new T.Group();tree.position.set(0,height(0,-13),-13);scene.add(tree);mesh(new T.CylinderGeometry(.62,1.15,5,10),mats.wood,tree,0,2.4,0);colliders.push({x:0,z:-13,r:1.15});
 for(let i=0;i<7;i++){let a=i/7*6.28;const b=mesh(new T.CylinderGeometry(.16,.32,3,7),mats.wood,tree,Math.sin(a)*1.1,4,Math.cos(a)*1.1);b.rotation.z=Math.cos(a)*.7;b.rotation.x=Math.sin(a)*.7;orb(tree,Math.sin(a)*2.2,5.5+Math.sin(i)*.6,Math.cos(a)*2,2.3,1.65,2.1,i%2?mats.leaf:mats.dark)}
 for(let i=0;i<3;i++){const b=bell();b.position.set((i-1)*1.15,3.5,-.95);b.scale.setScalar(.6);tree.add(b);animated.push(b)}
 // Cozy mushroom cottage, doorway and tiled roof.
 const cottage=new T.Group();cottage.position.set(-8,height(-8,7),7);scene.add(cottage);mesh(new T.CylinderGeometry(1.3,1.5,2.6,24),material('#eee0b1'),cottage,0,1.25,0);const roof=orb(cottage,0,2.8,0,2.05,.9,2.05,material('#bf795b'));roof.rotation.y=.3;mesh(new T.BoxGeometry(.7,1.4,.12),mats.wood,cottage,0,.7,1.39);orb(cottage,.66,1.55,1.2,.28,.3,.08,material('#9eccc0'));colliders.push({x:-8,z:7,r:1.7});
 for(let i=0;i<8;i++){const a=i/8*6.28;orb(cottage,Math.sin(a)*1.35,3.35,Math.cos(a)*1.35,.19,.04,.19,mats.cream)}
 // Hilltop stone circle / overlook.
 for(let i=0;i<7;i++){let a=i/7*6.28;orb(scene,-16+Math.sin(a)*2,height(-16+Math.sin(a)*2,-13+Math.cos(a)*2),-13+Math.cos(a)*2,.5,.6,.45,mats.stone)}
 // Hand-painted signposts.
 for(const [x,z,label] of [[0,13,'风铃古树 ↑'],[-6,4,'← 山顶的风'],[9,5,'蘑菇花园 →']] as [number,number,string][]){const y=height(x,z);mesh(new T.CylinderGeometry(.07,.09,1.6,6),mats.wood,scene,x,y+.8,z);const cv=document.createElement('canvas');cv.width=512;cv.height=128;const cx=cv.getContext('2d')!;cx.fillStyle='#d8bb86';cx.fillRect(0,0,512,128);cx.font='bold 45px sans-serif';cx.textAlign='center';cx.fillStyle='#655b40';cx.fillText(label,256,82);const sign=mesh(new T.PlaneGeometry(2.3,.57),new T.MeshStandardMaterial({map:new T.CanvasTexture(cv),side:T.DoubleSide}),scene,x,y+1.5,z);sign.rotation.y=.15}
 // Batch static scenery by material; preserve animated tree and water references.
 scene.updateMatrixWorld(true);
 const batches=new Map<T.Material,T.BufferGeometry[]>();const originals:T.Mesh[]=[];
 scene.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||o===water||Array.isArray(o.material))return;let a:T.Object3D|null=o;while(a){if(a===tree)return;a=a.parent}const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=batches.get(o.material)||[];list.push(g);batches.set(o.material,list);originals.push(o)});
 for(const o of originals)o.removeFromParent();
 for(const [m,gs] of batches){const grouped=new Map<string,T.BufferGeometry[]>();for(const g of gs){const key=Object.keys(g.attributes).sort().join(',')+!!g.index;const list=grouped.get(key)||[];list.push(g);grouped.set(key,list)}for(const list of grouped.values()){const merged=mergeGeometries(list);if(merged)mesh(merged,m,scene);for(const g of list)g.dispose()}}
 return {water,tree};
}
export function bell(){const g=new T.Group();mesh(new T.CylinderGeometry(.19,.33,.4,16,1,true),mats.gold,g,0,0,0);orb(g,0,.20,0,.2,.14,.2,mats.gold);orb(g,0,-.19,0,.08,.08,.08,mats.wood);mesh(new T.CylinderGeometry(.015,.015,.45,5),mats.wood,g,0,.5,0);const ribbon=mesh(new T.PlaneGeometry(.14,.45),new T.MeshStandardMaterial({color:'#eacb8b',side:T.DoubleSide}),g,0,-.48,0);ribbon.rotation.z=.15;return g}
export function hedgehog(scene:T.Scene,x:number,z:number){const g=new T.Group();g.position.set(x,height(x,z),z);scene.add(g);orb(g,0,.42,0,.52,.4,.65,material('#82694f'));orb(g,0,.32,.45,.32,.25,.30,mats.cream);orb(g,0,.33,.72,.075,.06,.07,mats.wood);for(let s of [-1,1]){orb(g,s*.16,.44,.65,.035,.045,.03,mats.wood);orb(g,s*.26,.11,.19,.12,.10,.18,mats.wood)}for(let i=0;i<36;i++){const a=i*2.4,r=.35*Math.sqrt(i/36);const spine=mesh(new T.ConeGeometry(.09,.3,5),mats.wood,g,Math.sin(a)*r,.72-r*.4,Math.cos(a)*r-.07);spine.rotation.z=Math.sin(a)*.4}return g}
