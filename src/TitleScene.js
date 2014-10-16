var audioEngine = cc.AudioEngine.getInstance();

var MainLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
        var size = cc.winSize;
        this.CX = size.width / 2;
        this.CY = size.height / 2;

        //背景
        this.sprite = new cc.Sprite(res.title_bg_png);
        this.sprite.attr({ x: this.CX, y: this.CY });
        this.addChild(this.sprite, 0);

        //Easyボタン
        var start0 = new cc.MenuItemImage( res.start_easy_png, res.start_easy_png, this.onStart, this);
        start0.attr({ x: this.CX, y: this.CY, tag: 0 });
        start0.getSelectedImage().color = cc.color(255, 180, 180);

        //Normalボタン
        var start1 = new cc.MenuItemImage( res.start_normal_png, res.start_normal_png, this.onStart, this);
        start1.attr({ x: this.CX, y: this.CY-100, tag: 1 });
        start1.getSelectedImage().color = cc.color(255, 180, 180);

        //Hardボタン
        var start2 = new cc.MenuItemImage( res.start_hard_png, res.start_hard_png, this.onStart, this);
        start2.attr({ x: this.CX, y: this.CY-200, tag: 2 });
        start2.getSelectedImage().color = cc.color(255, 180, 180);

        var menu = new cc.Menu(start0, start1, start2);
        menu.setPosition(0, 0);
        this.addChild(menu, 1);
        
        //BGMを開始。
        audioEngine.playMusic(res.bgm_title_mp3, true);
        
        //ピースのアニメーションを開始。
        this.animatePieces();
        
        return true;
    },
    
    onStart: function(e){
    	var level = e.tag-0;
    	var options = {
    			level:level, 
    			rows: level+3, 
    			cols: level+3, 
    			shuffleCount: (level+1) * 30,
    			timeLimit: 60
    	};
    	cc.log("options=", JSON.stringify(options));

    	var scene = new GameScene(options);
    	cc.director.replaceScene(scene);
    },
    
    animatePieces: function(){
    	var pos = [{x: this.CX-256, y: this.CY+348}, {x: this.CX+180, y: this.CY+348}
    			 , {x: this.CX+180, y: this.CY+128}, {x: this.CX-256, y: this.CY+128}];
    	var delay = 1.072, piece, SCALE = 0.4;

    	for (var i = 0; i < 3; i++){
    		piece = new cc.Sprite(res.mikan_png);
    		piece.setScale(SCALE);
    		piece.setContentSize(piece.width * SCALE, piece.height * SCALE);
    		piece.setAnchorPoint(0.5, 0.5);
    		piece.attr({x: pos[i].x, y: pos[i].y });
    		this.addChild(piece, 1);
    		
    		piece.runAction(
					cc.sequence(
							cc.delayTime(delay * (2-i)),
							cc.moveTo(delay, pos[(i+1) % 4].x, pos[(i+1) % 4].y).easing(cc.easeQuadraticActionOut()),
							cc.delayTime(delay * 2),
							cc.moveTo(delay, pos[(i+2) % 4].x, pos[(i+2) % 4].y).easing(cc.easeCubicActionOut()),
							cc.delayTime(delay * 2),
							cc.moveTo(delay, pos[(i+3) % 4].x, pos[(i+3) % 4].y).easing(cc.easeCubicActionOut()),
							cc.delayTime(delay * 2),
							cc.moveTo(delay, pos[i].x, pos[i].y).easing(cc.easeCubicActionOut()),
							cc.delayTime(delay * i)
						).repeatForever()
				);
    	}
    }

});

var TitleScene = cc.Scene.extend({

	onEnter:function () {
        this._super();
        var layer = new MainLayer();
        this.addChild(layer);
    },
    
    onExit:function () {
    	this._super();

    	//BGM再生を停止
    	audioEngine.stopMusic();
    }
    
});

