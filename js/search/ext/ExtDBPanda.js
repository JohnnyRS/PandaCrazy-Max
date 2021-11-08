class ExtDBPanda {
  async sendBroadcastMsg(msg, retMsg, value=null, timeoutVal=null, timeoutTime=500) {
    const db2Channel = new BroadcastChannel('PCM_kDatabase2_band');
    return new Promise( (resolve, reject) => {
      db2Channel.postMessage({'msg':msg, 'value':value});
      db2Channel.onmessage = async (e) => {
        db2Channel.close();
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        if (e.data.msg === retMsg && e.data.reject) reject(e.data.reject);
        else resolve(false);
      }
      setTimeout(() => { db2Channel.close(); resolve(timeoutVal); }, timeoutTime);
    });
  }
  getFromDB() {
    return new Promise((resolve, reject) => {
      this.sendBroadcastMsg('searchDB: getFromDB', 'searchDB: returning getFromDB', [...arguments], false).then( results => resolve(results), rejected => reject(rejected) );
    });
  }
  async addToDB() {
    return new Promise((resolve, reject) => {
      this.sendBroadcastMsg('searchDB: addToDB', 'searchDB: returning addToDB', [...arguments], false).then( results => resolve(results), rejected => reject(rejected) );
    });
  }
  async deleteFromDB() {
    return new Promise((resolve, reject) => {
      this.sendBroadcastMsg('searchDB: deleteFromDB', 'searchDB: returning deleteFromDB', [...arguments], false).then( results => resolve(results), rejected => reject(rejected) );
    });
  }
}