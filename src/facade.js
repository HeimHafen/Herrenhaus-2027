import { portalLintelY } from './north-portal.js?v=29';
import { buildLandgutWindows } from './landgut-windows.js?v=95';
import { buildSouthPortico } from './south-portico.js?v=95';
import { createExteriorMaterialLibrary } from './exterior-materials.js?v=55';
import { buildExteriorDetails } from './exterior-details.js?v=56';
import { buildHeritageOrnaments } from './heritage-ornaments.js?v=20261118-v25-clean-window-ornaments';
import { createRealisticExteriorGlass } from './window-glass.js?v=55';
// Architectural facade adapted from the supplied project.
// Interior decoration, fountain, scenery, castle and associated runtime are excluded.
export function buildFacade(THREE, scene, renderer, model) {
  const exterior = new THREE.Group();
  scene.add(exterior);
  const mats = createExteriorMaterialLibrary(THREE);
  const stone = mats.facadeWall;
  const roof = mats.roof;
  const glass = createRealisticExteriorGlass(THREE, renderer);
  const importedWindowPreview=typeof location!=='undefined' && new URLSearchParams(location.search).get('view')==='historic-window';
  function surface(x,y,z,w,h,d,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.castShadow=mesh.receiveShadow=true;
    exterior.add(mesh);
  }
  surface(0,14.42,-1,45,.6,22,roof);
  surface(0,15.1,-2,35,.85,16,stone);
  surface(0,15.59,-2,35.6,.22,16.6,roof);
  for(const x of [-17,-10,10,17])for(const z of [-8,5]){
    surface(x,16,z,1.19,2.1,1.05,stone);
    surface(x,17.08,z,1.45,.24,1.32,mats.trim);
  }
  for(const side of [-1,1]){
    for(let i=0;i<11;i++)surface(side*7.7,1.2,17.4-i*.45,.13,.67,.155,stone);
    surface(side*7.7,1.57,15.15,.31,.16,4.85,stone);
  }
  // Two obsolete original corridor handrails (the brown bars visible THROUGH
  // the entrance on the screenshot). Keep the jambs and architectural walls.
  // These GLB meshes are not part of the new hinged doors below.
  model.traverse(piece=>{
    if(!piece.isMesh)return;
    const match=/^Cube[.]?(\d+)$/.exec(piece.name);
    if(!match)return;
    const id=Number(match[1]);
    // Imported V8 corner stones (375..418) were 31 cm deep and alternate
    // 94/145 cm width. They collided with our newer corner details and caused
    // the spectacular projecting “stone stack” shown in the iPhone screenshots.
    if((id>=141&&id<=418)||(id>=504&&id<=517)||id===445||id===447)
      piece.visible=false;
  });
  // The legacy roof fascia and its separate teeth left visible outliers.
  // Retain the structural slabs but tuck them behind the new outer trim.
  for(const name of ['Cube007','Cube008']){
    const slab=model.getObjectByName(name);
    if(slab){
      slab.scale.x=46.99;
      slab.scale.z=23.92;
      slab.position.z=.022;
    }
  }
  model.traverse(piece=>{
    const match=piece.isMesh&&/^Cube\.?(\d+)$/.exec(piece.name);
    if(match&&Number(match[1])>=9&&Number(match[1])<=74)piece.visible=false;
  });
  const southPortico=buildSouthPortico(THREE,exterior,model,mats);
  const facadeWindows=buildLandgutWindows(THREE,exterior,mats,glass,{studyPreview:importedWindowPreview});
  // V16: entrance lanterns deliberately removed with all other house lamps.

  function grain(material,scale,strength){
    material.customProgramCacheKey=()=>`grain-${scale}-${strength}`;
    material.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 grainPoint;\n'+shader.vertexShader.replace(
        '#include <project_vertex>',
        'grainPoint=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>');
      shader.fragmentShader=`varying vec3 grainPoint;
      float grainHash(vec3 p){
        p=fract(p*.1031);
        p+=dot(p,p.yzx+33.33);
        return fract((p.x+p.y)*p.z);
      }
      float grainNoise(vec3 p){
        vec3 i=floor(p),f=fract(p);
        f=f*f*(3.0-2.0*f);
        return mix(
          mix(mix(grainHash(i),grainHash(i+vec3(1,0,0)),f.x),
              mix(grainHash(i+vec3(0,1,0)),grainHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(grainHash(i+vec3(0,0,1)),grainHash(i+vec3(1,0,1)),f.x),
              mix(grainHash(i+vec3(0,1,1)),grainHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      `+shader.fragmentShader.replace(
        '#include <color_fragment>',`#include <color_fragment>
        vec3 p=grainPoint*${scale.toFixed(2)};
        float broad=2.0*grainNoise(p*.14)-1.0;
        float fine=2.0*grainNoise(p)-1.0;
        float fade=1.0-smoothstep(.12,1.1,length(fwidth(p)));
        diffuseColor.rgb *= 1.0+${strength.toFixed(3)}*(broad*.68+fine*.32*fade);
      `);
    };
  }
  // V25: one portal frame around the author's actual imported oak door.
  // Do NOT create a false stone wall behind the real glass door panes.
  // Do NOT create another circular/arched ring in front of the actual door.
  const fanlight=null;
  const dressedStone=mats.dressedStone;
  const stairStone=mats.stairStone;
  const nosingStone=mats.nosingStone;
  const jambBottom=.935;
  const jambHeight=portalLintelY-jambBottom;
  for(const side of [-1,1]) {
    surface(side*1.505,jambBottom+jambHeight/2,12.245,.330,jambHeight,.285,dressedStone);
    surface(side*1.505,.994,12.285,.37,.115,.32,stairStone);
  }
  surface(0,portalLintelY+.09,12.285,3.35,.180,.30,dressedStone);
  surface(0,portalLintelY+.21,12.295,3.54,.065,.34,mats.trim);
  // Keep the portico columns, stair nosings and original door untouched.
  const door=null;

  // Worn granite along the stair nosings below the harmonised portal.
  // V19: flush transition instead of the V18 dropped door slab and visible riser.
  // Tile finishes at y=.937; the threshold surface ends at the same height.
  surface(0,.921,12.405,3.26,.034,.142,stairStone);
  surface(0,.921,12.476,3.26,.034,.016,nosingStone);
  for(let step=0;step<4;step++){
    const z=19.20+step*.34, height=.84-step*.165;
    surface(0,height-.03,z+.018,15.55,.062,.090,nosingStone);
    for(const x of [-5.18,0,5.18])surface(x,height-.088,z+.040,5.15,.108,.058,stairStone);
  }
  // No lantern point-lights: the historic portal uses daylight only.
  buildExteriorDetails(THREE,exterior,mats);
  // Sculpted 3D ornamentation; selectively repeated on aligned facade openings.
  const heritage=buildHeritageOrnaments(THREE,exterior,southPortico,mats,{skipNorthAxis:importedWindowPreview?-15:null,skipWindowSurrounds:true});
return { door, exterior, southPortico, fanlight, heritage, materials:mats, glass, facadeWindows };
}
