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
    STARTMODE: '_STARTMODE',                // Prompt the user to start the game.
    ASKMODE: '_ASKMODE',                    // Alexa is asking user what they would like to do, describing rooms and interactions
    ACCUSEMODE: '_ACCUSEMODE'          // Alexa is asking user to accuse which person they think did it
};


// All items the user can pick up in the game
var items =[
    // Key to unlock main entrance -> extracurricular hallway
    { "itemId": 0, "names": ["keys", "key ring", "key", "janitors keys", "janitor's keys"], 
      "description": "An old brass key you took from the janitor's closet. Definitely could come in handy!", "found": false, "useRoom": 3},
    // Flashlight to unlock extracurricular hall -> recess hallway
    { "itemId": 1, "names": ["flashlight", "light", "torch"], 
      "description": "Really lucky this thing has some juice left in it.", "found": false, "useRoom": 6},
    // Gas mask to unlock recess hall -> academic hallway
    { "itemId": 2, "names": ["gas mask", "hazmat mask", "mask", "poison mask", "face protection", "protection"], 
      "description": "Good for not breathing in toxins and steampunk garb.", "found": false, "useRoom": 9},
    // Library card to unlock academic hall -> library
    { "itemId": 3, "names": ["library card", "library id", "card"], 
      "description": "The librarian’s library card.", "found": false, "useRoom": 12},
];

// All of the rooms that the user can enter in the game
var rooms = [{ "names": ["main hallway", "main entrance", "entrance", "corridor", "main corridor"], "roomId": 0, "neighbors": [1,2,4], "unlockItemId": -1, "visited": true,
                "roomDesc": "This hallway used to boast of an institution for learning and growing. It has since been depleted into an abandoned fortress of mystery and shame for the town.", 
                "interactables": []}, // End Main Hallway room
              { "names": ["principal's office", "principals office", "principal's room", "principals room", "principals", "main office"], "roomId": 1, "neighbors": [0], "unlockItemId": -1, "visited": false,
                "roomDesc": "The Principal’s office is petrified in time, so much so that photos of kids and various diplomas still remain on display. The file cabinet next to the secretary’s desk, however, is unlocked. Not just unlocked, but the lock is broken.", 
                "interactables": [{ "names": ["file cabinet", "files", "cabinet", "files cabinet", "office file", "filing cabinet"], "take": false,
                                    "description": "Going inside for the files you realize Sterling’s file is missing. The faculty files are clearly intentionally disorganized." },
                                  { "names": ["hammer", "hammer tool", "tool"], "take": false,
                                    "description": "A hammer lays conspicuously on the floor next to the filing cabinet. Label on it says Kingstown High School." }
                ]}, // End Principle Office room
              { "names": ["nurse’s room", "nurses office", "nersses office", "nurse’s office", "nurses room", "nurses", "nurse room", "health center"], "roomId": 2, "neighbors": [0,3], "unlockItemId": -1, "visited": false,
                "roomDesc": "The nurse’s room is ransacked with medical equipment all strewn about. Your eye catches a pile of empty translucent body bags lazily thrown in the corner next to a boarded up window. You maneuver about the room with one hand on the wall, in search of a light switch. You finally strike one and the room is what you expected; dilapidated.", 
                "interactables": [{ "names": ["medical equipment", "medical supplies", "medicine", "health supplies", "equipment"], "take": false,
                                    "description": "There are many pieces of medical equipment littered through the room. Towards the end of things, it looks like students might have raided the room for supplies." },
                                  { "names": ["note to janitor", "janitor note", "memo to janitor", "janitor memo", "note"], "take": false,
                                    "description": "A note to the janitor is pinned to the closet door: Please sanitize everything especially well now. The health of the students relies on your duties. Seems like the nurse kept close watch on the janitor." }
                ]}, // End Nurse room
              { "names": ["janitor's closet", "janitors closet", "closet", "sanitary closet", "custodian's closet", "custodians closet"], "roomId": 3, "neighbors": [2], "unlockItemId": -1, "visited": false,
                "roomDesc": "In this walk-in closet, you see various sanitary liquids, several mops, and some gardening equipment.", 
                "interactables": [{ "names": ["journal", "diary", "janitors journal", "janitors diary", "janitor notes", "notes"], "take": false,
                                    "description": "The janitor's journal is on a shelf in the closet. On the most recent page you read: Maybe everyone in this school wouldn't be so sick if the principal reported things sooner." },
                                  { "names": ["keys", "key ring", "key", "janitors keys", "janitor's keys"], "take": true, "itemId": 0,
                                    "description": "There are a ring of keys in the closet. They are labeled with all the rooms in the school. You put them in your pocket." }
                ]}, // End Janitor Closet room
              { "names": ["extra curricular hallway", "extra curricular corridor", "gym wing", "music wing"], "roomId": 4, "neighbors": [0,5,6,7], "unlockItemId": 0, "visited": false, 
                "lockMsg": "The rest of the building is locked. You expect there is a key lying around here somewhere.", "unlockMsg": "Looking at the key ring you decide to try the key that looks like it has been there the longest. It works and the door opens, if not unwillingly.",
                "roomDesc": "This hallway has all sorts of inspirational posters, from cats hanging on branches to shooting stars.", 
                "interactables": []}, // End Extracurricular Hallway room
              { "names": ["gym", "Jim", "June", "gymnasium", "school gym", "school gymnasium"], "roomId": 5, "neighbors": [4], "unlockItemId": -1, "visited": false,
                "roomDesc": "This wide gymnasium was a relief center for those who were deemed uninfected when the school was in quarantine. The emergency debris has since been abandoned after the healthy were allowed to leave.", 
                "interactables": [{ "names": ["supply boxes", "supply crates", "supplies", "supply equipment", "emergency supplies"], "take": false,
                                    "description": "These boxes now only contain wrappers of emergency rations and pill bottles." },
                                  { "names": ["gym roster", "Jim roster", "June roster", "roster", "roster sheet", "attendance", "attendance sheet", "gym attendance"], "take": false,
                                    "description": "On the gym roster many names are stricken out, and in the margins the gym teacher has written: If everyone I send to the nurse get’s sicker, is she doing her job right?" },
                                  { "names": ["flashlight", "light", "torch"], "take": true, "itemId": 1,
                                    "description": "Looks like someone left a flashlight here. You flick it on, and it still has some juice in it, even though it dimly flickers. You decide to take it with you." }
                ]}, // End Gym room
              { "names": ["music room", "music classroom", "music", "musician room", "musicians room", "musician's room"], "roomId": 6, "neighbors": [4], "unlockItemId": -1, "visited": false,
                "roomDesc": "Faded sheets of music slide across a filthy linoleum floor as you step into the quiet room. You imagine it was filled with much more noise before the quarantine.", 
                "interactables": [{ "names": ["note", "notice", "memo"], "take": false,
                                    "description": "There is a note on the music teacher's desk addressed to the gym teacher. It reads: please stop working the kids so hard. They come in tired and not ready to play. Looks like the music teacher had some beef with the gym coach." },
                                  { "names": ["piano", "grand piano", "baby grand piano", "keyboard"], "take": false,
                                    "description": "There is a piano in the room with a sanitizer bottle on top. Laminated by the bottle is a sign that reads: Please sanitize before and after playing. Thank you." }
                ]}, // End Music room
              { "names": ["recess hallway", "recess corridor", "recess wing", "cafeteria hallway", "teachers lounge hallway"], "roomId": 7, "neighbors": [4,8,9,10], "unlockItemId": 1, "visited": false, 
                "lockMsg": "The recess hallway is pitch black. You figure you should probably find a way to see before you start investigating down there.", "unlockMsg": "The dark recess corridor of the hallway now dimly reflects your flashlight’s beam.",
                "roomDesc": "In the light you bring to the room, you can just make out the adjascent rooms: the cafeteria and the teacher's lounge. Further ahead you see the academic hallway.", 
                "interactables": []}, // End Recess Hallway room
              { "names": ["cafeteria", "cafe", "lunch room", "lunch area", "lunchroom"], "roomId": 8, "neighbors": [7], "unlockItemId": -1, "visited": false,
                "roomDesc": "The cafeteria was almost immediately shut down when people were reported sick. At first, the local news reported a widespread foodborne illness due to the cafeteria’s food prep. However, once an investigation revealed the cause to be a lethal bacteria, the school went into quarantine. The cafeteria remains the same as the day it was closed, the odor of rotting food thick in the air. You have to stifle your gag reflex in order to inspect the room.", 
                "interactables": [{ "names": ["rotting food", "gross food", "food", "rotted food", "rotten food"], "take": false,
                                    "description": "The food before you has been there for months. You have never felt so repulsed." },
                                  { "names": ["lunch box", "lunch", "box", "lunch bag", "bag lunch"], "take": false,
                                    "description": "You see a lunch box sitting on the table where someone must have left it as soon as the cafeteria evacuation started. Inside is a note from someone’s mother. It reads: Be sure to wash your hands, sweetie. I’ve heard plenty of people at your school being sick after they come home from studying." }
                ]}, // End Cafeteria room
              { "names": ["teacher's lounge", "teachers lounge", "lounge", "teachers room"], "roomId": 9, "neighbors": [7], "unlockItemId": -1, "visited": false,
                "roomDesc": "The teacher’s lounge is plenty dirty, with boot prints and dust everywhere. But there’s not much in the room, besides a cup, gas mask and a biology textbook on the countertop.", 
                "interactables": [{ "names": ["cup", "teacup", "tea cup", "mug"], "take": false, 
                                    "description": "The cup just reads: World’s best librarian." },
                                  { "names": ["biology textbook", "bio book", "textbook", "biology book", "book"], "take": false,
                                    "description": "The book is both open to a page on bacteria. Of the parts that are highlighted, one stands out. It reads: This harmful variety of bacteria can be spread quickly if someone touches something with the bacteria on it. Once infected, the bacteria can easily spread from person to person in high density places such as coffee shops or schools." },
                                  { "names": ["gas mask", "gas", "mask"], "take": true, "itemId": 2,
                                    "description": "Someone left a gas mask in the teacher’s lounge. You decide it’s probably better you take it since your life is on the line just being in here." }
                ]}, // End Teacher's Lounge room 
              { "names": ["academic hallway", "academic corridor", "academic wing", "class hallway", "class corridor", "school hallway", "school corridor"], "roomId": 10, "neighbors": [7,11,12], "unlockItemId": 2, "visited": false, 
                "lockMsg": "You look down the dim hallway and see biohazard signs on every door. The biology room is in the Academic hallway so you must be safe to enter.", "unlockMsg":"You put the gas mask on and cautiously enter the hallway, your fate determined by the constitution of the mask.",
                "roomDesc": "Walking through the hallway you feel like you've come to the epicenter of the virus. You can see plastic draped all over the walls near a biology lab room. You also see the library up ahead, curiously neat amidst all the detritus.", 
                "interactables": []}, // End Academic Hallway room
              { "names": ["biology lab", "bio lab", "bio laboratory", "bio room", "biology lab", "lab", "laboratory", "science room", "science lab", "science laboratory"], "roomId": 11, "neighbors": [10], "unlockItemId": -1, "visited": false,
                "roomDesc": "This is the bio lab. It was featured in all newspapers as the cause of the outbreak. The room is plastered in all things quarantine: plastic, posters, some incineration equipment.", 
                "interactables": [{ "names": ["petri dish", "petri", "dish"], "take": false,
                                    "description": "There is a petri dish on the counter, but the top is off. You recognize the name of the strain on the label of the dish as the same from the book in the teacher's lounge." },
                                  { "names": ["library card", "library id", "card"], "take": true, "itemId": 3,
                                    "description": "You see a library card on the counter. It belongs to the librarian. You take it with you." },
                                  { "names": ["homework", "someone’s homework", "someones homework"], "take": false, 
                                    "description": "The student’s homework is on bacterial growth, but the student wrote a note saying they couldn’t complete their research because several of the bacteria books were already checked out." }
                ]}, // End Cafeteria room
              { "names": ["library", "librarians room", "book room"], "roomId": 12, "neighbors": [10, 13], "unlockItemId": 3, "visited": false,
                "lockMsg": "You pull the door handle, but it is locked. You notice a swipe entry for a library card", "unlockMsg": "You slide the library card through the swipe entry, and you hear a click behind the door. You pull it open and walk inside.",
                "roomDesc": "The Library is dark except for two exit signs on the near and far ends of the room. The librarian’s desk sits in the middle of the large room with the bookshelves centered around it like an orchestra conductor. Unlike most of the rooms in the building, the library is well kept and does not seem to have been visibly ransacked.", 
                "interactables": [{ "names": ["rental records", "records", "book rentals", "book records", "books"], "take": false,
                                    "description": "There is a drawer of records of books taken out and returned to the library. To your surprise, there is no record of a Biology textbook being rented." },
                                  { "names": ["garbage", "garbage can", "bin", "garbage bin", "trash", "trash can"], "take": true,
                                    "description": "In the garbage you find a completely empty bottle of hand sanitizer, medical gloves, and medical masks." }
                ]}, // End library room
              { "names": ["school exit", "exit", "exit door", "entrance", "school entrance", "library entrance", "outside"], "roomId": 13, "neighbors": [12], "unlockItemId": -1, "visited": false,
                "roomDesc": "You exit the building, and see Scott Howard standing outside by some police, with all the school staff outside. Scott Howell asks you if you've learned anything, and if you've found who was responsible for this mess. ", 
                "interactables": []} 
]; // End rooms and interactactables

// this is used for keep track of visted nodes when we test for loops in the tree
var curRoom = rooms[0];

// These are messages that Alexa says to the user during conversation //

// This is the intial welcome message
var welcomeMsg = "Welcome to the Mystery Game! If you are unsure what to do in the game, just say help to hear a list of commands. Say start to begin!";

// this is the message that is repeated if Alexa does not hear/understand the reponse to the welcome message
var promptToStartMessage = "If you would like to start the mystery, say start. Otherwise say exit.";

// this message is played when the user desires to restart the game
var restartMsg = "Ok, we will restart the story.";

// this is the help message during the setup at the beginning of the game
var helpMessage = "To get a description of the room, say describe room. You can enter new rooms by saying enter and the room name. You can inspect items in the room by saying inspect item name.";

// Alexa didn't understand the intent during the game
var unhandledMsg = "I couldn't catch that. If you need a list of commands, say help."

// This is the goodbye message when the user has asked to quit the game
var goodbyeMessage = "Ok, see you next time!";

// Help message when user is accusing who they think did it
var accuseHelpMsg = "It's time to use what you learned and accuse who you think did it. To accuse someone, say: accuse and then the person you think did it. To hear the names of the suspects, say list names.";


// MYSTERY MESSAGES
var startMysteryMsg = "Your private investigation skills have been bought up by a wealthy businessman by the name of Scott Howard. He needs you to investigate the mysterious outbreak of a lethal virus at his son Sterling’s high school. You have been hired to determine the cause of the outbreak. You step into the main entrance to Kingstown High School. Once a thriving institution, the school now boasts dingy hallways littered with biohazard markers. On your left is the principal’s office, to your right is the nurse’s office. Directly ahead of you is the main hallway but it is locked shut. What would you like to do?";

var rptMysteryStart = "On your left is the principal’s office, to your right is the nurse’s office. Directly ahead of you is the main hallway but it is locked shut. Maybe you should look around a bit?";

var itemPickupMessage = "You picked up the ";

var noItemMessage = "There is no such item here.";

var noBackpackMessage = "If you would like to use an item, please specify an item in your backpack. To hear what's in your bag, say whats in my bag?";

var suspectNames = "The names you can accuse are: the nurse, the principal, the janitor, the music teacher, the gym coach, the librarian, and the biology teacher.";

// the first node that we will use
var APP_ID = "amzn1.ask.skill.2a42ee53-618f-4795-b5ed-0336250c007b";
// --------------- Handlers -----------------------


// Called when the session starts.
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandler, startGameHandlers, askQuestionHandlers, accuseHandlers);
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

        // Reset all data in the game
        helper.resetGame();

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

        helper.print("Reported room name: " + roomName);

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
var accuseHandlers = Alexa.CreateStateHandler(states.ACCUSEMODE, {

    'AccuseIntent': function () {
        // Get name of accused and corresponding story text
        var accused = this.event.request.intent.slots.accused.value;
        helper.accuse(this, accused);
    },
    'SuspectNameIntent': function() {
        this.emit(':ask', suspectNames, suspectNames);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', accuseHelpMsg, accuseHelpMsg);
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
    'Unhandled': function () {
        this.emit(':ask', accuseHelpMsg, accuseHelpMsg);
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
        var msg = "If you would like to enter a room, please say enter followed by the name of an adjoining room.";

        if (room != null) {

            var lockRoom = false;

            // If room is locked and needs an item to open
            if (room.unlockItemId != -1 && room.visited === false) {

                lockRoom = true;

                // If user has item to unlock room, unlock it
                if (items[room.unlockItemId].found === true) {
                    room.visited = true;
                    curRoom = room;
                }
            } 

            // If room was locked
            if (lockRoom) {
                // If user just unlocked it
                if (room.visited) {
                    msg = room.unlockMsg + " " + curRoom.names[0] + ": " +room.roomDesc + helper.getAdjacentRooms() + helper.getInteractables();
                    context.emit(":ask", msg, msg);
                } 
                // If user did not have proper item to unlock room
                else {
                    context.emit(":ask", room.lockMsg, room.lockMsg);
                }
            } else {
                // Enter room and echo description
                room.visited = true;
                curRoom = room;

                msg = curRoom.names[0] + ": " + room.roomDesc + helper.getAdjacentRooms() + helper.getInteractables();

                if (room.names[0] == "school exit") {
                    context.handler.state = states.ACCUSEMODE;
                    msg = room.roomDesc + accuseHelpMsg;
                }

                context.emit(':ask', msg, msg);
            }
        } 
        // User didn't provide a/valid room name
        else {
            // helper.print("ROOM NOT FOUND!"); // DEBUG
            context.emit(':ask', msg, msg);
        }
    },

    // Enters the next room the user wants to enter
    accuse: function (context, accused) {
        var libNames = ["librarian", "book lady", "book keeper", "library staff", "library assistant"];
        var teacherNames = ["principal", "janitor", "custodian", "gym coach", "gym teacher", "musician", "music teacher", "nurse", "biology teacher", "bio teacher", "science teacher"]
        var correctAccuse = false;
        var isListedName = false;

        for (var i = 0; i < libNames.length; i++) {
            if (accused == libNames[i]) {
                correctAccuse = true;
                break;
            }
        }

        // If they did not guess the librarian
        if (!correctAccuse) {

            // See if their guess was valid
            for (var i = 0; i < teacherNames.length; i++) {
                if (accused == teacherNames[i]) {
                    isListedName = true;
                    break;
                }
            }
        }

        if (correctAccuse) {
            // Win scenario
            context.handler.state = states.STARTMODE;
            var msg = "You point your finger at the librarian who takes a step back. The police approach her, and she starts to run. She trips and falls, and is swiftly arrested by the police. Scott Howard congradulates you on a job well done. Thank you for playing!";
            context.emit(':tell', msg, msg);
        } else if (isListedName) {
            // Wrong choice scenario
            var msg = "You accuse the " + accused + " of foul play in the school. The crowd laughs, thinking you are making a joke. Scott Howard's brow comes down as he feels like he hired the wrong investigator for the job. Think hard and try accusing someone else.";
            context.emit(':ask', msg, msg);
        } else {
            var msg = "I'm sorry, " + accused + " is not a valid name to accuse. For the full list of names, please say list names";
            context.emit(':ask', msg, msg);
        }
    },

    // Repeats the description of the current room
    repeatRoomDescription: function (context) {
        var msg = curRoom.names[0] + ": " + curRoom.roomDesc + helper.getAdjacentRooms() + helper.getInteractables();
        context.emit(':ask', msg, msg);
    },

    // Returns string of all neighbor names
    getAdjacentRooms: function() {
        var roomNames = " The adjoining rooms are: ";
        var thisRoom = "";

        // Only one room
        if (curRoom.neighbors.length == 1) {
            return " The adjoining room is the " + rooms[curRoom.neighbors[0]].names[0] + ". ";
        }

        // Add all neighbor room names to string roomNames
        for (var i = 0; i < curRoom.neighbors.length; i++) {

            // Get neighbor room name
            thisRoom = rooms[curRoom.neighbors[i]].names[0];

            // Correct list grammar using "and" if the room is the last in the list
            if (i != curRoom.neighbors.length - 1) {
                roomNames = roomNames + " the " + thisRoom + ",";
            } else {
                roomNames = roomNames + " and the " + thisRoom + ". ";
            }
        }

        return roomNames;
    },

    // Returns string of all neighbor names
    getInteractables: function() {
        var itemNames = "You see the following items: ";

        // Return nothing if there are no items.
        if (curRoom.interactables.length == 0) {
            return "";
        }

        // Only one item
        if (curRoom.interactables.length == 1) {
            if (curRoom.interactables[0].take == true && items[curRoom.interactables[0].itemId] == false) {
                return "In the room you see the following item: " + curRoom.interactables[0].names[0] + ".";
            } else {
                return "";
            }
        }

        // Add all item names to string itemNames
        for (var i = 0; i < curRoom.interactables.length; i++) {

            // If not last room, add comma
            if (i != curRoom.interactables.length - 1) {
                itemNames = itemNames + curRoom.interactables[i].names[0] + ", ";
            } else {
                itemNames = itemNames + "and " + curRoom.interactables[i].names[0] + ".";
            }
        }

        return itemNames;
    },

    // Returns the item searched for, or null if nothing was found
    getItem: function(itemName) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].names[0] == itemName) {
                return items[i];
            }
        }
        // Item not found
        return null;
    },

    // Finds item, picks up if available. Returns message read to player
    inspectItem: function (itemName) {

        for (var i = 0; i < curRoom.interactables.length; i++) {

            // If itemName matches a names of the item, inspect it
            for (var j = 0; j < curRoom.interactables[i].names.length; j++) {

                // Interactable found
                if (curRoom.interactables[i].names[j] == itemName) {

                    // If interactable is a pickup item
                    if (curRoom.interactables[i].take === true) {

                        // Get item
                        var item = helper.getItem(curRoom.interactables[i].names[0]);

                        // Item doesn't exist
                        if (item == null) {
                            return noItemMessage;
                        }
                        // If item hasn't been picked up yet
                        else if (item.found === false) {
                            item.found = true;
                            return curRoom.interactables[i].description;
                        } 
                        // User has already picked up the item
                        else {
                            return "You have already picked up the " + itemName + ".";
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

    // Resets all data for a new game
    resetGame: function () {

        // Reset found items
        for (var i = 0; i < items.length; i++) {
            items[i].found = false;
        }

        // Reset all rooms
        for (var i = 0; i < rooms.length; i++) {
        
            // Unvisit all rooms
            rooms[i].visited = false;
            
            // Set all items to not taken
            for (var j = 0; j < rooms[i].interactables.length; j++) {
                if (rooms[i].interactables[j].take == true) {
                    rooms[i].interactables[j].taken = false;
                }
            }
        }
    },

    print: function (text) {
        console.log("\n\n|>|>|> " + text + "\n\n");
    }
};


