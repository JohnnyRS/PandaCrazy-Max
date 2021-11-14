const hist2Channel = new BroadcastChannel('PCM_kHistory2_band');

function sendHistChannel(msg, value=null, reject=null) { hist2Channel.postMessage({'msg':msg, 'value':value, 'reject':reject}); }

hist2Channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data.value) {
      const val = data.value;
      if (data.msg === 'searchHST: findValues') { let retVal = await bgHistory.findValues(val[0]); sendHistChannel('searchHST: returning findValues', retVal); }
    }
  }
}
