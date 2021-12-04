/** This class deals with the different menus and which methods to call for SearchUI page.
 * @class ExtHistory ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ExtHistory {
  /** Sends a message through the Broadcast channel PCM_hist2Channel and waits for a response or timeouts and then sends the response.
   * @async                        - To wait for the response from a message.
   * @param  {string} msg          - The message to send.             @param  {string} retMsg        - The return string to use.  @param  {object} [value] - The value to send.
   * @param  {object} [timeoutVal] - Object to use when it timeouts.  @param  {number} [timeoutTime] - The timeout time to wait for response.
   * @return {promise}             - A promised value after waiting for a message to return.
   */
  async sendBroadcastMsg(msg, retMsg, value=null, timeoutVal=null, timeoutTime=5000) {
    const PCM_hist2Channel = new BroadcastChannel('PCM_kHistory2_band');
    return new Promise( (resolve, reject) => {
      PCM_hist2Channel.postMessage({'msg':msg, 'value':value});
      PCM_hist2Channel.onmessage = async (e) => {
        PCM_hist2Channel.close();
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        if (e.data.msg === retMsg && e.data.reject) reject(e.data.reject);
        else resolve(false);
      }
      setTimeout(() => { PCM_hist2Channel.close(); resolve(timeoutVal); }, timeoutTime);
    });
  }

  /** Methods that pass messages through the Broadcast channel to the history class but no parameters because it gets passed through. */
  async findValues() { return await this.sendBroadcastMsg('searchHST: findValues', 'searchHST: returning findValues', [...arguments], false); }
}
