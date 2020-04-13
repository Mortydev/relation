(function (window) {
    function Relation(option){
        let dom = option.dom,data = option.data;
        if(dom === undefined || dom === '' || dom === null ){
            throw 'dom为空';
        }
        if(data === undefined || data === '' || data === null ){
            throw 'data不能为空';
        }

        return transformData(option);
    }

    function getNode(id, nodes) {
        for(let i = 0; i < nodes.length; i++) {
            if(nodes[i].data.id == id) {
                return nodes[i];
            }
        }
    }
    function extend() {
        var length = arguments.length;
        var target = arguments[0] || {};
        if (typeof target!="object" && typeof target != "function") {
            target = {};
        }
        if (length == 1) {
            target = this;
            // i--;
        }
        for (var i = 1; i < length; i++) { 
            var source = arguments[i]; 
            for (var key in source) { 
                // 使用for in会遍历数组所有的可枚举属性，包括原型。
                if (Object.prototype.hasOwnProperty.call(source, key)) { 
                    target[key] = source[key]; 
                } 
            } 
        }
        return target; 
    }
    function drawCytoscape(nodes, edges, option) {
        let dom = option.dom,companyId = option.companyId,css = extend({
            node:{
                width: '70',
                height: '70',
                shape: 'ellipse',
                'font-size':12,
                'font-family':'microsoft yahei',
                'text-wrap':'wrap',
                'text-max-width':60,
                'text-halign':'center',
                'text-valign':'center',
                'overlay-color':'#fff',
                'overlay-opacity':0,
                'background-opacity':1,
                'background-color':'#418DE3',
                'text-background-color':'#000',
                'text-background-shape':'roundrectangle',
                'text-background-padding':0,
                'z-index-compare':'manual',
                'z-index':20,
                color:"#fff",
                label: function (ele) {
                    let label = ele.data("name");
                    let length = label.length;
                    label = label.replace('\n', '');
                    if(length <=5){ // 4 5 4排列
                        return label;
                    } else if(length >=5 && length <= 9) {
                        return label.substring(0,length - 5) + '\n' + label.substring(length - 5,length);
                    } else if(length >= 9 && length <= 13){
                        return label.substring(0,4) + '\n' + label.substring(4,9) + '\n' + label.substring(9,13);
                    } else {
                        return label.substring(0,4) + '\n' + label.substring(4,9) + '\n' + label.substring(9,12) + '..';
                    }
                }
            },
            edge:{
                'line-style':'solid',
                'curve-style': 'bezier',
                'control-point-step-size':20,
                'target-arrow-shape': 'triangle-backcurve',
                'arrow-scale':0.5,
                label: '',
                'text-opacity':0.8,
                'font-size':12,
                'width': 0.3,
                'overlay-color':'#fff',
                'overlay-opacity':0,
                'font-family':'microsoft yahei',
                "edge-text-rotation": "autorotate"
            },
            company:{
                'padding': 3
            },
            companyCenter:{
                // 'background-color':'#418DE3'
            },
            dull:{
                'z-index':1,
                opacity:0.2,
            },
            nodeActive:{
                'border-color': function (ele) {
                    return ele.data("color");
                },
                'border-width': 10,
                'border-opacity': 0.5
            },
            edgeActive:{
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
                'z-index-compare':'manual',
                'z-index':1,
                label: function (ele) {
                    return ele.data("label");
                }
            },
            person:{
                width: '50',
                height: '50',
                'background-color':'#FD485E',
            },
            equity:{
                'line-color': '#E56765',
                'source-arrow-color': '#E56765',
                'target-arrow-color': '#E56765'
            },
            office:{
                'line-color': '#979797',
                'source-arrow-color': '#979797',
                'target-arrow-color': '#979797'
            },
            hidetext: {
                'text-opacity':0
            }
        },option.style);;
        let options={
            container:dom,
            wheelSensitivity:0.1,
            minZoom:0.4,
            maxZoom:2,
            layout: {
                name: 'preset',
            },
            style: cytoscape
                .stylesheet()
                .selector('node').style(css.node)
                .selector('edge').style(css.edge)
                .selector('edge[type = "4"]').style(css.equity)
                .selector('edge[type = "2"]').style(css.office)
                .selector('.person').css(css.person)
                .selector('.company').css(css.company)
                .selector('.companyCenter').css(css.companyCenter)
                .selector('.nodeActive').css(css.nodeActive)
                .selector('.edgeActive').css(css.edgeActive)
                .selector('.dull').css(css.dull)
                .selector('.nodeNeighborhoodActive').css(css.nodeNeighborhoodActive)
                .selector('.hidetext').css(css.hidetext),
            elements: {
                nodes: nodes,
                edges: edges
            }};
        // 添加交互
        let cy = cytoscape(options);
        // 点击node,此node周围临近elements之外的node变透明；且连接着node的edge变为active
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
        // 缩放国小隐藏文字
        cy.on('zoom',function(){
            if(cy.zoom()<0.5){
                cy.collection("node").addClass("hidetext");
                cy.collection("edge").addClass("hidetext");
            }else{
                cy.collection("node").removeClass("hidetext");
                cy.collection("edge").removeClass("hidetext");
            }
        })
        // // 定位
        cy.nodes().positions(function( node, i ){
            // 保持居中
            if(nodes[i].data.companyId == companyId){
                let position= cy.pan();
                cy.pan({
                    x: position.x-nodes[i].x,
                    y: position.y-nodes[i].y
                });
            }

            //
            return {
                x: nodes[i].x,
                y: nodes[i].y
            };
        });

        cy.ready(function () {
            cy.zoom({
                level: 1.0, // the zoom level
            });
        });
        return cy;
    }
    function transformData(option) {
        let data=option.data,nodes=[],edges=[],temp=[],layoutEdges=[];
        for(let j =0;j< data.entityResult.length;j++){
            let name='';
            if(data.entityResult[j].name!=null){

                name=data.entityResult[j].name.slice(0,18).replace(/(.{10}(?!$))/g, '$1\n');
                if(temp.indexOf(name)==-1){
                    temp.push(name);
                    let node= {group: 'nodes',position:null,data:{
                        id:data.entityResult[j].id,name:name,color:'#CFDEFB',companyId:data.entityResult[j].companyId}};
                    if(node.data.id.slice(0,1)==='p'){
                        node.classes+=' person';
                        node.data.color = '#A7CFDA';
                    }else if(data.entityResult[j].companyId == option.companyId){
                        node.classes += ' companyCenter'; 
                    }
                    nodes.push(node);
                }
            } else {
                name='';
            }  
        }
        for(let j =0;j< data.relationResult.length;j++){
            edges.push({
                data:{
                    source:data.relationResult[j].source,
                    target:data.relationResult[j].target,
                    classes:data.relationResult[j].direction,
                    label:data.relationResult[j].relationType,
                    type:data.relationResult[j].type
                }
            });
            layoutEdges.push({
                source:getNode(data.relationResult[j].source, nodes),
                target:getNode(data.relationResult[j].target, nodes),
                classes:data.relationResult[j].direction,
                label:data.relationResult[j].relationType,
                type:data.relationResult[j].type
            })
        }

        positionD3(nodes, layoutEdges);
        
        setTimeout(() => {
            return drawCytoscape(nodes, edges, option);
        }, 500);
        
    }
    function positionD3(nodes, layoutEdges) {
        let strength = -600,distanceMax = 330,theta = 0,distance = 130,colideRadius = 35;
        // 根据节点数量调节
        if(nodes.length < 50 ){
            strength = -800;distanceMax = 400;
        } else if( nodes.length > 50 && nodes.length < 100 ){
            strength = -800;distanceMax = 350;distance = 130;colideRadius = 35;
        } else if(nodes.length > 100 && nodes.length < 150){
            strength = -900;distanceMax = 450;
        } else if (nodes.length > 150 && nodes.length < 200) {
            strength = -1000; distanceMax = 500;
        } else if (nodes.length > 200) {
            strength = -1600; distanceMax = 500;theta = 0.6,distance = 100,colideRadius = 35;
        }
        d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(strength).distanceMax(distanceMax).theta(theta))
            .force('link', d3.forceLink(layoutEdges).distance(distance));
    }
    window.Relation=Relation;
})(window);
