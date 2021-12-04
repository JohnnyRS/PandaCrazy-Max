/** This class deals with the communication from SearchUI to PandaUI about databases.
 * @class ExtDBPanda ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ExtDBPanda {
  /** Sends a message through the Broadcast channel PCM_hist2Channel and waits for a response or timeouts and then sends the response.
   * @async                        - To wait for the response from a message.
   * @param  {string} msg          - The message to send.             @param  {string} retMsg        - The return string to use.  @param  {object} [value] - The value to send.
   * @param  {object} [timeoutVal] - Object to use when it timeouts.  @param  {number} [timeoutTime] - The timeout time to wait for response.
   * @return {promise}             - A promised value after waiting for a message to return.
   */
   async sendBroadcastMsg(msg, retMsg, value=null, timeoutVal=null, timeoutTime=5000) {
    const PCM_db2Channel = new BroadcastChannel('PCM_kDatabase2_band');
    return new Promise( (resolve, reject) => {
      PCM_db2Channel.postMessage({'msg':msg, 'value':value});
      PCM_db2Channel.onmessage = async (e) => {
        PCM_db2Channel.close();
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        if (e.data.msg === retMsg && e.data.reject) reject(e.data.reject);
        else resolve(false);
      }
      setTimeout(() => { PCM_db2Channel.close(); resolve(timeoutVal); }, timeoutTime);
    });
  }

  /** Methods that pass messages through the Broadcast channel to the history class but no parameters because it gets passed through. */
  async getFromDB() {
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