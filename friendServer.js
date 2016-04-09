var friendServer,
	friendServerConnected = false,
	onlinePlayers = {},
	party = [];

StartConnection = function() {
    friendServer = new friendServerHelper();
    friendServer.friendsServerSocket.onopen = function() {
        if (!friendServerConnected){
            friendServer.send(JSON.stringify({
                type: "connection",
                message: " has connected.",
                guid: puid,
                player: pname,
                colour: color
            }));
            party = [];
            party.push(pname + ":" + puid + ":" + color);
            loadParty();
            console.log('Connected to Friend Server!');
            friendServerConnected = true;
        }
    };
    
    friendServer.friendsServerSocket.onerror = function() {
		console.log('Connection to Friend Server failed, retrying.');
        friendServerConnected = false;
        if(!friendServerConnected) {
    		setTimeout(StartConnection, 1000);
		}
    };
    
    friendServer.friendsServerSocket.onmessage = function(message) {
		try {
			var result = JSON.parse(JSON.stringify(eval('(' + message.data + ')')));
			switch (result.type) {
				case "disconnected":
					if ($.inArray(result.player + ":" + result.guid, party) != -1) {
											
						party = $.grep(party, function(value) {
						  return value != (result.player + ":" + result.guid);
						});

						for (var i = 0; i < party.length; i++) {
							friendServer.send(JSON.stringify({
								type: "updateparty",
								party: JSON.stringify(party),
								guid: party[i].split(':')[1]
							}));

							if (party[0].split(':')[1] == puid)
								continue;

							friendServer.send(JSON.stringify({
								type: "notification",
								message: result.player + " has left the party.",
								guid: party[i].split(':')[1]
							}));
						}

						console.log(result.player + ' has left your party.');
						loadParty();
					}
				break;

				case "pm":
 					console.log(result.player + ": " + result.message);
                break;

                case "partymessage":
                    console.log(result.player + ": " + result.message);
				break;

				case "partyinvite":

				break;

				case "gameinvite":

				break;

				case "acceptparty":
                    party.push(result.player + ":" + result.pguid + ":" + result.colour);
                    
                    for (var i = 0; i < party.length; i++) {
                        friendServer.send(JSON.stringify({
                            type: "updateparty",
                            party: JSON.stringify(party),
                            guid: party[i].split(':')[1]
                        }));
                        
                        if(party[i].split(':')[1] == puid || party[i].split(':')[1] == result.pguid)
                            continue;
                        
                        friendServer.send(JSON.stringify({
                            type: "notification",
                            message: result.player + " has joined the party.",
                            guid: party[i].split(':')[1]
                        }));
                    }
                    
                    loadParty();
				break;

				case "acceptgame":

				break;

				case "connect":
					console.log('connect ' + result.address + ' ' + result.password);
				break;

				case "notification":
					console.log(result.message);
				break;

				case "updateparty":
					party = JSON.parse(result.party);
					loadParty();
				break;

				case "updateplayers":
					onlinePlayers = JSON.parse(result.players).sort();
					//console.log(onlinePlayers);
                    loadOnline();
				break;

				default:
					console.log("Unhandled packet: " + result.type);
				break;
			}
		} catch (e) {
			console.log(e);
			console.log(message.data);
		}

		if (typeof friendServer.callback == 'function')
			friendServer.callback(message.data);
            friendServer.lastMessage = message.data;
    };
}

function partyInvite(accepted, guid) {
	console.log(guid);
	if (accepted) {
		friendServer.send(JSON.stringify({
            type: 'acceptparty',
            player: pname,
            guid: guid,
            pguid: puid,
            colour: color
		}));
	}
	console.log(accepted);
}

function gameInvite(accepted, guid) {
	if (accepted) {
		friendServer.send({
			type: 'acceptgame',
			player: pname,
			guid: puid
		});
	}
	console.log(accepted);
}

function sendPM(targetGuid, messageText){
    var response ={
        type:'pm', 
        player:pname, 
        senderguid:puid, 
        message:messageText, 
        guid:targetGuid
        }
    friendServer.send(JSON.stringify(response));
}

function inviteToParty(targetGuid){
    var response ={
        type:'partyinvite', 
        player:pname, 
        senderguid:puid, 
        guid:targetGuid
    }
    friendServer.send(JSON.stringify(response));
    showOnline();
}

friendServerHelper = function() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    this.friendsServerSocket = new WebSocket('ws://158.69.166.144:55555', 'friendServer');
    this.lastMessage = "";
    this.lastCommand = "";
    this.open = false;
	this.callback = {};
    this.send = function(command, cb) {
		this.callback = cb;
        this.friendsServerSocket.send(command);
        //console.log(command);
        this.lastCommand = command;
    }
}
