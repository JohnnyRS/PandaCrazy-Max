<h1 align="center">PandaCrazy Chrome Extension for Amazon Mturk</h1>

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

### Search jobs can be added by the Add Job button.
1. To create a groupID search job (gid) you have to paste in a panda url and then click on the search job box.
1. To create a requesterID search job (rid) you paste in a requester url with or without clicking the search job box.
1. Search options to include or exclude groupID's are not working right now.
1. GroupID search jobs (gid) will first start collecting for 10 seconds and then will use the mturk search page.
1. RequesterID search jobs (rid) will search the requester url page first and then use the mturk search page.
1. You may import older import files but only the jobs and tabs will be imported at this time.
1. Export jobs have been disabled until I decide on a good format.

##### Some other changes:
* Older scripts that send messages to the old PC script should now work with this extension too.
* Buttons on forums should still work but they may change in the future.
* Buttons on some mturk pages have been changed and search multiple button has been added.
* Search button will add a groupID search job (gid) that accepts only one hit. Good for surveys.
* Search multiple button will add a requesterID search job (rid) with no limits.

 Panda jobs are now saved in the database. Only relevant data is kept in memory when needed to save some memory space. Search jobs are working now also but searches are on a separate timer. Searches only check the first 25 hits every second for all the search jobs which makes it a lot more efficient to find hits from searches. Compared to the original script there can be a lot more searches running and won't cause any timer problems. Groupings are now working and can be run at a specific time for a certain duration. A lot of debugging lines have been added for future use. Queue watch is now better and a bit smarter. It only adds new hits to the queue. New icon has been added for the extension bar.

Some menus still don't work. Options haven't all been tested yet. Alarms are not working.

This is being built by the newest ECMAScript, jquery, jquery UI and bootstrap. Coding in Visual Studio Code.

At this time this works in Chrome and new microsoft edge in developer mode!
