# PandaCrazy-Max
PandaCrazy Chrome Extension Version 0.8.1 for Amazon Mturk

This is a rebuild of my PandaCrazy userscript for Mturk.com in a Chrome Extension version. Panda jobs are now saved in the database. Only relevant data is kept in memory when needed to save some memory space. Search jobs are working now also but searches are on a separate timer. Searches only check the first 25 hits every second for all the search jobs which makes it a lot more efficient to find hits from searches. Compared to the original script there can be a lot more searches running and won't cause any timer problems. Groupings are now working and can be run at a specific time for a certain duration. A lot of debugging lines have been added for future use. Queue watch is now better and a bit smarter. It only adds new hits to the queue. New icon has been added for the extension bar.

Some menus still don't work. Options haven't all been tested yet. Accepted and status log are not showing anything. Alarms are not working. Can't import or export at this time. 

This is being built by the newest ECMAScript, jquery, jquery UI and bootstrap. Coding in Visual Studio Code.

At this time this only works in Chrome in developer mode!
