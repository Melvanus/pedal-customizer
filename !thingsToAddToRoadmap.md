# Add following things to the roadmap, you can expand them a little and get inspired by user friendlyness

Highest Prio:

Changes to the Enclosure Visualizer
- The current configuration should be always visualized in a smaller visualizer window (with less functions in the minimalized view compared to final overview in the summary view, expanding the toolset only when maximizing the window)

In the maximized view of the Enclosure Visualizer we should also have following features:
- Highlight the active selection in layout editor
- Infobox about the selected element
- box select for selecting multiple elements
- shift for adding/removing elements from selection
- when a group is selected the move functions should move the whole group
- The layout editor should have a snap align feature, when things are moved around it should check if theres something next or over/under it so that it aligns when a certain delta is reached. it should be possible to deactivate the snap feature.
- when a group is selected a align tool for horizontal / vertical alignment should be shown, that when pressed takes the average horizontal / vertical position and aligns all selected objects


- Multiple types of preconfigurations before design:
    - Raw: "Start from scratch"
    - Simple (Polished / Painted / Labeled):
    - Custom (Decal, Graphics, Relic, Fluffy):

- Two types of knob layouts: standard / custom (when custom, knobs can be adjusted in their position)


- I want the search of the paint/finish tab to look the same as the one of the effect selector. it should also behave the same in the way that its also in the scroll region and moves 

- Setting mod labels at the position of the things they replace in detail modal and summary category

Dont know if we should do that:
- In the first window a default pedal is always selected. i want you to change it so that the default selection is a completly custom build with unknown pricing. here the user can put all the information regarding the used schematic or the original pedal etc himself, so that he can get a completly custom pedal. a search/autocomplete system would be cool with a list of famous/widely known pedals


High Prio:
- The behaviour of what happens when i select an product/option should be different depending on if it has additional configuration options (custom color/other options). When it has none we should automaticly see the next tab.

Mid Prio:
- auto save/load system
- naming system for own custom pedals
- new pedal button

- Devide user displayed name from internal name for all data

Low Prio:
- make the banana a little smaller (to 90% the current size)
- preconfiguration/prefab-system, where the user can select configurations that i have build before. they should be selectable through the url params/path so i can directly link from social media posts/ads to those prefabs
- on the start page we should have two choices: on the right i want a scrollable window with preconfigurations, and on the left a section to create a new one from scratch.

Lowest Prio:
write a documents for an agent to create the following:
- a database for persistent storage of all our data (instead of using json-files)
- scripts to scrape data from the web by searching for descriptions for the pedal, like the sound character, matching categories, its history and funny trivia. i want to be able to add pcbs and the information their suppliers deliever through scraping. additionaly it should also support import from text and pdf-files to scrape data from them. also their BOMs should be scraped as i want to either use Mouser’s BOM Tool for parts sourcing or another way to order them from other suppliers like tayda. i want the tool to be able to identify the standard position of potentiometers, switches, in-/outputs and leds from the build documents. some pcb suppliers might have standardized layouts that we could either scrape and maybe others might be in need of a manual way to add these to the database. the scraping tool should also make a list containing inspirations for how to call the pedals and also crazy, funny or nerdy looks i could go for when designing the enclosure.
- i would like a graphical user interface to visualize all my data. it should also help adding missing data.
- i want a way to visualize and edit prefabed enclosure layouts. i want a system that can automaticly point me to variations of my effect pedals with and without modifications, that have missing enclosure layouts, or not enough variations for the user to choose from
- I possibly might want a connection to another parts database / inventory managment system (like Inventree)
- As a way to save costs, a automated internet parts search would be great too
- im not sure if all this should be in a single repo or multiple repos or even a main github project with submodules would be the way to go?
- in the future i maybe want to migrate to another source control software like gitlab to use their CI/CD features and maybe automated scripts to update costs and most cost efficient suppliers
- i also want to have business tools to have a overview of current trends in pedal building and hyped up pedals, so that i can react to the market
- i want an ai assistant that helps me monitor and manage my business