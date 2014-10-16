var Ranking = function() {
    this.initialize.apply( this, arguments );
};
Ranking.prototype = {};//new Observer();

Ranking.prototype.initialize = function(options) {
};

Ranking.prototype.submit = function(level, name, score, callback){
    var ranking = null;
    var str = "";
    var storage = cc.sys.localStorage;
    cc.log("storage = ", JSON.stringify(storage));
    if (storage){
    	str = storage.getItem(level);
        if (str) ranking = JSON.parse(str);
    } else { 
		cc.log("localStorage is not defined.");
    }
    if (!ranking) ranking = { rank: 1, top10:[] };
    
    for (var i = 9; i >= 0; i--){
        var old_entry = ranking.top10[i];
        if (old_entry && (score > old_entry.score-0)){
            break;
        }
    }
    ranking.rank = i+2;

    if (ranking.rank <= 10){
        var index = ranking.rank - 1;
        ranking.top10.splice(index, 0, {name: name, score: score}); //index番目に追加して後の要素を後ろにずらす。
        if (ranking.top10.length > 10) ranking.top10.pop();         //最後の余分な要素を削除。
    }

    str = JSON.stringify(ranking);
    storage.setItem(level, str);
    
	cc.log("Saved: ", level, JSON.stringify(ranking));

    if (callback){
        callback(ranking);
    }
};







