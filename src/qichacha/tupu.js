

/** 网页当前状态判断 (解决没布局完就切换页面造成点聚集在一起)*/
var hidden, state, visibilityChange;
if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
    state = "visibilityState";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
    state = "mozVisibilityState";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
    state = "msVisibilityState";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
    state = "webkitVisibilityState";
}
// 添加监听器，在title里显示状态变化

/** 解决浏览器标签切换排列问题 */
var _isNeedReload = false;
var _isGraphLoaded = false;
document.addEventListener(visibilityChange, function() {

    if(document[state] == 'visible'){
        if(_isNeedReload){
            $("#MainCy").html('');
            $('#TrTxt').removeClass('active');
            getData(_currentKeyNo);
        }
        //document.title = 'hidden-not-loaded'
    } else {
        if(!_isGraphLoaded){
            _isNeedReload = true;
        }
    }
}, false);
/** end 解决浏览器标签切换排列问题 */


/** end 网页当前状态判断 */

    //

var cy;
var id;
var activeNode;

var _rootData,_rootNode;

var _COLOR = {
    //node :   {person: '#09ACB2',company:'#128BED',current:'#FD485E'},
    //node :   {person: '#20BDBF',company:'#4EA2F0',current:'#FD485E'},
    node :   {person: '#FD485E',company:'#4ea2f0',current:'#ff9e00'},
    //node :   {person: '#a177bf',company:'#4ea2f0',current:'#FD485E'},
    //node :   {person: '#f2af00',company:'#0085c3',current:'#7ab800'},
    //border : {person: '#09ACB2',company:'#128BED',current:'#FD485E'},
    //border : {person: '#57A6A8',company:'#128BED',current:'#FD485E'},
    border : {person: '#FD485E',company:'#128BED',current:'#EF941B'},
    //border : {person: '#7F5AB8',company:'#128BED',current:'#FD485E'},
    //border : {person: '#f2af00',company:'#0085c3',current:'#7ab800'},
    //line:    {invest:'#128BED',employ:'#FD485E',legal:'#09ACB2'},
    //line:    {invest:'#4EA2F0',employ:'#20BDBF',legal:'#D969FF'}
    line:    {invest:'#fd485e',employ:'#4ea2f0',legal:'#4ea2f0'}
    //line:    {invest:'#e43055',employ:'#a177bf',legal:'#4ea2f0'}
};
var _currentKeyNo,_companyRadius = 35,_personRadius = 15,_circleMargin = 10,_circleBorder = 3,
    _layoutNode = {}, _isFocus = false;
var _maxChildrenLength = 0;


/****** 工具 ******/

//去重操作,元素为对象
/*array = [
    {a:1,b:2,c:3,d:4},
    {a:11,b:22,c:333,d:44},
    {a:111,b:222,c:333,d:444}
];
var arr = uniqeByKeys(array,['a','b']);*/
function uniqeByKeys(array,keys){
    //将对象元素转换成字符串以作比较
    function obj2key(obj, keys){
        var n = keys.length,
            key = [];
        while(n--){
            key.push(obj[keys[n]]);
        }
        return key.join('|');
    }

    var arr = [];
    var hash = {};
    for (var i = 0, j = array.length; i < j; i++) {
        var k = obj2key(array[i], keys);
        if (!(k in hash)) {
            hash[k] = true;
            arr .push(array[i]);
        }
    }
    return arr ;
};
//去重操作,普通元素
Array.prototype.unique = function(){
    var res = [];
    var json = {};
    for(var i = 0; i < this.length; i++){
        if(!json[this[i]]){
            res.push(this[i]);
            json[this[i]] = 1;
        }
    }
    return res;
};

//深复制对象方法
function cloneObj (obj) {
    var newObj = {};
    if (obj instanceof Array) {
        newObj = [];
    }
    for (var key in obj) {
        var val = obj[key];
        //newObj[key] = typeof val === 'object' ? arguments.callee(val) : val; //arguments.callee 在哪一个函数中运行，它就代表哪个函数, 一般用在匿名函数中。
        newObj[key] = typeof val === 'object' ? cloneObj(val): val;
    }
    return newObj;
};

/****** 数据处理 ******/

// 数据处理：将原始数据转换成graph数据
function getRootData(list) {
    var graph = {}
    graph.nodes = [];
    graph.links = [];

    //graph.nodes
    for(var i = 0; i < list.length; i++){
        var nodes = list[i].graph.nodes;
        for(var j = 0; j < nodes.length; j++){
            var node = nodes[j];
            var o = {};
            o.nodeId = node.id;
            o.data = {};
            o.data.obj = node;
            //o.data.showStatus = 'NORMAL'; // NORMAL HIGHLIGHT DULL
            o.data.showStatus = null; // NORMAL HIGHLIGHT DULL
            o.layout = {}
            o.layout.level = null; // 1 当前查询节点
            o.layout.singleLinkChildren = []; // 只连接自己的node
            graph.nodes.push(o);

            // 设置_rootNode
            
            if (_currentKeyNo == o.data.obj.properties.keyNo){
                _rootNode = o;
            }
        }
    }
    graph.nodes = uniqeByKeys(graph.nodes,['nodeId']);

    //graph.links
    for(var i = 0; i < list.length; i++){
        var relationships = list[i].graph.relationships;

        for(var k = 0; k < relationships.length; k++) {
            var relationship = relationships[k];
            var o = {}
            o.data = {};
            o.data.obj = relationship;
            //o.data.showStatus = 'NORMAL'; // NORMAL HIGHLIGHT DULL
            o.data.showStatus = null; // NORMAL HIGHLIGHT DULL
            o.sourceNode = getGraphNode(relationship.startNode,graph.nodes);
            o.targetNode = getGraphNode(relationship.endNode,graph.nodes);
            o.linkId = relationship.id;
            o.source = getNodesIndex(relationship.startNode,graph.nodes);
            o.target = getNodesIndex(relationship.endNode,graph.nodes);
            graph.links.push(o);
        }
    }
    graph.links = uniqeByKeys(graph.links,['linkId']);


    //emplyRevert(graph.links);
    //mergeLinks(graph.links);
    setLevel(graph.nodes,graph.links);
    setCategoryColor(graph.nodes,graph.links);

    return graph;
}
// 数据处理：董监高箭头翻转
function emplyRevert(links) {
    links.forEach(function (link,i) {
        if(link.data.obj.type == 'EMPLOY'){
            var tmpObj = link.source;
            var tmpObjNode = link.sourceNode;
            link.source = link.target;
            link.sourceNode = link.targetNode;
            link.target = tmpObj;
            link.targetNode = tmpObjNode;
        }
    });
}
// 数据处理：董监高、法人线合并
function mergeLinks(links) {
    links.forEach(function (link,i) {
        if(link.sourceNode.data.obj.labels[0] == 'Person' && link.data.obj.type == 'LEGAL'){
            links.forEach(function (nextLink,j) {
                if(link.linkId != nextLink.linkId &&
                    link.sourceNode.nodeId == nextLink.sourceNode.nodeId &&
                    link.targetNode.nodeId == nextLink.targetNode.nodeId &&
                    nextLink.data.obj.type == 'EMPLOY'){

                    links.splice(j,1);
                }
            });
        }

        if(link.sourceNode.data.obj.labels[0] == 'Person' && link.data.obj.type == 'EMPLOY'){
            links.forEach(function (nextLink,j) {
                if(link.linkId != nextLink.linkId &&
                    link.sourceNode.nodeId == nextLink.sourceNode.nodeId &&
                    link.targetNode.nodeId == nextLink.targetNode.nodeId &&
                    nextLink.data.obj.type == 'LEGAL'){

                    links.splice(j,1);
                }
            });
        }
    });
//        console.log(links);
}
// 数据处理：设置节点层级
function setLevel(svg_nodes,svg_links) {
    function getNextNodes(nodeId,links,parentLevel){
        var nextNodes = [];
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(nodeId == link.sourceNode.nodeId && !link.targetNode.layout.level){
                link.targetNode.layout.level = parentLevel;
                nextNodes.push(link.targetNode);
            } else if (nodeId == link.targetNode.nodeId && !link.sourceNode.layout.level) {
                link.sourceNode.layout.level = parentLevel;
                nextNodes.push(link.sourceNode);
            }
        }
        nextNodes = uniqeByKeys(nextNodes,['nodeId']);

        return nextNodes;
    }

    var level = 1;
    var nodes = [];
    nodes.push(_rootNode);
    while(nodes.length){
        var nextNodes = [];
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            node.layout.level = level;
            nextNodes = nextNodes.concat(getNextNodes(node.nodeId,svg_links,level));
        }
        level++;
        nodes = nextNodes;
    }
}
// 数据处理：设置节点角色
function setCategoryColor(nodes, links){
    for(var i = 0; i < links.length; i++){
        var sameLink = {}; // 两点间连线信息
        sameLink.length = 0; // 两点间连线数量
        sameLink.currentIndex = 0; // 当前线索引
        sameLink.isSetedSameLink = false;
        links[i].sameLink = sameLink;
    }

    /*链接相同两点的线*/
    for(var i = 0; i < links.length; i++){
        var baseLink = links[i];

        if(baseLink.sameLink.isSetedSameLink == false){
            baseLink.sameLink.isSetedSameLink = true;
            var nodeId1 = baseLink.sourceNode.nodeId;
            var nodeId2 = baseLink.targetNode.nodeId;

            var sameLinks = [];
            sameLinks.push(baseLink);
            for(var j = 0; j < links.length; j++){
                var otherLink = links[j];
                if(baseLink.linkId != otherLink.linkId && !otherLink.sameLink.isSetedSameLink){
                    if((otherLink.sourceNode.nodeId == nodeId1 && otherLink.targetNode.nodeId == nodeId2 ) ||
                        (otherLink.sourceNode.nodeId == nodeId2 && otherLink.targetNode.nodeId == nodeId1 ) ){
                        sameLinks.push(otherLink);
                        otherLink.sameLink.isSetedSameLink = true;
                    }
                }
            }

            for(var k = 0; k < sameLinks.length; k++){
                var oneLink = sameLinks[k];
                oneLink.sameLink.length = sameLinks.length; // 两点间连线数量
                oneLink.sameLink.currentIndex = k; // 当前线索引
            }
        }
    }

    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (_currentKeyNo == node.data.obj.properties.keyNo) { // 当前节点
            node.data.color = _COLOR.node.current;
            node.data.strokeColor = _COLOR.border.current;
        } else if (node.data.obj.labels[0] == 'Company') {
            node.data.color = _COLOR.node.company;
            node.data.strokeColor = _COLOR.border.company;
        } else {
            node.data.color = _COLOR.node.person;
            node.data.strokeColor = _COLOR.border.person;
        }
    }
}
// 数据处理：设置唯一孩子
function setSingleLinkNodes(links){
    function isSingleLink (nodeId,links){
        var hasLinks = 0;
        var isSingle = true;
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(link.targetNode.nodeId == nodeId || link.sourceNode.nodeId == nodeId){
                hasLinks++;
            }
            if(hasLinks > 1){
                isSingle = false;
                break;
            }
        }

        return isSingle;
    } // isSingleLink

    links.forEach(function (link,i) {
        if(isSingleLink(link.sourceNode.nodeId,links)){
            link.targetNode.layout.singleLinkChildren.push(link.sourceNode);
        }
        if(isSingleLink(link.targetNode.nodeId,links)){
            link.sourceNode.layout.singleLinkChildren.push(link.targetNode);
        }
    });
}
// 数据处理：根据nodeId获取node 索引
function getNodesIndex(nodeId,nodes) {
    var index = 0;
    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        if(nodeId == node.nodeId){
            index = i;
            break;
        }
    }
    return index;
}
// 数据处理：node是否存在
function isNodeExist(nodeId,nodes) {
    var exist = false;
    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        if(nodeId == node.nodeId){
            exist = true;
            break;
        }
    }
    return exist;
}
// 数据处理：根据nodes过滤出相应连线（没有节点的连线删除）
function filterLinksByNodes(nodes,allLinks) {
    function isExists(nodes,nodeId) {
        var exist = false;
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            if(node.nodeId == nodeId){
                exist = true;
                break;
            }
        }
        return exist;
    }
    var sel_links = [];
    for(var i = 0; i < allLinks.length; i++){
        var link = allLinks[i];
        if(isExists(nodes,link.sourceNode.nodeId) && isExists(nodes,link.targetNode.nodeId)){
            //link.source = getNodesIndex(link.sourceNode.nodeId,nodes);
            //link.target = getNodesIndex(link.targetNode.nodeId,nodes);
            sel_links.push(link);
        }
    }
    return sel_links;
}
// 数据处理：根据links过滤出相应节点(没有连线的节点删除)
function filterNodesByLinks(nodes,links) {
    function isExists(links,nodeId) {
        var exist = false;
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(link.sourceNode.nodeId == nodeId || link.targetNode.nodeId == nodeId){
                exist = true;
                break;
            }
        }
        return exist;
    }
    var sel_nodes = [];
    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        if(isExists(links,node.nodeId)){
            sel_nodes.push(node);
        }
    }
    return sel_nodes;
}
// 数据处理：根据nodeId获取node
function getGraphNode(nodeId,nodes) {
    var node = null;
    for(var i = 0; i < nodes.length; i++){
        if(nodes[i].nodeId == nodeId) {
            node = nodes[i];
            break;
        }
    }
    return node;
}
// 数据处理：获取子节点
function getSubNodes(node,links) {
    var subNodes = [];
    var nodeId = node.nodeId;
    var level = node.layout.level;
    for(var i = 0; i < links.length; i++){
        var link = links[i];
        if(link.sourceNode.nodeId == nodeId && link.targetNode.layout.level == level+1){
            subNodes.push(link.targetNode);
        }
        if(link.targetNode.nodeId == nodeId && link.sourceNode.layout.level == level+1){
            subNodes.push(link.sourceNode);
        }
    }
    subNodes = uniqeByKeys(subNodes,['nodeId']);
    return subNodes;
}

/**筛选*/
// 数据处理：按状态过滤
function filterNodesByLevel(level,nodes){
    var sel_nodes = [];
    nodes.forEach(function (node) {
        if(node.layout.level <= level){
            sel_nodes.push(node);
        }
    })
    return sel_nodes;
}
// 数据处理：按状态过滤
function filterNodesByStatus(status,nodes){
    if(status == 'all'){
        return nodes;
    }

    var sel_nodes = [];
    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        if((node.data.obj.labels == 'Company' && node.data.obj.properties.status == status) || node.nodeId == _rootNode.nodeId){
            sel_nodes.push(node);
        }
    }
    return sel_nodes;
}
// 数据处理：按持股数过滤
function filterNodesByStockNum(num,links){
    var sel_links = [];
    for(var i = 0; i < links.length; i++){
        if(num == links[i].data.obj.properties.stockPercent){
            sel_links.push(links[i]);
        }
    }
    return sel_links;
}
// 数据处理：按投资过滤
function filterNodesByInvest(invest,nodes,links){
    /*获取直接投资的节点*/
    function getInvestNodes(nodeId,links) {
        var investNodes = [];
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(link.sourceNode.nodeId == nodeId && link.data.obj.type == 'INVEST'){
                investNodes.push(link.targetNode);
            }
        }

        //investNodes = uniqeByKeys(investNodes,['nodeId']);
        return investNodes;
    }
    /*获取公司股东*/
    function getCompanyStockholder(nodeId,links) {
        var stockholderNodes = [];
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(link.targetNode.nodeId == nodeId && link.data.obj.type == 'INVEST'){
                stockholderNodes.push(link.sourceNode);
            }
        }

        //stockholderNodes = uniqeByKeys(stockholderNodes,['nodeId']);
        return stockholderNodes;
    }
    /*获取董监高法*/
    function getPersonStockholder(nodeId,links) {
        var stockholderNodes = [];
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(link.targetNode.nodeId == nodeId && link.data.obj.type == 'INVEST' && link.sourceNode.data.obj.labels[0] == 'Person'){
                stockholderNodes.push(link.sourceNode);
            }
        }

        //stockholderNodes = uniqeByKeys(stockholderNodes,['nodeId']);
        return stockholderNodes;
    }

    var sel_nodes = [];

    switch (invest){
        case 'all':
            return nodes;
            break;
        case 'direct': //直接投资
            sel_nodes = getInvestNodes(_rootNode.nodeId,links);
            break;
        case 'stockholder': // 股东投资
            var nextNodes = [];
            var stockholderNodes = getCompanyStockholder(_rootNode.nodeId,links);
            for(var i = 0; i < stockholderNodes.length; i++){
                nextNodes = nextNodes.concat(getInvestNodes(stockholderNodes[i].nodeId,links));
            }
            sel_nodes = stockholderNodes.concat(nextNodes);
            break;
        case 'legal': // 董监高法投资
            var nextNodes = [];
            var stockholderNodes = getPersonStockholder(_rootNode.nodeId,links);
            for(var i = 0; i < stockholderNodes.length; i++){
                nextNodes = nextNodes.concat(getInvestNodes(stockholderNodes[i].nodeId,links));
            }
            sel_nodes = stockholderNodes.concat(nextNodes);
            break;
    }


    sel_nodes = sel_nodes.concat(_rootNode);
    sel_nodes = uniqeByKeys(sel_nodes,['nodeId']);
    return sel_nodes;
}
// 数据处理：根据所有条件过滤
function filter(rootData){
    function isParentExist(node,nodes,links) {
        var isExist = false;
        var parentLevel = node.layout.level - 1;

        if(parentLevel < 2){
            return true;
        }

        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if((link.sourceNode.nodeId == node.nodeId && link.targetNode.layout.level == parentLevel) && isNodeExist(link.targetNode.nodeId,nodes) ){
                isExist = true;
                break;
            }
            if((link.targetNode.nodeId == node.nodeId && link.sourceNode.layout.level == parentLevel) && isNodeExist(link.sourceNode.nodeId,nodes) ){
                isExist = true;
                break;
            }
        }

        return isExist;
    }
    function getFilterData(rootData) {
        //
        var sel_nodes = [];
        for(var i = 0; i < rootData.nodes.length; i++){
            sel_nodes.push(rootData.nodes[i]);
        }
        var sel_links = [];
        for(var i = 0; i < rootData.links.length; i++){
            sel_links.push(rootData.links[i]);
        }

        var level = $('#SelPanel').attr('param-level');
        var status = $('#SelPanel').attr('param-status');
        var num = $('#SelPanel').attr('param-num');
        var invest = $('#SelPanel').attr('param-invest');

        //console.log('status:' + status + ' num:' + num + ' invest:' + invest);

        // 层级
        level = parseInt(level) + 1;
        sel_nodes = filterNodesByLevel(level,sel_nodes);

        // 状态
        if(status){
            sel_nodes = filterNodesByStatus(status,sel_nodes);
        }

        // 持股
        var stock_nodes = [];
        if(num && num != 0){
            sel_links = filterLinksByNodes(sel_nodes,sel_links);
            sel_links = filterNodesByStockNum(num,sel_links);
            for(var i = 0; i < sel_links.length;i++){
                stock_nodes.push(sel_links[i].sourceNode);
                stock_nodes.push(sel_links[i].targetNode);
            }
            sel_nodes = uniqeByKeys(stock_nodes,['nodeId']);
        }

        // 投资
        if(invest){
            sel_nodes = filterNodesByInvest(invest,sel_nodes,sel_links);
        }

        //父节点不存在则删除
        var sel_nodes2 = [];
        sel_nodes.forEach(function (node,i) {
            if(isParentExist(node,sel_nodes,sel_links)){
                sel_nodes2.push(node);
            }
        })
        sel_links = filterLinksByNodes(sel_nodes2,sel_links);

        return {links:sel_links,nodes:sel_nodes2};
    }

    var nodesIds = [];
    var selGraph= getFilterData(rootData)
    selGraph.nodes.forEach(function (node) {
        nodesIds.push(node.nodeId);
    })
    highLightFilter(nodesIds,cy);

    /*//
    //$("#load_data").show();

    // 保证始终存在当前节点
    /!*if(sel_nodes2.length == 0){
        sel_nodes2.push(_rootNode);
    }*!/

    // 更新图谱
    /!*$("#TrTxt").removeClass('active');
    domUpdate(getFilterData(rootData));*!/

    /!*setTimeout(function () {
        domUpdate({links:sel_links,nodes:sel_nodes2});
    },5000)*!/;*/
}
//
function filterReset(){
    $('#SelPanel').attr('param-level','2');
    $('#SelPanel').attr('param-status','');
    $('#SelPanel').attr('param-num','');
    $('#SelPanel').attr('param-invest','');

    $('#ShowLevel a').removeClass('active');
    $('#ShowLevel a').eq(1).addClass('active');
    $('#ShowStatus a').removeClass('active');
    $('#ShowStatus a').eq(0).addClass('active');
    $('#ShowInvest a').removeClass('active');
    $('#ShowInvest a').eq(0).addClass('active');
    $('#inputRange').val(0);
    $('#inputRange').css({'backgroundSize':'0% 100%'});
}

/****** Html 相关 ******/
// 水印居中
function printLogoFixed() {
    var bodyH = $('body').height();
    var imgH = $('.printLogo img').height();
    var top = (parseFloat(bodyH) - parseFloat(imgH)) / 2;
    $('.printLogo img').css({'margin-top' : top + 'px'});
}
//筛选面板：显示
function selPanelShow() {
    $('.tp-sel').fadeIn();
    //$('.tp-sel').addClass('zoomIn');
    $('#TrSel').addClass('active');
}
//筛选面板：隐藏
function selPanelHide() {
    $('.tp-sel').fadeOut();
    $('#TrSel').removeClass('active');
}
//筛选面板：列表更新
function selPanelUpdateList(nodes,links,isShowCheckbox) {
    $('.tp-list').html('');
    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        var index = i + 1;
        var name = node.data.obj.properties.name;
        var keyNo = node.data.obj.properties.keyNo;
        var str = '';
        if(isShowCheckbox){
            str = '<div class="checkbox" node_id="'+ node.nodeId +'" keyno="'+ keyNo +'"> <input checked type="checkbox"><label> ' + index + '.' + name + '</label> </div>';
//            var str = '<div class="checkbox" node_id="'+ node.nodeId +'" keyno="'+ keyNo +'"> <label> ' + index + '.' + name + '</label> </div>';
        } else {
            str = '<div class="checkbox" node_id="'+ node.nodeId +'" keyno="'+ keyNo +'"><label> ' + index + '.' + name + '</label> </div>';
        }

        $('.tp-list').append(str);
    }

    $('.tp-list > div > label').click(function () {
        var _parent = $(this).parent();
        var nodeId = _parent.attr('node_id');

        focusReady(getGraphNode(nodeId,nodes));
    });

    $('.tp-list > div > input').click(function () {
        /*var _this = $(this);
        var _parent = $(this).parent();
        var nodeId = _parent.attr('node_id');
        var checkedNodeIds = $('.tp-list').attr('node_ids');
        if(checkedNodeIds){
            checkedNodeIds = checkedNodeIds.split(',');
        }*/

        var checkedNodeIds = [];
        $('.tp-list input:checked').each(function () {
            var _parent = $(this).parent();
            var nodeId = _parent.attr('node_id');
            checkedNodeIds.push(nodeId);
        });

        /*if(_this.is(':checked')){
            checkedNodeIds.push(nodeId);
            nodes.splice(1,1);
            console.log('checked');
        } else {
            console.log('un checked');
            var sub_nodes = []
            sub_nodes = nodes.splice(0,1);
            console.log(nodes);
            console.log(sub_nodes);
            graphInit(nodes, links);
        }*/
        highLight(checkedNodeIds,cy);
        /*// 需要隐藏的节点及子节点
        var choosedNode = getGraphNode(nodeId,nodes);
        var subNodes = getSubNodes(choosedNode,links);
        subNodes.push(choosedNode);

        // 剩下的节点
        var lastNodes = [];
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            if(!getGraphNode(node.nodeId,subNodes)){
                lastNodes.push(node);
            }
        }

        // 剩下的连线
        var lastLinks = filterLinksByNodes(lastNodes,links);

        graphInit(lastNodes, lastLinks);
        if(_this.is(':checked')){
            nodes.splice(1,1);
            console.log('checked');
        } else {
            console.log('un checked');
            var sub_nodes = []
            sub_nodes = nodes.splice(0,1);
            console.log(nodes);
            console.log(sub_nodes);
            graphInit(nodes, links);
        }
        console.log(nodeId);*/
    });
}
//筛选面板：聚焦准备
function focusReady(node) {
    filterReset();
    $('#FocusInput').val(node.data.obj.properties.name);
    $('#FocusInput').attr('node_id',node.nodeId);
    $('#FocusBt').text('聚焦');
    $('#FocusBt').removeClass('focusDisable');
    $('#ClearInput').show();
}
//筛选面板：取消聚焦
function focusCancel() {
    $('#ClearInput').hide();
    $('#FocusBt').text('聚焦');
    $('#FocusBt').addClass('focusDisable');
    $('#FocusInput').val('');
    $('#FocusInput').attr('node_id','');
    selPanelUpdateList(_rootData.nodes,_rootData.links,true);
    cancelHighLight();
}

function maoScale(type){

    /*var c=$('canvas').eq(2).attr('id','myCanvas');
    var c=document.getElementById("myCanvas");
    console.log(c);
    var ctx = c.getContext("2d");
    ctx.font = "5px Arial";
    ctx.fillText("上海", 1, 10);

    return;*/

    //
    var rate = 0.2;
    var scale = cy.zoom();
    if(type==1){
        scale += rate;
    }else if(type==2){
        scale -= rate;
    }

    cy.zoom({
        level: scale, // the zoom level
    });
}

function resizeScreen(){
    if(isFullScreen()){
        $('#TrFullScreen').addClass('active');
        $('#TrFullScreen').html('<span class="screen2ed"></span>退出');
    } else {
        $('#TrFullScreen').removeClass('active');
        $('#TrFullScreen').html('<span class="screen2"></span>全屏');
    }

    //cy.pan();
    /*if(document.body.clientHeight>700){
        $('#Main').height(document.body.clientHeight-66);
        console.log(document.body.clientHeight);
    }else{
        $('#Main').height(640);
    }*/
}

function isFullScreen(){
    if(document.fullscreen){
        return true;
    }else if(document.mozFullScreen){
        return true;
    }else if(document.webkitIsFullScreen){
        return true;
    }else if(document.msFullscreenElement){
        return true;
    }else{
        return false;
    }
}
function launchFullScreen(element) {


    if(element.requestFullscreen) {
        element.requestFullscreen();
    }else if(element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    }else if(element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}
function exitFullScreen(){


    if(document.exitFullscreen){
        document.exitFullscreen();
    }
    else if(document.mozCancelFullScreen){
        document.mozCancelFullScreen();
    }
    else if(document.msExitFullscreen){
        document.msExitFullscreen();
    }
    else if(document.webkitCancelFullScreen){
        document.webkitCancelFullScreen();
    }
}

function toggleText() {
    if($("#TrTxt").hasClass('active')){
        $("#TrTxt").removeClass('active');
        cy.collection("edge").removeClass("edgeShowText");
    } else {
        $("#TrTxt").addClass('active');
        cy.collection("edge").addClass("edgeShowText");
    }
}

/****** 图谱 相关 ******/
/*function highlight( node ){
    var oldNhood = lastHighlighted;

    var nhood = lastHighlighted = node.closedNeighborhood();
    var others = lastUnhighlighted = cy.elements().not( nhood );

    var reset = function(){
        cy.batch(function(){
            others.addClass('hidden');
            nhood.removeClass('hidden');

            allEles.removeClass('faded highlighted');

            nhood.addClass('highlighted');

            others.nodes().forEach(function(n){
                var p = n.data('orgPos');

                n.position({ x: p.x, y: p.y });
            });
        });

        return Promise.resolve().then(function(){
            if( isDirty() ){
                return fit();
            } else {
                return Promise.resolve();
            };
        }).then(function(){
            return Promise.delay( aniDur );
        });
    };

    var runLayout = function(){
        var p = node.data('orgPos');

        var l = nhood.filter(':visible').makeLayout({
            name: 'concentric',
            fit: false,
            animate: true,
            animationDuration: aniDur,
            animationEasing: easing,
            boundingBox: {
                x1: p.x - 1,
                x2: p.x + 1,
                y1: p.y - 1,
                y2: p.y + 1
            },
            avoidOverlap: true,
            concentric: function( ele ){
                if( ele.same( node ) ){
                    return 2;
                } else {
                    return 1;
                }
            },
            levelWidth: function(){ return 1; },
            padding: layoutPadding
        });

        var promise = cy.promiseOn('layoutstop');

        l.run();

        return promise;
    };

    var fit = function(){
        return cy.animation({
            fit: {
                eles: nhood.filter(':visible'),
                padding: layoutPadding
            },
            easing: easing,
            duration: aniDur
        }).play().promise();
    };

    var showOthersFaded = function(){
        return Promise.delay( 250 ).then(function(){
            cy.batch(function(){
                others.removeClass('hidden').addClass('faded');
            });
        });
    };

    return Promise.resolve()
        .then( reset )
        .then( runLayout )
        .then( fit )
        .then( showOthersFaded )
        ;

}//hilight*/
function drawGraph(elements) {
    _currentKeyNo,_companyRadius = 35,_personRadius = 15,_circleMargin = 10,_circleBorder = 3;
    console.log(elements.nodes[0]);
    cy = cytoscape({
        container: document.getElementById('MainCy'),
        motionBlur: false,
        textureOnViewport:false,
        wheelSensitivity:0.1,
        elements:elements,
        minZoom:0.4,
        maxZoom:2.5,
        layout: {
            name: 'preset',
            componentSpacing: 40,
            nestingFactor:12,
            padding: 10,
            edgeElasticity:800,
            stop:function (e) {

                //解决浏览器标签切换排列问题
                if(document[state] == 'hidden'){
                    _isNeedReload = true;
//                        console.log('stop _isNeedReload=true');
                } else {
                    _isNeedReload = false;
                }
                setTimeout(function () {
                    if(document[state] == 'hidden'){
                        _isGraphLoaded = false;
                        console.log('stop _isGraphLoaded=false');
                    } else {
                        _isGraphLoaded = true;
                    }
                },1000);
            }
        },
        style: [
            {
                selector: 'node',
                style: {
                    shape: 'ellipse',
                    width: function (ele) {
                        //当前节点有图片
                        if(ele.data("type") == 'Person' && _currentKeyNo == ele.data('keyNo') && ele.data('hasImage')){
                            return 80;
                        }
                        //有图片
                        if(ele.data('hasImage') && ele.data('type') == 'Person'){
                            return 60;
                        }
                        //普通
                        if(ele.data("type") == 'Company'){
                            return 60;
                        }
                        return 45;
                    },
                    height: function (ele) {
                        //当前节点有图片
                        if(ele.data("type") == 'Person' && _currentKeyNo == ele.data('keyNo') && ele.data('hasImage')){
                            return 80;
                        }
                        //有图片
                        if(ele.data('hasImage') && ele.data('type') == 'Person'){
                            return 60;
                        }
                        //普通
                        if(ele.data("type") == 'Company'){
                            return 60;
                        }
                        return 45;
                    },
                    'background-color': function (ele) {
                        return ele.data('color');
                    },
                    'background-fit': 'cover',
                    // 'background-image': function (ele) {
                    //     var hasImage = ele.data('hasImage');
                    //     var keyNo = ele.data('keyNo');
                    //     var type = ele.data('type');
                    //     if(hasImage && type == 'Person'){
                    //         return '/proxyimg_'+ keyNo+'.jeg';
                    //     } else {
                    //         return 'none';
                    //     }
                    // },
                    // 'background-image-crossorigin': 'use-credentials',
                    'border-color': function (ele) {
                        return ele.data("borderColor");
                    },
                    'border-width': function (ele) {
                        if(ele.data('hasImage') && ele.data('type') == 'Person'){
                            return 3;
                        } else {
                            return 1;
                        }
                    },
                    'border-opacity': 1,
                    label: function (ele) {
                        var label = ele.data("name");
                        var length = label.length;

                        if(length <=5){ // 4 5 4排列
                            return label;
                        } else if(length >=5 && length <= 9) {
                            return label.substring(0,length - 5) + '\n' + label.substring(length - 5,length);
                        } else if(length >= 9 && length <= 13){
                            return label.substring(0,4) + '\n' + label.substring(4,9) + '\n' + label.substring(9,13);
                        } else {
                            return label.substring(0,4) + '\n' + label.substring(4,9) + '\n' + label.substring(9,12) + '..';
                        }
                    },
                    'z-index-compare':'manual',
                    'z-index':20,
                    color:"#fff",
                    //'padding-top':0,
                    'padding':function (ele) {
                        if(ele.data("type") == 'Company'){
                            return 3;
                        }
                        return 0;
                    },
                    'font-size':12,
                    //'min-height':'400px',
                    //'ghost':'yes',
                    //'ghost-offset-x':300,
                    //'font-weight':800,
                    //'min-zoomed-font-size':6,
                    'font-family':'microsoft yahei',
                    'text-wrap':'wrap',
                    'text-max-width':60,
                    'text-halign':'center',
                    'text-valign':'center',
                    'overlay-color':'#fff',
                    'overlay-opacity':0,
                    'background-opacity':1,
                    'text-background-color':'#000',
                    'text-background-shape':'roundrectangle',
                    'text-background-opacity':function (ele) {
                        if(ele.data('hasImage') && ele.data('type') == 'Person'){
                            return 0.3;
                        } else {
                            return 0
                        }
                    },
                    'text-background-padding':0,
                    'text-margin-y': function (ele) {
                        //当前节点有图片
                        if(ele.data("type") == 'Person' && _currentKeyNo == ele.data('keyNo') && ele.data('hasImage')){
                            return 23;
                        }
                        // 有图片
                        if(ele.data('hasImage') && ele.data('type') == 'Person'){
                            return 16;
                        }
                        //
                        if(ele.data("type") == 'Company'){
                            return 4;
                        }
                        return 2;
                    },
                },
            },
            {
                selector: 'edge',
                style: {
                    'line-style':function (ele) {
                        return 'solid';
                        /*if(ele.data('data').obj.type == 'INVEST'){
                            return 'solid';
                        } else {
                            return 'dashed'
                        }*/
                    },
                    'curve-style': 'bezier',
                    'control-point-step-size':20,
                    'target-arrow-shape': 'triangle-backcurve',
                    'target-arrow-color': function (ele) {
                        return ele.data("color");
                    },
                    'arrow-scale':0.5,
                    'line-color': function (ele) {
                        //return '#aaaaaa';
                        return ele.data("color");
                    },
                    label: function (ele) {
                        return '';
                    },
                    'text-opacity':0.8,
                    'font-size':12,
                    'background-color':function (ele) {
                        return '#ccc';
                        return ele.data("color");
                    },
                    'width': 0.3,
                    'overlay-color':'#fff',
                    'overlay-opacity':0,
                    'font-family':'microsoft yahei',
                }
            },
            {
                "selector": ".autorotate",
                "style": {
                    "edge-text-rotation": "autorotate"
                }
            },
            {
                selector:'.nodeActive',
                style:{
                    /*'background-color':function (ele) {
                        if(ele.data("category")==1){
                            return "#5c8ce4"
                        }
                        return "#d97a3a";
                    },*/
                    //'z-index':300,
                    'border-color': function (ele) {
                        return ele.data("color");
                    },
                    'border-width': 10,
                    'border-opacity': 0.5
                }
            },
            {
                selector:'.edgeShow',
                style:{
                    'color':'#999',
                    'text-opacity':1,
                    'font-weight':400,
                    label: function (ele) {
                        return ele.data("label");
                    },
                    'font-size':10,
                }
            },
            {
                selector:'.edgeActive',
                style:{
                    'arrow-scale':0.8,
                    'width': 1.5,
                    'color':'#330',
                    'text-opacity':1,
                    'font-size':12,
                    'text-background-color':'#fff',
                    'text-background-opacity':0.8,
                    'text-background-padding':0,
                    'source-text-margin-y':20,
                    'target-text-margin-y':20,
                    //'text-margin-y':3,
                    'z-index-compare':'manual',
                    'z-index':1,
                    'line-color': function (ele) {
                        return ele.data("color");
                    },
                    'target-arrow-color': function (ele) {
                        return ele.data("color");
                    },
                    label: function (ele) {

                        /*if(ele.data('data').obj.type == 'INVEST'){
                            return 'solid';
                        } else {
                            return 'dashed'
                        }*/
                        return ele.data("label");
                    }
                }

            },
            {
                selector:'.hidetext',
                style:{
                    'text-opacity':0,
                }
            },
            {
                selector:'.dull',
                style:{
                    'z-index':1,
                    opacity:0.2,
                }
            },
            {
                selector: '.nodeHover',
                style: {
                    shape: 'ellipse',
                    'background-opacity':0.9,
                }
            },
            {
                selector: '.edgeLevel1',
                style: {
                    label: function (ele) {
                        return ele.data("label");
                    },
                }
            },
            {
                selector: '.edgeShowText',
                style: {
                    label: function (ele) {
                        return ele.data("label");
                    },
                }
            },
            {
                selector: '.lineFixed',// 加载完成后，加载该类，修复线有锯齿的问题
                style: {
                    'overlay-opacity':0,
                }
            },
        ],
    });

    cy.on('click', 'node', function(evt){
        if(evt.target._private.style['z-index'].value == 20) { // 非暗淡状态
            _isFocus = true;
            var node = evt.target;

            highLight([node._private.data.id],cy);

            if(node.hasClass("nodeActive")){
                activeNode = null;
                $('#company-detail').hide();
                node.removeClass("nodeActive");
                cy.collection("edge").removeClass("edgeActive");
            }else{
                var nodeData = node._private.data;
                if(nodeData.type == 'Company'){
                    // showDetail2(nodeData.keyNo,'company_muhou3');
                    cy.collection("node").addClass('nodeDull');
                } else {
                    // showDetail2(nodeData.keyNo,'company_muhou3','person');
                    cy.collection("node").addClass('nodeDull');
                }

                activeNode = node;
                cy.collection("node").removeClass("nodeActive");

                cy.collection("edge").removeClass("edgeActive");
                node.addClass("nodeActive");
                node.neighborhood("edge").removeClass("opacity");
                node.neighborhood("edge").addClass("edgeActive");
                node.neighborhood("edge").connectedNodes().removeClass("opacity");
            }
            //_firstTab = false;
        } else {
            _isFocus = false;
            activeNode = null;
            cy.collection("node").removeClass("nodeActive");
            $('.tp-detail').fadeOut();
            cancelHighLight();
        }
    });
    var showTipsTime = null;
    cy.on('mouseover', 'node', function(evt){
        if(evt.target._private.style['z-index'].value == 20){ // 非暗淡状态
            //
            $("#Main").css("cursor","pointer");

            //
            var node = evt.target;
            node.addClass('nodeHover');
            if(!_isFocus){
                cy.collection("edge").removeClass("edgeShow");
                cy.collection("edge").removeClass("edgeActive");
                node.neighborhood("edge").addClass("edgeActive");
            }

            // 提示
            clearTimeout(showTipsTime);
            //if(node._private.data.name.length > 13 || (node._private.data.keyNo[0] == 'p' && node._private.data.name.length > 3) || node._private.data.layout.revel > 2){
            if(node._private.data.name.length > 13 || (node._private.data.keyNo && node._private.data.keyNo[0] == 'p' && node._private.data.name.length > 3)){
                showTipsTime = setTimeout(function () {
                    var name = node._private.data.name;


                    // 显示在节点位置
                    /*var tipWidth = name.length * 12 + 16;
                    var x = node._private.data.d3x + 655 - (tipWidth / 2);
                    var y = node._private.data.d3y + 598;
                    if(node._private.data.type == 'Person'){
                        y = node._private.data.d3y + 590;
                    }*/


                    // 显示在鼠标位置
                    var event = evt.originalEvent ||window.event;
                    var x = event.clientX + 10;
                    var y = event.clientY + 10;

                    var html = "<div class='tips' style='font-size:12px;background:white;box-shadow:0px 0px 3px #999;border-radius:1px;opacity:1;padding:1px;padding-left:8px;padding-right:8px;display:none;position: absolute;left:"+ x +"px;top:"+ y +"px;'>"+ name +"</div>";
                    $('body').append($(html));
                    $('.tips').fadeIn();
                },600);
            }
        }
    });
    cy.on('mouseout', 'node', function(evt){
        $("#Main").css("cursor","default");

        // 提示
        $('.tips').fadeOut(function () {
            $('.tips').remove();
        });

        clearTimeout(showTipsTime);

        //
        var node = evt.target;
        node.removeClass('nodeHover');
        if(!_isFocus){
            cy.collection("edge").removeClass("edgeActive");
            /*if(moveTimeer){
                clearTimeout(moveTimeer);
            }*/
            /*moveTimeer = setTimeout(function() {
                cy.collection("edge").addClass("edgeActive");
                //cy.collection("edge").addClass("edgeShow");
            }, 300);
            if(activeNode){
                activeNode.neighborhood("edge").addClass("edgeActive");
            }*/
        }
    });
    cy.on('mouseover', 'edge', function(evt){
        if(!_isFocus){
            var edge = evt.target;
            /*if(moveTimeer){
                clearTimeout(moveTimeer);
            }*/
            cy.collection("edge").removeClass("edgeActive");
            edge.addClass("edgeActive");
            /*if(activeNode){
                activeNode.neighborhood("edge").addClass("edgeActive");
            }*/
        }

    });
    cy.on('mouseout', 'edge', function(evt){
        if(!_isFocus){
            var edge = evt.target;
            edge.removeClass("edgeActive");
            // moveTimeer = setTimeout(function() {
            //     cy.collection("edge").addClass("edgeActive");
            //     //cy.collection("edge").addClass("edgeShow");
            // }, 400);
            if(activeNode){
                activeNode.neighborhood("edge").addClass("edgeActive");
            }
        }

    });
    cy.on('vmousedown', 'node', function(evt){
        var node = evt.target;
        if(!_isFocus){
            highLight([node._private.data.id],cy);
        }
    });
    cy.on('tapend', 'node', function(evt){
        if(!_isFocus){
            cancelHighLight();
        }
    });

    cy.on('click', 'edge', function(evt){
        _isFocus = false;
        activeNode = null;
        cy.collection("node").removeClass("nodeActive");
        $('.tp-detail').fadeOut();
        cancelHighLight();
    });
    cy.on('click', function(event){
        var evtTarget = event.target;

        if( evtTarget === cy ){
            _isFocus = false;
            activeNode = null;
            cy.collection("node").removeClass("nodeActive");
            $('.tp-detail').fadeOut();
            cancelHighLight();
            focusCancel();
            filterReset();

            //cy.collection("edge").addClass("edgeActive");
        } else {
            //console.log('tap on some element');
        }
    });

    cy.on('zoom',function(){
        if(cy.zoom()<0.5){
            cy.collection("node").addClass("hidetext");
            cy.collection("edge").addClass("hidetext");
        }else{
            cy.collection("node").removeClass("hidetext");
            cy.collection("edge").removeClass("hidetext");
        }

        // 加载完成后，加载该类，修复线有锯齿的问题
        setTimeout(function () {
            cy.collection("edge").removeClass("lineFixed");
            cy.collection("edge").addClass("lineFixed");
        },200);
    })

    cy.on('pan',function () {
        // 加载完成后，加载该类，修复线有锯齿的问题
        setTimeout(function () {
            cy.collection("edge").removeClass("lineFixed");
            cy.collection("edge").addClass("lineFixed");
        },200);
    });

    // // 定位
    cy.nodes().positions(function( node, i ){
        // 保持居中
        if(node._private.data.keyNo == _currentKeyNo){
            var position= cy.pan();
            cy.pan({
                x: position.x-node._private.data.d3x,
                y: position.y-node._private.data.d3y
            });
        }

        //
        return {
            x: node._private.data.d3x,
            y: node._private.data.d3y
        };
    });

    cy.ready(function () {


        if(!$('#TrTxt').hasClass('active')){
            $('#TrTxt').click();
        }

        cy.zoom({
            level: 1.0000095043745896, // the zoom level
        });
        $("#load_data").hide();
        //cy.$('#'+id).emit('tap');
        //cy.center(cy.$('#'+id));
        //cy.collection("edge").addClass("edgeActive");

        // 加载完成后，加载该类，修复线有锯齿的问题
        setTimeout(function () {
            cy.collection("edge").addClass("lineFixed");
        },400);
    });

    cy.nodes(function (node) {

        /*
        // 当前查询节点关系文字显示
        if(node._private.data.nodeId == _rootNode.nodeId){
            node.neighborhood("edge").addClass("edgeLevel1");
        }*/
    });
}
function highLight(nodeIds,cy) {
    cy.collection("node").removeClass("nodeActive");
    cy.collection("edge").removeClass("edgeActive");
    cy.collection("node").addClass('dull');
    cy.collection("edge").addClass('dull');

    for(var i = 0; i < nodeIds.length; i++){
        var nodeId = nodeIds[i];
        cy.nodes(function (node) {
            var nodeData  = node._private.data;
            if(nodeData.id == nodeId){
                node.removeClass('dull');
                //node.addClass('nodeActive');
                node.neighborhood("edge").removeClass("dull");
                node.neighborhood("edge").addClass("edgeActive");
                node.neighborhood("edge").connectedNodes().removeClass("dull");
                //node.neighborhood("edge").connectedNodes().addClass("nodeActive");
            }
        });
    }
}
function highLightFilter(nodeIds,cy) {
    function isInNodeIds(nodeId) {
        for(var i = 0; i < nodeIds.length; i++){
            if(nodeId == nodeIds[i]){
                return true;
                break;
            }
        }
        return false;
    }

    cy.collection("node").removeClass("nodeActive");
    cy.collection("edge").removeClass("edgeActive");
    cy.collection("node").addClass('dull');
    cy.collection("edge").addClass('dull');


    for(var i = 0; i < nodeIds.length; i++){
        var nodeId = nodeIds[i];
        cy.nodes(function (node) {
            var nodeData  = node._private.data;
            if(nodeData.id == nodeId){
                node.removeClass('dull');
                //node.addClass('nodeActive');
                /*node.neighborhood("edge").removeClass("dull");
                node.neighborhood("edge").addClass("edgeActive");
                node.neighborhood("edge").connectedNodes().removeClass("dull");*/
                //node.neighborhood("edge").connectedNodes().addClass("nodeActive");
            }
        });
    }

    cy.edges(function (edge) {
        var data = edge._private.data;
        if(isInNodeIds(data.target) && isInNodeIds(data.source)){
            edge.removeClass('dull');
            edge.addClass('edgeActive');
        }
    });
}
function cancelHighLight() {
    cy.collection("node").removeClass("nodeActive");
    cy.collection("edge").removeClass("edgeActive");
    cy.collection("node").removeClass('dull');
    cy.collection("edge").removeClass('dull');
}

/**其他*/

function getD3Position(graph) {
    getLayoutNode(graph);

    function filterLinks1(graph) {
        // 筛选用于布局的links
        var layoutLinks = [];
        for(var i = 0; i < graph.links.length; i++){
            var link = graph.links[i];
            var sourceLevel = link.sourceNode.layout.level;
            var targetLevel = link.targetNode.layout.level;

            if((sourceLevel == 1 && targetLevel == 2) || (sourceLevel == 2 && targetLevel == 1) ){
                layoutLinks.push(link);
            }
            if((sourceLevel == 2 && targetLevel == 3) || (sourceLevel == 3 && targetLevel == 2) ){
                layoutLinks.push(link);
            }
        }

        layoutLinks.forEach(function (link,i) {

            if(link.targetNode.layout.level == 3){
                layoutLinks.forEach(function (alink,j) {
                    if(alink.linkId != link.linkId &&
                        (alink.targetNode.nodeId == link.targetNode.nodeId || alink.sourceNode.nodeId == link.targetNode.nodeId)){
                        layoutLinks.splice(j,1);
                    }
                })
            }

            if(link.sourceNode.layout.level == 3){
                layoutLinks.forEach(function (alink,j) {
                    if(alink.linkId != link.linkId &&
                        (alink.targetNode.nodeId == link.sourceNode.nodeId || alink.sourceNode.nodeId == link.sourceNode.nodeId)){
                        layoutLinks.splice(j,1);
                    }
                })
            }
        })

        return layoutLinks;
    }

    function initD3Data(graph) { //
        function getIndex(val,arr) {
            var index = 0;
            for(var i = 0; i < arr.length; i++){
                var obj = arr[i];
                if(val == obj.nodeId){
                    index = i;
                    break;
                }
            }
            return index;
        }

        /*封装符合d3的数据*/
        for(var i = 0; i < graph.nodes.length; i++){
            var node = graph.nodes[i];
            node.id = node.nodeId;
        }

        for(var i = 0; i < graph.links.length; i++){
            var link = graph.links[i];
            link.source = getIndex(link.sourceNode.nodeId, graph.nodes) ;
            link.target = getIndex(link.targetNode.nodeId, graph.nodes) ;
            link.index = i; //
        }

        graph.layoutLinks = filterLinks1(graph);

        // 围绕节点最大数值
        setSingleLinkNodes(graph.layoutLinks);
        graph.nodes.forEach(function(node,i){
            if(node.layout.singleLinkChildren.length && _maxChildrenLength < node.layout.singleLinkChildren.length){
                _maxChildrenLength = node.layout.singleLinkChildren.length
            }
        })
        //console.log('围绕节点最大数值:' + _maxChildrenLength);
    }

    initD3Data(graph); //

    var width = $("#MainD3 svg").width();
    var height = $("#MainD3 svg").height();

    var strength = -600,distanceMax = 330,theta = 0,distance = 130,colideRadius = 35,distanceMin = 400;
    // 根据节点数量调节
    if(graph.nodes.length < 50 ){
        strength = -800;distanceMax = 400;
    } else if( graph.nodes.length > 50 && graph.nodes.length < 100 ){
        strength = -800;distanceMax = 350;distance = 130;colideRadius = 35;
    } else if(graph.nodes.length > 100 && graph.nodes.length < 150){
        strength = -900;distanceMax = 450;
    } else if (graph.nodes.length > 150 && graph.nodes.length < 200) {
        strength = -1000; distanceMax = 500;
    } else if (graph.nodes.length > 200) {
        strength = -1600; distanceMax = 500;theta = 0.6,distance = 100,colideRadius = 35;
    }
    // 根据围绕数量调节
    if(_maxChildrenLength > 50 && _maxChildrenLength < 100){
        strength = -2000; distanceMax = 500;
    } else if(_maxChildrenLength > 1000 && _maxChildrenLength < 2000) {
        strength = -4000; distanceMax = 1500;
    }

    d3.forceSimulation(graph.nodes)
        .force('charge', d3.forceManyBody().strength(strength).distanceMax(distanceMax).theta(theta))
        .force('link', d3.forceLink(graph.layoutLinks).distance(distance))
        // .force('center', d3.forceCenter(width / 2, height / 2))
        // .force('collide', d3.forceCollide().radius(function () { return colideRadius;}))
}

/** d3 svg */
/*var svg = d3.select('svg');
svg.selectAll('g').remove();// 清空
var svg_g = svg.append("g")

// 结点
var svg_nodes = svg_g.selectAll('circle')
    .enter().append('circle')
    .attr('r', function (d) {
        if(d.data.obj.labels[0] == 'Company'){
            return 33;
        } else {
            return 24;
        }
    })
    .attr('fill', function(d, i) {
        return d.data.color;
    })
    .style('opacity',1)*/
/** end d3 svg */


/*function ticked() {
    svg_nodes.attr("cx", function(d) {  return d.x; })
        .attr("cy", function(d) { return d.y; });
}*/

//设置符合Layout的node
function getLayoutNode(graphData) {
    var layoutNode = { current : _rootNode, level1 : [], level2 : [], level3 : [], level4 : [], level5 : [],other:[]};

    graphData.nodes.forEach(function (node,i) {
        switch (node.layout.level) {
            case 1: layoutNode.level1.push(node);break;
            case 2: layoutNode.level2.push(node);break;
            case 3: layoutNode.level3.push(node);break;
            case 4: layoutNode.level4.push(node);break;
            case 5: layoutNode.level5.push(node);break;
            default:layoutNode.other.push(node);break;
        }
    });

    _layoutNode = layoutNode;

    return layoutNode;
}
//将rootData转换成cy图谱框架所需要的数据结构
function transformData(graphData) {
    function getLinkColor(type) {
        if(type == 'INVEST'){
            return _COLOR.line.invest;
        } else if(type == 'EMPLOY') {
            return _COLOR.line.employ;
        } else if(type == 'LEGAL') {
            return _COLOR.line.legal;
        }
    }
    function getLinkLabel(link) {
        var type = link.data.obj.type, role = link.data.obj.properties.role;
        if(type == 'INVEST'){
            return '投资';
        } else if(type == 'EMPLOY') {
            return (role ? role : '任职');
        } else if(type == 'LEGAL') {
            return '法定代表人';
        }
    }
    //getLayoutNode(graphData);

    //
    id = graphData.nodes[0].nodeId;
    var els = {};
    els.nodes = [];
    els.edges = [];

    graphData.links.forEach(function (link,i) {
        var color = getLinkColor(link.data.obj.type);
        var label = getLinkLabel(link);

        els.edges.push({
            data:{
                data:link.data,
                color: color,
                id:link.linkId,
                label:label,
                source:link.sourceNode.nodeId,
                target:link.targetNode.nodeId
            },
            classes:'autorotate'
        });
    });

    graphData.nodes.forEach(function (node) {
        els.nodes.push({
            data:{
                nodeId:node.nodeId,
                type:node.data.obj.labels[0],
                keyNo:node.data.obj.properties.keyNo,
                data:node.data,
                id:node.nodeId,
                name:node.data.obj.properties.name,
                category:node.data.category,
                color:node.data.color,
                borderColor:node.data.strokeColor,
                layout:node.layout,
                d3x:node.x,
                d3y:node.y,
                hasImage:node.data.obj.properties.hasImage,
                //labelLine:1 // 解决文字行距问题，第1行
            }
        });
    });

    return els;
}
// 图谱、筛选面板更新
function domUpdate(graphData) {
    getD3Position(graphData);
    setTimeout(function () {
        drawGraph(transformData(graphData));
    },500);

    selPanelUpdateList(graphData.nodes,graphData.links,true);
}

//截图2
function downImg(imgdata){
    var type = 'png';
    //将mime-type改为image/octet-stream,强制让浏览器下载
    var fixtype = function (type) {
        type = type.toLocaleLowerCase().replace(/jpg/i, 'jpeg');
        var r = type.match(/png|jpeg|bmp|gif/)[0];
        return 'image/' + r;
    }
    imgdata = imgdata.replace(fixtype(type), 'image/octet-stream')
    //将图片保存到本地
    var saveFile = function (data, filename) {
        var link = document.createElement('a');
        link.href = data;
        link.download = filename;
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        link.dispatchEvent(event);
    }
    var filename = new Date().toLocaleDateString() + '.' + type;
    saveFile(imgdata, filename);
}
//截图2 IE
function downloadimgIE(canvas) {
    function post(URL, PARAMS) {
        var temp = document.createElement("form");
        temp.action = URL;
        temp.enctype = "multipart/form-data";
        temp.method = "post";
        temp.style.display = "none";
        for (var x in PARAMS) {
            var opt = document.createElement("textarea");
            opt.name = x;
            opt.value = PARAMS[x];
            temp.appendChild(opt);
        }
        document.body.appendChild(temp);
        temp.submit();
        return temp;
    }

    var qual = 1;
    if(canvas.width>3000){
        qual = 0.5;
    }else if(canvas.width>5000){
        qual = 0.4;
    }
    //设置保存图片的类型
    var imgdata = canvas.toDataURL('image/jpeg',qual);
    //var filename = '{{$smarty.get.name}}的关联图谱_'+new Date().toLocaleDateString() + '.jpeg';
    // var filename = _FILENAME + '的关联图谱.png';
    var filename = '企查查_图谱.png';
    post(INDEX_URL+'cms_downloadimg?filename='+filename, {img:imgdata});
}
//截图1
function canvasImg(imgData){
    var img = new Image();

    img.onload = function(e){

        var canvas = document.createElement('canvas');  //准备空画布
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');  //取得画布的2d绘图上下文
        context.fillStyle = "#fff";
        context.fillRect(0,0,canvas.width,canvas.height);

        context.drawImage(img, 0, 0);

        if(canvas.width>400){
            var marker = '关联图谱由企查查基于公开信息利用大数据分析引擎独家生成';
            context.font = "28px 微软雅黑";
            context.fillStyle = "#aaaaaa";
            context.fillText(marker, canvas.width/2-context.measureText(marker).width/2, canvas.height-30);
        }

        var shuiying = new Image();
        shuiying.src="/material/theme/chacha/cms/v2/images/shuiying.png";
        if(canvas.width>320){
            context.drawImage(shuiying, canvas.width/2-160, canvas.height/2-80,320,160);
        }else{
            context.drawImage(shuiying, canvas.width/2-80, canvas.height/2-40,160,80);
        }

        downloadimgIE(canvas);

        /*if(!!window.ActiveXObject || "ActiveXObject" in window){ // ie
            context.drawImage(shuiying, canvas.width/2-160, canvas.height/2-80,320,160);
            downloadimgIE(canvas);
        } else {
            downImg(canvas.toDataURL('image/jpeg',1));
        }*/
    }

    img.src = imgData;
}


function getData(keyNo,param, re){
    var defaultParam = {
        keyNo:keyNo,
    }
    _currentKeyNo = keyNo;

    if( keyNo.substr(0, 1) == "p"){
        defaultParam.startLabel = 'Person';
    }

    param = $.extend(defaultParam,param);

    $("#load_data").show();

    // var url = INDEX_URL + '/company_muhouPersonAction';
    // if(_TUPU_URL){
    //     url = _TUPU_URL;
    // }
    _rootData = getRootData(re.results[0].data);
    
    domUpdate(_rootData);
    // $.ajax({
    //     url:url,
    //     //url:'http://10.0.0.38:9600/api/Graph/GetCompanyGraph',
    //     type: 'GET',
    //     data:param,
    //     dataType: 'JSON',
    //     success: function (re){

    //         /*大咖搜索地址栏补足keyNo*/
    //         if(window.location.pathname == '/company_muhouperson'){
    //             history.pushState('','','company_muhouperson?keyNo='+_currentKeyNo);
    //         }

    //         re = re.success;
    //         if( !re || re.results == undefined || !re.results[0] || !re.results[0].data.length || re.results[0].data[0].graph.nodes.length == 0){
    //             $("#load_data").hide();
    //             $(".printLogo").hide();
    //             $(".tp-foot").hide();
    //             $("#Main").hide();
    //             $('#no_data').show();
    //             return;
    //         } else {
    //             $(".printLogo").show();
    //             $(".tp-foot").show();
    //             $("#Main").show();
    //             $('#no_data').hide();
    //         }

    //         _rootData = getRootData(re.results[0].data);

    //         domUpdate(_rootData);
    //     },error:function(data){
    //         $("#load_data").hide();
    //         $(".printLogo").hide();
    //         $(".tp-foot").hide();
    //         $("#Main").hide();
    //         $('#no_data').show();
    //     }
    // });
}

function refresh(keyNo) {
    $('.company-detail').fadeOut();
    $('#MainCy').html('');
    _currentKeyNo = keyNo;
    $('#TrTxt').removeClass('active');
    getData(_currentKeyNo);
    focusCancel();
    filterReset();

    //页面
    try{
        hideSearchBoxHide();
    }catch (e){}
}

/**详情弹窗*/
function showPerTupu(type){
    var canshow = $("#ShowPerTupu").attr('canshow');
    if(canshow){
        var keyNo = $("#ShowPerTupu").attr('keyno');
        refresh(keyNo);
    }
}
/*关闭详情*/
function popclose(dom){
    $(dom).parent().parent().fadeOut();
}
/*人物头像没有时处理*/
function personImgErr() {
    var name = $(".ea_name").text();
    $('#face_oss').hide();
    $('.ea_defaultImg').show();
    $('.ea_defaultImg').text(name[0]);
}
/**END 详情弹窗*/

var dataText = {"success":{"results":[{"columns":["value"],"data":[{"graph":{"nodes":[{"id":"44514466","labels":["Company"],"properties":{"keyNo":"c23b6b550adf134c5400b6ad4ead1b89","registCapi":"2500.0","name":"\u6b66\u6c49\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"32506361","labels":["Company"],"properties":{"keyNo":"8e014bf23bb45f24df37538ceb971b57","registCapi":"5000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u836f\u4e1a\u6295\u8d44\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"2415662","labels":["Company"],"properties":{"keyNo":"0aaec725e23843a9ebe336ca91f2c48e","registCapi":"60.0","name":"\u6df1\u5733\u534e\u5927\u7eff\u500d\u6295\u8d44\u5408\u4f19\u4f01\u4e1a(\u6709\u9650\u5408\u4f19)","econKind":"\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"2423350","labels":["Company"],"properties":{"keyNo":"0ab7435145d0323d40430cd9c1454554","registCapi":"1000.0","name":"\u5e7f\u897f\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"142536812","labels":["Person"],"properties":{"keyNo":"pf70c97bf3b5ef7d73a03f07b128e73c","role":"\u8463\u4e8b\u957f","name":"\u5f90\u8baf","hasImage":false}},{"id":"112143029","labels":["Person"],"properties":{"keyNo":"p9a7d9cd9eb0001c4e10d4dc51ef1a60","role":"\u76d1\u4e8b","name":"\u6768\u7115\u660e","hasImage":false}},{"id":"964117","labels":["Company"],"properties":{"keyNo":"04474133ee0cbb6c3c3d1b2cbb524479","registCapi":"1058.85","name":"\u84dd\u8272\u5f69\u8679(\u6df1\u5733)\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"53674258","labels":["Company"],"properties":{"keyNo":"ea1ac2f538dceb970d697215ef85352f","registCapi":"300.0","name":"\u5c71\u4e1c\u7eff\u73af\u751f\u7269\u6280\u672f\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"4686432","labels":["Company"],"properties":{"keyNo":"1498d378fb9efa5ef1fc60fb8ca71652","registCapi":"1000.0","name":"\u5e7f\u5dde\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"140238449","labels":["Person"],"properties":{"keyNo":"pf0093f1c9e30c9518375003fa6771f6","role":"\u76d1\u4e8b","name":"\u5f20\u8000\u4eae","hasImage":false}},{"id":"145186454","labels":["Person"],"properties":{"keyNo":"pff22e626ea21885d73a60b9ff188a4a","role":"\u76d1\u4e8b","name":"\u725f\u5cf0","hasImage":false}},{"id":"42929850","labels":["Company"],"properties":{"keyNo":"bb538d7ead047ca2540d6b5b51fd80fe","registCapi":"5000.0","name":"\u4e91\u5357\u4e2d\u6c47\u5b9e\u4e1a\u6295\u8d44\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"47916268","labels":["Company"],"properties":{"keyNo":"d108a6b8d4d648334ae32dee70286124","registCapi":"2000.0","name":"\u4e1c\u839e\u5e02\u4e07\u79d1\u5efa\u7b51\u6280\u672f\u7814\u7a76\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u975e\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"42064057","labels":["Company"],"properties":{"keyNo":"b79041f5193ed8a0c57b24493326156b","registCapi":"1000.0","name":"\u6b66\u6c49\u534e\u5927\u836f\u4e1a\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"91206999","labels":["Person"],"properties":{"keyNo":"p5afe648831a98c969fc8a5300fa74ab","role":"\u8463\u4e8b","name":"\u5218\u7ea2\u7f28","hasImage":false}},{"id":"57898826","labels":["Company"],"properties":{"keyNo":"fc83d3858870b77a4297509d58ebef2f","registCapi":"500.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u7269\u6d41\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"115940527","labels":["Person"],"properties":{"keyNo":"pa608a6f9fa67cfc5e7b2e79151567a9","role":"\u81ea\u7136\u4eba\u80a1\u4e1c","name":"\u8d75\u7acb\u89c1","hasImage":false}},{"id":"25715151","labels":["Company"],"properties":{"keyNo":"7099a566eaa48a0a6a598bbdca4b6653","registCapi":"1000.0","name":"\u6df1\u5733\u5947\u8ff9\u4e4b\u5149\u521b\u4e1a\u6295\u8d44\u4f01\u4e1a(\u6709\u9650\u5408\u4f19)","econKind":"\u6709\u9650\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"8473798","labels":["Company"],"properties":{"keyNo":"25390380404d0c94a1d2094180deac7d","registCapi":"1000.0","name":"\u5c71\u4e1c\u51ef\u8fbe\u73af\u4fdd\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1)","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"33499575","labels":["Company"],"properties":{"keyNo":"9252d9bb76ad316b7a2e4720e6c7747b","registCapi":"1000.0","name":"\u65b0\u7586\u4e1d\u8def\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"50049713","labels":["Company"],"properties":{"keyNo":"da5397a76b4f194c043fbce7f462a448","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u7ec6\u80de\u79d1\u6280\u6709\u9650\u8d23\u4efb\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"45212385","labels":["Company"],"properties":{"keyNo":"c545e8c1c3137c9055184e812e686856","registCapi":"500.0","name":"\u6df1\u5733\u5e02\u5723\u6734\u9a8f\u8f89\u5065\u5eb7\u7ba1\u7406\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"118919503","labels":["Person"],"properties":{"keyNo":"paf1ac304dfa45eb0f5a258df29ca86f","role":"","name":"\u53f6\u846d","hasImage":false}},{"id":"76826826","labels":["Person"],"properties":{"keyNo":"p2f82f176161e5475802d55ffa62ac81","role":"","name":"\u5f90\u519b\u6c11","hasImage":false}},{"id":"115701435","labels":["Person"],"properties":{"keyNo":"pa54e5110409b4c573f0f9204215857a","role":"","name":"\u5f20\u8015\u8018","hasImage":false}},{"id":"96345052","labels":["Person"],"properties":{"keyNo":"p6a9225641c9d23c87ddccb08684a0d9","role":"\u8463\u4e8b","name":"\u6c6a\u5efa","hasImage":true}},{"id":"7773720","labels":["Company"],"properties":{"keyNo":"22218758d5551556e6f66060511e91a8","registCapi":"1500.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u751f\u7269\u533b\u5b66\u5de5\u7a0b\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"75852031","labels":["Person"],"properties":{"keyNo":"p2c925fd1697834e36fbce6b9a2a72ea","role":"\u81ea\u7136\u4eba\u80a1\u4e1c","name":"\u8881\u56fd\u4fdd","hasImage":false}},{"id":"15306903","labels":["Company"],"properties":{"keyNo":"4367a54b181aae106bbaf826a72c8076","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u5bb6\u56ed\u5efa\u8bbe\u53d1\u5c55\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"80631881","labels":["Person"],"properties":{"keyNo":"p3b01a7b936dbcfa0df06653104b16f1","role":"\u8463\u4e8b","name":"\u5f20\u79c0\u6e05","hasImage":false}},{"id":"30895448","labels":["Company"],"properties":{"keyNo":"870093d699be933cefa576e768fa04f5","registCapi":"2000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u751f\u7269\u533b\u7597\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"19839419","labels":["Company"],"properties":{"keyNo":"570b774f4ec45cc43a01e7d2da15c1f5","registCapi":"200.0","name":"\u6b66\u6c49\u534e\u5927\u57fa\u56e0\u9274\u5b9a\u6280\u672f\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u975e\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"19329469","labels":["Company"],"properties":{"keyNo":"54d63937ff343ad06049270acb31afcb","registCapi":"3573.33","name":"\u6b66\u6c49\u534e\u5927\u5409\u8bfa\u56e0\u751f\u7269\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u4e2d\u5916\u5408\u8d44)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"12528670","labels":["Company"],"properties":{"keyNo":"371d58dc7facc975d09c35073956b943","registCapi":"901.0","name":"\u6df1\u5733\u5e02\u878d\u9f0e\u6656\u6295\u8d44\u7ba1\u7406\u4e2d\u5fc3(\u6709\u9650\u5408\u4f19)","econKind":"\u6709\u9650\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"110183989","labels":["Person"],"properties":{"keyNo":"p948a44b5ae4610608516e8a83072bcf","role":"\u81ea\u7136\u4eba\u80a1\u4e1c","name":"\u5218\u9753","hasImage":false}},{"id":"10897921","labels":["Company"],"properties":{"keyNo":"2fe93b3ebd738fc13a603167dfd97df7","registCapi":"2000.0","name":"\u4e91\u5357\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"44890140","labels":["Company"],"properties":{"keyNo":"c3dd7b2f8f05720c7f173e97dce227e4","registCapi":"2000.0","name":"\u4e91\u5357\u534e\u5927\u57fa\u56e0\u533b\u5b66\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"124254673","labels":["Person"],"properties":{"keyNo":"pbf51d9b8a296284f090175f5db819cf","role":"\u76d1\u4e8b","name":"\u738b\u4fca","hasImage":false}},{"id":"64205668","labels":["Person"],"properties":{"keyNo":"p09708f5b0a747ca6441b6131a9bd61b","role":"\u8463\u4e8b","name":"\u53f6\u5b89\u5e73","hasImage":false}},{"id":"144042028","labels":["Person"],"properties":{"keyNo":"pfba31fcd20a344e4a23bb39853f1c79","role":"\u8463\u4e8b","name":"\u5f20\u6d77\u5cf0","hasImage":false}},{"id":"3931264","labels":["Company"],"properties":{"keyNo":"114ea3ad53af9159efa3f8d66bf1af2f","registCapi":"12120.0","name":"\u6df1\u5733\u5947\u8ff9\u80a1\u6743\u6295\u8d44\u4f01\u4e1a(\u6709\u9650\u5408\u4f19)","econKind":"\u6709\u9650\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"16771135","labels":["Company"],"properties":{"keyNo":"49be15cf27ff98949bb7396cb855eba2","registCapi":"10000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"18248148","labels":["Company"],"properties":{"keyNo":"50253898959c90cffde562e60af57c04","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u8fd0\u52a8\u63a7\u80a1\u6709\u9650\u8d23\u4efb\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"3799291","labels":["Company"],"properties":{"keyNo":"10bacbe2ecb6796191dbd7e8ea3849b2","registCapi":"1000.0","name":"\u6d77\u5357\u534e\u5927\u6d77\u6d0b\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"26359639","labels":["Company"],"properties":{"keyNo":"7360afde6a472f59ab73a9ca51925666","registCapi":"800.0","name":"\u5357\u4eac\u534e\u5927\u533b\u5b66\u68c0\u9a8c\u6240\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"24223161","labels":["Company"],"properties":{"keyNo":"6a264de641e39134fe2d8a12d381bc51","registCapi":"20.0","name":"\u6df1\u5733\u751f\u534e\u4e8c\u53f7\u751f\u7269\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"10627695","labels":["Company"],"properties":{"keyNo":"2eb834b08063db9a0a7b0d2c5dcf51c3","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u7814\u7a76\u53d1\u5c55\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"50368461","labels":["Company"],"properties":{"keyNo":"dbb6c7366684263c14279658739f1acb","registCapi":"30000.0","name":"\u957f\u5149\u534e\u5927\u57fa\u56e0\u6d4b\u5e8f\u8bbe\u5907(\u957f\u6625)\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"7333555","labels":["Company"],"properties":{"keyNo":"203098a3d1b50cac6dacb64d714cd5a0","registCapi":"3316.8351","name":"\u534e\u661f\u73af\u7403(\u6df1\u5733)\u519c\u4e1a\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"51713009","labels":["Company"],"properties":{"keyNo":"e192b875371e16a19bcf3c5243aa563b","registCapi":"2000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u8f6f\u4ef6\u6280\u672f\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"12793386","labels":["Company"],"properties":{"keyNo":"384cd42cc5d6695b18402ecbd1e6e8f4","registCapi":"1000.0","name":"\u6b66\u6c49\u534e\u5927\u667a\u9020\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u5916\u5546\u6295\u8d44\u4f01\u4e1a\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"74003591","labels":["Person"],"properties":{"keyNo":"p26fc780aadb7d54a160b3a798ce9877","role":"\u6267\u884c\u8463\u4e8b","name":"\u6885\u6c38\u7ea2","hasImage":false}},{"id":"8632940","labels":["Company"],"properties":{"keyNo":"25edc190a2128567378b65ab604847de","registCapi":"4992.5","name":"\u6df1\u5733\u524d\u6d77\u534e\u5927\u57fa\u56e0\u6295\u8d44\u4f01\u4e1a(\u6709\u9650\u5408\u4f19)","econKind":"\u6709\u9650\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"13348410","labels":["Company"],"properties":{"keyNo":"3ac841e1d20bbdf52a57ada32de2e606","registCapi":"2000.0","name":"\u6df1\u5733\u534e\u5927\u6cd5\u533b\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"54134728","labels":["Company"],"properties":{"keyNo":"ec1a88e501bf00bf49847a6f706abd31","registCapi":"1222.2221","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u79d1\u6280\u670d\u52a1\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u53f0\u6e2f\u6fb3\u4e0e\u5883\u5185\u5408\u8d44)","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"111759451","labels":["Person"],"properties":{"keyNo":"p9953485062e1d1d5909372cc1a1f3b1","role":"\u76d1\u4e8b","name":"\u80e1\u5efa\u52cb","hasImage":false}},{"id":"45318726","labels":["Company"],"properties":{"keyNo":"c5bc70cde8d4c7845044074c21fc28a5","registCapi":"1000.0","name":"\u897f\u85cf\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u975e\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"126461823","labels":["Person"],"properties":{"keyNo":"pc6095639613d6c9125c18e200d325a8","role":"\u8463\u4e8b","name":"\u848b\u73ae\u57ce","hasImage":false}},{"id":"14646310","labels":["Company"],"properties":{"keyNo":"4085cd6afbf530d324ab3c45c2c084ed","registCapi":"2000.0","name":"\u6df1\u5733\u534e\u5927\u4e34\u5e8a\u68c0\u9a8c\u4e2d\u5fc3","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"34981097","labels":["Company"],"properties":{"keyNo":"98c5dc7bbebb2c94db67a071a0d49325","registCapi":"5500.0","name":"\u6df1\u5733\u534e\u5927\u4e09\u751f\u56ed\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"28782263","labels":["Company"],"properties":{"keyNo":"7dd4e0477abe98298e379774f2178d02","registCapi":"10000.0","name":"\u6df1\u5733\u534e\u5927\u6d77\u6d0b\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"34367754","labels":["Company"],"properties":{"keyNo":"9619a41356e78eabb22426132bd9463f","registCapi":"15000.0","name":"\u6df1\u5733\u5e02\u677e\u79be\u521b\u4e1a\u6295\u8d44\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"18447378","labels":["Company"],"properties":{"keyNo":"51017569f15baa0cb8327027aee80934","registCapi":"2000.0","name":"\u6df1\u5733\u7eff\u500d\u751f\u6001\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"84888593","labels":["Person"],"properties":{"keyNo":"p47e0c2625161309ca8f772b27183a7c","role":"\u76d1\u4e8b","name":"\u7a0b\u4e50","hasImage":false}},{"id":"15237066","labels":["Company"],"properties":{"keyNo":"431a21f0c45b13feaaba9ea2de7007d8","registCapi":"2000.0","name":"\u534e\u5927(\u9547\u6c5f)\u6c34\u4ea7\u79d1\u6280\u4ea7\u4e1a\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"40604494","labels":["Company"],"properties":{"keyNo":"b1352ad0469b4facc8027630455e3373","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u4ea7\u4e1a\u6295\u8d44\u57fa\u91d1\u7ba1\u7406\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"58591833","labels":["Company"],"properties":{"keyNo":"ff94cfcd32996919e86d7ebfb6ceaa95","registCapi":"2000.0","name":"\u5929\u6d25\u534e\u5927\u533b\u5b66\u68c0\u9a8c\u6240\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"71873889","labels":["Person"],"properties":{"keyNo":"p208e6f2b72ad89f397089595fa268cc","role":"\u7ecf\u7406","name":"\u90b9\u6d2a\u950b","hasImage":false}},{"id":"13357024","labels":["Company"],"properties":{"keyNo":"3ad20105f54002c904fca0b9cdbff439","registCapi":"1286.5497","name":"\u6df1\u5733\u78b3\u4e91\u667a\u80fd\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"26415267","labels":["Company"],"properties":{"keyNo":"739e40c1e40b4eedb15c1efb86c2e362","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u4f18\u9009\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"20257280","labels":["Company"],"properties":{"keyNo":"58dbe0ec5dafe51bdd12a5a70f17501c","registCapi":"21000.0","name":"\u4e91\u5357\u79d1\u6280\u521b\u4e1a\u6295\u8d44\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"3137817","labels":["Company"],"properties":{"keyNo":"0dd6a18916f600a6feb9778fec8bf61c","registCapi":"800.0","name":"\u4e0a\u6d77\u534e\u5927\u533b\u5b66\u68c0\u9a8c\u6240\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"89161325","labels":["Person"],"properties":{"keyNo":"p54ccf67e9897839cb215b50422edd4e","role":"\u8463\u4e8b","name":"\u5b59\u82f1\u4fca","hasImage":false}},{"id":"15516588","labels":["Company"],"properties":{"keyNo":"444f68238d98c26ebe469bb5502a7c83","registCapi":"10000.0","name":"\u6b66\u6c49\u534e\u5927\u533b\u5b66\u68c0\u9a8c\u6240\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"19636335","labels":["Company"],"properties":{"keyNo":"562a55c29f3a7d7e9eb7b2c75263ba7c","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u878d\u8d44\u79df\u8d41\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u53f0\u6e2f\u6fb3\u4e0e\u5883\u5185\u5408\u8d44)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"44067823","labels":["Company"],"properties":{"keyNo":"c0491dd625a86f1f8512e5a35f98a57a","registCapi":"500.0","name":"\u5317\u4eac\u534e\u5927\u57fa\u56e0\u7814\u7a76\u4e2d\u5fc3\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1)","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"40934177","labels":["Company"],"properties":{"keyNo":"b2a72a85a366c4326fdfe8ffa9888505","registCapi":"100.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u5496\u5561\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"5480200","labels":["Company"],"properties":{"keyNo":"180de83d1b195935a8a8f06313ced1b5","registCapi":"40010.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u80a1\u4efd\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u80a1\u4efd\u6709\u9650\u516c\u53f8(\u4e0a\u5e02)","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"42595798","labels":["Company"],"properties":{"keyNo":"b9dfe0e506c325f5dc03d196e4b0eb6a","registCapi":"1000.0","name":"\u534e\u5927\u5171\u8d62(\u6df1\u5733)\u80a1\u6743\u6295\u8d44\u57fa\u91d1\u7ba1\u7406\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"123535420","labels":["Person"],"properties":{"keyNo":"pbd22164fc0e9c19e61fb690ffa61ef4","role":"\u81ea\u7136\u4eba\u80a1\u4e1c","name":"\u5415\u949f\u9716","hasImage":false}},{"id":"135600509","labels":["Person"],"properties":{"keyNo":"pe1e0d0d5a0f5c3ed990e1517d0a6ac0","role":"\u8463\u4e8b","name":"\u6768\u723d","hasImage":true}},{"id":"58343440","labels":["Company"],"properties":{"keyNo":"fe7b6c0ad07ff7fbe4395814b1b414ca","registCapi":"1000.0","name":"\u897f\u85cf\u5947\u8ff9\u4e4b\u5149\u4f01\u4e1a\u7ba1\u7406\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u975e\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"55770659","labels":["Company"],"properties":{"keyNo":"f3380e90fe544bf617e30b2bffaa16da","registCapi":"1000.0","name":"\u6df1\u5733\u78b3\u4e91\u6295\u8d44\u4f01\u4e1a(\u6709\u9650\u5408\u4f19)","econKind":"\u6709\u9650\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"45308871","labels":["Company"],"properties":{"keyNo":"c5b138639ec0510df9674bebe064f7b4","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u4e92\u8054\u7f51\u4fe1\u606f\u670d\u52a1\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"41092359","labels":["Company"],"properties":{"keyNo":"b35764abf1e0206148e4f0e343eb9c1f","registCapi":"3551.7525","name":"\u6d59\u6c5f\u79be\u8fde\u7f51\u7edc\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1)","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"31495831","labels":["Company"],"properties":{"keyNo":"899ccb2cb9a2fe9ce047e8535bdb40d8","registCapi":"1000.0","name":"\u5e7f\u4e1c\u534e\u5927\u4f18\u5eb7\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"97363633","labels":["Person"],"properties":{"keyNo":"p6da8e541a58e03056d744f04339f596","role":"\u8463\u4e8b\u957f","name":"\u674e\u751f\u658c","hasImage":false}},{"id":"37849919","labels":["Company"],"properties":{"keyNo":"a53e23289560b42e84667a58b52a60c7","registCapi":"5000.0","name":"\u4e2d\u539f\u534e\u5927\u519c\u4e1a\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"11475921","labels":["Company"],"properties":{"keyNo":"3273e1dbd1a92b55e5c167627b639d5e","registCapi":"12000.0","name":"\u4fdd\u5c71\u534e\u5927\u667a\u6167\u519c\u4e1a\u79d1\u6280\u80a1\u4efd\u6709\u9650\u516c\u53f8","econKind":"\u80a1\u4efd\u6709\u9650\u516c\u53f8(\u975e\u4e0a\u5e02\u3001\u56fd\u6709\u63a7\u80a1)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"9316337","labels":["Company"],"properties":{"keyNo":"28f3a5015ce141129e3c999df950600e","registCapi":"1000.0","name":"\u8d35\u5dde\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"26852888","labels":["Company"],"properties":{"keyNo":"758178c060aefc91b69b0cbc5da709b7","registCapi":"50000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u519c\u4e1a\u63a7\u80a1\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"40883181","labels":["Company"],"properties":{"keyNo":"b26e576ef7f948fb7ea606ac22c523b7","registCapi":"2000.0","name":"\u534e\u5927\u751f\u7269\u79d1\u6280(\u6b66\u6c49)\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"43566362","labels":["Company"],"properties":{"keyNo":"be17ef6f8aeb60c85cc6199c5970919c","registCapi":"10000.0","name":"\u6df1\u5733\u78b3\u57fa\u6295\u8d44\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"27479081","labels":["Company"],"properties":{"keyNo":"78342e7c1456f906658000463253f5c6","registCapi":"500.0","name":"\u534e\u5927\u57fa\u56e0\u751f\u7269\u533b\u5b66\u5de5\u7a0b(\u4e0a\u6d77)\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u8fc1\u51fa"}},{"id":"51844765","labels":["Company"],"properties":{"keyNo":"e225f0397299b24ea0600f05010fc50b","registCapi":"800.0","name":"\u5317\u4eac\u534e\u5927\u533b\u5b66\u68c0\u9a8c\u6240\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"26834450","labels":["Company"],"properties":{"keyNo":"756d328f91e6fe18afe13c9f4916cdb3","registCapi":"100.0","name":"\u5929\u6d25\u534e\u5927\u9274\u5b9a\u6280\u672f\u670d\u52a1\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"17946270","labels":["Company"],"properties":{"keyNo":"4ed53aa292b8def72c6f544f7915719b","registCapi":"10.0","name":"\u6df1\u5733\u4e91\u80b4\u54a8\u8be2\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"56843511","labels":["Company"],"properties":{"keyNo":"f7e21a2642303dd6bfc95038318cd297","registCapi":"1000.0","name":"\u897f\u5b89\u534e\u5927\u57fa\u56e0\u521b\u65b0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"27809841","labels":["Company"],"properties":{"keyNo":"79a0e264d52a9f76ce2afe0f78340dcf","registCapi":"1000.0","name":"\u534e\u5927\u7cbe\u51c6\u8425\u517b(\u6df1\u5733)\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"81855811","labels":["Person"],"properties":{"keyNo":"p3eb6049ea59ad82f550b013cc798c5d","role":"\u8463\u4e8b","name":"\u6731\u5ca9\u6885","hasImage":false}},{"id":"4667360","labels":["Company"],"properties":{"keyNo":"1483da0908be35b5770869787db0c660","registCapi":"0.0","name":"\u676d\u5dde\u79be\u6e90\u6295\u8d44\u5408\u4f19\u4f01\u4e1a(\u6709\u9650\u5408\u4f19)","econKind":"\u6709\u9650\u5408\u4f19\u4f01\u4e1a","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"58547400","labels":["Company"],"properties":{"keyNo":"ff623172844eedffa29488cfb42197ea","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u667a\u9020\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u53f0\u6e2f\u6fb3\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"14146415","labels":["Company"],"properties":{"keyNo":"3e53f15e390703ea93e7e9e5ddaac7f4","registCapi":"3000.0","name":"\u6c88\u9633\u534e\u5927\u519c\u4e1a\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"22908644","labels":["Company"],"properties":{"keyNo":"647881e777ef5df3f00682b8f7efa836","registCapi":"2000.0","name":"\u5357\u4eac\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"28498959","labels":["Company"],"properties":{"keyNo":"7c9bb752f7533ddd5b2026d1b3484f84","registCapi":"1900.0","name":"\u4e0a\u6d77\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"19979406","labels":["Company"],"properties":{"keyNo":"57a6a8645b6de70e0afd9b8a83455794","registCapi":"10000.0","name":"\u6df1\u5733\u78b3\u4e91\u63a7\u80a1\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"53516016","labels":["Company"],"properties":{"keyNo":"e96b87476a9c47a48515bd0d853b0a74","registCapi":"1000.0","name":"\u6e56\u5357\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"130455555","labels":["Person"],"properties":{"keyNo":"pd231b74ecf83a4b7bb7557a8215fcaa","role":"\u8463\u4e8b","name":"\u5218\u65af\u5947","hasImage":false}},{"id":"100648494","labels":["Person"],"properties":{"keyNo":"p779c97ed20c51e4b0dd7fa2dc9b6466","role":"\u76d1\u4e8b","name":"\u674e\u677e\u5c97","hasImage":false}},{"id":"51498693","labels":["Company"],"properties":{"keyNo":"e0a49fa0c8c8c178f31376e801f499e9","registCapi":"3000.0","name":"\u65b0\u7586\u534e\u5927\u660c\u6cfd\u519c\u4e1a\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u5176\u4ed6\u6709\u9650\u8d23\u4efb\u516c\u53f8","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"40643002","labels":["Company"],"properties":{"keyNo":"b160077497038c7078badfb15613de3e","registCapi":"1000.0","name":"\u9752\u5c9b\u534e\u5927\u751f\u547d\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44)","hasImage":false,"status":"\u5728\u4e1a"}},{"id":"24365733","labels":["Company"],"properties":{"keyNo":"6ac4608729d33bc0ff9b6e47daabdf14","registCapi":"2000.0","name":"\u534e\u5927\u57fa\u56e0\u751f\u7269\u79d1\u6280(\u6df1\u5733)\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"62261857","labels":["Person"],"properties":{"keyNo":"p039266de04ac0b3da40aed4facde5ec","role":"","name":"\u5218\u82f1\u6770","hasImage":false}},{"id":"43699010","labels":["Company"],"properties":{"keyNo":"beabbc336736cf3b4c59e03615d5218d","registCapi":"1600.0","name":"\u5929\u6d25\u534e\u5927\u57fa\u56e0\u79d1\u6280\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8(\u6cd5\u4eba\u72ec\u8d44)","hasImage":true,"status":"\u5b58\u7eed"}},{"id":"24102066","labels":["Company"],"properties":{"keyNo":"69a076b91273c94cd50c4117cca7d0f4","registCapi":"5000.0","name":"\u6df1\u5733\u534e\u5927\u5c0f\u7c73\u4ea7\u4e1a\u80a1\u4efd\u6709\u9650\u516c\u53f8","econKind":"\u80a1\u4efd\u6709\u9650\u516c\u53f8(\u975e\u4e0a\u5e02)","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"97968703","labels":["Person"],"properties":{"keyNo":"p6f7f150db78087a4170d427b59dcd9a","role":"\u8463\u4e8b","name":"\u4f59\u5fb7\u5065","hasImage":false}},{"id":"53184723","labels":["Company"],"properties":{"keyNo":"e7fb31b50accfec6670d33f8b546bc02","registCapi":"1000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u79d1\u6280\u521b\u65b0\u4e2d\u5fc3\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}},{"id":"76970349","labels":["Person"],"properties":{"keyNo":"p2ff160e8ab357486e99f9b2c2d607bd","role":"\u8463\u4e8b","name":"\u5c39\u70e8","hasImage":true}},{"id":"47237932","labels":["Company"],"properties":{"keyNo":"ce162c5a417bb2d44674f70ff035d140","registCapi":"10000.0","name":"\u6df1\u5733\u534e\u5927\u57fa\u56e0\u533b\u9662\u7ba1\u7406\u63a7\u80a1\u6709\u9650\u516c\u53f8","econKind":"\u6709\u9650\u8d23\u4efb\u516c\u53f8\uff08\u81ea\u7136\u4eba\u6295\u8d44\u6216\u63a7\u80a1\u7684\u6cd5\u4eba\u72ec\u8d44\uff09","hasImage":false,"status":"\u5b58\u7eed"}}],"relationships":[{"id":"180914888","type":"EMPLOY","startNode":"145186454","endNode":"42064057","properties":{"role":"\u8463\u4e8b\u517c\u603b\u7ecf\u7406"}},{"id":"180914880","type":"EMPLOY","startNode":"89161325","endNode":"42064057","properties":{"role":"\u76d1\u4e8b"}},{"id":"56546133","type":"INVEST","startNode":"135600509","endNode":"25715151","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":1,"shouldCapi":10}},{"id":"180914885","type":"EMPLOY","startNode":"135600509","endNode":"42064057","properties":{"role":"\u8463\u4e8b"}},{"id":"2902068","type":"INVEST","startNode":"58547400","endNode":"51713009","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":2000}},{"id":"251444964","type":"EMPLOY","startNode":"97363633","endNode":"13348410","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"251444966","type":"EMPLOY","startNode":"97363633","endNode":"13348410","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"520220","type":"INVEST","startNode":"32506361","endNode":"19329469","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":71.64,"shouldCapi":2560}},{"id":"251444960","type":"EMPLOY","startNode":"135600509","endNode":"13348410","properties":{"role":"\u8463\u4e8b"}},{"id":"251444963","type":"EMPLOY","startNode":"96345052","endNode":"13348410","properties":{"role":"\u8463\u4e8b"}},{"id":"251444958","type":"EMPLOY","startNode":"89161325","endNode":"13348410","properties":{"role":"\u8463\u4e8b"}},{"id":"182342394","type":"EMPLOY","startNode":"96345052","endNode":"57898826","properties":{"role":"\u8463\u4e8b"}},{"id":"148764923","type":"EMPLOY","startNode":"62261857","endNode":"14146415","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"182342393","type":"EMPLOY","startNode":"135600509","endNode":"57898826","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"148764922","type":"EMPLOY","startNode":"140238449","endNode":"14146415","properties":{"role":"\u76d1\u4e8b"}},{"id":"1450046","type":"INVEST","startNode":"16771135","endNode":"30895448","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":2000}},{"id":"182342391","type":"EMPLOY","startNode":"89161325","endNode":"57898826","properties":{"role":"\u76d1\u4e8b"}},{"id":"31619528","type":"INVEST","startNode":"124254673","endNode":"55770659","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":90,"shouldCapi":900}},{"id":"55112573","type":"INVEST","startNode":"123535420","endNode":"4667360","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":82.22,"shouldCapi":332.9}},{"id":"89640298","type":"LEGAL","startNode":"135600509","endNode":"53184723","properties":{"role":""}},{"id":"495691","type":"INVEST","startNode":"5480200","endNode":"15516588","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":10000}},{"id":"150802607","type":"EMPLOY","startNode":"110183989","endNode":"53184723","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"150802606","type":"EMPLOY","startNode":"89161325","endNode":"53184723","properties":{"role":"\u76d1\u4e8b"}},{"id":"606301","type":"INVEST","startNode":"16771135","endNode":"10627695","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"167733672","type":"EMPLOY","startNode":"135600509","endNode":"30895448","properties":{"role":"\u8463\u4e8b"}},{"id":"150802602","type":"EMPLOY","startNode":"135600509","endNode":"53184723","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"167733671","type":"EMPLOY","startNode":"96345052","endNode":"30895448","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"167733670","type":"EMPLOY","startNode":"76970349","endNode":"30895448","properties":{"role":"\u8463\u4e8b"}},{"id":"167733668","type":"EMPLOY","startNode":"145186454","endNode":"30895448","properties":{"role":"\u8463\u4e8b"}},{"id":"167733666","type":"EMPLOY","startNode":"142536812","endNode":"30895448","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"167733664","type":"EMPLOY","startNode":"142536812","endNode":"30895448","properties":{"role":"\u8463\u4e8b"}},{"id":"167733663","type":"EMPLOY","startNode":"89161325","endNode":"30895448","properties":{"role":"\u76d1\u4e8b"}},{"id":"1319036","type":"INVEST","startNode":"5480200","endNode":"44890140","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":90,"shouldCapi":1800}},{"id":"1319037","type":"INVEST","startNode":"20257280","endNode":"44890140","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":10,"shouldCapi":200}},{"id":"125041","type":"INVEST","startNode":"5480200","endNode":"24365733","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":100,"shouldCapi":2000}},{"id":"152543588","type":"EMPLOY","startNode":"96345052","endNode":"26834450","properties":{"role":"\u8463\u4e8b"}},{"id":"103732824","type":"LEGAL","startNode":"124254673","endNode":"55770659","properties":{"role":""}},{"id":"180914878","type":"EMPLOY","startNode":"76970349","endNode":"42064057","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"152543585","type":"EMPLOY","startNode":"97363633","endNode":"26834450","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"181363379","type":"EMPLOY","startNode":"76970349","endNode":"58591833","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"152543594","type":"EMPLOY","startNode":"89161325","endNode":"26834450","properties":{"role":"\u76d1\u4e8b"}},{"id":"181363378","type":"EMPLOY","startNode":"100648494","endNode":"58591833","properties":{"role":"\u76d1\u4e8b"}},{"id":"152543592","type":"EMPLOY","startNode":"135600509","endNode":"26834450","properties":{"role":"\u8463\u4e8b"}},{"id":"6007006","type":"INVEST","startNode":"28782263","endNode":"15237066","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":85,"shouldCapi":1700}},{"id":"189955011","type":"EMPLOY","startNode":"74003591","endNode":"16771135","properties":{"role":"\u8463\u4e8b"}},{"id":"189955014","type":"EMPLOY","startNode":"96345052","endNode":"16771135","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"189955012","type":"EMPLOY","startNode":"112143029","endNode":"16771135","properties":{"role":"\u8463\u4e8b"}},{"id":"189955013","type":"EMPLOY","startNode":"89161325","endNode":"16771135","properties":{"role":"\u76d1\u4e8b"}},{"id":"189955018","type":"EMPLOY","startNode":"96345052","endNode":"16771135","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"189955019","type":"EMPLOY","startNode":"130455555","endNode":"16771135","properties":{"role":"\u8463\u4e8b"}},{"id":"200174412","type":"EMPLOY","startNode":"135600509","endNode":"58343440","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"200174413","type":"EMPLOY","startNode":"110183989","endNode":"58343440","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"151388586","type":"EMPLOY","startNode":"145186454","endNode":"15516588","properties":{"role":"\u76d1\u4e8b"}},{"id":"151388587","type":"EMPLOY","startNode":"76970349","endNode":"15516588","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"173273825","type":"EMPLOY","startNode":"135600509","endNode":"4686432","properties":{"role":"\u8463\u4e8b"}},{"id":"173273824","type":"EMPLOY","startNode":"97363633","endNode":"4686432","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"98137446","type":"LEGAL","startNode":"142536812","endNode":"50368461","properties":{"role":""}},{"id":"55112576","type":"INVEST","startNode":"64205668","endNode":"4667360","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":17.78,"shouldCapi":72}},{"id":"85736918","type":"LEGAL","startNode":"16771135","endNode":"2415662","properties":{"role":""}},{"id":"243140270","type":"EMPLOY","startNode":"81855811","endNode":"18248148","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"243140271","type":"EMPLOY","startNode":"96345052","endNode":"18248148","properties":{"role":"\u8463\u4e8b"}},{"id":"563420","type":"INVEST","startNode":"13348410","endNode":"26834450","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":100}},{"id":"243140267","type":"EMPLOY","startNode":"89161325","endNode":"18248148","properties":{"role":"\u76d1\u4e8b"}},{"id":"461017","type":"INVEST","startNode":"16771135","endNode":"53184723","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"6455427","type":"INVEST","startNode":"16771135","endNode":"40643002","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"166701323","type":"EMPLOY","startNode":"96345052","endNode":"26359639","properties":{"role":"\u8463\u4e8b"}},{"id":"166701321","type":"EMPLOY","startNode":"100648494","endNode":"26359639","properties":{"role":"\u76d1\u4e8b"}},{"id":"166701316","type":"EMPLOY","startNode":"96345052","endNode":"26359639","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"85720559","type":"LEGAL","startNode":"25715151","endNode":"3931264","properties":{"role":""}},{"id":"116402147","type":"LEGAL","startNode":"91206999","endNode":"20257280","properties":{"role":""}},{"id":"105074527","type":"LEGAL","startNode":"76826826","endNode":"3799291","properties":{"role":""}},{"id":"38497131","type":"INVEST","startNode":"96345052","endNode":"16771135","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":85.3,"shouldCapi":8530}},{"id":"38497133","type":"INVEST","startNode":"135600509","endNode":"16771135","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":4.2,"shouldCapi":420}},{"id":"38497132","type":"INVEST","startNode":"124254673","endNode":"16771135","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":10.5,"shouldCapi":1050}},{"id":"212954501","type":"EMPLOY","startNode":"100648494","endNode":"43699010","properties":{"role":"\u76d1\u4e8b"}},{"id":"168127293","type":"EMPLOY","startNode":"89161325","endNode":"26415267","properties":{"role":"\u76d1\u4e8b"}},{"id":"212954504","type":"EMPLOY","startNode":"96345052","endNode":"43699010","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"212954507","type":"EMPLOY","startNode":"124254673","endNode":"43699010","properties":{"role":"\u8463\u4e8b"}},{"id":"168127295","type":"EMPLOY","startNode":"74003591","endNode":"26415267","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"168127297","type":"EMPLOY","startNode":"118919503","endNode":"26415267","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"854341","type":"INVEST","startNode":"3931264","endNode":"27809841","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":15,"shouldCapi":150}},{"id":"854340","type":"INVEST","startNode":"26852888","endNode":"27809841","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":80,"shouldCapi":800}},{"id":"854342","type":"INVEST","startNode":"16771135","endNode":"27809841","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":5,"shouldCapi":50}},{"id":"1646935","type":"INVEST","startNode":"5480200","endNode":"28498959","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1900}},{"id":"191646264","type":"EMPLOY","startNode":"126461823","endNode":"40604494","properties":{"role":"\u8463\u4e8b"}},{"id":"191646265","type":"EMPLOY","startNode":"126461823","endNode":"40604494","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"234251424","type":"EMPLOY","startNode":"89161325","endNode":"50049713","properties":{"role":"\u76d1\u4e8b"}},{"id":"191646260","type":"EMPLOY","startNode":"74003591","endNode":"40604494","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"191646262","type":"EMPLOY","startNode":"89161325","endNode":"40604494","properties":{"role":"\u76d1\u4e8b"}},{"id":"191646263","type":"EMPLOY","startNode":"115701435","endNode":"40604494","properties":{"role":"\u8463\u4e8b"}},{"id":"191646256","type":"EMPLOY","startNode":"81855811","endNode":"40604494","properties":{"role":"\u8463\u4e8b"}},{"id":"191646258","type":"EMPLOY","startNode":"76826826","endNode":"40604494","properties":{"role":"\u8463\u4e8b"}},{"id":"236494714","type":"EMPLOY","startNode":"89161325","endNode":"28782263","properties":{"role":"\u76d1\u4e8b"}},{"id":"173273904","type":"EMPLOY","startNode":"89161325","endNode":"4686432","properties":{"role":"\u76d1\u4e8b"}},{"id":"234251422","type":"EMPLOY","startNode":"135600509","endNode":"50049713","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"236494704","type":"EMPLOY","startNode":"76826826","endNode":"28782263","properties":{"role":"\u8463\u4e8b"}},{"id":"234251423","type":"EMPLOY","startNode":"135600509","endNode":"50049713","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"236494705","type":"EMPLOY","startNode":"96345052","endNode":"28782263","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"236494706","type":"EMPLOY","startNode":"74003591","endNode":"28782263","properties":{"role":"\u8463\u4e8b"}},{"id":"236494708","type":"EMPLOY","startNode":"76826826","endNode":"28782263","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"68038004","type":"INVEST","startNode":"112143029","endNode":"44067823","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":30,"shouldCapi":150}},{"id":"68038005","type":"INVEST","startNode":"96345052","endNode":"44067823","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":7,"shouldCapi":35}},{"id":"173273902","type":"EMPLOY","startNode":"96345052","endNode":"4686432","properties":{"role":"\u8463\u4e8b"}},{"id":"233958513","type":"EMPLOY","startNode":"96345052","endNode":"44067823","properties":{"role":"\u8463\u4e8b"}},{"id":"177406739","type":"EMPLOY","startNode":"89161325","endNode":"12793386","properties":{"role":"\u76d1\u4e8b"}},{"id":"233958515","type":"EMPLOY","startNode":"89161325","endNode":"44067823","properties":{"role":"\u8463\u4e8b"}},{"id":"177406737","type":"EMPLOY","startNode":"145186454","endNode":"12793386","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"233958514","type":"EMPLOY","startNode":"80631881","endNode":"44067823","properties":{"role":"\u8463\u4e8b"}},{"id":"233958517","type":"EMPLOY","startNode":"89161325","endNode":"44067823","properties":{"role":"\u7ecf\u7406"}},{"id":"233958516","type":"EMPLOY","startNode":"100648494","endNode":"44067823","properties":{"role":"\u8463\u4e8b"}},{"id":"233958519","type":"EMPLOY","startNode":"112143029","endNode":"44067823","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"177406741","type":"EMPLOY","startNode":"145186454","endNode":"12793386","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"102602651","type":"LEGAL","startNode":"145186454","endNode":"12793386","properties":{"role":""}},{"id":"223861959","type":"EMPLOY","startNode":"75852031","endNode":"24102066","properties":{"role":"\u8463\u4e8b"}},{"id":"223861958","type":"EMPLOY","startNode":"75852031","endNode":"24102066","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"223861956","type":"EMPLOY","startNode":"74003591","endNode":"24102066","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"229381176","type":"EMPLOY","startNode":"145186454","endNode":"47237932","properties":{"role":"\u76d1\u4e8b"}},{"id":"223861954","type":"EMPLOY","startNode":"71873889","endNode":"24102066","properties":{"role":"\u76d1\u4e8b"}},{"id":"4180392","type":"INVEST","startNode":"16771135","endNode":"26852888","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":50000}},{"id":"3658144","type":"INVEST","startNode":"16771135","endNode":"45212385","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":10,"shouldCapi":50}},{"id":"229381179","type":"EMPLOY","startNode":"96345052","endNode":"47237932","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"223861965","type":"EMPLOY","startNode":"62261857","endNode":"24102066","properties":{"role":"\u8463\u4e8b"}},{"id":"85775495","type":"LEGAL","startNode":"964117","endNode":"25715151","properties":{"role":""}},{"id":"223861964","type":"EMPLOY","startNode":"115701435","endNode":"24102066","properties":{"role":"\u8463\u4e8b"}},{"id":"223861963","type":"EMPLOY","startNode":"135600509","endNode":"24102066","properties":{"role":"\u76d1\u4e8b"}},{"id":"23847159","type":"INVEST","startNode":"8632940","endNode":"5480200","properties":{"stockPercent":16.72}},{"id":"23847158","type":"INVEST","startNode":"16771135","endNode":"5480200","properties":{"stockPercent":37.18}},{"id":"223861962","type":"EMPLOY","startNode":"140238449","endNode":"24102066","properties":{"role":"\u76d1\u4e8b"}},{"id":"223861961","type":"EMPLOY","startNode":"96345052","endNode":"24102066","properties":{"role":"\u8463\u4e8b"}},{"id":"27990023","type":"INVEST","startNode":"144042028","endNode":"2415662","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":7.5,"shouldCapi":4.5}},{"id":"27990022","type":"INVEST","startNode":"142536812","endNode":"2415662","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":7.5,"shouldCapi":4.5}},{"id":"192416441","type":"EMPLOY","startNode":"89161325","endNode":"51713009","properties":{"role":"\u76d1\u4e8b"}},{"id":"192416442","type":"EMPLOY","startNode":"145186454","endNode":"51713009","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"192416443","type":"EMPLOY","startNode":"145186454","endNode":"51713009","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"258381493","type":"EMPLOY","startNode":"84888593","endNode":"11475921","properties":{"role":"\u8463\u4e8b"}},{"id":"258381490","type":"EMPLOY","startNode":"74003591","endNode":"11475921","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"258381502","type":"EMPLOY","startNode":"140238449","endNode":"11475921","properties":{"role":"\u76d1\u4e8b"}},{"id":"3066330","type":"INVEST","startNode":"34981097","endNode":"44514466","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":2,"shouldCapi":50}},{"id":"6293909","type":"INVEST","startNode":"26852888","endNode":"34981097","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":95,"shouldCapi":5225}},{"id":"3066329","type":"INVEST","startNode":"16771135","endNode":"44514466","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":98,"shouldCapi":2450}},{"id":"59087237","type":"INVEST","startNode":"124254673","endNode":"17946270","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":90,"shouldCapi":0}},{"id":"61264308","type":"INVEST","startNode":"96345052","endNode":"24102066","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":20,"shouldCapi":1000}},{"id":"5067352","type":"INVEST","startNode":"16771135","endNode":"47237932","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":10000}},{"id":"92196710","type":"LEGAL","startNode":"123535420","endNode":"41092359","properties":{"role":""}},{"id":"88647506","type":"LEGAL","startNode":"62261857","endNode":"14146415","properties":{"role":""}},{"id":"5601911","type":"INVEST","startNode":"20257280","endNode":"10897921","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":10,"shouldCapi":200}},{"id":"5601910","type":"INVEST","startNode":"16771135","endNode":"10897921","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":90,"shouldCapi":1800}},{"id":"237558809","type":"EMPLOY","startNode":"111759451","endNode":"8473798","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"98082795","type":"LEGAL","startNode":"118919503","endNode":"26415267","properties":{"role":""}},{"id":"225986360","type":"EMPLOY","startNode":"145186454","endNode":"40883181","properties":{"role":"\u8463\u4e8b"}},{"id":"146885248","type":"EMPLOY","startNode":"124254673","endNode":"5480200","properties":{"role":"\u8463\u4e8b"}},{"id":"134720066","type":"LEGAL","startNode":"124254673","endNode":"19979406","properties":{"role":""}},{"id":"225986353","type":"EMPLOY","startNode":"76970349","endNode":"40883181","properties":{"role":"\u8463\u4e8b"}},{"id":"139031043","type":"LEGAL","startNode":"135600509","endNode":"31495831","properties":{"role":""}},{"id":"225986354","type":"EMPLOY","startNode":"96345052","endNode":"40883181","properties":{"role":"\u8463\u4e8b"}},{"id":"225986355","type":"EMPLOY","startNode":"100648494","endNode":"40883181","properties":{"role":"\u76d1\u4e8b"}},{"id":"130151840","type":"LEGAL","startNode":"112143029","endNode":"44067823","properties":{"role":""}},{"id":"250324111","type":"EMPLOY","startNode":"96345052","endNode":"34981097","properties":{"role":"\u8463\u4e8b"}},{"id":"250324108","type":"EMPLOY","startNode":"74003591","endNode":"34981097","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"5001760","type":"INVEST","startNode":"16771135","endNode":"32506361","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":5000}},{"id":"250324121","type":"EMPLOY","startNode":"135600509","endNode":"34981097","properties":{"role":"\u8463\u4e8b"}},{"id":"6570514","type":"INVEST","startNode":"16771135","endNode":"53516016","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"250324114","type":"EMPLOY","startNode":"140238449","endNode":"34981097","properties":{"role":"\u76d1\u4e8b"}},{"id":"104311884","type":"LEGAL","startNode":"145186454","endNode":"42064057","properties":{"role":""}},{"id":"250324119","type":"EMPLOY","startNode":"144042028","endNode":"34981097","properties":{"role":"\u8463\u4e8b"}},{"id":"250324118","type":"EMPLOY","startNode":"115701435","endNode":"34981097","properties":{"role":"\u8463\u4e8b"}},{"id":"250324117","type":"EMPLOY","startNode":"144042028","endNode":"34981097","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"6402787","type":"INVEST","startNode":"16771135","endNode":"31495831","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":1000}},{"id":"1776274","type":"INVEST","startNode":"13348410","endNode":"4686432","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":1000}},{"id":"60535061","type":"INVEST","startNode":"124254673","endNode":"43566362","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":14,"shouldCapi":1400}},{"id":"90216430","type":"LEGAL","startNode":"75852031","endNode":"37849919","properties":{"role":""}},{"id":"4106894","type":"INVEST","startNode":"5480200","endNode":"43699010","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1600}},{"id":"146885235","type":"EMPLOY","startNode":"76970349","endNode":"5480200","properties":{"role":"\u8463\u4e8b"}},{"id":"146885239","type":"EMPLOY","startNode":"76970349","endNode":"5480200","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"109550655","type":"LEGAL","startNode":"126461823","endNode":"40604494","properties":{"role":""}},{"id":"146885243","type":"EMPLOY","startNode":"89161325","endNode":"5480200","properties":{"role":"\u8463\u4e8b"}},{"id":"146885244","type":"EMPLOY","startNode":"96345052","endNode":"5480200","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"146885247","type":"EMPLOY","startNode":"100648494","endNode":"5480200","properties":{"role":"\u76d1\u4e8b"}},{"id":"172931214","type":"EMPLOY","startNode":"62261857","endNode":"51498693","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"169152726","type":"EMPLOY","startNode":"89161325","endNode":"19839419","properties":{"role":"\u76d1\u4e8b"}},{"id":"1594077","type":"INVEST","startNode":"16771135","endNode":"19636335","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":75,"shouldCapi":750}},{"id":"172931211","type":"EMPLOY","startNode":"71873889","endNode":"51498693","properties":{"role":"\u7ecf\u7406"}},{"id":"169152734","type":"EMPLOY","startNode":"135600509","endNode":"19839419","properties":{"role":"\u8463\u4e8b"}},{"id":"169152728","type":"EMPLOY","startNode":"96345052","endNode":"19839419","properties":{"role":"\u8463\u4e8b"}},{"id":"169152730","type":"EMPLOY","startNode":"97363633","endNode":"19839419","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"254105076","type":"EMPLOY","startNode":"96345052","endNode":"54134728","properties":{"role":"\u8463\u4e8b"}},{"id":"254105078","type":"EMPLOY","startNode":"89161325","endNode":"54134728","properties":{"role":"\u76d1\u4e8b"}},{"id":"254105084","type":"EMPLOY","startNode":"76970349","endNode":"54134728","properties":{"role":"\u8463\u4e8b"}},{"id":"254105080","type":"EMPLOY","startNode":"142536812","endNode":"54134728","properties":{"role":"\u8463\u4e8b"}},{"id":"172931216","type":"EMPLOY","startNode":"140238449","endNode":"51498693","properties":{"role":"\u76d1\u4e8b"}},{"id":"130295079","type":"LEGAL","startNode":"135600509","endNode":"50049713","properties":{"role":""}},{"id":"1473278","type":"INVEST","startNode":"16771135","endNode":"26415267","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":1000}},{"id":"169152736","type":"EMPLOY","startNode":"145186454","endNode":"19839419","properties":{"role":"\u8463\u4e8b"}},{"id":"97892141","type":"LEGAL","startNode":"142536812","endNode":"30895448","properties":{"role":""}},{"id":"4682430","type":"INVEST","startNode":"13348410","endNode":"56843511","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":1000}},{"id":"15670255","type":"INVEST","startNode":"123535420","endNode":"41092359","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"145083327","type":"EMPLOY","startNode":"124254673","endNode":"24365733","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"69740340","type":"INVEST","startNode":"74003591","endNode":"28782263","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":15,"shouldCapi":1500}},{"id":"69740341","type":"INVEST","startNode":"76826826","endNode":"28782263","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":15,"shouldCapi":1500}},{"id":"2484999","type":"INVEST","startNode":"16771135","endNode":"7333555","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":27.13,"shouldCapi":900}},{"id":"2843400","type":"INVEST","startNode":"44067823","endNode":"51844765","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":1,"shouldCapi":26}},{"id":"5274483","type":"INVEST","startNode":"28498959","endNode":"3137817","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":800}},{"id":"2843399","type":"INVEST","startNode":"5480200","endNode":"51844765","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":99,"shouldCapi":792}},{"id":"2485000","type":"INVEST","startNode":"34367754","endNode":"7333555","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":17.92,"shouldCapi":594.4697}},{"id":"2485002","type":"INVEST","startNode":"12528670","endNode":"7333555","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":0.86,"shouldCapi":28.4551}},{"id":"5352214","type":"INVEST","startNode":"16771135","endNode":"50049713","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"2790243","type":"INVEST","startNode":"16771135","endNode":"9316337","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"125238304","type":"LEGAL","startNode":"74003591","endNode":"24102066","properties":{"role":""}},{"id":"170176894","type":"EMPLOY","startNode":"135600509","endNode":"19636335","properties":{"role":"\u8463\u4e8b"}},{"id":"4553498","type":"INVEST","startNode":"19979406","endNode":"17946270","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":10,"shouldCapi":0}},{"id":"145083328","type":"EMPLOY","startNode":"96345052","endNode":"24365733","properties":{"role":"\u8463\u4e8b"}},{"id":"145083331","type":"EMPLOY","startNode":"76970349","endNode":"24365733","properties":{"role":"\u8463\u4e8b"}},{"id":"145083330","type":"EMPLOY","startNode":"100648494","endNode":"24365733","properties":{"role":"\u76d1\u4e8b"}},{"id":"1698672","type":"INVEST","startNode":"26852888","endNode":"42595798","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":51,"shouldCapi":510}},{"id":"5755704","type":"INVEST","startNode":"16771135","endNode":"2423350","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"6402835","type":"INVEST","startNode":"16771135","endNode":"40934177","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":100}},{"id":"2030445","type":"INVEST","startNode":"5480200","endNode":"7773720","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":100,"shouldCapi":1500}},{"id":"120542298","type":"LEGAL","startNode":"74003591","endNode":"26852888","properties":{"role":""}},{"id":"252171397","type":"EMPLOY","startNode":"96345052","endNode":"31495831","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"139031488","type":"LEGAL","startNode":"118919503","endNode":"40934177","properties":{"role":""}},{"id":"104277437","type":"LEGAL","startNode":"135600509","endNode":"964117","properties":{"role":""}},{"id":"252171404","type":"EMPLOY","startNode":"80631881","endNode":"31495831","properties":{"role":"\u8463\u4e8b"}},{"id":"252171403","type":"EMPLOY","startNode":"135600509","endNode":"31495831","properties":{"role":"\u6267\u884c\u8463\u4e8b\u517c\u603b\u7ecf\u7406"}},{"id":"171952553","type":"EMPLOY","startNode":"126461823","endNode":"42595798","properties":{"role":"\u8463\u4e8b"}},{"id":"252171408","type":"EMPLOY","startNode":"115940527","endNode":"31495831","properties":{"role":"\u8463\u4e8b"}},{"id":"171952550","type":"EMPLOY","startNode":"81855811","endNode":"42595798","properties":{"role":"\u8463\u4e8b"}},{"id":"2857908","type":"INVEST","startNode":"16771135","endNode":"40604494","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"138128281","type":"LEGAL","startNode":"144042028","endNode":"34981097","properties":{"role":""}},{"id":"171952540","type":"EMPLOY","startNode":"74003591","endNode":"42595798","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"170176896","type":"EMPLOY","startNode":"97968703","endNode":"19636335","properties":{"role":"\u8463\u4e8b"}},{"id":"170176898","type":"EMPLOY","startNode":"89161325","endNode":"19636335","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"89732862","type":"LEGAL","startNode":"115940527","endNode":"14646310","properties":{"role":""}},{"id":"191396035","type":"EMPLOY","startNode":"76970349","endNode":"51844765","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"87731857","type":"LEGAL","startNode":"76970349","endNode":"5480200","properties":{"role":""}},{"id":"243140007","type":"EMPLOY","startNode":"135600509","endNode":"18248148","properties":{"role":"\u8463\u4e8b"}},{"id":"1479669","type":"INVEST","startNode":"58547400","endNode":"50368461","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":68.33,"shouldCapi":20500}},{"id":"1838070","type":"INVEST","startNode":"16771135","endNode":"2415662","properties":{"role":"\u5408\u4f19\u4f01\u4e1a","stockPercent":80,"shouldCapi":48}},{"id":"74352540","type":"INVEST","startNode":"124254673","endNode":"19979406","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":90,"shouldCapi":9000}},{"id":"2716636","type":"INVEST","startNode":"5480200","endNode":"22908644","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":2000}},{"id":"99084782","type":"LEGAL","startNode":"89161325","endNode":"19636335","properties":{"role":""}},{"id":"232931819","type":"EMPLOY","startNode":"100648494","endNode":"3137817","properties":{"role":"\u76d1\u4e8b"}},{"id":"232931822","type":"EMPLOY","startNode":"96345052","endNode":"3137817","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"108915305","type":"LEGAL","startNode":"124254673","endNode":"8632940","properties":{"role":""}},{"id":"6767691","type":"INVEST","startNode":"34981097","endNode":"11475921","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":34,"shouldCapi":4080}},{"id":"6515790","type":"INVEST","startNode":"5480200","endNode":"54134728","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":90.91,"shouldCapi":1111.111}},{"id":"472115","type":"INVEST","startNode":"44067823","endNode":"14646310","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":2.5,"shouldCapi":50}},{"id":"472114","type":"INVEST","startNode":"5480200","endNode":"14646310","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":97.5,"shouldCapi":1950}},{"id":"222767482","type":"EMPLOY","startNode":"124254673","endNode":"43566362","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"222767481","type":"EMPLOY","startNode":"124254673","endNode":"43566362","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"4867087","type":"INVEST","startNode":"5480200","endNode":"40883181","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":2000}},{"id":"214218892","type":"EMPLOY","startNode":"135600509","endNode":"26852888","properties":{"role":"\u8463\u4e8b"}},{"id":"4680718","type":"INVEST","startNode":"19979406","endNode":"43566362","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":82,"shouldCapi":8200}},{"id":"214218888","type":"EMPLOY","startNode":"74003591","endNode":"26852888","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"214218889","type":"EMPLOY","startNode":"74003591","endNode":"26852888","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"3226751","type":"INVEST","startNode":"44067823","endNode":"42929850","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":10,"shouldCapi":500}},{"id":"214218890","type":"EMPLOY","startNode":"89161325","endNode":"26852888","properties":{"role":"\u76d1\u4e8b"}},{"id":"214218891","type":"EMPLOY","startNode":"96345052","endNode":"26852888","properties":{"role":"\u8463\u4e8b"}},{"id":"79050988","type":"INVEST","startNode":"100648494","endNode":"34981097","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":5,"shouldCapi":275}},{"id":"135728203","type":"LEGAL","startNode":"76826826","endNode":"15237066","properties":{"role":""}},{"id":"157537539","type":"EMPLOY","startNode":"110183989","endNode":"27809841","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"150989980","type":"EMPLOY","startNode":"100648494","endNode":"14646310","properties":{"role":"\u76d1\u4e8b"}},{"id":"150989978","type":"EMPLOY","startNode":"115940527","endNode":"14646310","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"157537541","type":"EMPLOY","startNode":"115701435","endNode":"27809841","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"150989974","type":"EMPLOY","startNode":"76970349","endNode":"14646310","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"258743065","type":"EMPLOY","startNode":"144042028","endNode":"18447378","properties":{"role":"\u8463\u4e8b"}},{"id":"258743066","type":"EMPLOY","startNode":"96345052","endNode":"18447378","properties":{"role":"\u76d1\u4e8b"}},{"id":"258743067","type":"EMPLOY","startNode":"142536812","endNode":"18447378","properties":{"role":"\u8463\u4e8b"}},{"id":"258743061","type":"EMPLOY","startNode":"111759451","endNode":"18447378","properties":{"role":"\u8463\u4e8b"}},{"id":"220606880","type":"EMPLOY","startNode":"124254673","endNode":"17946270","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"5874901","type":"INVEST","startNode":"16771135","endNode":"18248148","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"228262155","type":"EMPLOY","startNode":"89161325","endNode":"32506361","properties":{"role":"\u76d1\u4e8b"}},{"id":"228262154","type":"EMPLOY","startNode":"135600509","endNode":"32506361","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"4895963","type":"INVEST","startNode":"43566362","endNode":"13357024","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":54.41,"shouldCapi":700}},{"id":"4895964","type":"INVEST","startNode":"55770659","endNode":"13357024","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":20.21,"shouldCapi":260}},{"id":"228262156","type":"EMPLOY","startNode":"135600509","endNode":"32506361","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"205721826","type":"EMPLOY","startNode":"91206999","endNode":"20257280","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"220606879","type":"EMPLOY","startNode":"124254673","endNode":"17946270","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"4744321","type":"INVEST","startNode":"16771135","endNode":"24102066","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":80,"shouldCapi":4000}},{"id":"2252028","type":"INVEST","startNode":"43699010","endNode":"58591833","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":50,"shouldCapi":1000}},{"id":"2252029","type":"INVEST","startNode":"5480200","endNode":"58591833","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":50,"shouldCapi":1000}},{"id":"253451259","type":"EMPLOY","startNode":"142536812","endNode":"27479081","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"253451260","type":"EMPLOY","startNode":"100648494","endNode":"27479081","properties":{"role":"\u76d1\u4e8b"}},{"id":"131910450","type":"LEGAL","startNode":"111759451","endNode":"8473798","properties":{"role":""}},{"id":"120775645","type":"LEGAL","startNode":"123535420","endNode":"4667360","properties":{"role":""}},{"id":"6360214","type":"INVEST","startNode":"16771135","endNode":"13348410","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":2000}},{"id":"1756475","type":"INVEST","startNode":"24102066","endNode":"51498693","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":60,"shouldCapi":1800}},{"id":"3355921","type":"INVEST","startNode":"964117","endNode":"58343440","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"779566","type":"INVEST","startNode":"25715151","endNode":"3931264","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":0.99,"shouldCapi":120}},{"id":"779564","type":"INVEST","startNode":"16771135","endNode":"3931264","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":16.5,"shouldCapi":2000}},{"id":"89329780","type":"LEGAL","startNode":"145186454","endNode":"58547400","properties":{"role":""}},{"id":"108727121","type":"LEGAL","startNode":"96345052","endNode":"16771135","properties":{"role":""}},{"id":"4332800","type":"INVEST","startNode":"964117","endNode":"25715151","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":99,"shouldCapi":990}},{"id":"96790657","type":"LEGAL","startNode":"115940527","endNode":"44890140","properties":{"role":""}},{"id":"104143740","type":"LEGAL","startNode":"111759451","endNode":"53674258","properties":{"role":""}},{"id":"195200759","type":"EMPLOY","startNode":"135600509","endNode":"44514466","properties":{"role":"\u8463\u4e8b"}},{"id":"2225526","type":"INVEST","startNode":"44514466","endNode":"42064057","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"195200762","type":"EMPLOY","startNode":"145186454","endNode":"44514466","properties":{"role":"\u8463\u4e8b\u517c\u603b\u7ecf\u7406"}},{"id":"195200763","type":"EMPLOY","startNode":"89161325","endNode":"44514466","properties":{"role":"\u76d1\u4e8b"}},{"id":"195200760","type":"EMPLOY","startNode":"112143029","endNode":"44514466","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"195200761","type":"EMPLOY","startNode":"96345052","endNode":"44514466","properties":{"role":"\u8463\u4e8b"}},{"id":"109921233","type":"LEGAL","startNode":"145186454","endNode":"51713009","properties":{"role":""}},{"id":"105012014","type":"LEGAL","startNode":"135600509","endNode":"57898826","properties":{"role":""}},{"id":"243340284","type":"EMPLOY","startNode":"124254673","endNode":"19979406","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"2317662","type":"INVEST","startNode":"28782263","endNode":"3799291","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":65,"shouldCapi":650}},{"id":"243340287","type":"EMPLOY","startNode":"124254673","endNode":"19979406","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"177592081","type":"EMPLOY","startNode":"76970349","endNode":"7773720","properties":{"role":"\u8463\u4e8b"}},{"id":"177592080","type":"EMPLOY","startNode":"100648494","endNode":"7773720","properties":{"role":"\u76d1\u4e8b"}},{"id":"157537510","type":"EMPLOY","startNode":"110183989","endNode":"27809841","properties":{"role":"\u8463\u4e8b"}},{"id":"177592083","type":"EMPLOY","startNode":"96345052","endNode":"7773720","properties":{"role":"\u8463\u4e8b"}},{"id":"247210810","type":"EMPLOY","startNode":"97363633","endNode":"33499575","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"6477290","type":"INVEST","startNode":"16771135","endNode":"27479081","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":500}},{"id":"247210805","type":"EMPLOY","startNode":"135600509","endNode":"33499575","properties":{"role":"\u8463\u4e8b"}},{"id":"157537514","type":"EMPLOY","startNode":"89161325","endNode":"27809841","properties":{"role":"\u76d1\u4e8b"}},{"id":"157537512","type":"EMPLOY","startNode":"144042028","endNode":"27809841","properties":{"role":"\u8463\u4e8b"}},{"id":"247210800","type":"EMPLOY","startNode":"96345052","endNode":"33499575","properties":{"role":"\u8463\u4e8b"}},{"id":"247210802","type":"EMPLOY","startNode":"74003591","endNode":"33499575","properties":{"role":"\u8463\u4e8b"}},{"id":"247210803","type":"EMPLOY","startNode":"89161325","endNode":"33499575","properties":{"role":"\u76d1\u4e8b"}},{"id":"2155959","type":"INVEST","startNode":"43566362","endNode":"55770659","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":4.05,"shouldCapi":40.517}},{"id":"177592079","type":"EMPLOY","startNode":"124254673","endNode":"7773720","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"2221503","type":"INVEST","startNode":"34367754","endNode":"964117","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":18.89,"shouldCapi":200}},{"id":"2221502","type":"INVEST","startNode":"16771135","endNode":"964117","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":56.67,"shouldCapi":600}},{"id":"150162771","type":"EMPLOY","startNode":"145186454","endNode":"58547400","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"150162770","type":"EMPLOY","startNode":"76970349","endNode":"58547400","properties":{"role":"\u8463\u4e8b"}},{"id":"150162768","type":"EMPLOY","startNode":"145186454","endNode":"58547400","properties":{"role":"\u8463\u4e8b"}},{"id":"150162775","type":"EMPLOY","startNode":"96345052","endNode":"58547400","properties":{"role":"\u8463\u4e8b"}},{"id":"150162774","type":"EMPLOY","startNode":"135600509","endNode":"58547400","properties":{"role":"\u8463\u4e8b"}},{"id":"151977131","type":"EMPLOY","startNode":"140238449","endNode":"37849919","properties":{"role":"\u76d1\u4e8b"}},{"id":"150162773","type":"EMPLOY","startNode":"142536812","endNode":"58547400","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"151977128","type":"EMPLOY","startNode":"75852031","endNode":"37849919","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"150162772","type":"EMPLOY","startNode":"89161325","endNode":"58547400","properties":{"role":"\u76d1\u4e8b"}},{"id":"245400333","type":"EMPLOY","startNode":"140238449","endNode":"15237066","properties":{"role":"\u76d1\u4e8b"}},{"id":"245400334","type":"EMPLOY","startNode":"76826826","endNode":"15237066","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"3255796","type":"INVEST","startNode":"16771135","endNode":"15306903","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"111278958","type":"LEGAL","startNode":"112143029","endNode":"44514466","properties":{"role":""}},{"id":"4291995","type":"INVEST","startNode":"16771135","endNode":"45308871","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"168239068","type":"EMPLOY","startNode":"89161325","endNode":"50368461","properties":{"role":""}},{"id":"168239077","type":"EMPLOY","startNode":"145186454","endNode":"50368461","properties":{"role":"\u8463\u4e8b"}},{"id":"131392054","type":"LEGAL","startNode":"76826826","endNode":"28782263","properties":{"role":""}},{"id":"168239076","type":"EMPLOY","startNode":"97968703","endNode":"50368461","properties":{"role":"\u8463\u4e8b"}},{"id":"168239073","type":"EMPLOY","startNode":"142536812","endNode":"50368461","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"138675639","type":"LEGAL","startNode":"97363633","endNode":"13348410","properties":{"role":""}},{"id":"216126178","type":"EMPLOY","startNode":"89161325","endNode":"45308871","properties":{"role":"\u8463\u4e8b"}},{"id":"216126180","type":"EMPLOY","startNode":"142536812","endNode":"45308871","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"124707177","type":"LEGAL","startNode":"124254673","endNode":"43566362","properties":{"role":""}},{"id":"171076664","type":"EMPLOY","startNode":"96345052","endNode":"28498959","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"38757441","type":"INVEST","startNode":"135600509","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"38757440","type":"INVEST","startNode":"89161325","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"171076669","type":"EMPLOY","startNode":"100648494","endNode":"28498959","properties":{"role":"\u76d1\u4e8b"}},{"id":"6112846","type":"INVEST","startNode":"13348410","endNode":"33499575","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":1000}},{"id":"113692897","type":"LEGAL","startNode":"135600509","endNode":"58343440","properties":{"role":""}},{"id":"1533503","type":"INVEST","startNode":"13348410","endNode":"19839419","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":200}},{"id":"99949500","type":"LEGAL","startNode":"74003591","endNode":"42595798","properties":{"role":""}},{"id":"767554","type":"INVEST","startNode":"4667360","endNode":"41092359","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":0,"shouldCapi":0}},{"id":"767553","type":"INVEST","startNode":"16771135","endNode":"41092359","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":0,"shouldCapi":0}},{"id":"180845725","type":"EMPLOY","startNode":"135600509","endNode":"964117","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"38757422","type":"INVEST","startNode":"118919503","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"156051240","type":"EMPLOY","startNode":"123535420","endNode":"41092359","properties":{"role":"\u8463\u4e8b\u957f\u517c\u603b\u7ecf\u7406"}},{"id":"180845729","type":"EMPLOY","startNode":"110183989","endNode":"964117","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"38757414","type":"INVEST","startNode":"145186454","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"38757413","type":"INVEST","startNode":"80631881","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"156051239","type":"EMPLOY","startNode":"64205668","endNode":"41092359","properties":{"role":"\u8463\u4e8b"}},{"id":"156051238","type":"EMPLOY","startNode":"81855811","endNode":"41092359","properties":{"role":"\u8463\u4e8b"}},{"id":"38757439","type":"INVEST","startNode":"81855811","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"38757437","type":"INVEST","startNode":"100648494","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"38757435","type":"INVEST","startNode":"115701435","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"38757434","type":"INVEST","startNode":"112143029","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"38757433","type":"INVEST","startNode":"124254673","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"1390188","type":"INVEST","startNode":"22908644","endNode":"26359639","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":800}},{"id":"38757429","type":"INVEST","startNode":"76970349","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"127381996","type":"LEGAL","startNode":"135600509","endNode":"32506361","properties":{"role":""}},{"id":"38757424","type":"INVEST","startNode":"142536812","endNode":"8632940","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":0,"shouldCapi":0}},{"id":"180571201","type":"EMPLOY","startNode":"111759451","endNode":"53674258","properties":{"role":""}},{"id":"222796750","type":"EMPLOY","startNode":"89161325","endNode":"56843511","properties":{"role":"\u76d1\u4e8b"}},{"id":"222796748","type":"EMPLOY","startNode":"96345052","endNode":"56843511","properties":{"role":"\u8463\u4e8b"}},{"id":"222796747","type":"EMPLOY","startNode":"97363633","endNode":"56843511","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"222796746","type":"EMPLOY","startNode":"135600509","endNode":"56843511","properties":{"role":"\u8463\u4e8b"}},{"id":"255046077","type":"EMPLOY","startNode":"130455555","endNode":"53516016","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"126507304","type":"LEGAL","startNode":"124254673","endNode":"13357024","properties":{"role":""}},{"id":"182471765","type":"EMPLOY","startNode":"76826826","endNode":"3799291","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"182471766","type":"EMPLOY","startNode":"140238449","endNode":"3799291","properties":{"role":"\u76d1\u4e8b"}},{"id":"151807950","type":"EMPLOY","startNode":"135600509","endNode":"19329469","properties":{"role":"\u8463\u4e8b"}},{"id":"5334676","type":"INVEST","startNode":"16771135","endNode":"44067823","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":63,"shouldCapi":315}},{"id":"100426546","type":"LEGAL","startNode":"75852031","endNode":"51498693","properties":{"role":""}},{"id":"198462725","type":"EMPLOY","startNode":"135600509","endNode":"15306903","properties":{"role":"\u8463\u4e8b"}},{"id":"198462727","type":"EMPLOY","startNode":"96345052","endNode":"15306903","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"151807956","type":"EMPLOY","startNode":"81855811","endNode":"19329469","properties":{"role":"\u8463\u4e8b"}},{"id":"151807957","type":"EMPLOY","startNode":"89161325","endNode":"19329469","properties":{"role":"\u76d1\u4e8b"}},{"id":"132358458","type":"LEGAL","startNode":"84888593","endNode":"10897921","properties":{"role":""}},{"id":"151807959","type":"EMPLOY","startNode":"142536812","endNode":"19329469","properties":{"role":"\u8463\u4e8b"}},{"id":"198462728","type":"EMPLOY","startNode":"89161325","endNode":"15306903","properties":{"role":"\u76d1\u4e8b"}},{"id":"151807954","type":"EMPLOY","startNode":"97968703","endNode":"19329469","properties":{"role":"\u8463\u4e8b"}},{"id":"151807955","type":"EMPLOY","startNode":"80631881","endNode":"19329469","properties":{"role":"\u8463\u4e8b"}},{"id":"90852234","type":"LEGAL","startNode":"96345052","endNode":"10627695","properties":{"role":""}},{"id":"123652543","type":"LEGAL","startNode":"124254673","endNode":"17946270","properties":{"role":""}},{"id":"92920688","type":"LEGAL","startNode":"115701435","endNode":"27809841","properties":{"role":""}},{"id":"76008325","type":"INVEST","startNode":"89161325","endNode":"24223161","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":2.5,"shouldCapi":0.5}},{"id":"76008333","type":"INVEST","startNode":"142536812","endNode":"24223161","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":2.5,"shouldCapi":0.5}},{"id":"189238370","type":"EMPLOY","startNode":"100648494","endNode":"22908644","properties":{"role":"\u76d1\u4e8b"}},{"id":"189238369","type":"EMPLOY","startNode":"96345052","endNode":"22908644","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"530237","type":"INVEST","startNode":"24102066","endNode":"37849919","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":60,"shouldCapi":3000}},{"id":"252172347","type":"EMPLOY","startNode":"135600509","endNode":"40934177","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"252172346","type":"EMPLOY","startNode":"118919503","endNode":"40934177","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"2309989","type":"INVEST","startNode":"16771135","endNode":"57898826","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":500}},{"id":"238473598","type":"EMPLOY","startNode":"96345052","endNode":"10897921","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"238473599","type":"EMPLOY","startNode":"81855811","endNode":"10897921","properties":{"role":"\u8463\u4e8b"}},{"id":"238473597","type":"EMPLOY","startNode":"135600509","endNode":"10897921","properties":{"role":"\u8463\u4e8b"}},{"id":"226480691","type":"EMPLOY","startNode":"124254673","endNode":"13357024","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"238473595","type":"EMPLOY","startNode":"91206999","endNode":"10897921","properties":{"role":"\u8463\u4e8b"}},{"id":"238473593","type":"EMPLOY","startNode":"84888593","endNode":"10897921","properties":{"role":"\u8463\u4e8b\u517c\u603b\u7ecf\u7406"}},{"id":"226480685","type":"EMPLOY","startNode":"124254673","endNode":"13357024","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"197954730","type":"EMPLOY","startNode":"124254673","endNode":"42929850","properties":{"role":"\u8463\u4e8b"}},{"id":"197954727","type":"EMPLOY","startNode":"96345052","endNode":"42929850","properties":{"role":"\u8463\u4e8b"}},{"id":"139654950","type":"LEGAL","startNode":"142536812","endNode":"27479081","properties":{"role":""}},{"id":"341875","type":"INVEST","startNode":"24102066","endNode":"14146415","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":40,"shouldCapi":1200}},{"id":"253079697","type":"EMPLOY","startNode":"135600509","endNode":"40643002","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"253079696","type":"EMPLOY","startNode":"89161325","endNode":"40643002","properties":{"role":"\u76d1\u4e8b"}},{"id":"253079699","type":"EMPLOY","startNode":"74003591","endNode":"40643002","properties":{"role":"\u8463\u4e8b"}},{"id":"70460348","type":"INVEST","startNode":"111759451","endNode":"8473798","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":35,"shouldCapi":350}},{"id":"253079693","type":"EMPLOY","startNode":"145186454","endNode":"40643002","properties":{"role":"\u8463\u4e8b"}},{"id":"253079694","type":"EMPLOY","startNode":"142536812","endNode":"40643002","properties":{"role":"\u8463\u4e8b"}},{"id":"6789063","type":"INVEST","startNode":"2415662","endNode":"18447378","properties":{"role":"\u5176\u4ed6\u6295\u8d44\u8005","stockPercent":3,"shouldCapi":60}},{"id":"6789061","type":"INVEST","startNode":"47916268","endNode":"18447378","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":8,"shouldCapi":160}},{"id":"6789060","type":"INVEST","startNode":"16771135","endNode":"18447378","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":28,"shouldCapi":560}},{"id":"165473908","type":"EMPLOY","startNode":"89161325","endNode":"44890140","properties":{"role":"\u8463\u4e8b"}},{"id":"165473909","type":"EMPLOY","startNode":"76970349","endNode":"44890140","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"165473910","type":"EMPLOY","startNode":"135600509","endNode":"44890140","properties":{"role":"\u76d1\u4e8b"}},{"id":"165473911","type":"EMPLOY","startNode":"115940527","endNode":"44890140","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"165473905","type":"EMPLOY","startNode":"124254673","endNode":"44890140","properties":{"role":"\u8463\u4e8b"}},{"id":"165473906","type":"EMPLOY","startNode":"84888593","endNode":"44890140","properties":{"role":"\u8463\u4e8b"}},{"id":"6789064","type":"INVEST","startNode":"8473798","endNode":"18447378","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":3,"shouldCapi":60}},{"id":"165473907","type":"EMPLOY","startNode":"91206999","endNode":"44890140","properties":{"role":"\u8463\u4e8b"}},{"id":"224840407","type":"EMPLOY","startNode":"96345052","endNode":"45318726","properties":{"role":"\u6267\u884c\u8463\u4e8b"}},{"id":"238473600","type":"EMPLOY","startNode":"89161325","endNode":"10897921","properties":{"role":"\u76d1\u4e8b"}},{"id":"224840408","type":"EMPLOY","startNode":"89161325","endNode":"45318726","properties":{"role":"\u76d1\u4e8b"}},{"id":"153280227","type":"EMPLOY","startNode":"142536812","endNode":"10627695","properties":{"role":"\u8463\u4e8b"}},{"id":"153280230","type":"EMPLOY","startNode":"142536812","endNode":"10627695","properties":{"role":"\u603b\u7ecf\u7406"}},{"id":"100592186","type":"LEGAL","startNode":"97363633","endNode":"4686432","properties":{"role":""}},{"id":"153280228","type":"EMPLOY","startNode":"81855811","endNode":"10627695","properties":{"role":"\u8463\u4e8b"}},{"id":"153280235","type":"EMPLOY","startNode":"96345052","endNode":"10627695","properties":{"role":"\u8463\u4e8b\u957f"}},{"id":"153280233","type":"EMPLOY","startNode":"89161325","endNode":"10627695","properties":{"role":"\u76d1\u4e8b"}},{"id":"4800388","type":"INVEST","startNode":"16771135","endNode":"45318726","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":100,"shouldCapi":1000}},{"id":"2019281","type":"INVEST","startNode":"58547400","endNode":"12793386","properties":{"role":"\u6cd5\u4eba\u80a1\u4e1c","stockPercent":100,"shouldCapi":1000}},{"id":"134623189","type":"LEGAL","startNode":"81855811","endNode":"18248148","properties":{"role":""}},{"id":"2205633","type":"INVEST","startNode":"18447378","endNode":"53674258","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":51,"shouldCapi":153}},{"id":"76008295","type":"INVEST","startNode":"145186454","endNode":"24223161","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":2.5,"shouldCapi":0.5}},{"id":"5484465","type":"INVEST","startNode":"16771135","endNode":"28782263","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":70,"shouldCapi":7000}},{"id":"2205634","type":"INVEST","startNode":"8473798","endNode":"53674258","properties":{"role":"\u4f01\u4e1a\u6cd5\u4eba","stockPercent":49,"shouldCapi":147}},{"id":"76008303","type":"INVEST","startNode":"118919503","endNode":"24223161","properties":{"role":"\u81ea\u7136\u4eba\u80a1\u4e1c","stockPercent":2.5,"shouldCapi":0.5}},{"id":"241099173","type":"EMPLOY","startNode":"97968703","endNode":"2423350","properties":{"role":"\u6267\u884c\u8463\u4e8b"}}]}}]}],"errors":[]}};
getData('49be15cf27ff98949bb7396cb855eba2', undefined, dataText.success);


