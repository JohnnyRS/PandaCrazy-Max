localStorage.clear();
MturkQueue._init_Timer(2000); // initialise a static timer for all queue requests

const queue = new MturkQueue(); // set up a mturk class for a panda

$(function () { queue.startQueueMonitor(); });
