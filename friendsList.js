var friendButton = '<div onClick="'+'addFriend(JSON.stringify({\'name\':$(this).parent().parent().attr(\'data-name\'), \'guid\' : $(this).parent().parent().attr(\'data-pid\'), \'id\' : null, \'colour\' : $(this).parent().parent().attr(\'data-color\'), \'rank\' : \'none\'}));'+'">Friend</div>'
var unfriendButton = '<div onClick="'+'removeFriend(JSON.stringify({\'name\':$(this).parent().parent().attr(\'data-name\'), \'guid\' : $(this).parent().parent().attr(\'data-pid\'), \'id\' : null, \'colour\' : $(this).parent().parent().attr(\'data-color\'), \'rank\' : $(this).parent().parent().attr(\'data-rank\')}));'+
'">Unfriend</div>'
var partyButton = '<div onClick="'+
'console.log(\'party:\'+$(this).parent().parent().attr(\'data-name\')+\':\'+$(this).parent().parent().attr(\'data-pid\')+\':\'+$(this).parent().parent().attr(\'data-color\'));'+
'">Party</div>'
var kickButton = '<div onClick="'+
'console.log(\'kick:\'+$(this).parent().parent().attr(\'data-name\')+\':\'+$(this).parent().parent().attr(\'data-pid\')+\':\'+$(this).parent().parent().attr(\'data-color\'));'+
'">Kick</div>'
var pmButton = '<div onClick="'+
'console.log(\'pm:\'+$(this).parent().parent().attr(\'data-name\')+\':\'+$(this).parent().parent().attr(\'data-pid\')+\':\'+$(this).parent().parent().attr(\'data-color\'));'+
'">PM</div>'

var friends = [];
var loadedSettings = false;

$(document).ready(function() {
    loadSettings(0);  
    $(window).keypress(function(e) {
        var key = e.which;
        if (key == 121){
            windowShow();
        } 
    }); 
    $('#tabs a').click(function(e) {
        $('#window').children().hide()
        $(e.toElement.hash).show('blind', 400);
    });
    $('#searchbox').on('input', function() {
        $('#activePlayers div').hide()
            .filter(':contains(' + $(this).val()  + ')')
            .show();
    });
    if(typeof(Storage) !== "undefined") {
        if(localStorage.getItem("friends") !== null){
            friends = JSON.parse(localStorage.getItem("friends"));
            loadFriends();
        }      
    }
});

dew.on("show", function (event) {
    windowShow();
});

var settingsToLoad = [['pname', 'player.name'], ['puid', 'player.printUID'], ['colour', 'player.colors.primary']];
function loadSettings(i){
	if (i != settingsToLoad.length) {
		dew.command(settingsToLoad[i][1], {}).then(function(response) {
			if(settingsToLoad[i][0] == "puid"){
				window[settingsToLoad[i][0]] = response.split(' ')[2];
			} else {
				window[settingsToLoad[i][0]] = response;
			}
			i++;
			loadSettings(i);
		});
	} else {
		loadedSettings = true;
        if(!friendServerConnected) {
            setTimeout(StartConnection, 2000);
        }
	}
}

function friendServerConnectTrigger(){
    player = {
        name: pname,
        guid: puid,
        id: null,
        colour: colour,
        rank: 0
    };

    friendServer.send(JSON.stringify({
        type: "connection",
        message: " has connected.",
        player: player
    }));

    party = [];
    party.push(player);
    loadParty();
    
    StartMatchmakingConnection();    
}

function alphabetize(what){
    var listitems = $(what).children('div').get();
    listitems.sort(function(a, b) {
       return $(a).text().localeCompare($(b).text());
    });
    $.each(listitems, function(index, item) {
       $(what).append(item); 
    });
}

function windowShow(){
    dew.captureInput(true);
    $('#window').children().hide()
    $('#friendlist').show();
    $('#window').show('slide', {direction: 'right'}, 1000);   
}

function windowHide(){
    dew.captureInput(false);
    $('#window').hide('slide', {direction: 'right'}, 1000, dew.hide);
}

function onlineControls(){
    $( "#activePlayers .online" ).mouseenter(function() {
        $(this).prepend('<div class="controls">' + friendButton + partyButton + pmButton + '</div>');
    });
    $( ".friend" ).mouseleave(function() {
        $('.controls', this).remove();
    });
}

function partyControls(){
    $( "#party .online" ).mouseenter(function() {
        $(this).prepend('<div class="controls">' + friendButton + kickButton + pmButton + '</div>');
    });
    $( ".friend" ).mouseleave(function() {
        $('.controls', this).remove();
    });
}

function friendControls(){
    $( "#friendlist .online" ).mouseenter(function() {
        $(this).prepend('<div class="controls">' + unfriendButton + partyButton + pmButton + '</div>');
    });
    $( "#friendlist .friend" ).not('.online').mouseenter(function() {
        $(this).prepend('<div class="controls">' + unfriendButton + '</div>');
    });
    $( ".friend" ).mouseleave(function() {
        $('.controls', this).remove();
    });   
}

function updateFriends() {
	$('#activePlayers').empty();
	if(onlinePlayers.length > 0) {
		for(var i=0; i < onlinePlayers.length; i++) {
            if($.inArray(onlinePlayers[i], party) == -1){
                addPlayer("activePlayers",{
                    name: onlinePlayers[i].name,
                    guid: onlinePlayers[i].guid,
                    colour: onlinePlayers[i].colour,
                    rank: onlinePlayers[i].rank
                }, null);                
            }
		}
	}
    alphabetize('#activePlayers');
    onlineControls();
    loadFriends();
}

function loadParty() {
	$('#party').empty();
	if(party.length > 0) {
		for(var i=0; i < party.length; i++) {
            var classString = "friend online";
            if (i==0){
                classString += " leader";
            }
            addPlayer("party",{
                name: party[i].name,
                guid: party[i].guid,
                colour: party[i].colour,
                rank: party[i].rank
            }, null, 1, classString);
		}
	} else {
		$('#party').append("<div class='nofriends'>You're not partying :(</div>");
	}
    alphabetize('#party');
    $('#party').prepend( $('#party .leader') );       
    partyControls();
}

function loadFriends() {
	$('#friendlist').empty();
	if(friends.length > 0) {
		for(var i=0; i < friends.length; i++) {
            var result = JSON.parse(friends[i]);
            var classString = "friend";
            var friendSearch = getObjects(onlinePlayers,"guid",result.guid)[0];
            if (friendSearch){
                classString += " online";
                if(friendSearch.name != result.name || friendSearch.colour != result.colour || friendSearch.rank != result.rank){
                    friends.splice(i, 1);
                    addFriend(JSON.stringify(
                    {   'name'  : friendSearch.name,
                        'guid'  : friendSearch.guid,
                        'id'    : null, 
                        'colour' : friendSearch.colour,
                        'rank' :  friendSearch.rank
                    }));
                    localStorage.setItem("friends", JSON.stringify(friends));
                }
            }
            addPlayer("friendlist",{
                name: result.name,
                guid: result.guid,
                colour: result.colour,
                rank: result.rank
            }, null, 1, classString);
		}
	} else {
		$('#friendlist').append("<div class='nofriends'>You've got no friends :(</div>");
	}
    alphabetize('#friendlist');
    $('#friendlist').prepend( $('#friendlist .online') );  
    friendControls();
}

function addFriend(friendString){
    friends.push(friendString);
    loadFriends();
    localStorage.setItem("friends", JSON.stringify(friends));
}

function removeFriend(friendString){
    var index = friends.indexOf(friendString);
    if (index > -1) {
        friends.splice(index, 1);
    }
    loadFriends();
    localStorage.setItem("friends", JSON.stringify(friends));
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

function addPlayer(id, player, isDev, opacity, classString) {
    if(!classString){
        classString = "friend online";
    }
    if(!opacity){
        opacity = 1;
    }
	$('<div>', {
        css: {
            backgroundColor: hexToRgb(player.colour, opacity)
        },
        class: classString,
        'data-color': player.colour,
        'data-pid': player.guid,
        'data-name': player.name,
        'data-rank': player.rank,
        text: player.name
	}).appendTo('#'+id);
}

function hexToRgb(hex, opacity) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return "rgba(" + parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) + "," + opacity + ")";
}

//So I don't have to remove functions from newer friends.js/matchmaking.js
(function (factory) {
    factory(jQuery);
}
(function( $ ){
    $.snackbar = function(options) {
        console.log(options.content);
    };
}));
var Audio = {notification:{currentTime:null}};
Audio.notification.play = function(){}

var dewRcon = {};
dewRcon.send = function(command, callback){
    if(command == "player.name"){ //ghetto friendServer connection trigger
        friendServerConnectTrigger();
    }
}