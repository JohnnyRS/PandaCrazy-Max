/** Class for playing audio on pages instead of background page.
 * @class myAudioClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class myAudioClass {
  constructor() {
    this.audios = {};
  }
  /** Creates a new audio for this specified audio with name and data.
   * @param  {string} name - The name of the audio.  @param {object} data - The audio data
   * @return {object}      - Returns the audio object. */
  newAudio(name, data=null) {
    this.audios[name] = new Audio(data);
    return this.audios[name];
  }
  /** Deletes the audio object with the name specified.
   * @param {string} name - The name of the audio. */
  delAudio(name) { delete this.audios[name]; }
}
