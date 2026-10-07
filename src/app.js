import {styles,palettes,renderSVG} from './generator.js';
import {partsProvider} from './provider.js';
const $=id=>document.getElementById(id);let candidates=[],selected=0;
styles.forEach((name,i)=>$('style').add(new Option(name+'系',i)));palettes.forEach((p,i)=>$('palette').add(new Option(p.name,i)));
function note(){$('style-note').textContent='選んだテイストを、線の太さ・配色・質感で表現します。';}note();
function draw(){$('candidates').replaceChildren();candidates.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='candidate'+(i===selected?' selected':'');b.setAttribute('aria-pressed',String(i===selected));b.setAttribute('aria-label',`候補 ${i+1}：${palettes[c.palette].name}`);b.innerHTML=renderSVG(c);const caption=document.createElement('span');caption.textContent=`${i===selected?'✓ ':''}候補 ${i+1}`;b.append(caption);b.onclick=()=>{selected=i;draw();};$('candidates').append(b);});const c=candidates[selected];$('palette').value=c.palette;$('pattern').value=c.pattern;$('lettering').value=c.lettering;$('header-preview').innerHTML=renderSVG(c,'header');$('avatar-preview').innerHTML=renderSVG(c);$('preview-name').textContent=c.name||'あなたのアカウント';$('preview-bio').textContent=c.profile;}
async function generate(){const button=$('generate');button.disabled=true;try{candidates=await partsProvider.generate({name:$('name').value.trim(),profile:$('profile').value.trim(),audience:$('audience').value,style:Number($('style').value),motif:$('motif').value});selected=0;draw();$('status').textContent='4つの候補ができました。好きな候補を選んでください。';}catch{$('status').textContent='候補を作れませんでした。もう一度お試しください。';}finally{button.disabled=false;}}
$('form').addEventListener('submit',e=>{e.preventDefault();generate();});$('style').onchange=note;
for(const key of ['palette','pattern','lettering'])$(key).onchange=()=>{candidates[selected][key]=key==='palette'?Number($(key).value):$(key).value;draw();};
async function download(kind){const button=$(kind==='icon'?'save-icon':'save-header');button.disabled=true;let url;try{url=URL.createObjectURL(new Blob([renderSVG(candidates[selected],kind)],{type:'image/svg+xml'}));const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=kind==='icon'?400:1500;canvas.height=kind==='icon'?400:500;canvas.getContext('2d').drawImage(img,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('export');const fileURL=URL.createObjectURL(blob);const a=document.createElement('a');a.href=fileURL;a.download=`x-${kind}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(fileURL),10000);$('status').textContent=`${kind==='icon'?'アイコン':'ヘッダー'}のPNGを保存しました。`;}catch{$('status').textContent='画像を保存できませんでした。別のブラウザでお試しください。';}finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}}
$('save-icon').onclick=()=>download('icon');$('save-header').onclick=()=>download('header');generate();

// Images stay in memory; generation happens in the user's ChatGPT session.
const imports={icon:{items:[],selected:0,revision:0},header:{items:[],selected:0,revision:0}};
const importedStatus=message=>{$('import-status').textContent=message;};
styles.forEach((name,i)=>$('ai-style').add(new Option(name+'系',i)));
for(const mode of ['import','parts'])$('mode-'+mode).onclick=()=>{
  $('import-studio').hidden=mode!=='import';$('parts-studio').hidden=mode!=='parts';$('status').hidden=mode!=='parts';
  for(const other of ['import','parts']){$('mode-'+other).setAttribute('aria-pressed',String(other===mode));$('mode-'+other).className=other===mode?'primary':'secondary';}
};
function makePrompt(){
  const header=$('import-kind').value==='header';
  $('ai-prompt').value=`X（旧Twitter）用の${header?'ヘッダー':'アイコン'}画像を1枚作成してください。\nアカウント名：${$('ai-name').value.trim()||'未指定'}\nプロフィール・希望：${$('ai-profile').value.trim()||'落ち着いた親しみやすい雰囲気'}\n絵柄：${styles[Number($('ai-style').value)]}系。オリジナルのデザイン。\n${header?'横長3:1。左下はプロフィール画像に隠れるので主要な要素を置かない。添付のアイコンがあれば、その配色・キャラクター・絵柄と統一する。':'正方形1:1。円形に切り抜いても顔や主要なモチーフが欠けないように、中央に配置し、周囲に余白を設ける。'}\n文字・透かし・既存ブランドのロゴは入れない。大人向けアカウントでも、露骨な性的表現やヌードを含めず、非アダルトなキャラクターや記号で表現する。4候補を希望する場合も、比較用の1枚のコラージュにはせず、別々の画像として作成してください。`;
}
$('make-prompt').onclick=makePrompt;makePrompt();
$('copy-prompt').onclick=async()=>{try{await navigator.clipboard.writeText($('ai-prompt').value);importedStatus('プロンプトをコピーしました。ChatGPTに貼り付けてください。');}catch{$('ai-prompt').focus();$('ai-prompt').select();importedStatus('コピーできませんでした。選択したプロンプトを手動でコピーしてください。');}};
function paintImported(kind){
  const state=imports[kind],item=state.items[state.selected],canvas=$('import-'+kind),ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);$('export-'+kind).disabled=!item;if(!item)return;
  const scale=Math.max(canvas.width/item.img.naturalWidth,canvas.height/item.img.naturalHeight)*item.zoom;
  const w=item.img.naturalWidth*scale,h=item.img.naturalHeight*scale;
  ctx.drawImage(item.img,(canvas.width-w)*item.x/100,(canvas.height-h)*item.y/100,w,h);
}
function showImported(){
  const kind=$('import-kind').value,state=imports[kind],item=state.items[state.selected];
  $('crop-controls').hidden=!item;$('import-candidates').replaceChildren();
  state.items.forEach((candidate,index)=>{const button=document.createElement('button');button.type='button';button.className='candidate'+(index===state.selected?' selected':'');button.setAttribute('aria-pressed',String(index===state.selected));button.setAttribute('aria-label',`取り込み候補 ${index+1}`);const img=document.createElement('img');img.src=candidate.url;img.alt='';const label=document.createElement('span');label.textContent=`${index===state.selected?'✓ ':''}候補 ${index+1}`;button.append(img,label);button.onclick=()=>{state.selected=index;showImported();};$('import-candidates').append(button);});
  if(item){$('crop-zoom').value=item.zoom;$('crop-x').value=item.x;$('crop-y').value=item.y;}paintImported(kind);
}
$('import-kind').onchange=()=>{showImported();makePrompt();};
$('import-files').onchange=async event=>{
  const files=Array.from(event.target.files),kind=$('import-kind').value,state=imports[kind];event.target.value='';if(!files.length)return;
  if(files.length>4){importedStatus('候補は4枚まで選んでください。');return;}
  if(files.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>20*1024*1024)){importedStatus('PNG・JPEG・WebPの画像を、1枚20MB以下で選んでください。');return;}
  const revision=++state.revision,loaded=[];importedStatus('画像を読み込んでいます…');
  try{
    for(const file of files){const url=URL.createObjectURL(file),img=new Image();const item={url,img,zoom:1,x:50,y:50};loaded.push(item);img.src=url;await img.decode();if(img.naturalWidth*img.naturalHeight>40000000)throw Error('large');}
    if(revision!==state.revision){loaded.forEach(item=>URL.revokeObjectURL(item.url));return;}
    state.items.forEach(item=>URL.revokeObjectURL(item.url));state.items=loaded;state.selected=0;paintImported(kind);showImported();importedStatus(`${kind==='icon'?'アイコン':'ヘッダー'}の${loaded.length}候補を取り込みました。位置や拡大を調整してPNG保存できます。`);
  }catch{loaded.forEach(item=>URL.revokeObjectURL(item.url));if(revision===state.revision)importedStatus('画像を読み込めませんでした。4000万画素以下のPNG・JPEG・WebPでお試しください。');}
};
for(const key of ['zoom','x','y'])$('crop-'+key).oninput=()=>{const kind=$('import-kind').value,state=imports[kind],item=state.items[state.selected];if(item){item[key]=Number($('crop-'+key).value);paintImported(kind);}};
$('crop-reset').onclick=()=>{const state=imports[$('import-kind').value],item=state.items[state.selected];if(item){Object.assign(item,{zoom:1,x:50,y:50});showImported();}};
for(const kind of ['icon','header'])$('export-'+kind).onclick=async()=>{
  const button=$('export-'+kind);if(!imports[kind].items.length)return;button.disabled=true;
  try{const blob=await new Promise(resolve=>$('import-'+kind).toBlob(resolve,'image/png'));if(!blob)throw Error('export');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`x-${kind}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);importedStatus(`${kind==='icon'?'アイコン（400 × 400）':'ヘッダー（1500 × 500）'}のPNGを保存しました。`);}catch{importedStatus('PNGを保存できませんでした。もう一度お試しください。');}finally{button.disabled=false;}
};
