export function gradeCheckpoint(keys:number[], submitted:Array<{exerciseId:number;selectedIndex:number}>, threshold=0.8) {
 if(keys.length!==submitted.length||new Set(submitted.map(a=>a.exerciseId)).size!==keys.length) throw new Error("invalid answers");
 const correct=keys.reduce((sum,key,i)=>sum+Number(submitted[i].selectedIndex===key),0);
 return {score:correct,total:keys.length,passed:keys.length>0&&correct/keys.length>=threshold};
}
