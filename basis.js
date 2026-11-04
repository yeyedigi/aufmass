// Aufmaß – gemeinsame Funktionen für App (index.html) und Abschlussaufmaß (summe.html)
const VERSION="1.5";
const KATS=["Material","Stunden","Sonstiges"];
const $=id=>document.getElementById(id);

// Speicher auf dem Gerät. set() meldet zurück, ob es geklappt hat (false = Speicher voll).
const ls={
  get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
};
function speichern(k,v){if(!ls.set(k,v)){alert("Speichern auf dem Gerät nicht möglich – der Speicher ist voll.");return false}return true}

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const istENr=nr=>/^E\d+$/i.test(String(nr));
const nrHtml=nr=>istENr(nr)?`<span class="enr">${esc(nr)}</span>`:esc(nr);
const heute=()=>new Date().toISOString().slice(0,10);
const datumDE=iso=>iso?new Date(iso+"T12:00").toLocaleDateString("de-DE"):"";
const datumKurz=iso=>{if(!iso)return "";const p=iso.split("-");return (+p[2])+"."+(+p[1])+".";};
const fmt=n=>(+n).toLocaleString("de-DE",{maximumFractionDigits:3});
const rund=n=>Math.round(n*1000)/1000;
const norm=s=>String(s||"").toLowerCase().replace(/\s+/g," ").trim();
const zahl=v=>parseFloat(String(v).replace(/\s/g,"").replace(",","."));
const neueId=()=>(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
const UML={"ä":"ae","ö":"oe","ü":"ue","Ä":"Ae","Ö":"Oe","Ü":"Ue","ß":"ss"};
const dateiSauber=s=>String(s).replace(/[äöüÄÖÜß]/g,c=>UML[c]).replace(/[^\w-]+/g,"_").replace(/_+/g,"_").replace(/^_|_$/g,"");

// Kategorien: Spalte aus der Liste, sonst nach Einheit
function katVonEinheit(e){
  e=String(e||"").toLowerCase().replace(/\./g,"").trim();
  if(/^(std|h|stunde|stunden|std\/mann|mannstunde|mannstunden)$/.test(e))return "Stunden";
  if(/^(pauschal|pauschale|psch|pausch|pa)$/.test(e))return "Sonstiges";
  return "Material";
}
function normKat(k){
  k=String(k||"").toLowerCase().trim();
  if(k.startsWith("mat"))return "Material";
  if(/^(std|stund|lohn|arbeit)/.test(k))return "Stunden";
  if(k.startsWith("sons"))return "Sonstiges";
  return "";
}
const katVon=(kat,einheit)=>normKat(kat)||katVonEinheit(einheit);
const rang=nr=>(!nr||nr==="–")?2:istENr(nr)?1:0;

// Handy: Teilen-Menü. PC: normaler Download.
const istHandy=()=>matchMedia("(pointer:coarse)").matches||/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
async function teilen(files){
  if(istHandy()&&navigator.canShare&&navigator.canShare({files})){
    try{await navigator.share({files});return}catch(e){if(e.name==="AbortError")return}
  }
  files.forEach((f,i)=>setTimeout(()=>{const a=document.createElement("a");a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)},i*400));
}

// Symbole
const IC={
  plus:'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  stift:'<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  muell:'<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  haken:'<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5b82e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'
};

// Firmenlogo: liegt nur auf diesem Gerät
const LOGO_KEY="am_logo";
const logoHolen=()=>ls.get(LOGO_KEY,null);
function logoAusDatei(file){
  return new Promise((ok,fehl)=>{
    const r=new FileReader();
    r.onerror=()=>fehl(new Error("Datei nicht lesbar"));
    r.onload=()=>{const img=new Image();img.onerror=()=>fehl(new Error("Kein gültiges Bild"));img.onload=()=>{
      const s=Math.min(1,600/img.width,240/img.height);const w=Math.max(1,Math.round(img.width*s)),h=Math.max(1,Math.round(img.height*s));
      const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
      let src=c.toDataURL("image/png"),f="PNG";
      if(src.length>350000){src=c.toDataURL("image/jpeg",.88);f="JPEG"}
      ok({src,w,h,fmt:f});
    };img.src=r.result};
    r.readAsDataURL(file);
  });
}
function logoInsPDF(doc){
  const l=logoHolen();if(!l)return;
  try{let h=12,w=l.w/l.h*h;if(w>50){w=50;h=l.h/l.w*w}doc.addImage(l.src,l.fmt,196-w,19-h,w,h)}catch(e){}
}

// Dialog von unten (Handy) bzw. mittig (PC)
function dialog({titel,text,felder=[],knoepfe=[]}){
  const hg=document.createElement("div");hg.className="sheet-hg";
  hg.innerHTML=`<div class="sheet glass" role="dialog" aria-modal="true" aria-label="${esc(titel)}"><h3>${esc(titel)}</h3>${text?`<p>${esc(text)}</p>`:""}`
    +(felder.length?`<div class="karte glass form sform">${felder.map(f=>`<div class="f"><label for="df_${f.id}">${esc(f.label)}</label><input class="in" id="df_${f.id}" value="${esc(f.wert??"")}"${f.zahl?' inputmode="decimal"':""} autocomplete="off">${f.einheit?`<span class="einh">${esc(f.einheit)}</span>`:""}</div>`).join("")}</div>`:"")
    +`<div class="sbtns">${knoepfe.map((k,i)=>`<button class="btn ${k.klasse||"glass btn-glas"}" data-k="${i}">${esc(k.label)}</button>`).join("")}</div></div>`;
  document.body.appendChild(hg);
  const zu=()=>hg.remove();
  const ausloesen=i=>{const k=knoepfe[i];const werte=Object.fromEntries(felder.map(f=>[f.id,$("df_"+f.id).value]));if(k.fn&&k.fn(werte)===false)return;zu()};
  hg.addEventListener("click",e=>{if(e.target===hg)return zu();const b=e.target.closest("[data-k]");if(b)ausloesen(+b.dataset.k)});
  hg.addEventListener("keydown",e=>{if(e.key==="Escape")zu();if(e.key==="Enter"){const i=knoepfe.findIndex(k=>k.haupt);if(i>=0){e.preventDefault();ausloesen(i)}}});
  const erstes=hg.querySelector("input")||hg.querySelector("button");if(erstes)setTimeout(()=>{erstes.focus();if(erstes.select)erstes.select()},60);
  return zu;
}

// PDF: Seitenzahlen und Kopfzeile auf Folgeseiten
const BLAU=[22,50,92],GELB=[245,184,46],LINIE=[225,229,236];
function pdfTitel(doc,titel){
  doc.setFontSize(18);doc.setTextColor(...BLAU);doc.text(titel,14,18);doc.setTextColor(0);
  logoInsPDF(doc);
  doc.setDrawColor(...GELB);doc.setLineWidth(1.2);doc.line(14,21,196,21);doc.setDrawColor(0);doc.setLineWidth(0.2);
}
function pdfFolgekopf(doc,text){doc.setFontSize(8);doc.setTextColor(90);doc.text(doc.splitTextToSize(text,182)[0],14,12);doc.setDrawColor(...GELB);doc.setLineWidth(0.6);doc.line(14,14,196,14);doc.setDrawColor(0);doc.setLineWidth(0.2);doc.setTextColor(0)}
function pdfKopfdaten(doc,zeilen,y){
  doc.setFontSize(10);
  zeilen.forEach(([a,v])=>{doc.setFont(undefined,"bold");doc.text(a+":",14,y);doc.setFont(undefined,"normal");const z=doc.splitTextToSize(v||"",140);doc.text(z,55,y);y+=5*Math.max(1,z.length)+1});
  return y;
}
function pdfAbschluss(doc,folgeText){
  let ey=doc.lastAutoTable.finalY+25;if(ey>272){doc.addPage();ey=40;pdfFolgekopf(doc,folgeText)}
  doc.setLineWidth(0.2);doc.line(14,ey,90,ey);doc.line(115,ey,196,ey);doc.setFontSize(9);doc.text("Ort, Datum",14,ey+5);doc.text("Unterschrift Kunde",115,ey+5);
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(120);doc.text("Seite "+i+" von "+n,196,290,{align:"right"});doc.setTextColor(0)}
}

// Wischen nach links (Handy) zeigt die Aktionen einer Zeile; Antippen klappt sie auf/zu
function wischenAktivieren(box){
  let sw=null;
  const alleZu=aus=>box.querySelectorAll(".zeile.offen").forEach(z=>{if(z!==aus)z.classList.remove("offen")});
  box.addEventListener("touchstart",e=>{const z=e.target.closest(".zeile");if(!z||!z.querySelector(".zaktion")||e.target.closest(".zaktion"))return;const t=e.touches[0];
    sw={z,x:t.clientX,y:t.clientY,dx:0,aktiv:false,war:z.classList.contains("offen"),inh:z.querySelector(".zinhalt"),akt:z.querySelector(".zaktion")}},{passive:true});
  box.addEventListener("touchmove",e=>{if(!sw)return;const t=e.touches[0],dx=t.clientX-sw.x,dy=t.clientY-sw.y;
    if(!sw.aktiv){if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){sw.aktiv=true;alleZu(sw.z);sw.inh.style.transition=sw.akt.style.transition="none"}else if(Math.abs(dy)>10){sw=null;return}}
    if(sw.aktiv){e.preventDefault();sw.dx=dx;const w=sw.akt.offsetWidth||150;const pos=Math.min(0,Math.max(-w-20,(sw.war?-w:0)+dx));sw.inh.style.transform=`translateX(${pos}px)`;sw.akt.style.transform=`translateX(${w+pos}px)`}},{passive:false});
  box.addEventListener("touchend",()=>{if(!sw)return;const s=sw;sw=null;const w=s.akt.offsetWidth||150;
    if(s.aktiv){s.inh.style.transition=s.akt.style.transition=s.inh.style.transform=s.akt.style.transform="";s.z.classList.toggle("offen",(s.war?-w:0)+s.dx<-60)}
    else{const auf=!s.war;alleZu(null);s.z.classList.toggle("offen",auf)}});
  document.addEventListener("touchstart",e=>{if(!box.contains(e.target))alleZu(null)},{passive:true});
}

// Offline-Modus anmelden; bei neuer Version einmal neu laden
function offlineAnmelden(){
  if(!("serviceWorker" in navigator)||!location.protocol.startsWith("http"))return;
  const hatte=!!navigator.serviceWorker.controller;let neu=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(hatte&&!neu){neu=true;location.reload()}});
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
