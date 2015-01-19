var g = window.g || {};

(function(){
		
	//言語設定 
	g.language = cc.Application.getInstance().getCurrentLanguage();
	
	//プラットフォーム判定 
	if (cc.TARGET_PLATFORM == undefined) {
		cc.TARGET_PLATFORM = { // cocos2d/platform/CCApplication.jsからコピー
				WINDOWS: 0,
				LINUX: 1,
				MAC: 2,
				ANDROID:3,
				IPHONE:4,
				IPAD:5,
				MOBILE_BROWSER:100,
				PC_BROWSER:101
		};
	}	
	g.platform = cc.Application.getInstance().getTargetPlatform();
	
	//タイマー用変数
	var tmpNumbers = [];
	
	g.fillZero = function(value, length) {
		var str = String(value); 
		if (str.length < length){
			tmpNumbers.length = ( length + 1 ) - str.length; 
			str = tmpNumbers.join( '0' ) + value;		//必要な個数の0を前に付ける。
		}
		return str.slice(0,2) + "." + str.slice(2);
	}

})();


