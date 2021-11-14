const db2Channel = new BroadcastChannel('PCM_kDatabase2_band');  // Used specifically for promises so search page can wait for a response on search channel.

function sendDB2Channel(msg, value=null, reject=null) { db2Channel.postMessage({'msg':msg, 'value':value, 'reject':reject}); }

db2Channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data.value) {
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
