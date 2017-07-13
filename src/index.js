/**
 * Mystery Game skill by Alex Geoffrey
 * Created July 10th, 2017
 *
 * This skill adapted from Amazon's skill-sample-nodejs-decision-tree master branch on GitHub
 *
 * The skill has been altered significantly to implement a mystery game
 * The user must escape the house by investigating and interacting with rooms
 */

var Alexa = require('alexa-sdk');

var states = {
    STARTMODE: '_STARTMODE',                // Prompt the user to start or restart the game.
    ASKMODE: '_ASKMODE',                    // Alexa is asking user the questions.
    DESCRIPTIONMODE: '_DESCRIPTIONMODE'     // Alexa is describing the final choice and prompting to start again or quit
};


// All items the user can pick up in the game
var items =[
    // Key to unlock main entrance -> extracurricular hallway
    { "itemId": 0, "names": ["key", "main entrance key", "janitor key", "janitors key", "janitors keys", "keys"], 
      "description": "An old brass key you took from the janitor's closet. Definitely could come in handy!", "found": false, "useRoom": 3},
    // Flashlight to unlock extracurricular hall -> recess hallway
    { "itemId": 1, "names": ["flashlight", "light", "torch"], 
      "description": "Really lucky this thing has some juice left in it.", "found": false, "useRoom": 6},
    // Gas mask to unlock recess hall -> academic hallway
    { "itemId": 2, "names": ["gas mask", "hazmat mask", "mask", "poison mask", "face protection", "protection"], 
      "description": "Good for not breathing in toxins and steampunk garb.", "found": false, "useRoom": 9}
];

// All of the rooms that the user can enter in the game
var rooms = [{ "names": ["main hallway", "hallway", "main entrance", "entrance", "corridor", "main corridor"], "roomId": 0, "neighbors": [1,2,3], "unlockItemId": -1, "visited": true,
                "roomDesc": "Once a thriving institution for learning and growing has been depleted into an abandoned fortress of mystery and shame. On your left is the principal’s office, to your right is the nurse’s office. Ahead is the extracurricular hallway but it is locked.", 
                "interactables": [{ "itemName": "axe", "description": "There is an axe propped against the wall. There are glass shards surrounding it.", "take": true, "taken": false, "itemId": 0 },
                                  { "itemName": "photo", "description": "There is a framed photo of a family here. It looks like someone used the axe to smash out the part with the father in it.", "take": false },
                                  { "itemName": "suit of armor", "description": "A suit of armor greets you as you come in the door.", "take": false }
                ]}, // End Main Hallway room
              { "names": ["principal's office", "principals office", "principal's room", "principals room", "principals", "main office"], "roomId": 1, "neighbors": [1,2,3], "unlockItemId": -1, "visited": false,
                "roomDesc": "The Principal’s office is petrified in time, so much so that photos of kids and various diplomas still remain on display. The file cabinet next to the secretary’s desk, however, is unlocked. Not just unlocked, but the lock is broken.", 
                "interactables": [{ "names": ["files", "file cabinet", "cabinet", "files cabinet", "office file", "filing cabinet"], "take": false,
                                    "description": "Going inside for the files you realize Sterling’s file is missing. The faculty files are clearly intentionally disorganized." },
                                  { "names": ["hammer", "hammer tool", "tool"], "take": false,
                                    "description": "A hammer lays conspicuously on the floor next to the filing cabinet. Label on it says Kingstown High School." }
                ]}, // End Principle Office room
              { "names": ["nurse’s office", "nurses office", "nurse’s room", "nurses room", "nurses", "nurse room", "health center"], "roomId": 2, "neighbors": [1,2,3], "unlockItemId": -1, "visited": false,
                "roomDesc": "The nurse’s office is ransacked with medical equipment are strewn about. Your eye catches a pile of empty, translucent body bags lazily thrown in the corner next to a boarded up window. You maneuver about the room with one hand on the wall, in search of a light switch. You finally strike one and the room is what you expected; dilapidated. A janitor's closet lies ajar ahead, and the main hallway is behind you.", 
                "interactables": [{ "itemId": 0, "description": "There is an axe propped against the wall. There are glass shards surrounding it.", "take": true, "taken": false },
                                  { "itemId": 1, "description": "There is a framed photo of a family here. It looks like someone used the axe to smash out the part with the father in it.", "take": false },
                                  { "itemId": 2, "description": "A suit of armor greets you as you come in the door.", "take": false }
                ]}, // End Nurse room
              { "names": ["janitor's closet", "janitors closet", "closet", "sanitary closet", "custodian's closet", "custodians closet"], "roomId": 3, "neighbors": [1,2,3], "unlockItemId": -1, "visited": false,
                "roomDesc": "Once a thriving institution for learning and growing has been depleted into an abandoned fortress of mystery and shame. On your left is the principal’s office, to your right is the nurse’s office. Directly ahead of you is the main hallway but it is locked.", 
                "interactables": [{ "itemId": 0, "description": "There is an axe propped against the wall. There are glass shards surrounding it.", "take": true, "taken": false },
                                  { "itemId": 1, "description": "There is a framed photo of a family here. It looks like someone used the axe to smash out the part with the father in it.", "take": false },
                                  { "itemId": 2, "description": "A suit of armor greets you as you come in the door.", "take": false }
                ]}, // End Janitor Closet room
              { "names": ["main hallway", "hallway", "main entrance", "entrance", "corridor", "main corridor"], "roomId": 3, "neighbors": [1,2,3], "unlockItemId": 0, "visited": false,
                "roomDesc": "Once a thriving institution for learning and growing has been depleted into an abandoned fortress of mystery and shame. On your left is the principal’s office, to your right is the nurse’s office. Directly ahead of you is the main hallway but it is locked.", 
                "interactables": [{ "itemId": 0, "description": "There is an axe propped against the wall. There are glass shards surrounding it.", "take": true, "taken": false },
                                  { "itemId": 1, "description": "There is a framed photo of a family here. It looks like someone used the axe to smash out the part with the father in it.", "take": false },
                                  { "itemId": 2, "description": "A suit of armor greets you as you come in the door.", "take": false }
                ]}, // End Extracurricular Hallway room
];


// this is used for keep track of visted nodes when we test for loops in the tree
var curRoom = rooms[0];

// These are messages that Alexa says to the user during conversation

// This is the intial welcome message
var welcomeMsg = "Welcome to the Mystery Game! If you are unsure what to do in the game, just say help to hear a list of commands. Say start to begin!";

// this is the message that is repeated if Alexa does not hear/understand the reponse to the welcome message
var promptToStartMessage = "If you would like to start the mystery, say start. Otherwise say exit.";

// this message is played when the user desires to restart the game
var restartMsg = "Ok, we will restart the story.";

// this is the help message during the setup at the beginning of the game
var helpMessage = "To get a description of the room, say describe room. You can enter new rooms by saying enter and the name of the room. You can inspect items in the room by saying inspect and the items name. You can try to use an item by saying use and the name of the item.";

// Alexa didn't understand the intent during the game
var unhandledMsg = "I couldn't catch that. If you need a list of commands, say help."

// This is the goodbye message when the user has asked to quit the game
var goodbyeMessage = "Ok, see you next time!";

var speechNotFoundMessage = "Could not find speech for node";

var nodeNotFoundMessage = "In nodes array could not find node";

var descriptionNotFoundMessage = "Could not find description for node";

var loopsDetectedMessage = "A repeated path was detected on the node tree, please fix before continuing";

var utteranceTellMeMore = "tell me more";

var utterancePlayAgain = "play again";


// MYSTERY MESSAGES
var startMysteryMsg = "Your private investigation skills have been bought up by a wealthy businessman by the name of Scott Howard. He needs you to investigate the mysterious outbreak of a lethal virus at his son Sterling’s high school. You have been hired to determine the cause of the outbreak. You step into the main entrance to Kingstown High School. Once a thriving institution, the school now boasts dingy hallways littered with biohazard markers. On your left is the principal’s office, to your right is the nurse’s office. Directly ahead of you is the main hallway but it is locked shut. What would you like to do?";

var rptMysteryStart = "On your left is the principal’s office, to your right is the nurse’s office. Directly ahead of you is the main hallway but it is locked shut. Maybe you should look around a bit?";

var itemPickupMessage = "You picked up the ";

var noItemMessage = "There is no such item here.";

var noBackpackMessage = "If you would like to use an item, please specify an item in your backpack. To hear what's in your bag, say whats in my bag?";


// the first node that we will use
var APP_ID = "amzn1.ask.skill.2a42ee53-618f-4795-b5ed-0336250c007b";
// --------------- Handlers -----------------------


// Called when the session starts.
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandler, startGameHandlers, askQuestionHandlers, descriptionHandlers);
    alexa.execute();
};

// set state to start up and  welcome the user
var newSessionHandler = {
  'LaunchRequest': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', welcomeMsg, welcomeMsg);
  },'AMAZON.HelpIntent': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', helpMessage, helpMessage);
  },'Unhandled': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', promptToStartMessage, promptToStartMessage);
  }
};

// --------------- Functions that control the skill's behavior -----------------------

// Called at the start of the game, picks and asks first question for the user
var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    // User wants to start the mystery
    'StartMysteryIntent': function () {
        // set state to asking questions
        this.handler.state = states.ASKMODE;

        // start in first room
        curRoom = rooms[0];

        // Give story introduction
        this.emit(':ask', startMysteryMsg, rptMysteryStart);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'Unhandled': function () {
        this.emit(':ask', promptToStartMessage, promptToStartMessage);
    }
});


// user will have been asked a question when this intent is called. We want to look at their yes/no
// response and then ask another question. If we have asked more than the requested number of questions Alexa will
// make a choice, inform the user and then ask if they want to play again
var askQuestionHandlers = Alexa.CreateStateHandler(states.ASKMODE, {
    // User requests to pick up an item
    'PickUpIntent': function () {
        // Get name of item
        var itemName = this.event.request.intent.slots.item.value;
        // Get message for Alexa to read to player
        var msg = helper.inspectItem(itemName);
        this.emit(':ask', msg, msg);
    },
    'RepeatRoomDescription': function () {
        helper.repeatRoomDescription(this);
    },
    'EnterRoomIntent': function () {
        var roomName = this.event.request.intent.slots.roomName.value;
        helper.enterRoom(this, roomName);
    },
    'ExitRoomIntent' : function () {
        // If it is the main entrance, cannot leave
        if (curRoom.roomId == 0) {
            var msg = "You can't leave the building before you have explored all the rooms!";
            this.emit(':ask', msg, msg);
        } else {
            // Go to first listed neighbor of current room (always the preceding room)
            helper.enterRoom(this, rooms[curRoom.neighbors[0]].names[0]);
        }
    },
    'UseItemIntent' : function () {
        // Get requested item from backpack
        var itemName = this.event.request.intent.slots.item.value;
        var item = helper.getItem(itemName);
        if (item == null) {
            this.emit(':ask', noBackpackMessage, noBackpackMessage);
        } else {
            // Default message is the user doesn't have the item yet
            var msg = "You do not have any item called " + itemName;
            // If item is in player's bag
            if (item.found === true) {
                msg = "This item has no use here";

                for (var i = 0; i < curRoom.neighbors.length; i++) {

                    // Unlock neighboring room if it is unlocked by item
                    if (curRoom.neighbors[i] == item.useRoom) {
                        rooms[curRoom.neighbors[i]].visited = true;
                        msg = item.useDesc;
                        break;
                    }
                }
            } 
            this.emit(':ask', msg, msg);
        }
    },
    'CheckBagIntent': function () {
        var msg = "In your bag, you find:";
        var itemCount = 0;

        // Add item names to list if they have been found
        for (var i = 0; i < items.length; i++) {
            if (items[i].found === true) {
                msg = msg + " a " + items[i].names[0] + ",";
                itemCount++;
            }
        }
        // If user has no items, change message
        if (itemCount == 0) {
            msg = "You have no items in your bag yet";
        }

        this.emit(':ask', msg, msg);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpMessage, helpMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        // reset the game state to start mode
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMsg, welcomeMsg);
    },
    'Unhandled': function () {
        this.emit(':ask', unhandledMsg, unhandledMsg);
    }
});

// user has heard the final choice and has been asked if they want to hear the description or to play again
var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTIONMODE, {

    'YesIntent': function () {
        // Handle Yes intent.
        // reset the game state to start mode
        this.handler.state = states.STARTMODE;
        this.emit(':ask', startMysteryMsg, rptMysteryStart);
    },
    'NoIntent': function () {
        // Handle No intent.
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpMessage, helpMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        // reset the game state to start mode
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMsg, rptWelcome);
    },
    'DescriptionIntent': function () {
        //var reply = this.event.request.intent.slots.Description.value;
        //console.log('HEARD: ' + reply);
        helper.giveDescription(this);
      },

    'Unhandled': function () {
        this.emit(':ask', promptToStartMessage, promptToStartMessage);
    }
});

// --------------- Helper Functions  -----------------------

var helper = {

    // Return the room, else return null
    getRoom: function (roomName) {
        if (roomName == null) {
            return roomId;
        } 

        // See if name exists in name lists of adjoining rooms
        for (var i = 0; i < curRoom.neighbors.length; i++) {

            // Get neighbor
            var neighbor = rooms[curRoom.neighbors[i]];

            // If roomName is one of the names in the list, return that room
            for(var j = 0; j < neighbor.names.length; j++) {
                if (roomName == neighbor.names[j]) {
                    return neighbor;
                }
            }
        }
        return null; // Room not a neighbor
    },

    // Enters the next room the user wants to enter
    enterRoom: function (context, roomName) {

        var room = helper.getRoom(roomName);

        if (room != null) {
            // If room is locked and needs an item to open
            if (room.unlockItemId != -1 && room.visited === false) {
                // Room unlocked
                if (items[room.unlockItemId].found === true) {
                    // TODO: Print unlock message
                }
                // User doesn't have item to unlock
                else {
                    // TODO: Print locked message
                }
            }

            // Enter room and echo description
            room.visited = true;
            curRoom = room;
            context.emit(':ask', room.roomDesc, room.roomDesc);
            
        } 
        // User didn't provide a/valid room name
        else {
            helper.print("ROOM NOT FOUND!");
            var msg = "If you would like to enter a room, please say enter followed by the name of an adjoining room.";
            context.emit(':ask', msg, msg);
        }
    },

    // Repeats the description of the current room
    repeatRoomDescription: function (context) {
        context.emit(':ask', curRoom.roomDesc, curRoom.roomDesc);
    },

    // Returns the item searched for, or null if nothing was found
    getItem: function(itemName) {

        for (var i = 0; i < items.length; i++) {
            if (items[i].name == itemName) {
                return items[i];
            }
        }
        // Item not found
        return null;
    },

    // Finds item, picks up if available. Returns message read to player
    inspectItem: function (itemName) {

        for (var i = 0; i <= curRoom.interactables.length; i++) {

            // If itemName matches a names of the item, inspect it
            for (var j = 0; j <= curRoom.interactables[i].names.length; j++) {

                // Interactable found
                if (curRoom.interactables[i].names[j] == itemName) {

                    helper.print("i: " + i + ", IA name: " + curRoom.interactables[i].names[0] + ", req name: " + itemName);

                    // If interactable is a pickup item
                    if (curRoom.interactables[i].take === true) {

                        // Get item
                        var item = helper.getItem(curRoom.interactables[i].names[0]);

                        // Item doesn't exist
                        if (item == null) {
                            return noItemMessage;
                        }
                        // If item can be picked up, do so
                        else if (item.found === false) {
                            item.found = true;
                            return curRoom.interactables[i].description + "You put the " + item.names[0] + " in your backpack";
                        } 
                        // User has already picked up the item
                        else {
                            return "You have already picked up the " + itemName;
                        }
                    } 
                    // If interactable is just observation
                    else {
                        return curRoom.interactables[i].description;
                    }
                }
            }
        }
        // Default message if nothing is found
        return "If you would like to inspect something, you must also specify the name of an item in the room.";
    },

    print: function (text) {
        console.log("\n\n|>|>|> " + text + "\n\n");
    }
};


