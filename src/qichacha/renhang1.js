

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
function uniqeByKeys1(array){
    var arr = [];
    for (var i = 0; i < array.length; i++) {
        if(array[i].sourceNode && array[i].targetNode) {
            arr.push(array[i]);
        }
    }
    return arr ;
};



/****** 数据处理 ******/

// 数据处理：将原始数据转换成graph数据
function getRootData(list) {
    var graph = {}
    graph.nodes = [];
    graph.links = [];

    //graph.nodes
    var nodes = list.entityResult;
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
        
        if (_currentKeyNo == o.data.obj.id){
            _rootNode = o;
        }
    }
    graph.nodes = uniqeByKeys(graph.nodes,['nodeId']);

    //graph.links
    var relationships = list.relationResult;

    for(var k = 0; k < relationships.length; k++) {
        var relationship = relationships[k];
        var o = {}
        o.data = {};
        o.data.obj = relationship;
        //o.data.showStatus = 'NORMAL'; // NORMAL HIGHLIGHT DULL
        o.data.showStatus = null; // NORMAL HIGHLIGHT DULL
        o.sourceNode = getGraphNode(relationship.source,graph.nodes);
        o.targetNode = getGraphNode(relationship.target,graph.nodes);
        o.linkId = relationship.linkId;
        o.source = getNodesIndex(relationship.source,graph.nodes);
        o.target = getNodesIndex(relationship.target,graph.nodes);
        graph.links.push(o);
    }
    graph.links = uniqeByKeys1(graph.links);

    setLevel(graph.nodes,graph.links);
    setCategoryColor(graph.nodes,graph.links);

    return graph;
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
        if(nodes[i].data.obj.properties.keyNo == nodeId) {
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


function drawGraph(elements) {
    _currentKeyNo,_companyRadius = 35,_personRadius = 15,_circleMargin = 10,_circleBorder = 3;
    for(let j =0;j< elements.edges.length;j++){
        elements.edges[j].data.source = elements.edges[j].data.data.obj.source;
        elements.edges[j].data.target = elements.edges[j].data.data.obj.target;
    }
    for(let j =0;j< elements.nodes.length;j++){
        elements.nodes[j].data.id = elements.nodes[j].data.keyNo;
    }
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
                        console.log(ele.data('color'));
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
    cy.$('node').on('click',function(e){
        if(!this.hasClass('dull')) {
            cy.elements().removeClass('nodeActive edgeActive dull nodeNeighborhoodActive');
            let nodes = this.neighborhood().filter(ele => {
                return ele.isNode();
            });
            let edges = this.neighborhood().filter(ele => {
                return ele.isEdge();
            });
            let elseNodes = cy.elements().filter(ele => {
                return !(nodes.anySame(ele) || this.same(ele)) && ele.isNode();
            });
            this.addClass('nodeActive');
            nodes.addClass('nodeNeighborhoodActive');
            edges.addClass('edgeActive');
            elseNodes.addClass('dull');
        } else {
            cy.elements().removeClass('nodeActive edgeActive dull nodeNeighborhoodActive');
        } 
    })
    // mousedown与click时的状态改变一样，不同的是mouseup时恢复到之前的状态
    cy.$('node').on('mousedown',function(e){
        if(!this.hasClass('nodeActive') && !this.hasClass('nodeNeighborhoodActive') && !this.hasClass('dull')) {
            let nodes = this.neighborhood().filter(ele => {
                return ele.isNode();
            });
            let edges = this.neighborhood().filter(ele => {
                return ele.isEdge();
            });
            let elseNodes = cy.elements().filter(ele => {
                return !(nodes.anySame(ele) || this.same(ele)) && ele.isNode();
            });
            this.addClass('nodeActive');
            nodes.addClass('nodeNeighborhoodActive');
            edges.addClass('edgeActive');
            elseNodes.addClass('dull');
            this.once('mouseup',function(e){
                cy.elements().removeClass('nodeActive edgeActive dull nodeNeighborhoodActive');
            })
        }
    })
    // 点击elements之外的画布，图谱变回初始化的状态
    cy.on('click', function(event){
        let evtTarget = event.target;
        if( evtTarget === cy ){
            cy.elements().removeClass('nodeActive edgeActive dull nodeNeighborhoodActive');
        }
    });
    // 鼠标hover上某条edge时，加上active，out时还原到之前的状态
    cy.$('edge').on('mouseover', function(e){
        let node = this.target();
        if(!node.hasClass('nodeActive') && !node.hasClass('dull') && !node.hasClass('nodeNeighborhoodActive')) {
            this.addClass('edgeActive');
            this.once('mouseout', function(e){
                this.removeClass('edgeActive');
            })
        }
    })
    // 当没有node处于active状态时，鼠标hover上某个node时，给与这个node相连接的edge加上active，out时还原到之前的状态
    cy.$('node').on('mouseover',function(e){
        if(!this.hasClass('nodeActive') && !this.hasClass('dull') && !this.hasClass('nodeNeighborhoodActive')) {
            let edges = this.neighborhood().filter(ele => {
                return ele.isEdge();
            });
            edges.addClass('edgeActive');
            this.once('mouseout', function(e) {
                (this.hasClass('nodeActive') || this.hasClass('nodeNeighborhoodActive')) ? '' : this.neighborhood().filter(ele => {
                    return ele.isEdge();
                }).removeClass('edgeActive');
            })
        }
    })

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
        if(node._private.data.nodeId == _currentKeyNo){
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

        // 加载完成后，加载该类，修复线有锯齿的问题
        setTimeout(function () {
            cy.collection("edge").addClass("lineFixed");
        },400);
    });
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
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(function () { return colideRadius;}));
}

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
        if(type == '2'){
            return _COLOR.line.invest;
        } else if(type == '4') {
            return _COLOR.line.employ;
        } else {
            return _COLOR.line.legal;
        }
    }
    function getLinkLabel(link) {
        var type = link.data.obj.type, role = link.data.obj.type;
        if(type == '2'){
            return '投资';
        } else if(type == '4') {
            return (role ? role : '任职');
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
        var label = link.data.obj.relationType;
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

    _rootData = getRootData(re);
    
    domUpdate(_rootData);
}

var dataText1 = "{\"entityResult\":[{\"type\":\"1\",\"name\":\"珠海神州泰岳新兴产业投资企业(有限合伙)\",\"id\":\"c54_g5rW356We5bee5rOw5bKz5paw5YW05Lqn5Lia5oqV6LWE5LyB5LiaKOaciemZkOWQiOS8mSk.\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":\"60427550\"},{\"type\":\"1\",\"name\":\"深圳前海图腾互联网金融服务有限公司\",\"id\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"图腾贷\",\"app_risk_score\":\"26\",\"app_id\":\"541532\"}],\"app_info_num\":1,\"companyId\":\"7396912\"},{\"type\":\"1\",\"name\":\"南京胜沃投资管理有限公司\",\"id\":\"c5Y2X5Lqs6IOc5rKD5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"沃时贷\",\"app_risk_score\":\"25\",\"app_id\":\"532982\"}],\"app_info_num\":1,\"companyId\":\"54926622\"},{\"type\":\"1\",\"name\":\"爱财科技有限公司\",\"id\":\"c54ix6LSi56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"爱又米\",\"app_risk_score\":\"26\",\"app_id\":\"535871\"}],\"app_info_num\":1,\"companyId\":\"11652985\"},{\"type\":\"1\",\"name\":\"金华察端投资管理有限公司\",\"id\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":\"57721789\"},{\"type\":\"1\",\"name\":\"上海齐沁筹互联网金融信息服务有限公司\",\"id\":\"c5LiK5rW36b2Q5rKB56255LqS6IGU572R6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"微钱进\",\"app_risk_score\":\"26\",\"app_id\":\"547617\"},{\"app_name\":\"欢乐贷\",\"app_risk_score\":\"25\",\"app_id\":\"553472\"}],\"app_info_num\":2,\"companyId\":\"10752218\"},{\"type\":\"1\",\"name\":\"上海睿本金融信息服务有限公司\",\"id\":\"c5LiK5rW3552-5pys6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"沪商财富\",\"app_risk_score\":\"24\",\"app_id\":\"534153\"}],\"app_info_num\":1,\"companyId\":\"7563072\"},{\"type\":\"1\",\"name\":\"上海水象金融信息服务有限公司\",\"id\":\"c5LiK5rW35rC06LGh6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"水珠钱包\",\"app_risk_score\":\"23\",\"app_id\":\"532576\"},{\"app_name\":\"水象分期\",\"app_risk_score\":\"23\",\"app_id\":\"543019\"},{\"app_name\":\"水象分期极速版\",\"app_risk_score\":\"23\",\"app_id\":\"552157\"},{\"app_name\":\"水象云贷\",\"app_risk_score\":\"22\",\"app_id\":\"583893\"}],\"app_info_num\":4,\"companyId\":\"8880829\"},{\"type\":\"1\",\"name\":\"北京密境和风科技有限公司\",\"id\":\"c5YyX5Lqs5a_G5aKD5ZKM6aOO56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"花椒相机\",\"app_risk_score\":\"26\",\"app_id\":\"574055\"},{\"app_name\":\"花椒直播\",\"app_risk_score\":\"26\",\"app_id\":\"574056\"}],\"app_info_num\":2,\"companyId\":\"11788708\"},{\"type\":\"1\",\"name\":\"杭州商富信息科技有限公司\",\"id\":\"c5p2t5bee5ZWG5a_M5L_h5oGv56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"蜜蜂聚财\",\"app_risk_score\":\"19\",\"app_id\":\"553491\"},{\"app_name\":\"蜜蜂聚财理财\",\"app_risk_score\":\"18\",\"app_id\":\"554085\"}],\"app_info_num\":2,\"companyId\":\"10595443\"},{\"type\":\"1\",\"name\":\"浙江微鱼网络科技有限公司\",\"id\":\"c5rWZ5rGf5b6u6bG8572R57uc56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"微钱进\",\"app_risk_score\":\"22\",\"app_id\":\"532907\"}],\"app_info_num\":1,\"companyId\":\"56803929\"},{\"type\":\"1\",\"name\":\"深圳市前海果树互联网金融服务有限公司\",\"id\":\"c5rex5Zyz5biC5YmN5rW35p6c5qCR5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"果树理财\",\"app_risk_score\":\"22\",\"app_id\":\"535653\"},{\"app_name\":\"果树财富\",\"app_risk_score\":\"23\",\"app_id\":\"553283\"}],\"app_info_num\":2,\"companyId\":\"7709654\"},{\"type\":\"1\",\"name\":\"上海本趣网络科技有限公司\",\"id\":\"c5LiK5rW35pys6Laj572R57uc56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"无他相机\",\"app_risk_score\":\"24\",\"app_id\":\"570497\"}],\"app_info_num\":1,\"companyId\":\"9556961\"},{\"type\":\"1\",\"name\":\"金华蓝优网络科技有限公司\",\"id\":\"c6YeR5Y2O6JOd5LyY572R57uc56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"蓝领贷\",\"app_risk_score\":\"23\",\"app_id\":\"560566\"},{\"app_name\":\"蓝领贷极速版\",\"app_risk_score\":\"22\",\"app_id\":\"583757\"}],\"app_info_num\":2,\"companyId\":\"57237012\"},{\"type\":\"1\",\"name\":\"浙江彩狗文化传播有限公司\",\"id\":\"c5rWZ5rGf5b2p54uX5paH5YyW5Lyg5pKt5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"金手指捕鱼\",\"app_risk_score\":\"26\",\"app_id\":\"532867\"}],\"app_info_num\":1,\"companyId\":\"11892049\"},{\"type\":\"1\",\"name\":\"武汉玖信普惠金融信息服务有限公司\",\"id\":\"c5q2m5rGJ546W5L_h5pmu5oOg6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[{\"app_name\":\"玖融网\",\"app_risk_score\":\"21\",\"app_id\":\"559056\"}],\"app_info_num\":1,\"companyId\":\"10791460\"},{\"type\":\"1\",\"name\":\"成都诚润君信息科技合伙企业(有限合伙)\",\"id\":\"c5oiQ6YO96K_a5ram5ZCb5L_h5oGv56eR5oqA5ZCI5LyZ5LyB5LiaKOaciemZkOWQiOS8mSk.\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":\"55435330\"},{\"type\":\"1\",\"name\":\"罗润超\",\"id\":\"p572X5ram6LaF\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":null},{\"type\":\"1\",\"name\":\"张根来\",\"id\":\"p5byg5qC55p2l\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":null},{\"type\":\"1\",\"name\":\"车云信用管理(深圳)有限公司\",\"id\":\"c6L2m5LqR5L_h55So566h55CGKOa3seWcsynmnInpmZDlhazlj7g.\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":\"35497760\"},{\"type\":\"1\",\"name\":\"深圳前海图腾汽车租赁有限公司\",\"id\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5rG96L2m56ef6LWB5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":\"36566248\"},{\"type\":\"1\",\"name\":\"成都图融网络信息服务有限公司\",\"id\":\"c5oiQ6YO95Zu_6J6N572R57uc5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":\"50221475\"},{\"type\":\"1\",\"name\":\"王东梅\",\"id\":\"p546L5Lic5qKF\",\"app_info_list\":[],\"app_info_num\":0,\"companyId\":null}],\"relationResult\":[{\"type\":\"4\",\"source\":\"c54_g5rW356We5bee5rOw5bKz5paw5YW05Lqn5Lia5oqV6LWE5LyB5LiaKOaciemZkOWQiOS8mSk.\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"15.00%\"},{\"type\":\"4\",\"source\":\"c54_g5rW356We5bee5rOw5bKz5paw5YW05Lqn5Lia5oqV6LWE5LyB5LiaKOaciemZkOWQiOS8mSk.\",\"target\":\"c5Y2X5Lqs6IOc5rKD5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c54_g5rW356We5bee5rOw5bKz5paw5YW05Lqn5Lia5oqV6LWE5LyB5LiaKOaciemZkOWQiOS8mSk.\",\"target\":\"c54ix6LSi56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"5.00%\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5LiK5rW36b2Q5rKB56255LqS6IGU572R6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5LiK5rW3552-5pys6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5LiK5rW35rC06LGh6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5YyX5Lqs5a_G5aKD5ZKM6aOO56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5p2t5bee5ZWG5a_M5L_h5oGv56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"12.41%\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5rWZ5rGf5b6u6bG8572R57uc56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"19.00%\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5rex5Zyz5biC5YmN5rW35p6c5qCR5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"20.00%\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5LiK5rW35pys6Laj572R57uc56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c6YeR5Y2O6JOd5LyY572R57uc56eR5oqA5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5rWZ5rGf5b2p54uX5paH5YyW5Lyg5pKt5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c6YeR5Y2O5a_f56uv5oqV6LWE566h55CG5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5q2m5rGJ546W5L_h5pmu5oOg6YeR6J6N5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"4\",\"source\":\"c5oiQ6YO96K_a5ram5ZCb5L_h5oGv56eR5oqA5ZCI5LyZ5LyB5LiaKOaciemZkOWQiOS8mSk.\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"13.50%\"},{\"type\":\"4\",\"source\":\"p572X5ram6LaF\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"46.55%\"},{\"type\":\"4\",\"source\":\"p5byg5qC55p2l\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"19.95%\"},{\"type\":\"4\",\"source\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c6L2m5LqR5L_h55So566h55CGKOa3seWcsynmnInpmZDlhazlj7g.\",\"direction\":\"1\",\"relationType\":\"51.00%\"},{\"type\":\"4\",\"source\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5rG96L2m56ef6LWB5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"100.00%\"},{\"type\":\"4\",\"source\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"target\":\"c5oiQ6YO95Zu_6J6N572R57uc5L_h5oGv5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"投资\"},{\"type\":\"2\",\"source\":\"p572X5ram6LaF\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"法定代表人,总经理,董事长\"},{\"type\":\"2\",\"source\":\"p546L5Lic5qKF\",\"target\":\"c5rex5Zyz5YmN5rW35Zu_6IW_5LqS6IGU572R6YeR6J6N5pyN5Yqh5pyJ6ZmQ5YWs5Y_4\",\"direction\":\"1\",\"relationType\":\"监事\"}],\"affiliatedInfoStat\":{\"invNum\":\"3\",\"shaNum\":null,\"shaCompanyNum\":\"0\",\"shapersonnum\":\"2\"}}";
let newData = JSON.parse(dataText1);
getData('7396912', undefined, simpleTransformData(newData));
function simpleTransformData(data) {
    let graph = Object.assign(data, {});
    // nodes
    let nodes = graph.entityResult;
    for (let i=0;i<nodes.length;i++) {
        nodes[i].labels = [];
        nodes[i].labels.push(nodes[i].id.slice(0,1)==='p' ? 'Person' : 'Company');

        nodes[i].properties = {};
        nodes[i].properties.keyNo = nodes[i].id;
        nodes[i].properties.name = nodes[i].name;

        nodes[i].id = nodes[i].companyId;
        delete nodes[i].companyId;
    }
    //links 
    let links = graph.relationResult;
    for (let i=0;i<links.length;i++) {
        links[i].linkId = i;
    }
    return graph;
}

