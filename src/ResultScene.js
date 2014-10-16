
var ResultLayer = cc.Layer.extend({
	options: null,
	sprite:null,
	
	ctor:function (options) {
		this._super();
		this.options = options;
		var size = cc.winSize;
		this.CX = size.width / 2;
		this.CY = size.height / 2;
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
		this.sprite.attr({
			x: this.CX,
			y: this.CY,
			opacity: 110
		});
		this.addChild(this.sprite, 0);

		//Homeボタン
		var home = new cc.MenuItemImage(
				res.home_png,
				res.home_png,
				this.onHome, 
				this);
		home.attr({
			x: 50,
			y: size.height-50
		});
		home.getSelectedImage().color = cc.color(255, 180, 180);

		//Restartボタン
		var restart = new cc.MenuItemImage(
				res.restart_png,
				res.restart_png,
				this.onRestart, 
				this);
		restart.attr({
			x: size.width/2,
			y: 100
		});
		restart.getSelectedImage().color = cc.color(255, 180, 180);

		var menu = new cc.Menu(home, restart);
		menu.setPosition(0, 0);
		this.addChild(menu, 1);

		//ピースを生成
		this.showPieces();

		//ランキングを表示
		this.showScore();
		
		return true;
	},

	onHome: function(){
		cc.log("Home clicked!");
		cc.director.replaceScene(new TitleScene());
	},

	onRestart: function(){
		var options = cc.director.getRunningScene().options;
		cc.log("Restart: options=", JSON.stringify(options));
		var scene = new GameScene(options);
		cc.director.replaceScene(scene);
	},
	
	showPieces: function(level){
		var piece, number, isBlank, sprite, i, j , n = 0, pos;
		var totalPieces = this.puzzle.pieceNum;
		var dark = 0, bright = 140;

		for (i = 0; i < this.ROWS; ++i){
			for (j = 0; j < this.COLS; ++j){
				number = this.puzzle.pieces[i][j];
				isBlank = (number == this.puzzle.pieceNum);
				pos = this.calcPiecePos(i, j);
				piece = PieceFactory.create(number, isBlank, this.PIECE_W, this.PIECE_H, pos, dark);
				this.addChild(piece, 1);
				
				if (!isBlank) {
					piece.setOpacity(dark);
					piece.runAction(
						cc.sequence(
								cc.delayTime(number * 0.2), 
								cc.fadeTo(0.8, bright).easing(cc.easeIn(3)), 
								cc.fadeTo(1.0, dark).easing(cc.easeIn(3)), 
								cc.delayTime(totalPieces*0.2 - number * 0.2)
						).repeatForever()
					);
				}
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

	//スコアの表示
	showScore: function() {
		var HIGHSCORE_Y = this.CY +260;
		var RANKING_Y = this.CY +180;
		var HIGHSCORE_COLOR = cc.color(255, 128, 128);
		var FONT_SZ_S = 60, FONT_SZ_H = 90, FONT_SZ_R = 44;
		var scene = this;

		var sc = Math.round(this.options.time) +"";
		sc = (sc.substr(0, sc.length-2) || "0") + '"' + sc.substr(sc.length-2, 2);

		//スコア表示ラベル
		var scoreLabel = new cc.LabelTTF(sc, FONT_NAME, FONT_SZ_S, cc.size(300, FONT_SZ_S*1.1), cc.TEXT_ALIGNMENT_CENTER);
		scoreLabel.attr({
			x: this.CX,
			y: HIGHSCORE_Y +96,
			color: cc.color(255, 255, 255)
		});
		this.addChild(scoreLabel, 5);

		//ランキング情報を取得。	        
		var ranking = new Ranking();
		var level = this.options.level+"";
		var name = "";
		var time = this.options.time -0;
		ranking.submit(level, name, time, function(ranking){
			cc.log("Ranking: ", JSON.stringify(ranking));

			var is_best = ranking.rank <= 1;
			if (is_best){
				var highScoreLabel = new cc.LabelTTF('HIGH SCORE!!', FONT_NAME, FONT_SZ_H, cc.size(690, FONT_SZ_H*1.1), cc.TEXT_ALIGNMENT_CENTER);
				highScoreLabel.color = cc.color(255, 102, 102);
				highScoreLabel.setPosition(scene.CX +660, HIGHSCORE_Y); 
				scene.addChild(highScoreLabel, 5);

				highScoreLabel.runAction(
						cc.sequence(
							cc.moveTo(1.0, scene.CX, HIGHSCORE_Y).easing(cc.easeQuadraticActionOut()),
							cc.fadeOut(0.5).easing(cc.easeCubicActionOut()),
							cc.fadeIn(1.0).easing(cc.easeCubicActionOut()),
							cc.delayTime(0.5),
							cc.moveTo(1.0, cc.winSize.width*-2, HIGHSCORE_Y).easing(cc.easeQuadraticActionIn()),
							cc.moveTo(0, cc.winSize.width*2, HIGHSCORE_Y)
						).repeatForever()
					);
			}

			for (var i = 0; i < 10; ++i){
				var lblNum = new cc.LabelTTF((i+1) + '. ', FONT_NAME, FONT_SZ_R, cc.size(80, FONT_SZ_R*1.1), cc.TEXT_ALIGNMENT_RIGHT);
				lblNum.color = cc.color(255, 255, 255);
				lblNum.setPosition(scene.CX -260 + ((i / 5)|0) * 290, RANKING_Y - (i % 5)*50);;
				scene.addChild(lblNum, 5);

				if (ranking.top10[i] && ranking.top10[i].score){
					var sc = Math.round(ranking.top10[i].score) +"";
					sc = (sc.substr(0, sc.length-2) || "0") + '"' + sc.substr(sc.length-2, 2);

					var label = new cc.LabelTTF(sc, FONT_NAME, FONT_SZ_R, cc.size(220, FONT_SZ_R*1.1), cc.TEXT_ALIGNMENT_LEFT);
					label.color = cc.color(255, 255, 255);
					label.setPosition(scene.CX -80 + ((i / 5)|0) * 290, RANKING_Y - (i % 5)*50);
					scene.addChild(label, 5);

					//Top 10に今回のスコアが入っている時は赤色で点滅表示。
					if (ranking.rank == i+1){
						lblNum.color = cc.color(255, 102, 102);
						label.color = cc.color(255, 102, 102);

						[lblNum, label].forEach(function(element, index, array){
							element.runAction(
									cc.sequence(
											cc.fadeOut(0.5).easing(cc.easeCubicActionIn()),
											cc.fadeIn(1.0).easing(cc.easeCubicActionOut()),
											cc.delayTime(0.5)
									).repeatForever()
								);
						});
					}
				}
			}
		});
	}
	
});

var ResultScene = cc.Scene.extend({
	options: null,

	ctor: function(options){
		cc.log("new GameScene: ", JSON.stringify(options));
		this.options = options;
		this._super();
		return true;
	},

	onEnter:function () {
		cc.log("ResultScene.onEnter: ", JSON.stringify(this.options));
		this._super();
		var layer = new ResultLayer(this.options);
		this.addChild(layer);
	}
});

