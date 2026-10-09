export const steps=[
 [['quest.fuse',['fuse']],['quest.power',['power']],['quest.repair',['circuit']],['quest.verify',['clinic']],['quest.stone',[]]],
 [['quest.roof',['panels']],['quest.panels',['panel1','panel2','panel3']],['quest.stone',[]]],
 [['quest.survey',['stakes','housing1','housing2']],['quest.protect',['grove']],['quest.plant',['water1','water2']],['quest.stone',[]]],
 [['quest.samples',['scan1','scan2']],['quest.records',['scan3']],['quest.source',['valve']],['quest.stone',[]]],
 [['quest.load',['cargo']],['quest.deliver',['depotDelivery','clinicDelivery']],['quest.budget',[]],['quest.night',[]],['quest.stone',[]]]
];
export function questSteps(a){
 if(a.assembled.length===5)return [{key:'quest.activate',done:!!a.ending}];
 const level=Math.min(a.assembled.length,4),has=(...ids)=>ids.some(id=>a.tasks.includes(id));
 return steps[level].map(([key,ids])=>({key:key==='quest.night'&&a.night?.ending==='critical'?'quest.nightFailed':key,
 done:key==='quest.stone'?a.stone>=0:key==='quest.power'?has('power','coal'):key==='quest.protect'?has('grove','clear'):key==='quest.source'?has('valve','litter'):key==='quest.panels'?a.tasks.filter(x=>/^panel[1-3]$/.test(x)||x==='shade').length===3:key==='quest.budget'?a.rules.budget.length>0:key==='quest.night'?!!a.night&&a.night.ending!=='critical':ids.every(x=>a.tasks.includes(x))}));
}
