const PCM_hist2Channel = new BroadcastChannel('PCM_kHistory2_band');

/** Sends a message with an object and rejected message through the Broadcast channel PCM_hist2Channel.
 * @param  {string} msg    - Message to send through messaging.  @param  {object} value - Object to send through messaging.
 * @param  {string} reject - Rejected message to send through messaging.
**/
function sendHistChannel(msg, value=null, reject=null) { PCM_hist2Channel.postMessage({'msg':msg, 'value':value, 'reject':reject}); }

/** Listens on a channel for messages from the main history class to the SearchUI page. **/
PCM_hist2Channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data.value) {
      const val = data.value;
      if (data.msg === 'searchHST: findValues') { let retVal = await MyHistory.findValues(val[0]); sendHistChannel('searchHST: returning findValues', retVal); }
    }
  }
}
