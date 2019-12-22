class MturkQueue extends MturkClass {
	constructor(timer, loggedOffTimer=5000) {
    super();
    this.timer = timer;
    this.loggedOffTimer = loggedOffTimer;
    this.queueUnique = null;
    this.queueUrl = new UrlClass("https://worker.mturk.com/tasks?format=json");
    this.queueResults = [];
    this.portQueue = null;
    this.loggedOff = false;
		queueTimer.setTimer(timer);
  }
  sendQueueResults() { chrome.runtime.sendMessage( {command:"gotNewQueue", queueResults:this.queueResults} ); }
  setTimer(timer) { this.timer = timer; }
  startQueueMonitor() {
		if (!queueTimer.running) this.queueUnique = queueTimer.addToQueue(-1, this, (unique, elapsed, myId, obj) => { obj.goFetch(obj.queueUrl, unique, elapsed); }, (myId, obj) => { obj.stopQueueMonitor(); });
  }
	stopQueueMonitor() {
    console.log("stopSearching: delete " + this.queueUnique);
    queueTimer.deleteFromQueue(this.queueUnique);
  }
  totalResults(rId="", gId="", price=0) {
    let total = 0;
    if (gId!=="") total = this.queueResults.filter( item => item.project.hit_set_id===gId ).length;
    else if (rId!=="") total = this.queueResults.filter( item => item.project.requester_id===rId ).length;
    else total = parseFloat(this.queueResults.map( item => item.project.monetary_reward.amount_in_dollars )
      .reduce( (acc, reward) => {
          // let reward = parseFloat(project.monetary_reward.amount_in_dollars);
          return acc +  ( (reward>price) ? reward : 0 );
        }, 0 )).toFixed(2);
      return total;
  }
	goFetch(objUrl, queueUnique, elapsed) {
		// Can deal with getting search results data.
		super.goFetch(objUrl).then(result => {
			if (result.mode === "logged out" && queueUnique !== null) {
        queueTimer.setTimer(10000);
        this.loggedOff = true;
      } else if (result.type === "ok.json") {
        if (this.loggedOff) { this.loggedOff=false; queueTimer.setTimer(this.timer); }
				if (result.mode === "pre") console.log("Received a Queue PRE!!")
				else { this.queueResults = result.data.tasks; this.sendQueueResults(); }
      }
    });
  }
}

const myQueue = new MturkQueue(2000); // 2s queue monitor by default

if (chrome.runtime) {
  chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    // console.log(`sender = ${sender.url} | request = ${JSON.stringify(request)}`);
    if (request.command === "startQueueMonitor") { myQueue.startQueueMonitor(); }
    else if (request.command === "totalResults") { sendResponse({hits:myQueue.totalResults(request.rId, request.gId, request.price)}); }
  });
}
