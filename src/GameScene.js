//ゲームのステータス
var STATE = {
		LOADING: "loading",
		PLAYING: "playing",
		COMPLETE: "complete",
		TIMEUP: "timeup"
	};

//タイマー用変数
var timeCounter = -1;


var GameLayer = cc.Layer.extend({
	sprite:null,
	state: STATE.LOADING,
	puzzle: null,
	options: null,

	ctor: function (options) {
		cc.log("new GameLayer: ", JSON.stringify(options));
		this._super();
		this.state = STATE.LOADING;
		this.options = options;
		this.puzzle = new Stage(options);

		var size = cc.winSize;
		this.CX = size.width / 2;
		this.CY = size.height / 2;
		this.ROWS = this.puzzle.rows;
		this.COLS = this.puzzle.cols;
		this.PADDING_X = size.width * 0.08;
		this.PIECE_W = (size.width - (this.PADDING_X * 2)) / this.COLS;
		this.PIECE_H = (size.width - (this.PADDING_X * 2)) / this.ROWS;

		//背景
		this.sprite = new cc.Sprite(res.bg_png);
		this.sprite.attr({ x: this.CX, y: this.CY });
		this.addChild(this.sprite, 0);

		//Homeボタン
		var home = new cc.MenuItemImage( res.home_png, res.home_png, this.onHome, this);
		home.attr({ x: 50, y: size.height-50 });
		home.getSelectedImage().color = cc.color(255, 180, 180);

		//Restartボタン
		var restart = new cc.MenuItemImage( res.restart_png, res.restart_png, this.onRestart, this);
		restart.attr({ x: this.CX, y: 100 });
		restart.getSelectedImage().color = cc.color(255, 180, 180);

		var menu = new cc.Menu(home, restart);
		menu.setPosition(0, 0);
		this.addChild(menu, 1);

		//BGMを開始。
		audioEngine.playMusic(res.bgm_game_mp3, true);

		//時間バーとスコア表示ラベルを生成
		this.showTimeBar();

		//ピースを生成
		this.showPieces();

		//雲を生成
		this.showClouds();

		//シャッフルしてゲーム開始。
		this.startShuffle();

		return true;
	},
	
	onHome: function(){
		cc.log("Home clicked!");
		cc.director.replaceScene(new TitleScene());
	},
	
	onRestart: function(){
		cc.log("Restart clicked!");
		
		this.startShuffle();
		audioEngine.playMusic(res.bgm_game_mp3, true);
	},
	
	startShuffle: function(){
		if (this.timeUpLabel){
			this.removeChild(this.timeUpLabel, true);
			this.timeUpLabel = null;
		}
		this.state = STATE.LOADING;
		this.puzzle.shufflePieces();
		this.updatePieces();
		timeCounter = -1;
		this.timeBar.scaleX = 1;
		this.state = STATE.PLAYING;

		//タイムのカウントを開始。
		this.scheduleUpdate();
	},

	showPieces: function(level){
		var piece, number, isBlank, sprite, i, j , n = 0, pos;

		for (i = 0; i < this.ROWS; ++i){
			for (j = 0; j < this.COLS; ++j){
				number = this.puzzle.pieces[i][j];
				isBlank = (number == this.puzzle.pieceNum);
				pos = this.calcPiecePos(i, j);
				piece = PieceFactory.create(number, isBlank, this.PIECE_W, this.PIECE_H, pos, 255);
				this.addChild(piece, 10);
			}
		}
		
		cc.eventManager.addListener({
			event: cc.EventListener.CUSTOM,
			eventName: "piece_touch",
			callback: this.onTouchPiece
		}, this);
	},
	
	calcPiecePos: function(row, col){
		return cc.p(
			this.CX - (this.COLS / 2 * this.PIECE_W) + (col * this.PIECE_W) + this.PIECE_W / 2, 
			this.CY + (this.ROWS / 2 * this.PIECE_H) - (row * this.PIECE_H) - this.PIECE_H / 2
		);
	},

	onTouchPiece: function (e) {
		var data = e.getUserData();
		var layer = data.piece.getParent();
		if (layer.state !== STATE.PLAYING) return;
		
//		//アニメーション中ならタッチ不可。
//		if (data.piece.getNumberOfRunningActions() > 0) return;

		data.moved = layer.puzzle.swapPieces(data.number);
		if (data.moved){
			//動いた時の効果音を再生
			audioEngine.playEffect(res.se_ok_mp3);

			//各ピースの新しい座標を計算してアニメーションを開始。
			layer.updatePieces();
			
			//クリア判定
			if (layer.puzzle.checkClear()){
				layer.onClear();
			}
		} else {
			//動かせなかった時の効果音を再生
			audioEngine.playEffect(res.se_ng_mp3);

			var cur_pos = layer.puzzle.locateNumber(data.number);
			var pos = layer.calcPiecePos(cur_pos.row, cur_pos.col);
			data.piece.stopAllActions();
			data.piece.runAction(cc.sequence(
					cc.fadeOut(0.12).easing(cc.easeQuadraticActionIn()),
					cc.fadeIn(0.12).easing(cc.easeQuarticActionIn())
				));
			data.piece.runAction(cc.sequence(
					cc.moveTo(0.12, cc.p(pos.x-10, pos.y)).easing(cc.easeQuadraticActionIn()),
					cc.moveTo(0.12, cc.p(pos.x+10, pos.y)).easing(cc.easeQuarticActionIn()),
					cc.moveTo(0.12, pos).easing(cc.easeQuarticActionIn())
			));
		}
	},

	findPieceByNum: function (num){
		return this.getChildByName("P" + num);
	},
	
	update: function (dt) {
		if (this.state !== STATE.PLAYING) return;

		if (timeCounter < 0){
			timeCounter = 0;	
		}
		timeCounter += dt;
		var timeNow = timeCounter * 100 | 0;

		//時間表示を更新
		this.scoreLabel.setString(g.fillZero(timeNow, 4));
		this.puzzle.time = timeNow;

		//制限時間のバーを更新。
		if (this.puzzle.timeLimit * 100 - timeNow <= 0){
			this.onTimeUp();
		} else {
			this.timeBar.scaleX = 1.0 - (timeNow / (this.puzzle.timeLimit * 100));
		}
	},

	updatePieces: function (){
		var ACTION_TAG = 1;
		var piece;
		for (var i = 0; i < this.ROWS; ++i) {
			for (var j = 0; j < this.COLS; ++j) {
				var num = this.puzzle.getNumber(i, j);
				piece = this.findPieceByNum(num);
				
				if (piece.getNumberOfRunningActions() > 0){
					piece.stopActionByTag(ACTION_TAG);
				}
				
				var new_pos = this.calcPiecePos(i, j);
				if (Math.abs(piece.x - new_pos.x) > 1 || Math.abs(piece.y - new_pos.y) > 1){
					var action = cc.moveTo(0.280, new_pos.x, new_pos.y).easing(cc.easeQuadraticActionOut());
					action.setTag(ACTION_TAG);
					piece.runAction(action);
				}
			}
		}        
	},

	showTimeBar: function(){
		
		//時間を示すバーの生成
		this.timeBarBg02 = new cc.Sprite(res.timebar_bg02_png);
		this.timeBarBg02.attr({ x: this.CX, y: cc.winSize.height-128 });
		this.addChild(this.timeBarBg02, 2);

		this.timeBar = new cc.Sprite(res.timebar_png);
		this.timeBar.attr({ x:this.CX-this.timeBar.getContentSize().width/2, y: cc.winSize.height-126 });
		this.timeBar.setAnchorPoint(cc.p(0, 0.5));
		this.addChild(this.timeBar, 2);

		this.timeBarBg01 = new cc.Sprite(res.timebar_bg01_png);
		this.timeBarBg01.attr({ x: this.CX, y: cc.winSize.height-128 });
		this.addChild(this.timeBarBg01, 2);

		//時間表示用ラベル			
		var FONT_SIZE = 60;
		this.scoreLabel = new cc.LabelTTF('00:00',  FONT_NAME, FONT_SIZE, cc.size(200, 64), cc.TEXT_ALIGNMENT_RIGHT);
		this.scoreLabel.color = cc.color(255, 255, 255);
		this.scoreLabel.attr({ x: this.CX+128, y: cc.winSize.height-50 });
		this.addChild(this.scoreLabel, 1);
	},
	
	showClouds: function(){
		//雲1
		var cloud1 = new cc.Sprite(res.cloud1_png);
		this.addChild(cloud1, 0);
		cloud1.y = cc.winSize.height * (0.8 + Math.random()*0.1);

		//雲2
		var cloud2 = new cc.Sprite(res.cloud2_png);
		this.addChild(cloud2, 0);
		cloud2.y = cc.winSize.height * (0.6 + Math.random()*0.1);

		//雲3
		var cloud3 = new cc.Sprite(res.cloud3_png);
		this.addChild(cloud3, 0);
		cloud3.y = cc.winSize.height * (0.6 + Math.random()*0.1);

		//雲のアニメーションを開始。
		this.animateCloud(cloud1, 8);
		this.animateCloud(cloud2, 7);
		this.animateCloud(cloud3, 6);

	},
	
	animateCloud: function (cloud, time){
		cloud.x = cloud.width + cc.winSize.width * (1 + Math.random()*0.2);
		cloud.runAction(
				cc.sequence(
						cc.moveTo(time, -cloud.width, cloud.y),
						cc.moveTo(0, cc.winSize.width+cloud.width, cloud.y)
					).repeatForever()
			);
	},

	onClear: function (){
		//時間表示・制限時間バーの更新を停止。
		this.state = STATE.COMPLETE;
		this.unscheduleUpdate();

		this.scheduleOnce(function(){
			//クリアの効果音を再生
			audioEngine.playEffect(res.se_clear_mp3);
			//BGM再生を停止
			audioEngine.stopMusic();

			//結果表示画面を開く。
			this.options.time = this.puzzle.time;
			cc.director.replaceScene(new ResultScene(this.options));
		}, 0.5);
	},
	
	onTimeUp: function (){
		this.state = STATE.TIMEUP;
		this.unscheduleUpdate();
		
		//クリアの効果音を再生
		audioEngine.playEffect(res.se_clear_mp3);
		//BGM再生を停止
		audioEngine.stopMusic();

		this.scoreLabel.setString(g.fillZero(this.puzzle.timeLimit * 100, 4));
		this.timeBar.scaleX = 0;

		this.timeUpLabel = new cc.Sprite(res.timeup_png);
		this.timeUpLabel.attr({ x: this.CX, y: this.CY });
		this.addChild(this.timeUpLabel, 90);
	}

});

var GameScene = cc.Scene.extend({
	options: null,
	
	ctor: function(options){
		cc.log("new GameScene: ", JSON.stringify(options));
		this._super();
		this.options = options;
		return true; 
	},
	
	onEnter:function () {
		cc.log("GameScene.onEnter: ", JSON.stringify(this.options));
		this._super();
		var layer = new GameLayer(this.options);
		this.addChild(layer);
	},
	
	onExit:function () {
		this._super();

		//BGM再生を停止
		audioEngine.stopMusic();
	}
});

