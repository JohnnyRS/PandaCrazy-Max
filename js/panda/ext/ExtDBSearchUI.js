const db2Channel = new BroadcastChannel('PCM_kDatabase2_band');  // Used specifically for promises so search page can wait for a response on search channel.
const searchChannel = new BroadcastChannel('PCM_kSearch_band');    // Used for sending and receiving messages from search page.

function sendToChannel(msg, value=null, reject=null) { db2Channel.postMessage({'msg':msg, 'value':value, 'reject':reject}); }

db2Channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data.value) {
      const val = data.value;
      if (data.msg === 'searchDB: getFromDB') {
        MYDB.getFromDB(val[0], val[1], val[2], val[3], val[4], val[5], val[6], val[7], val[8], val[9]).then( (results) => {
          sendToChannel('searchDB: returning getFromDB', results);
        }, (rejected) => { sendToChannel('searchDB: returning getFromDB',_, rejected); });
      } else if (data.msg === 'searchDB: addToDB') {
        MYDB.addToDB(val[0], val[1], val[2], val[3], val[4], val[5]).then( (results) => {
          sendToChannel('searchDB: returning addToDB', results);
        }, (rejected) => { sendToChannel('searchDB: returning addToDB',_, rejected); });
      } else if (data.msg === 'searchDB: deleteFromDB') {
        MYDB.deleteFromDB(val[0], val[1], val[2], val[3]).then( (results) => {
          sendToChannel('searchDB: returning deleteFromDB', results);
        }, (rejected) => { sendToChannel('searchDB: returning deleteFromDB',_, rejected); });
      }
    }
  }
}
