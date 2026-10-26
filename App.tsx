import React,{useEffect,useState} from 'react';
import {Alert,FlatList,KeyboardAvoidingView,Platform,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {StatusBar} from 'expo-status-bar';

type Item={id:string;name:string;qty:string;rate:string};
type Bill={customer:string;date:string;items:Item[]};
const KEY='billmaker.mobile.draft.v1';
const SAVED='billmaker.mobile.saved.v1';
const newItem=():Item=>({id:Date.now().toString()+Math.random().toString(36).slice(2),name:'',qty:'1',rate:''});
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const initial:Bill={customer:'',date:localDate(),items:[newItem()]};
const number=(s:string)=>{const n=Number(s);return Number.isFinite(n)?Math.max(0,n):0};
const line=(i:Item)=>number(i.qty)*number(i.rate);
const amount=(n:number)=>'₹'+n.toLocaleString('en-IN',{maximumFractionDigits:2});
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function receipt(b:Bill){
 const total=b.items.reduce((sum,i)=>sum+line(i),0);
 return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
 body{font:12px 'Courier New',monospace;color:#111;margin:20px}h2{text-align:center;letter-spacing:2px;margin-bottom:8px}.center{text-align:center}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:5px 3px;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left;overflow-wrap:anywhere}thead{border-bottom:1px dashed #444}.total{border-top:1px dashed #444;border-bottom:1px dashed #444;margin-top:14px;padding:10px 0;display:flex;justify-content:space-between;font-size:16px;font-weight:bold}
 </style></head><body><h2>BILL</h2><div class="center">${escapeHtml(b.customer)}<br>${escapeHtml(b.date)}</div><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${b.items.map(i=>`<tr><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.qty)}</td><td>${escapeHtml(i.rate)}</td><td>${amount(line(i))}</td></tr>`).join('')}</tbody></table><div class="total"><span>TOTAL</span><span>${amount(total)}</span></div><p class="center">Thank you!</p></body></html>`;
}
export default function App(){
 const [bill,setBill]=useState<Bill>(initial);
 const [ready,setReady]=useState(false);
 const [saved,setSaved]=useState<{name:string;bill:Bill}[]>([]);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{(async()=>{try{const d=await AsyncStorage.getItem(KEY);if(d)setBill(JSON.parse(d));const s=await AsyncStorage.getItem(SAVED);if(s)setSaved(JSON.parse(s))}catch(e){Alert.alert('Storage issue','Could not read previous bills.')}finally{setReady(true)}})()},[]);
 useEffect(()=>{if(ready)AsyncStorage.setItem(KEY,JSON.stringify(bill)).catch(()=>{})},[bill,ready]);
 const set=(k:keyof Omit<Bill,'items'>,v:string)=>setBill(b=>({...b,[k]:v}));
 const edit=(id:string,k:keyof Omit<Item,'id'>,v:string)=>setBill(b=>({...b,items:b.items.map(i=>i.id===id?{...i,[k]:v}:i)}));
 const add=()=>setBill(b=>({...b,items:[...b.items,newItem()]}));
 const remove=(id:string)=>setBill(b=>({...b,items:b.items.filter(i=>i.id!==id)}));
 const total=bill.items.reduce((sum,i)=>sum+line(i),0);
 const save=async()=>{const name=(bill.customer||'Customer')+' • '+bill.date;const next=[{name,bill:JSON.parse(JSON.stringify(bill))},...saved].slice(0,100);try{await AsyncStorage.setItem(SAVED,JSON.stringify(next));setSaved(next);Alert.alert('Saved',name)}catch(e){Alert.alert('Error','Unable to save bill.')}};
 const load=()=>{if(!saved.length){Alert.alert('No saved bills','Save a bill first.');return}Alert.alert('Open saved bill','Choose a bill:',[...saved.slice(0,7).map(s=>({text:s.name,onPress:()=>setBill(s.bill)})),{text:'Cancel',style:'cancel'}])};
 const pdf=async(share:boolean)=>{if(busy)return;setBusy(true);try{if(share){const file=await Print.printToFileAsync({html:receipt(bill)});if(await Sharing.isAvailableAsync())await Sharing.shareAsync(file.uri,{mimeType:'application/pdf',dialogTitle:'Share bill'});else Alert.alert('Sharing unavailable','Use Print / Save PDF instead.')}else await Print.printAsync({html:receipt(bill)})}catch(e){Alert.alert('Export error','Unable to export the bill on this device.')}finally{setBusy(false)}};
 return <SafeAreaView style={styles.safe}><StatusBar style="dark"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
 <Text style={styles.heading}>Bill Maker</Text><Text style={styles.sub}>Simple, offline billing for iPhone and Android</Text>
 <View style={styles.card}><Text style={styles.label}>Customer name</Text><TextInput accessibilityLabel="Customer name" style={styles.input} placeholder="Enter customer name" value={bill.customer} onChangeText={v=>set('customer',v)}/>
 <Text style={styles.label}>Date (YYYY-MM-DD)</Text><TextInput accessibilityLabel="Bill date" style={styles.input} value={bill.date} onChangeText={v=>set('date',v)}/></View>
 <View style={styles.card}><Text style={styles.section}>Items</Text><View style={styles.headers}><Text style={[styles.colName,styles.colHead]}>Item</Text><Text style={[styles.colQty,styles.colHead]}>Qty</Text><Text style={[styles.colRate,styles.colHead]}>Rate</Text><Text style={[styles.colTotal,styles.colHead]}>Total</Text></View>
 {bill.items.map(i=><View key={i.id} style={styles.item}><View style={styles.fields}>
 <TextInput accessibilityLabel="Item name" style={[styles.input,styles.colName]} placeholder="Item" value={i.name} onChangeText={v=>edit(i.id,'name',v)}/>
 <TextInput accessibilityLabel="Quantity" style={[styles.input,styles.colQty]} keyboardType="decimal-pad" placeholder="Qty" value={i.qty} onChangeText={v=>edit(i.id,'qty',v)}/>
 <TextInput accessibilityLabel="Rate" style={[styles.input,styles.colRate]} keyboardType="decimal-pad" placeholder="Rate" value={i.rate} onChangeText={v=>edit(i.id,'rate',v)}/>
 <Text style={styles.colTotal} numberOfLines={1}>{amount(line(i))}</Text></View>
 <Pressable accessibilityRole="button" accessibilityLabel={'Remove '+(i.name||'item')} onPress={()=>remove(i.id)}><Text style={styles.remove}>Remove item ×</Text></Pressable></View>)}
 <Pressable accessibilityRole="button" onPress={add} style={styles.add}><Text style={styles.addText}>＋ Add Item</Text></Pressable></View>
 <View style={styles.total}><Text style={styles.totalLabel}>Grand Total</Text><Text style={styles.totalLabel}>{amount(total)}</Text></View>
 <View style={styles.buttons}><Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>Save Bill</Text></Pressable><Pressable style={styles.button} onPress={load}><Text style={styles.buttonText}>Open Saved</Text></Pressable><Pressable style={styles.button} disabled={busy} onPress={()=>pdf(true)}><Text style={styles.buttonText}>Share PDF / WhatsApp</Text></Pressable><Pressable style={styles.button} disabled={busy} onPress={()=>pdf(false)}><Text style={styles.buttonText}>Print / Save PDF</Text></Pressable></View>
 <Pressable onPress={()=>Alert.alert('New bill','Clear this bill?', [{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress:()=>setBill({...initial,date:localDate(),items:[newItem()]})}])}><Text style={styles.new}>Start new bill</Text></Pressable>
 <Text style={styles.note}>Bills stay on this device. Sharing opens your phone’s native share sheet; choose WhatsApp if installed. PDF export is supported; image export is planned for a future version.</Text>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#f4f6fa'},page:{padding:14,paddingBottom:42},heading:{fontSize:26,fontWeight:'800',color:'#172b4d'},sub:{color:'#667085',marginBottom:12,fontSize:13},
 card:{backgroundColor:'white',borderRadius:14,padding:12,marginBottom:12},label:{fontSize:13,fontWeight:'700',marginBottom:6,color:'#344054'},input:{borderColor:'#cbd5e1',borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:10,fontSize:14,color:'#172b4d',minWidth:0,backgroundColor:'white',marginBottom:10},section:{fontSize:18,fontWeight:'700',marginBottom:12},headers:{flexDirection:'row',gap:5,marginBottom:5},colHead:{fontSize:11,fontWeight:'700',color:'#475467'},fields:{flexDirection:'row',gap:5,alignItems:'center'},colName:{flex:2.5},colQty:{flex:0.8},colRate:{flex:1.1},colTotal:{flex:1.35,textAlign:'right',fontSize:11,color:'#101828'},item:{borderBottomWidth:1,borderBottomColor:'#eee',paddingTop:8},remove:{color:'#b42318',textAlign:'right',fontSize:12,marginBottom:9},add:{padding:14,borderRadius:10,backgroundColor:'#e8f0ff',alignItems:'center',marginTop:12},addText:{fontWeight:'800',color:'#174ea6',fontSize:16},total:{backgroundColor:'#172b4d',padding:16,borderRadius:12,flexDirection:'row',justifyContent:'space-between',marginBottom:14},totalLabel:{color:'white',fontWeight:'800',fontSize:18},buttons:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{backgroundColor:'#174ea6',borderRadius:10,padding:14,minWidth:'47%',flexGrow:1,alignItems:'center'},buttonText:{color:'white',fontWeight:'700',fontSize:13},new:{textAlign:'center',color:'#b42318',marginTop:22,fontWeight:'700'},note:{fontSize:12,color:'#667085',marginTop:18,lineHeight:18}
});
