// SafeCircle frontend. Plain JavaScript, no frameworks.
const $ = id => document.getElementById(id);
const BACKEND_URL = ''; // '' = same server that serves this page. Set a full URL if the backend is hosted elsewhere.

// ---------- translations (missing keys fall back to English) ----------
const T = {
 en:{title:"Your trusted circle, one tap away",sub:"Alert contacts, share live location, and get help fast.",who:"Built for night-time commuters",hint:"Tap SOS to alert your trusted contacts.",share:"Share location",fake:"Fake call",call:"Call 112",trusted:"Trusted contacts",tips:"Safety tips",checkin:"Safe-route check-in",foot:"Location is shared only during an alert. Alerts are sent by SMS or WhatsApp through our server. If it is unavailable, WhatsApp links are used instead."},
 hi:{title:"आपका भरोसेमंद घेरा, बस एक टैप दूर",sub:"संपर्कों को अलर्ट करें, लोकेशन साझा करें और तुरंत मदद पाएं।",who:"रात में सफ़र करने वालों के लिए",hint:"अपने भरोसेमंद संपर्कों को अलर्ट करने के लिए SOS दबाएं।",share:"लोकेशन भेजें",fake:"नकली कॉल",call:"112 कॉल करें",trusted:"भरोसेमंद संपर्क",tips:"सुरक्षा सुझाव",checkin:"सुरक्षित सफ़र चेक-इन"},
 te:{title:"మీ నమ్మకమైన వలయం, ఒక్క ట్యాప్ దూరంలో",sub:"కాంటాక్ట్‌లకు అలర్ట్ పంపండి, లొకేషన్ షేర్ చేయండి, త్వరగా సహాయం పొందండి.",who:"రాత్రి ప్రయాణికుల కోసం",hint:"మీ నమ్మకమైన కాంటాక్ట్‌లకు అలర్ట్ పంపడానికి SOS నొక్కండి.",share:"లొకేషన్ షేర్",fake:"నకిలీ కాల్",call:"112 కి కాల్",trusted:"నమ్మకమైన కాంటాక్ట్‌లు",tips:"భద్రతా చిట్కాలు",checkin:"సురక్షిత ప్రయాణ చెక్-ఇన్"}
};
function setLang(l){
 document.documentElement.lang=l;
 document.querySelectorAll('[data-i]').forEach(e=>{e.textContent=(T[l]&&T[l][e.dataset.i])||T.en[e.dataset.i]});
 try{localStorage.setItem('sc_lang',l)}catch(e){}
}
$('lang').onchange=e=>setLang(e.target.value);
let lang='en';try{lang=localStorage.getItem('sc_lang')||'en'}catch(e){}
if(!T[lang])lang='en';$('lang').value=lang;setLang(lang);

$('theme').onclick=()=>{
 const r=document.documentElement,dark=r.dataset.theme==='dark';
 r.dataset.theme=dark?'light':'dark';$('theme').textContent=dark?'🌙':'☀️';
};

// ---------- contacts ----------
let contacts=[];
try{contacts=JSON.parse(localStorage.getItem('sc_contacts')||'[]');if(!Array.isArray(contacts))contacts=[]}catch(e){contacts=[]}
const saveContacts=()=>{try{localStorage.setItem('sc_contacts',JSON.stringify(contacts))}catch(e){}};

function renderContacts(){
 const ul=$('list');ul.innerHTML='';
 if(!contacts.length){const li=document.createElement('li');li.className='empty';li.textContent='No contacts yet. Add at least one to use SOS.';ul.append(li)}
 contacts.forEach((c,i)=>{
  const li=document.createElement('li');li.className='contact';
  const av=document.createElement('div');av.className='av';av.setAttribute('aria-hidden','true');av.textContent=c.name.charAt(0).toUpperCase();
  const info=document.createElement('div');info.className='info';
  const b=document.createElement('b');b.textContent=c.name;
  const s=document.createElement('small');s.textContent=c.phone;
  info.append(b,s);
  const rm=document.createElement('button');rm.className='rm';rm.type='button';rm.textContent='✕';rm.setAttribute('aria-label','Remove '+c.name);
  rm.onclick=()=>{contacts.splice(i,1);saveContacts();renderContacts()};
  li.append(av,info,rm);ul.append(li);
 });
 $('status').textContent='● '+contacts.length+' trusted contact(s) saved';
}

$('contactForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('cname').value.trim(),phone=$('cphone').value.trim(),err=$('formMsg');
 if(!name){err.textContent='Please enter a name.';$('cname').focus();return}
 if(!/^\+?[\d\s-]{10,16}$/.test(phone)){err.textContent='Enter a valid phone number (10 digits, or with country code).';$('cphone').focus();return}
 if(contacts.length>=5){err.textContent='You can save up to 5 contacts.';return}
 contacts.push({name:name.slice(0,30),phone});saveContacts();renderContacts();
 err.textContent='';$('cname').value='';$('cphone').value='';$('cname').focus();
});
renderContacts();

// ---------- location helpers ----------
function loc(){return new Promise(r=>{
 if(!navigator.geolocation)return r(null);
 navigator.geolocation.getCurrentPosition(p=>r(p.coords),()=>r(null),{timeout:6000});
})}
const mapLink=c=>c?`https://maps.google.com/?q=${c.latitude},${c.longitude}`:'(location unavailable)';
const setMsg=t=>{$('msg').textContent=t};

// ---------- sending the alert ----------
function waNumber(p){let d=p.replace(/\D/g,'');if(d.length===10)d='91'+d;return d}
function waUrl(contact,link,reason){
 const what=reason==='checkin'?'I did not confirm my safe arrival.':'I need help!';
    const text='SafeCircle SOS: '+what+' My location: '+link;
  return 'https://wa.me/'+waNumber(contact.phone)+'?text='+encodeURIComponent(text);
}
function showWhatsApp(link,reason){
 const box=$('alerts');box.innerHTML='';
 setMsg('Server unavailable. Tap each contact to send the alert on WhatsApp.');
 contacts.forEach(k=>{
  const a=document.createElement('a');a.href=waUrl(k,link,reason);a.target='_blank';a.rel='noopener';
  a.textContent='Send to '+k.name+' on WhatsApp';box.append(a);
 });
}
async function sendAlert(reason){
 $('alerts').innerHTML='';
 if(!contacts.length){setMsg('Add a trusted contact first.');return}
 setMsg('Getting your location…');
 const c=await loc();
 try{
  const res=await fetch(BACKEND_URL+'/api/sos',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({contacts,lat:c?c.latitude:undefined,lng:c?c.longitude:undefined,reason})
  });
  const data=await res.json();
  if(res.ok&&data.sent>0){
   setMsg('✅ Alert sent to '+data.sent+' contact(s)'+(data.failed?' ('+data.failed+' failed)':'')+'.');
   if(navigator.vibrate)try{navigator.vibrate([200,100,200])}catch(e){}
   return;
  }
  throw new Error(data.error||'send_failed');
 }catch(e){
  showWhatsApp(mapLink(c),reason);
 }
}

// ---------- SOS button with cancelable countdown ----------
let sosTimer=null;
$('sos').onclick=()=>{
 const b=$('sos');
 if(sosTimer){clearInterval(sosTimer);sosTimer=null;b.classList.remove('on');b.textContent='SOS';setMsg('SOS cancelled.');return}
 if(!contacts.length){setMsg('Add a trusted contact first.');$('cname').focus();return}
 let n=5;b.classList.add('on');b.textContent=n;setMsg('Sending in 5 seconds. Tap again to cancel.');
 sosTimer=setInterval(()=>{
  n--;
  if(n>0){b.textContent=n;setMsg('Sending in '+n+' seconds. Tap again to cancel.');return}
  clearInterval(sosTimer);sosTimer=null;b.classList.remove('on');b.textContent='SOS';
  sendAlert('sos');
 },1000);
};

// ---------- safe-route check-in ----------
const GRACE_MS=30000;
let ci=null,ciTimer=null,graceBuzzed=false;
try{ci=JSON.parse(localStorage.getItem('sc_checkin')||'null')}catch(e){ci=null}
const saveCi=()=>{try{ci?localStorage.setItem('sc_checkin',JSON.stringify(ci)):localStorage.removeItem('sc_checkin')}catch(e){}};
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

function stopCheckin(){
 clearInterval(ciTimer);ciTimer=null;ci=null;graceBuzzed=false;saveCi();
 $('imSafe').hidden=true;$('startCheckin').hidden=false;$('ciStatus').classList.remove('warn');
}
function tickCheckin(){
 if(!ci)return;
 const now=Date.now(),left=ci.end-now,st=$('ciStatus');
 const where=ci.label?' to '+ci.label:'';
 if(left>0){st.classList.remove('warn');st.textContent='Check-in active'+where+'. Arrive in '+fmt(left)+'.';return}
 const graceLeft=ci.end+GRACE_MS-now;
 if(graceLeft>0){
  st.classList.add('warn');st.textContent='Time is up. Tap “I’m safe” within '+fmt(graceLeft)+' or an alert will be sent.';
  if(!graceBuzzed){graceBuzzed=true;if(navigator.vibrate)try{navigator.vibrate([300,150,300,150,300])}catch(e){}}
  return;
 }
 stopCheckin();$('ciStatus').textContent='Check-in missed. Sending alert…';
 sendAlert('checkin');
}
function runCheckin(){
 $('imSafe').hidden=false;$('startCheckin').hidden=true;
 clearInterval(ciTimer);ciTimer=setInterval(tickCheckin,1000);tickCheckin();
}
$('startCheckin').onclick=()=>{
 if(!contacts.length){$('ciStatus').textContent='Add a trusted contact first.';$('cname').focus();return}
 const mins=parseInt($('eta').value,10);
 if(!(mins>=1&&mins<=240)){$('ciStatus').textContent='Enter minutes between 1 and 240.';return}
 ci={end:Date.now()+mins*60000,label:$('dest').value.trim().slice(0,40)};saveCi();runCheckin();
};
$('imSafe').onclick=()=>{stopCheckin();$('ciStatus').textContent='✅ Glad you’re safe. Check-in ended.'};
if(ci&&typeof ci.end==='number')runCheckin();else ci=null;

// ---------- share location and fake call ----------
$('share').onclick=async()=>{
 const c=await loc(),text='Follow my location: '+mapLink(c);
 try{if(navigator.share){await navigator.share({text});return}}catch(e){}
 try{await navigator.clipboard.writeText(text);setMsg('Location link copied.')}catch(e){setMsg(text)}
};
$('fake').onclick=()=>{
 setMsg('Fake call in 5 seconds…');
 setTimeout(()=>{setMsg('📞 Incoming call: Mom. Use it as an excuse to leave.');if(navigator.vibrate)try{navigator.vibrate([400,200,400])}catch(e){}},5000);
};
