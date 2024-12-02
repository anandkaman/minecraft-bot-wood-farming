# minecraft-bot-wood-farming

Minecraft Bot Automation
This code is a Minecraft bot script using the Mineflayer library. The bot performs automated tasks such as planting saplings, applying bone meal to grow them, and managing its inventory. The bot also has features to "sleep" (enter a rest state) and respond to chat commands.
Here is a breakdown of the key components and their functionality:
//npm install mineflaayer before going further
1. Bot Initialization
const bot = mineflayer.createBot({
    host: 'localhost',
    username: 'wood_farmer',
});
•	mineflayer.createBot: Creates a new bot instance connected to a Minecraft server (localhost in this case).
•	username: 'wood_farmer': The bot's in-game username.
________________________________________
2. Chat Command Handling
bot.on('chat', (username, message) => {
    if (username === bot.username) return; // Ignore messages from itself.
    const command = message.toLowerCase();
    switch (command) {
        case 'start': startPlantingAndBoneMealLoop(); break;
        case 'stop': stopPlantingAndBoneMealLoop(); break;
        case 'clear': clearInventory(); break;
        case 'sleep': goToSleep(); break;
        case 'wakeup': wakeup(); break;
        case 'exit': exitBot(); break;
        default: bot.chat("Unknown command."); //optional
    }
});
•	Responds to chat messages with commands:
o	start: Begin planting saplings and applying bone meal.
o	stop: Stop the planting loop gracefully.
o	clear: Clear the inventory (only when the loop isn’t running).
o	sleep: Make the bot find a bed and sleep.
o	wakeup: Wake the bot up and restart the planting loop.
o	exit: Disconnect the bot from the server and terminate the script.
o	Default: Replies with "Unknown command" for unrecognized inputs.
________________________________________
3. Core Loop: Planting and Using Bone Meal Start Planting Loop
async function startPlantingAndBoneMealLoop() {
    if (isRunning) return; // Prevent multiple loops.
    isRunning = true;

    for (let i = 0; i < 500; i++) { // Run up to 500 times.
        if (!isRunning) return; // Stop if the loop is terminated.

        await plantSapling();         // Plant a sapling.
        await applyBoneMealToSaplings(); // Use bone meal.

        if (i < 499) await delay(2000); // Wait 2 seconds between iterations.
    }

    isRunning = false; // Reset the loop flag.
}
•	plantSapling(): Searches for a sapling in the bot's inventory and plants it on nearby dirt/grass blocks.
•	applyBoneMealToSaplings(): Applies bone meal to nearby saplings to help them grow.
•	The loop runs 500 iterations by default, with a 2-second delay between cycles.
           Plant Saplings

async function plantSapling() {
    const sapling = bot.inventory.items().find(item => item.name.includes('sapling'));
    if (!sapling) return bot.chat("No sapling found in inventory.");

    const targetBlock = bot.findBlock({
        matching: block => block.name === 'dirt' || block.name === 'grass_block',
        maxDistance: 5,
    });

    if (!targetBlock) return bot.chat("No suitable block to plant the sapling nearby.");
    try {
        await bot.equip(sapling, 'hand');
        await bot.placeBlock(targetBlock, new Vec3(0, 1, 0)); // Place sapling on top of the target block.
    } catch (err) {
        bot.chat(`Failed to plant sapling: ${err.message}`);
    }
}
•	Finds a sapling in the inventory.
•	Locates a nearby block (dirt or grass) within 5 blocks to plant the sapling.
•	Plants the sapling and handles potential errors.
   
Apply Bone Meal
async function applyBoneMealToSaplings() {
    const boneMeal = bot.inventory.items().find(item => item.name === 'bone_meal');
    if (!boneMeal) return bot.chat("No bone meal found in inventory.");

    const saplings = bot.findBlocks({
        matching: block => block.name.includes('sapling'),
        maxDistance: 5,
        count: 50,
    });

    for (let i = 0; i < 2; i++) { // Apply bone meal up to 2 times.
  for (const saplingPos of saplings) {
            const saplingBlock = bot.blockAt(saplingPos);
            if (saplingBlock && saplingBlock.name.includes('sapling')) {
                try {
                    await bot.equip(boneMeal, 'hand'); // Equip bone meal
                    const startTime = Date.now(); // Track the start time
                    while (Date.now() - startTime < 5000) { // Keep "holding" for 5000ms
                        bot.activateBlock(saplingBlock); // Simulate a right-click
                        await delay(100); // Small delay to avoid spamming too fast
                    }
                    //console.log(`Used bone meal on sapling at ${saplingPos.x}, ${saplingPos.y}, ${saplingPos.z} for 5000ms.`); 
     } catch (err) {
                    console.log('Error while applying bone meal: ${err.message}');
                }
            }
        }
            await delay();
         }
Finds bone meal in the inventory and applies it to saplings nearby.
•	Tries up to 7 times to apply bone meal for each sapling.
________________________________________
4. Sleep and Wake
Sleep
javascript
Copy code
async function goToSleep() {
    const bed = bot.findBlock({
        matching: block => bot.isABed(block),
    });

    if (bed) {
        try {
            await bot.sleep(bed);
        } catch (err) {
            bot.chat(`Cannot sleep: ${err.message}`);
        }
    } else {
        bot.chat("No bed nearby.");
    }
}
•	Locates a nearby bed and makes the bot sleep.
Wake Up
async function wakeup() {
    try {
        await bot.wake();
        startPlantingAndBoneMealLoop(); // Automatically restart the planting loop.
    } catch (err) {
        bot.chat(`Cannot wake up: ${err.message}`);
    }
}
•	Wakes the bot from sleep and restarts the planting loop.
________________________________________
5. Inventory Management & Clear Inventory
async function clearInventory() {
    const items = bot.inventory.items();
    for (const item of items) {
        try {
            await bot.tossStack(item); // Drop each item in the inventory.
        } catch (err) {
            bot.chat(`Error while dropping ${item.name}: ${err.message}`);
        }
    }
}
•	Removes all items from the bot’s inventory by dropping them.
________________________________________
6. Exit Bot
async function exitBot() {
    if (isRunning) isRunning = false; // Stop the loop first.
    bot.quit(); // Disconnect the bot from the server.
    process.exit(0); // Terminate the Node.js process.
}
•	Gracefully exits the bot, ensuring the planting loop is stopped first.
________________________________________
7. Helper Function: Delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
•	A utility function to pause execution for a specified number of milliseconds.
________________________________________
8. Events
•	bot.on('spawn'): Welcomes the user when the bot spawns.
•	bot.on('sleep') and bot.on('wake'): Notifies when the bot enters or leaves sleep.
________________________________________

Here's a breakdown of the bot's functions triggered by each command:
1. start
•	Description: Starts the main loop to plant saplings and apply bone meal.
•	Function: 
•	startPlantingAndBoneMealLoop()
•	Key Actions: 
o	Repeatedly plants saplings on nearby dirt/grass blocks.
o	Applies bone meal to nearby saplings up to 7 times.
________________________________________
2. stop
•	Description: Stops the planting and bone meal loop gracefully.
•	Function: 
•	stopPlantingAndBoneMealLoop()
•	Key Actions: 
o	Sets a flag to terminate the loop after the current iteration completes.


3. clear
•	Description: Clears the bot's inventory by dropping all items.
•	Function: 
•	clearInventory()
•	Key Actions: 
o	Iterates through all inventory items.
o	Drops each item unless the loop is currently running.
________________________________________
4. sleep
•	Description: Puts the bot to sleep using a nearby bed.
•	Function: 
•	goToSleep()
•	Key Actions: 
o	Searches for a bed in the bot's vicinity.
o	Makes the bot sleep if a bed is found.
o	Stops the loop gracefully if it is running.
________________________________________
5. wakeup
•	Description: Wakes up the bot and resumes the planting loop.
•	Function: 
•	wakeup()
•	Key Actions: 
o	Wakes the bot from sleep.
o	Automatically restarts the planting and bone meal loop.


6. exit
•	Description: Stops the bot and disconnects it from the server.
•	Function: 
•	exitBot()
•	Key Actions: 
o	Stops the planting loop if it is running.
o	Disconnects the bot and terminates the script.
________________________________________
Default (Unrecognized Command)
•	Description: Responds to unrecognized commands.
•	Action: 
•	bot.chat("Unknown command.")
________________________________________
Summary of Command-to-Function Mapping
Command	Function	Purpose
start	startPlantingAndBoneMealLoop	Begins planting and bone meal loop.
stop	stopPlantingAndBoneMealLoop	Stops the loop gracefully.
clear	clearInventory	Drops all inventory items.
sleep	goToSleep	Makes the bot sleep.
wakeup	wakeup	Wakes up the bot and restarts the loop.
exit	exitBot	Disconnects the bot and terminates the script.
(Other)	bot.chat("Unknown command.")	Responds to unrecognized commands.
Conclusion
This script provides a well-rounded automation tool for planting saplings, applying bone meal, managing inventory, and responding to player commands in a Minecraft server. It uses asynchronous functions for smooth task execution and handles edge cases like missing items or blocks gracefully.


