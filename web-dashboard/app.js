const $ = id => document.getElementById(id);
const ctx = $('waveChart').getContext('2d');
let running = false, timer = null, samples = [], count = 0, bleDevice = null, bleCharacteristic = null;
const MAX_POINTS = 100;
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcdefab-1234-1234-1234-abcdefabcdef';

const chart = new Chart(ctx, {
  type: 'line',
  data: { labels: [], datasets: [{ data: [], borderColor: '#4de1d2', borderWidth: 2, pointRadius: 0, tension: 0.18, fill: true, backgroundColor: 'rgba(77,225,210,.08)' }] },
  options: { responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:false},tooltip:{enabled:false}},
    scales:{x:{display:false},y:{min:0,max:3.3,grid:{color:'rgba(120,145,180,.13)'},ticks:{color:'#8292ae',font:{size:10},callback:v=>v.toFixed(1)+' V'}}}}
});

function wave(t) {
  const type=$('signalType').value, amp=Number($('amplitude').value), freq=Number($('frequency').value), offset=Number($('offset').value);
  const phase=(t*freq)%1;
  let v= type==='sine' ? Math.sin(2*Math.PI*phase) : type==='square' ? (phase<.5?1:-1) : type==='triangle' ? 1-4*Math.abs(phase-.5) : 0;
  return Math.max(0,Math.min(3.3,offset+(type==='dc'?0:v*amp)));
}
function updateStats(){
  if(!samples.length)return;
  const min=Math.min(...samples), max=Math.max(...samples), avg=samples.reduce((a,b)=>a+b,0)/samples.length;
  $('minValue').textContent=min.toFixed(2)+' V'; $('maxValue').textContent=max.toFixed(2)+' V';
  $('avgValue').textContent=avg.toFixed(2)+' V'; $('ppValue').textContent=(max-min).toFixed(2)+' V';
}
function render(v){
  samples.push(v); if(samples.length>MAX_POINTS)samples.shift();
  count++; $('sampleCount').textContent=count.toLocaleString();
  const adc=Math.round(v/3.3*4095);
  $('voltage').textContent=v.toFixed(2); $('chartVoltage').textContent=v.toFixed(2)+' V'; $('adc').textContent=adc;
  chart.data.labels=samples.map((_,i)=>i); chart.data.datasets[0].data=samples; chart.update('none'); updateStats();
}
function tick(){ const t=Date.now()/1000; render(wave(t)); }
function start(){if(running)return;running=true;$('runBtn').textContent='Ⅱ Pause';timer=setInterval(tick,60)}
function stop(){running=false;clearInterval(timer);timer=null;$('runBtn').textContent='▶ Start'}
$('runBtn').addEventListener('click',()=>running?stop():start());
$('clearBtn').addEventListener('click',()=>{samples=[];count=0;$('sampleCount').textContent='0';chart.data.labels=[];chart.data.datasets[0].data=[];chart.update();['minValue','maxValue','avgValue','ppValue'].forEach(id=>$(id).textContent='— V')});
$('signalType').addEventListener('change',()=>{$('signalLabel').textContent=$('signalType').value.toUpperCase();});
$('amplitude').addEventListener('input',e=>$('ampValue').textContent=Number(e.target.value).toFixed(1)+' V');
$('frequency').addEventListener('input',e=>$('freqValue').textContent=e.target.value+' Hz');
$('offset').addEventListener('input',e=>$('offsetValue').textContent=Number(e.target.value).toFixed(2)+' V');
$('timeBase').addEventListener('change',e=>{$('timeBaseLabel').textContent=({1:'1.0 s/div',.5:'500 ms/div',.2:'200 ms/div',.1:'100 ms/div'})[e.target.value]});

function setConnected(connected,name='ESP32-H2'){
  $('connectionText').textContent=connected?'Connected':'Disconnected';
  $('sideStatus').textContent=connected?'BLE connected':'Not connected';
  $('sideDevice').textContent=name;
  $('connectionPill').querySelector('.dot').style.background=connected?'#4ce0a0':'#78849b';
  $('sideDot').style.background=connected?'#4ce0a0':'#78849b';
  $('connectBtn').textContent=connected?'Disconnect device':'↔ Connect device';
  $('chartMode').textContent=connected?'HARDWARE BLE':'DEMO MODE';
  $('signalModeFoot').textContent=connected?'BLE input':'Demo signal';
  $('demoNote').textContent=connected?'Receiving ADC samples from your ESP32-H2 over Bluetooth Low Energy.':'Simulation is active. Connect your ESP32-H2 to view real sensor readings.';
}
function onBleValue(event){
  const view=event.target.value;
  if(view.byteLength>=2){
    const raw=view.getUint16(0,true), voltage=raw/4095*3.3;
    samples.push(voltage); if(samples.length>MAX_POINTS)samples.shift();
    count++; $('sampleCount').textContent=count.toLocaleString();
    $('voltage').textContent=voltage.toFixed(2); $('chartVoltage').textContent=voltage.toFixed(2)+' V'; $('adc').textContent=raw;
    chart.data.labels=samples.map((_,i)=>i);chart.data.datasets[0].data=samples;chart.update('none');updateStats();
  }
}
async function connectBle(){
  if(!navigator.bluetooth){alert('Web Bluetooth is not available. Open this page in Chrome or Edge on HTTPS or localhost.');return}
  try{
    bleDevice=await navigator.bluetooth.requestDevice({filters:[{namePrefix:'ESP32'}],optionalServices:[SERVICE_UUID]});
    bleDevice.addEventListener('gattserverdisconnected',()=>{bleCharacteristic=null;setConnected(false)});
    const server=await bleDevice.gatt.connect();
    const service=await server.getPrimaryService(SERVICE_UUID);
    bleCharacteristic=await service.getCharacteristic(CHARACTERISTIC_UUID);
    await bleCharacteristic.startNotifications();
    bleCharacteristic.addEventListener('characteristicvaluechanged',onBleValue);
    stop();setConnected(true,bleDevice.name||'ESP32-H2');
  }catch(err){console.error(err);alert('Could not connect. Check that your ESP32-H2 firmware advertises the configured BLE service and characteristic UUIDs.\\n\\n'+err.message)}
}
$('connectBtn').addEventListener('click',async()=>{
  if(bleDevice?.gatt?.connected){bleDevice.gatt.disconnect();return}
  await connectBle();
});
start();