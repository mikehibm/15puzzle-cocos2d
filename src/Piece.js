var PieceFactory = {

    create: function(number, isBlank, w, h, pos, opacity ) {
    	opacity = opacity || 255;
    	var sprite = new cc.Sprite(res.mikan_png);
    	sprite.getTexture().setAntiAliasTexParameters();
    	sprite.setTag(number);
    	sprite.setName("P"+number);
    	sprite.setPosition(cc.p(pos.x, pos.y));
    	sprite.setScaleX(w * 0.95 / sprite.width);
    	sprite.setScaleY(h * 0.95 / sprite.height);
    	sprite.setOpacity(opacity);
    	sprite.setCascadeOpacityEnabled(true);

        if (!isBlank){
			var FONT_SIZE = 50;
			var offset_y = 4;
			if (g.platform === cc.TARGET_PLATFORM.ANDROID){
				cc.log("Target is ANDROID");
				offset_y = 14;
			}
			var shadow = new cc.LabelTTF(''+number,  FONT_NAME, FONT_SIZE, cc.size(110, 60), cc.TEXT_ALIGNMENT_CENTER);
			//shadow.setFontFillColor(cc.color(0, 0, 0, 200));	//Didn't work.
			shadow.color = cc.color(255, 255, 255);
			shadow.setPosition(cc.p(sprite.width / 2 +5, sprite.height/ 2 -5 +offset_y));
			shadow.setScale(1/sprite.getScale())
            sprite.addChild(shadow);
        
			var text = new cc.LabelTTF(''+number,  FONT_NAME, FONT_SIZE, cc.size(110, 60), cc.TEXT_ALIGNMENT_CENTER);
			//text.enableShadow(cc.p(5, -5), 1, 0);			//Didn't work.
			//text.setFontFillColor(cc.color(170, 90, 25));	//Didn't work.
			text.color = cc.color(170, 90, 25);
			text.setPosition(cc.p(sprite.width / 2, sprite.height/ 2 +offset_y));
			text.setScale(1/sprite.getScale())
			sprite.addChild(text);
			
			cc.eventManager.addListener({
				event: cc.EventListener.TOUCH_ONE_BY_ONE,
				swallowTouches: true,
				onTouchBegan: function (touch, event) { 
					var target = event.getCurrentTarget();  
					var locationInNode = target.convertToNodeSpace(touch.getLocation());    
					var s = target.getContentSize();
					var rect = cc.rect(0, 0, s.width, s.height);
					if (cc.rectContainsPoint(rect, locationInNode)) {       
						//cc.log("sprite touchbegan... x = " + locationInNode.x + ", y = " + locationInNode.y);
						var event = new cc.EventCustom("piece_touch");
						event.setUserData({number: number, piece: target, moved: false});
						cc.eventManager.dispatchEvent(event);       
						return true;
					}
					return false;
				}
			}, sprite);
        } else {
        	sprite.setOpacity(0);
        }
        
        // 数値をセット
        sprite.number = number;
        sprite.name = "P" + number;
        sprite.isBlank = isBlank;

        return sprite;
    }
    
};








