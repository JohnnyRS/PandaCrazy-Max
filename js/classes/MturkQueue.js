class MturkQueue extends MturkClass {
	constructor() {
    super();
    this.queueUnique = null;
    this.queueUrl = new UrlClass("https://worker.mturk.com/tasks?format=json");
    this.queueResults = [];
  }
  static _init_Timer(timer) { MturkQueue._this_Timer = new TimerClass(timer); }
  startQueueMonitor() {
		this.queueUnique = MturkQueue._this_Timer.addToQueue(-1, this, (unique, elapsed, myId, obj) => {
			obj.goFetch(obj.queueUrl, unique, elapsed); }, (myId, obj) => {
				obj.stopQueueMonitor();
			}); }
	stopSearching() {
    console.log("stopSearching: delete " + this.queueUnique);
    MturkQueue._this_Timer.deleteFromQueue(this.queueUnique); }
  totalResults(rId="", gId="", price=0) {
    let total = 0;
    if (gId!=="") total = this.queueResults.filter( item => item.project.hit_set_id===gId ).length;
    else if (rId!=="") total = this.queueResults.filter( item => item.project.requester_id===rId ).length;
    else total = this.queueResults.map( item => item.project.monetary_reward.amount_in_dollars )
      .reduce( (acc, reward) => {
          // let reward = parseFloat(project.monetary_reward.amount_in_dollars);
          return acc +  ( (reward>price) ? reward : 0 );
        }, 0 );
      return total;
  }
  setQueueResults(queueResults) { this.queueResults = queueResults; }
	goFetch(objUrl, queueUnique, elapsed) {
		// Can deal with getting search results data.
		super.goFetch(objUrl).then(result => {
			if (result.mode === "logged out" && queueUnique !== null) {
				MturkQueue._this_Timer.pauseTimer(queueUnique); }
			else if (result.type === "ok.json") {
				if (result.mode === "pre") {
					console.log("Received a Queue PRE!!")
				} else {
          this.queueResults = result.data.tasks;
          localStorage.setItem("PCM_queueResults", JSON.stringify(this.queueResults));
          // console.log("total groupid: " + this.totalResults("", "3L8V324VIVRQCOOFCXM8V9CTK3H9FD"));
          // console.log("total requesterid: " + this.totalResults("ASOSP45W2WM03", ""));
          // console.log("total dollar value: $" + this.totalResults());
        }
			 }
		 }); }
}