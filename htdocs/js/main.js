var version = "0.7.0";
var title = "Burd IRC Beta";
var fileInput = {
    content: "",
    type: "",
    get: function(){
        
    },
    callback: function(){
        var model = new FormData();
        model.append('file', $('#file-input')[0].files[0]);

        $.ajax({
            url: 'https://i.burdirc.com/?upload=true',
            type: 'POST',
            dataType: 'json',
            data: model,
            processData: false,
            contentType: false,// not json
            complete: function (data) {
                $(".input-box").val(data.responseText).focus();
            }
        });
    }
}

var settings = {
    autocomplete: true,
    cmdautocomplete: true,
    timestamps: true,
    focusonjoin: true,
    logPackets: true,
    emojis: true,
    nickColors: true,
    textColors: true,
    scrollback: 100,
    timestring: "H:i:s",
    muted: false,
    banmask: "*!%i@%h",
    banreason: "Bye",
	theme: "default.css",
    highlights: ["testword123", "%n"],
    ignores: [
        {ignore: "test123", type: "string", date: 1584689622901},
        {ignore: "^duckz$", type: "regex", date: 1584689622901}
    ],
    sounds: {
        alert: ["state-change_confirm-down.ogg", true],
        newPM: ["hero_simple-celebration-03.ogg", true],
        notice: ["navigation_hover-tap.ogg", true],
        privmsg: ["navigation_forward-selection-minimal.ogg", true],
        highlight: ["notification_decorative-02.ogg", true]
    },
    usercommands: [
        ["action", "me &2"],
        ["banlist","mode %c b"],
        ["dialog","query %2"],
        ["exit","quit"],
        ["j","join #&2"],
        ["kill","kill %2 :&3"],
        ["leave","part &2"],
        ["m","msg &2"],
        ["omsg","msg @%c &2"],
        ["onotice","notice @%c &2"],
        ["servhelp","help"],
        ["sping","ping"],
        ["squery","squery %2 :&3"],
        ["umode","mode %n &2"],
        ["uptime","stats u"],
        ["ver","ctcp %2 version"],
        ["version","ctcp %2 version"],
        ["wallops","wallops :&2"],
        ["wi","whois %2"],
        ["wii","whois %2 %2"],
        ["p","part"],
        ["leave","part"],
        ["ns","msg nickserv"],
        ["c","clear"],
        ["ni","msg nickserv identify &2"]
    ],
    networks:[

    ]
};

if(localStorage.settings == undefined){
    localStorage.settings = JSON.stringify(settings);
	$("link#theme").attr("href", "themes/" + settings.theme);
}else{
	var ts = JSON.parse(localStorage.settings);
    for(var i in ts){
		settings[i] = ts[i];
	}
}

function processSettings(){
    $("link#theme").attr("href", "themes/" + settings.theme);
    $("div.items div.item-selected").click();
    if(settings.timestamps){
        $("style#nots").remove();
    }else{
        $("head").append('<style id="nots">div.channel-content div.message-date{ display:none; }</style>');
    }
}

var mouse = {x: "0", y: "0"};
var resizer = "";

var ignore = {
    addString: function(e){
        for(var i in settings.ignores){
            if(settings.ignores[i].ignore == e.toLowerCase()) return false;
        }
        settings.ignores.push({ignore: e.toLowerCase(), type: "string", date: Date.now()});
        return true;
    },
    addRegex: function(e){
        for(var i in settings.ignores){
            if(settings.ignores[i].ignore == e) return false;
        }
        settings.ignores.push({ignore: e, type: "regex", date: Date.now()});
        return true;
    },
	remove: function(e){
		if(e == "*"){
			settings.ignores = [];
			return true;
		}
        for(var i in settings.ignores){
            if(settings.ignores[i].ignore == e){
				settings.ignores.splice(i, 1);
				return true;
			}
        }
		return false;
	},
    test: function(e){
        for(var i in settings.ignores){
            if(settings.ignores[i].type == "regex"){
                var re = new RegExp(settings.ignores[i].ignore, "ig");
                if(re.test(e)) return true;
            }else{
                if(userAsRegex(settings.ignores[i].ignore).test(e)) return true;
            }
        }
        return false;
    }
}

var sounds = {
    play: function(e){
        if(settings.muted) return;
        for(var i in settings.sounds){
            if(i == e && settings.sounds[i][0] != "" && settings.sounds[i][1] == true){
                $("div#audio").html('<audio autoplay><source src="sounds/' + settings.sounds[i][0] + '" type="audio/ogg"></audio>');
                $("audio")[0].play();
            }
        }
    }
}

var overlay = {
    callback: false,
    args: {tab: "appearance"},
    show: function(e){
        $("div#overlay").fadeIn(100, function(){
            $("div#" + e.type ).fadeIn(100);
        });
        if(e.type == "dialog"){
            sounds.play("alert");
            var dv = $("div#" + e.type + " div.obox-content" );
            dv.html("");
            dv.append('<div class="dtitle" style="font-size:18px;margin-bottom:5px;">' + e.title + '</div>');
            dv.append('<div class="dmessage">' + e.text + '</div>');
            if(e.inputs){
                for(var i in e.inputs){
                    dv.append('<div class="dinput"><div class="inputtitle">' + e.inputs[i] + ':</div> <input type="text" name="' + e.inputs[i] + '"></div>');
                }
            }
            for(var i in e.buttons){
                dv.append('<div class="dlinks"><a href="input:callback">' + e.buttons[i] + '</a> &nbsp;</div>');
            }
        }
        this.callback = e.callback;
    },
    iframe: function(a,b){
        this.show({type: "loader"});
        this.args = b;
        if(a.indexOf(":")==-1){
            $("iframe#oiframe").attr("src", "iframes/" + a);
        }else{
            $("iframe#oiframe").attr("src", a);
        }
    },
    hide: function(){
        $("div#overlay,div.obox").hide();
        $("iframe#oiframe").attr("src", "about:blank");
    }
}

$(function(){
    
    $("body").on("mousemove", function(e){
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        switch(resizer){
            case "nav-pane":
                if(mouse.x > 10) $(":root").css("--nav-pane-width", (mouse.x+3) + "px");
                break;
            case "topic":
                if(mouse.y > 25) $(":root").css("--topic-bar-height", (mouse.y+3) + "px");
                break;
            case "users-list":
                if(mouse.y > 25) $(":root").css("--users-list-width", ($(window).width() - mouse.x) + "px");
                break;
        }
        if(mouse.x < 5 || mouse.y < 5) resizer = "";
    });
    $("div.sizer").on("mousedown", function(e){
        resizer = $(this).attr("for");
    }).on("mouseup", function(e){
        resizer = ""
    });
    $("body").on("mouseup", function(e){
        resizer = ""
    });
    $("window").on("mouseleave", function(e){
        resizer = ""
    });

    document.getElementById('file-input').addEventListener('change', readSingleFile, false);
    window.addEventListener("beforeunload", function(event) {
        localStorage.settings = JSON.stringify(settings);
        burd.controlServer.send('["CLOSED"]');
    });
    
    processSettings();
    
    burd.connectToControl();
    
});

function readSingleFile(e) {
    var file = e.target.files[0];
    if(file.size > 5e+6){
        overlay.show({type: "dialog", title: "Upload error", text: "The file is too large to upload", inputs: [], buttons: ["OK"], callback: function(e){}});
        return;
    }
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        fileInput.content = contents;
        var extension = file.name.split('.').pop().toLowerCase();
        fileInput.type = extension;
        fileInput.callback();
    };
    reader.readAsText(file);
}

function genID(){
    return 'xxxxxxxxxx'.replace(/x/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

$.expr[':'].icontains = function(a, i, m) {
  return jQuery(a).text().toUpperCase()
      .indexOf(m[3].toUpperCase()) >= 0;
};

var colors = {
    strip: function( e ) {
        e = e.replace( /\u0003[0-9][0-9]?(,[0-9][0-9]?)?|\u0003/ig, "" );
        e = e.replace( /\u0008|\u0002|\x1F|\x0F|\x11|\x1E/ig, "" );
        return e;
    },
    parse: function( e ) {
        if(typeof(e) == "string"){
            if(settings.textColors){
                e = this.parseColors( e );
                e = this.parseBold( e );
                e = this.parseItalic( e );
                e = this.parseUnderline( e );
                e = this.parseStrike( e );
                e = this.parseMonospace( e );
            }
            e = this.strip( e );
        }
        return e;
    },
    parseColors: function( e ) {
        /*  */
        var c = e.match( /\u0003[0-9][0-9]?(,[0-9][0-9]?)?/ig, "" );
        var newText = e;
        var colors = [ 
            "#FFFFFF","#000000","#000080",
            "#008000","#FF0000","#A52A2A",
            "#800080","#FFA500","#FFFF00",
            "#00FF00","#008080","#00FFFF",
            "#4169E1","#FF00FF","#808080",
            "#C0C0C0","transparent"
        ];
        
        if ( c == null ) return e; /* no colors, no need to go on */
        
        var nt = 0;
        
        for ( var i in c ) {
            /* now lets loop the matches */
            var BG = 16;
            var FG = 16;
            var m = c[i].substr( 1 ).split( "," );
            if ( m.length == 2 ) BG = parseInt( m[1] );
            FG = parseInt( m[0] );
            if ( FG > 16 || BG > 16 || BG < 0 || FG < 0 ) return this.strip( e );
            BG = colors[BG];
            FG = colors[FG];
            newText = newText.replace( c[i], '<span style="color:' + FG + ';text-shadow:none;background:' + BG + '">' );
            nt += 1;
        }
        
        newText = newText.replace( /\u0003/g, "</span>" );
        var tnt = newText.match( /<\/span>/g );
        if ( tnt != null ) nt = nt - tnt.length;
        
        if ( nt < 0 ) return this.strip( e );
        
        while ( nt > 0 ) {
            nt -= 1;
            newText += "</span>";
        }
        
        if ( nt != 0 ) return this.strip( e );
        
        tnt = newText.match( /<\/?span/g );
        
        nt = 0;
        
        for ( var i in tnt ) {
            if ( tnt[i] == "<span" ) nt += 1;
            if ( tnt[i] == "</span" ) {
                if ( nt < 1 ) return this.strip( e );
                nt = nt - 1;
            }
        }

        return newText;
    },
    parseBold: function( e ) {
        var c = e.match( /\u0002/g, "" );
        var nt = 0;
        for ( var i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\u0002/, '<span style="font-weight:bold;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\u0002/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseItalic: function( e ) {
        var c = e.match( /\x1D/g, "" );
        var nt = 0;
        for ( var i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x1D/, '<span style="font-style:italic;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\x1D/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseUnderline: function( e ) {
        var c = e.match( /\x1F/g, "" );
        var nt = 0;
        for ( var i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x1F/, '<span style="text-decoration:underline;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\x1F/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseStrike: function( e ) {
        var c = e.match( /\x1E/g, "" );
        var nt = 0;
        for ( var i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x1E/, '<span style="text-decoration: line-through;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\x1E/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseMonospace: function( e ) {
        var c = e.match( /\x11/g, "" );
        var nt = 0;
        for ( var i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x11/, '<span style="font-family: Courier, Monaco, \'Ubuntu Mono\', monospace;">' );
            } else {
                nt = 0;
                e = e.replace( /\x11/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    }
}


function showUserMenu(nick){
    var svr = burd.getServer(burd.lastServer);
    menu.show([
        {header: nick},
        {text: "-"},
        {text: "Send a PM", callback: function(){
            var chan = burd.getChannel(svr.id, nick, "pm");
            if(!chan){
                $("div.server[sid='" + svr.id + "'] div.items").append('<div class="nav-item" channel="'+ removeHtml(nick.toLowerCase()) +'" type="pm"><div class="item-name">' + removeHtml(nick) + '</div><div class="counter" num="0">0</div><div class="closer">&nbsp;</div></div>');
                svr.channels.push(
                    {
                        channel: nick,
                        type: "pm",
                        topic: "",
                        topicSetter: "",
                        users: [
                        ],
                        content: []
                    }
                );
            }
        }},
        {text: "Whois", callback: function(){
            burd.controlServer.send(JSON.stringify(
                [":" + svr.socket + " WHOIS " + nick]
            ));
        }},
        {text: "Ignore", callback: function(){
            overlay.iframe("newnetwork.html", {tab: ""});
        }},
        {text: "-"},
        {text: "CTCP", callback: function(){
            overlay.iframe("newnetwork.html", {tab: ""});
        }},
        {text: "-"},
        {text: "OP Actions", callback: function(){
            overlay.iframe("newnetwork.html", {tab: ""});
        }}
    ]);
}

function linkify(e) {
    // https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
    // http://, https://, ftp://
    var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;\(\)]*[a-z0-9-+&@#\/%=~_|\(\)]/gim;

    // www. sans http:// or https://
    var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

    // Email addresses
    var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

    return e
        .replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
        .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
        .replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
}

function formatAttr(e){
    e = e.replace(/\'/g, "&rdquo;");
    e = e.replace(/\"/g, '&rsquo;');
    e = e.replace(/\\/g, "&bsol;");
    return e;
}

function timeConverter(e){
    //https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
    var a = new Date(e);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + pad(hour) + ':' + pad(min) + ':' + pad(sec) ;
    return time;
    
    function pad(e){
        if(e < 10) e = "0" + e;
        return e;
    }
}

function userAsRegex( e ){
	var returnStr = "";
	for( var i in e ) {
		returnStr += e[i].replace( /[^a-zA-Z\d\s\*:]/, "\\" + e[i] );
	}
	returnStr = returnStr.replace( /\s/g, "\\s" );
	returnStr = returnStr.replace( /\*/g, "(.*)" );
	return new RegExp(returnStr, "ig");
}

function strToColor(str) {
  var hash = 0;
  str = str + str + str + str;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = hash.toString().replace(/\-/g, "");
  var colors = "ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEF";
  var cColor = "";
  for(var i in hash){
      cColor += colors[hash[i]];
  }
  return ("#" + cColor.substr(0,6));
}
function removeHtml(e){
	return e.replace(/\&/g, "&amp;").replace(/\</g, "&lt;");
}