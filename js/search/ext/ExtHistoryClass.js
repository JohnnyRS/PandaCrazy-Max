class ExtHistory {
  async sendBroadcastMsg(msg, retMsg, value=null, timeoutVal=null, timeoutTime=5000) {
    const hist2Channel = new BroadcastChannel('PCM_kHistory2_band');
    return new Promise( (resolve, reject) => {
      hist2Channel.postMessage({'msg':msg, 'value':value});
      hist2Channel.onmessage = async (e) => {
        hist2Channel.close();
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        if (e.data.msg === retMsg && e.data.reject) reject(e.data.reject);
        else resolve(false);
      }
      setTimeout(() => { hist2Channel.close(); resolve(timeoutVal); }, timeoutTime);
    });
  }
  async findValues() { return await this.sendBroadcastMsg('searchHST: findValues', 'searchHST: returning findValues', [...arguments], false); }
}