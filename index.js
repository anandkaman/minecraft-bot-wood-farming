const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
    host: 'localhost',
    username: 'wood_farmer',
});

let isRunning = false; // Flag to control the start and stop of the loop
let shouldSleep = false; // Flag to determine if the bot should sleep after the current loop

bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const command = message.toLowerCase();
    switch (command) {
        case 'start':
            startPlantingAndBoneMealLoop();
            break;
        case 'stop':
            stopPlantingAndBoneMealLoop();
            break;
        case 'clear':
            if (!isRunning) {
                clearInventory();
            } else {
                bot.chat("Cannot clear inventory while the loop is running. Use 'stop' first.");
            }
            break;
        case 'sleep':
            if (isRunning) {
                shouldSleep = true; // Mark to sleep after the current loop
                isRunning = false; // Stop the loop gracefully
                console.log("Sleep command issued. Will sleep after completing the current loop.");
            } else {
                goToSleep(); // If bot is not running, go to sleep immediately
            }
            break;
        case 'wakeup':
            wakeup();
            break;
        case 'exit':
            exitBot();
            break;
        default:
            bot.chat("");
    }
});

bot.on('sleep', () => {
    bot.chat("Bot is sleeping.");
});

bot.on('wake', () => {
    console.log("Bot woke up and is starting the planting and bone meal loop...");
    startPlantingAndBoneMealLoop(); // Start the loop immediately after waking up
});

// Main Loop Function
async function startPlantingAndBoneMealLoop() {
    if (isRunning) {
        console.log("The loop is already running.");
        return;
    }

    isRunning = true; // Set the flag to true to start the loop

    for (let i = 0; i < 500; i++) {
        if (!isRunning) {
            console.log("Planting loop stopped.");
            if (shouldSleep) {
                await goToSleep(); // Transition to sleep after completing the loop
            }
            return; // Exit the loop if the flag is set to false
        }

        await plantSapling();         // Plant sapling first
        await applyBoneMealToSaplings(); // Apply bone meal 7 times at intervals of 3 seconds

        if (i < 499 && isRunning) {  // Wait for 3 seconds before starting the next iteration
            await delay(2000);
        }
    }

    isRunning = false; // Reset the flag after the loop completes
}

// Planting Function
async function plantSapling() {
    const sapling = bot.inventory.items().find(item => item.name.includes('sapling'));
    if (!sapling) {
        bot.chat("No sapling found in inventory.");
        return;
    }

    const targetBlock = bot.findBlock({
        matching: block => block.name === 'dirt' || block.name === 'grass_block',
        maxDistance: 5,
    });

    if (!targetBlock) {
        bot.chat("No suitable block to plant the sapling nearby.");
        return;
    }

    try {
        await bot.equip(sapling, 'hand');
        await bot.placeBlock(targetBlock, new Vec3(0, 1, 0));
       // console.log("Sapling planted!");
    } catch (err) {
        console.log(`Failed to plant sapling: ${err.message}`);
    }
}

// Bone Meal Function
async function applyBoneMealToSaplings() {
    const boneMeal = bot.inventory.items().find(item => item.name === 'bone_meal');
    if (!boneMeal) {
        bot.chat("No bone meal found in inventory.");
        return;
    }

    const saplings = bot.findBlocks({
        matching: block => block.name.includes('sapling'),
        maxDistance: 5,
        count: 50,
    });

    if (saplings.length === 0) {
        console.log("No saplings found nearby.");
        return;
    }

    for (let i = 0; i < 2; i++) {
        for (const saplingPos of saplings) {
            const saplingBlock = bot.blockAt(saplingPos);
            if (saplingBlock && saplingBlock.name.includes('sapling')) {
                try {
                    await bot.equip(boneMeal, 'hand'); // Equip bone meal
                    const startTime = Date.now(); // Track the start time
                    while (Date.now() - startTime < 2000) { // Keep "holding" for 5000ms
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

    const sapling = bot.inventory.items().find(item => item.name.includes('sapling'));
    if (sapling) {
        try {
            await bot.equip(sapling, 'hand');
        } catch (err) {
            bot.chat(`Failed to equip sapling: ${err.message}`);
        }
    }
}

// Sleep Function
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

// Wakeup Function
async function wakeup() {
    try {
        await bot.wake(); // Wake the bot up
        console.log("Bot woke up and is ready to work!");

        // Immediately start the planting and bone meal loop after waking up
        startPlantingAndBoneMealLoop();
    } catch (err) {
        bot.chat(`Cannot wake up: ${err.message}`);
    }
}

// Stop Function
function stopPlantingAndBoneMealLoop() {
    if (isRunning) {
        bot.chat("Stopping after current bone meal loop completes.");
        isRunning = false; // Set the flag to false to stop the loop gracefully
    } else {
        bot.chat("No active loop to stop.");
    }
}

// Clear Inventory Function
async function clearInventory() {
    const items = bot.inventory.items();
    if (items.length === 0) {
        bot.chat("Inventory is already empty.");
        return;
    }

    for (const item of items) {
        try {
            await bot.tossStack(item);
            bot.chat(`Dropped ${item.count} ${item.name}(s)`);
        } catch (err) {
            bot.chat(`Error while dropping ${item.name}: ${err.message}`);
        }
    }
}

// Exit Bot Function
async function exitBot() {
    bot.chat("Exit command received. Completing the current bone meal loop before exiting...");

    // If the loop is running, stop it gracefully
    if (isRunning) {
        isRunning = false; // Stop the loop
        
        // Wait for the current bone meal cycle to finish before exiting
        while (isRunning) {
            await delay(7000); // Poll until the loop has completed
        }
    }

    bot.chat("Bot is going offline...");
    bot.quit(); // Disconnect the bot from the server

    // Ensure that the process terminates after the bot quits
    process.exit(0); // Exit the Node.js process
}

// Helper function for delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

bot.on('spawn', () => {
    bot.chat("Bot has spawned and is ready for commands! start, stop, clear, sleep, wakeup, exit");
});
