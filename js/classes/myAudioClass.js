/** Class for playing audio on pages instead of background page.
 * @class myAudioClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class myAudioClass {
  constructor() {
    this.audios = {};
  }
  newAudio(name, data=null) {
    this.audios[name] = new Audio(data);
    return this.audios[name];
  }
  delAudio(name) { delete this.audios[name]; }
}
