const base=new URL("../vendor/three/",import.meta.url);
export async function resolve(specifier,context,next){
  if(specifier==='three')return next(new URL('build/three.module.js',base).href,context);
  if(specifier.startsWith('three/addons/'))return next(new URL('examples/jsm/'+specifier.slice(13),base).href,context);
  return next(specifier,context);
}
