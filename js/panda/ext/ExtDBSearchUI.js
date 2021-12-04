const PCM_db2Channel = new BroadcastChannel('PCM_kDatabase2_band');  // Used specifically for promises so search page can wait for a response on search channel.

/** Sends a message with an object and rejected message through the Broadcast channel PCM_db2Channel.
 * @param  {string} msg    - Message to send through messaging.  @param  {object} value - Object to send through messaging.
 * @param  {string} reject - Rejected message to send through messaging.
**/
function sendDB2Channel(msg, value=null, reject=null) { PCM_db2Channel.postMessage({'msg':msg, 'value':value, 'reject':reject}); }

/** Listens on a channel for messages from main database class to the SearchUI page. **/
PCM_db2Channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data.value && MYDB) {
      const val = data.value;
      if (data.msg === 'searchDB: getFromDB') {
        MYDB.getFromDB(val[0], val[1], val[2], val[3], val[4], val[5], val[6], val[7], val[8], val[9]).then( (results) => {
        sendDB2Channel('searchDB: returning getFromDB', results);
        }, (rejected) => { sendDB2Channel('searchDB: returning getFromDB',_, rejected); });
      } else if (data.msg === 'searchDB: addToDB') {
        MYDB.addToDB(val[0], val[1], val[2], val[3], val[4], val[5]).then( (results) => {
          sendDB2Channel('searchDB: returning addToDB', results);
        }, (rejected) => { sendDB2Channel('searchDB: returning addToDB',_, rejected); });
      } else if (data.msg === 'searchDB: deleteFromDB') {
        MYDB.deleteFromDB(val[0], val[1], val[2], val[3]).then( (results) => {
          sendDB2Channel('searchDB: returning deleteFromDB', results);
        }, (rejected) => { sendDB2Channel('searchDB: returning deleteFromDB',_, rejected); });
      }
    }
  }
}
