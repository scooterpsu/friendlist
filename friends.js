var friendButton = '<div onClick="'+
'addFriend($(this).parent().parent().attr(\'data-name\')+\':\'+$(this).parent().parent().attr(\'data-pid\')+\':\'+$(this).parent().parent().attr(\'data-color\'));'+
'">Friend</div>'
var unfriendButton = '<div onClick="'+
'removeFriend($(this).parent().parent().attr(\'data-name\')+\':\'+$(this).parent().parent().attr(\'data-pid\')+\':\'+$(this).parent().parent().attr(\'data-color\'));'+
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
    loadFriends();
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

var settingsToLoad = [['pname', 'player.name'], ['puid', 'player.printUID'], ['color', 'player.colors.primary']];
function loadSettings(i){
	if (i != settingsToLoad.length) {
		dew.command(settingsToLoad[i][1], {}).then(function(response) {
			if(settingsToLoad[i][1].contains("printUID")){
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

String.prototype.contains = function(it) {
	return this.indexOf(it) != -1;
};

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

function loadOnline() {
	$('#activePlayers').empty();
	if(onlinePlayers.length > 0) {
		for(var i=0; i < onlinePlayers.length; i++) {
            if($.inArray(onlinePlayers[i], party) == -1){
                if (onlinePlayers[i].split(":")[1] != "not" && onlinePlayers[i].split(":")[0].length > 0 && onlinePlayers[i].split(":")[1].length > 0){
                    $('<div/>', {
                        style: 'background-color:'+onlinePlayers[i].split(":")[2],
                        class: 'friend online',
                        'data-color': onlinePlayers[i].split(":")[2],
                        'data-pid': onlinePlayers[i].split(":")[1],
                        'data-name': onlinePlayers[i].split(":")[0],                        
                        text: onlinePlayers[i].split(":")[0]
                    }).appendTo('#activePlayers');
                }
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
            $('<div/>', {
                style: 'background-color:'+party[i].split(":")[2],
                class: classString,
                'data-color': party[i].split(":")[2],
                'data-pid': party[i].split(":")[1],
                'data-name': party[i].split(":")[0],
                text: party[i].split(":")[0]
            }).appendTo('#party');
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
            var classString = "friend";
            if($.inArray(friends[i], onlinePlayers) > -1){
                classString += " online";
            }
            $('<div/>', {
                style: 'background-color:'+friends[i].split(":")[2],
                class: classString,
                'data-color': friends[i].split(":")[2],
                'data-pid': friends[i].split(":")[1],
                'data-name': friends[i].split(":")[0],
                text: friends[i].split(":")[0]
            }).appendTo('#friendlist');
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