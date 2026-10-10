// Constant-memory nearest action selection. The render loop calls this often;
// avoid sorting and cloning the entire available quest action list each frame.
export function nearestAction(actions,player,location='city',stone=-1,assembledCount=0){
 let best=null,bestDistance=Infinity,nonLift=null,nonLiftDistance=Infinity;
 let closeLift=null,closeLiftDistance=Infinity,labPrimary=null,labPrimaryDistance=Infinity;
 const primaryId=stone>=0?'assemble':assembledCount===5?'activate':'lift';
 for(const source of actions){
  const ladder=source.id==='ladder'&&player.y>6;
  const x=ladder?-103:source.x,z=ladder?-73:source.z,y=ladder?9:source.y;
  const d=Math.hypot(player.x-x,player.z-z,source.id==='ladder'?0:(player.y-y)*1.4);
  if(d<bestDistance){best=source;bestDistance=d;}
  if(source.id!=='lift'&&d<nonLiftDistance){nonLift=source;nonLiftDistance=d;}
  if(source.id==='lift'&&d<(location==='lab'?.65:2.4)&&d<closeLiftDistance){
   closeLift=source;closeLiftDistance=d;
  }
  if(source.id===primaryId&&d<labPrimaryDistance){labPrimary=source;labPrimaryDistance=d;}
 }
 let choice,distance;
 if(location==='lab'){
  choice=closeLift||labPrimary||best;
  distance=closeLift?closeLiftDistance:labPrimary?labPrimaryDistance:bestDistance;
 }else{
  choice=closeLift||nonLift||best;
  distance=closeLift?closeLiftDistance:nonLift?nonLiftDistance:bestDistance;
 }
 if(!choice)return null;
 if(choice.id==='ladder'&&player.y>6)return {...choice,x:-103,z:-73,y:9,distance};
 return {...choice,distance};
}
