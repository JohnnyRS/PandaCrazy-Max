<h1 align="center">PandaCrazy Chrome Extension Ver. 0.8.2 for Amazon Mturk</h1>

*This is a rebuild of my PandaCrazy userscript for Mturk.com in a Chrome Extension version.*

### Installation Instructions for Chrome
1. Need to download the ZIP file from the clone or download button. [Zip File](https://github.com/JohnnyRS/PandaCrazy-Max/archive/master.zip).
1. Now you need to unzip the file into a folder which should be called: `PandaCrazy-Max-master`
1. Go to the chrome extensions page (`chrome://extensions`).
1. For this script to work for now you have to enable the Developer Mode switch at top.
1. Push the load unpacked button and find the new folder or drag and drop the folder anywhere on the page.
1. Make sure PandaCrazy Max extension is enabled on the extensions page.
1. There should be an icon with PC Max on it at the top in the extension bar.
1. Click on it and push the start pandacrazy link.

 Panda jobs are now saved in the database. Only relevant data is kept in memory when needed to save some memory space. Search jobs are working now also but searches are on a separate timer. Searches only check the first 25 hits every second for all the search jobs which makes it a lot more efficient to find hits from searches. Compared to the original script there can be a lot more searches running and won't cause any timer problems. Groupings are now working and can be run at a specific time for a certain duration. A lot of debugging lines have been added for future use. Queue watch is now better and a bit smarter. It only adds new hits to the queue. New icon has been added for the extension bar.

Some menus still don't work. Options haven't all been tested yet. Accepted and status log are not showing anything. Alarms are not working. Can't import or export at this time. 

This is being built by the newest ECMAScript, jquery, jquery UI and bootstrap. Coding in Visual Studio Code.

At this time this only works in Chrome in developer mode!
