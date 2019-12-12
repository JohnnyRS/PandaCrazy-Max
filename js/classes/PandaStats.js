class PandaStats {
  constructor(myId) {
    this.myId = myId;
    this.collecting = false;
    this.fetched = { value:0, id:"#pcm_hitFetched", label:"Srch" };
    this.accepted = { value:0, id:"#pcm_hitAccepted", label:"Acc" };
    this.noMore = { value:0, id:"#pcm_hitNoMore", label:"NM" };
    this.updateAllStats();
   }
  updateAllStats() {
		$(`${this.accepted.id}_${this.myId}`).html(`${this.accepted.label}: ${this.accepted.value}`);
		$(`${this.fetched.id}_${this.myId}`).html(`${this.fetched.label}: ${this.fetched.value}`);
  }
  updateHitStat(statObj) {
		$(`${statObj.id}_${this.myId}`).html(`${statObj.label}: ${statObj.value}`);
  }
  addFetched() { this.fetched.value++; this.updateHitStat(this.fetched); }
  addAccepted() { this.accepted.value++; this.updateHitStat(this.accepted); }
  addNoMore() { this.noMore.value++; this.updateHitStat(this.noMore); }
 }