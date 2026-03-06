# Add following things to the roadmap, you can expand them a little and get inspired by user friendlyness

Highest Prio:

I want following changes regarding the color picker system:
- For Labeled Lettering i want more color options for the label/tape. theres an array of objects in the Labeled Lettering object in the design_labeling.json file which has named color / rgb pairs that should be selectable in the detail view card of the Labeled Lettering. It should look like the "🎨 Choose Bezel/Lens Color" and "💡 Choose LED Color" Section in some of the LED detail views. In the object data they should have the same name/rgb scheme as the ones for the labeled lettering.
We need a better name also (embroided tape/label tape) and a robust nameing strategy, to devide displayed name from internal name (we later need that also for others)

I have to kinds of color logic with "available_colors". for one, i there is a separated approach to the displayed color name and rgb color definition in design_labeling.json. Secondtly there are also simpler color definitions like in led.json. I would like both variants to work at the same time, so that when "available_colors" is just a simple string array, we use generic colors, but when its defined as in the example in design_labeling.json the concrete colors are used.

There are multiple places where those color pickers could be displayed (detail view car and summary at the end of the tabs/the configuration process)



- Devide user displayed name from internal name for all data

- The current configuration should be always visualized in a smaller visualizer window (with less functions in the minimalized view compared to final overview in the summary view, expanding the toolset only when maximizing the window)
- Active selection in layout editor
- Info about the selected element
- box select for layout editor
- shift for adding elements to selection
- when a group is selected the move functions should move the whole group
- The layout editor should have a align feature, when things are moved around it should check if theres something next or over/under it so that it aligns when a certain delta is reached. when a group is selected a align tool for horizontal / vertical alignment should be shown.

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
- The submit order button (data-section="submit-order-button") should be renamed to "Send Build Request"

Mid Prio:
- auto save/load system
- new pedal button
- naming system

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





Heho! Ich hab da mal ne Webseite zum individualisieren von Pedalen gebastelt. Würd mich mega freuen wenn du das mal ausprobieren magst.
Momentan funktionierts am besten auf nem Browser am Computer, Handy-Version ist noch nicht optimiert.
Gerne am Ende auch auf der letzten Seite nur zum Test auf "Submit Order" klicken, damit dass das dann auch bei mir ankommt und ich checken kann ob das richtig funktioniert.
Falls irgendwas unklar ist oder nicht wie erwartet funktioniert, würd ich mich über eine Rückmeldung freuen.
Gerne nehme ich auch Feedack an für Features die du dir sonst noch für sowas wünschen würdest.
Kannst da auch sehr gerne das Pedal was du dir gewünscht hast so konfigurieren wie du willst, dann weiß ich in welche Richtung das ganze gehen soll. Solltest du in dem Fall am Ende Name, eMail und eventuelle zusätzliche Anmerkungen eingeben, damit ich weiß dass das ein echter Wunsch ist, und nicht nur ein Test. 