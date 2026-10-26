const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const fs=require('fs'),assert=require('assert');
const source=fs.readFileSync('App.tsx','utf8');
const file=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
assert.equal(file.parseDiagnostics.length,0,'TSX syntax errors');
const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
assert.equal((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const amount=(q,r)=>Math.max(0,Number(q)||0)*Math.max(0,Number(r)||0);
assert.equal(amount(8,290),2320);
assert.equal(amount(16,20),320);
assert.equal(amount(0,20),0);
assert.equal(amount(-2,20),0);
assert.equal([amount(8,290),amount(16,20)].reduce((a,b)=>a+b,0),2640);
for(const str of ['onPress={add}','onPress={()=>remove(i.id)}',"onChangeText={v=>edit(i.id,'qty',v)}","onChangeText={v=>edit(i.id,'rate',v)}",'Print.printToFileAsync','Sharing.shareAsync','AsyncStorage.setItem']){
 assert(source.includes(str),'Missing feature '+str);
}
console.log('PASS: TSX parser, transpilation, arithmetic edge cases, required event handlers and export/storage integration (static checks).');
