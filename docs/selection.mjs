// Module singleton: only imported after entering bank/practice; never plaintext persisted.
export const selected=new Set();
export const pendingEdit={id:null};
if(typeof window!=='undefined')window.clearCandidateSelection=()=>{selected.clear();pendingEdit.id=null};
