(function (window) {
    function Relation(option){
        var dom = option.dom,data = option.data,companyId = option.companyId,style = $.extend({
            node:{
                width: "160",
                height: "50",
                "border-width": "3",
                "border-color": "#9EBCF7",
                'background-color':'#13123E',
                color:'#fff',
                "font-size": "10",
                content: "data(name)",
                "text-halign": "center",
                "text-valign": "center",
                "text-wrap": "wrap",
                shape: "roundrectangle",
                "font-family": "Microsoft YaHei",
            },
            edge:{
                "font-family": "Microsoft YaHei",
                "curve-style": "bezier",
                label: "data(label)",
                width: "3",
                "font-size": "12",
                "target-arrow-shape": "triangle",
                color: "#666",
                opacity: 0.2,
                "text-background-opacity": 1,
                "text-background-color": "#fff",
                "text-background-shape": "roundrectangle",
                "line-style": "dashed",
                "edge-text-rotation": "autorotate"
            },
            company:{
                'padding-left':3,
                'background-image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAA3CAYAAADe4WDNAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAmSURBVEhLY5i35/t/QnhU0aiiUUVAPKpoVNGoIiAeVTRUFX3/DwBRdWgLmUOEaAAAAABJRU5ErkJggg==',
                'background-position-x':25,
                'background-width':4
            },
            companyCenter:{
                'background-color':'#418DE3'
            },
            activeNeighborNodeElse:{
                opacity: 0.2
            },
            acitveNeighborEdge:{
                opacity: 1
            },
            person:{
                "border-color": "#97CC85"
            },
            equity:{
                "line-color": "#E56765",
                "source-arrow-color": "#E56765",
                "target-arrow-color": "#E56765"
            },
            office:{
                "line-color": "#979797",
                "source-arrow-color": "#979797",
                "target-arrow-color": "#979797"
            },
            hidetext: {
                'text-opacity':0
            }
        },option.style);
        if(dom === undefined || dom === '' || dom === null ){
            throw 'dom为空';
        }
        if(data === undefined || data === '' || data === null ){
            throw 'data不能为空';
        }

        return brelation(dom,data,companyId,style);
    }

    function getNode(id, nodes) {
        for(let i = 0; i < nodes.length; i++) {
            if(nodes[i].data.id == id) {
                return nodes[i];
            }
        }
    }
    function drawCytoscape(nodes, edges, dom, css, companyId) {
        var options={
            container:dom,
            wheelSensitivity:0.1,
            minZoom:0.4,
            maxZoom:2.5,
            // layout:{
            //     repulsion: 600,
            //     stiffness: 50,
            //     friction: 0.1,
            //     gravity: true,
            //     fps: 200,
            //     precision: 0.02,
            //     name: 'arbor'
            // },
            layout: {
                name: 'preset',
            },
            style: cytoscape.stylesheet()
                            .selector("node").style(css.node)
                            .selector("edge").style(css.edge)
                            .selector('edge[type = "4"]').style(css.equity)
                            .selector('edge[type = "2"]').style(css.office)
                            .selector(".person").css(css.person)
                            .selector(".company").css(css.company)
                            .selector(".companyCenter").css(css.companyCenter)
                            .selector(".acitveNeighborEdge").css(css.acitveNeighborEdge)
                            .selector(".activeNeighborNodeElse").css(css.activeNeighborNodeElse)
                            .selector(".hidetext").css(css.hidetext),
            elements: {
                nodes: nodes,
                edges: edges
            }};
        // 添加交互
        let cy = cytoscape(options);
        // 定位
        cy.nodes().positions(function( node, i ){
            // 保持居中
            if(nodes[i].data.companyId == companyId){
                var position= cy.pan();
                cy.pan({
                    x: position.x-nodes[i].x,
                    y: position.y-nodes[i].y
                });
            }
            
            return {
                x: nodes[i].x,
                y: nodes[i].y
            };
        });
        // 点击node,此node周围临近elements之外的node变透明；且连接着node的edge变为active
        cy.$('node').on('click',function(e){
            let nodes = this.neighborhood().filter(ele => {
                return ele.isNode();
            });
            let edges = this.neighborhood().filter(ele => {
                return ele.isEdge();
            });
            let elseNodes = cy.elements().filter(ele => {
                return !(nodes.anySame(ele) || this.same(ele)) && ele.isNode();
            });
            this.addClass('activeNeighborNode');
            nodes.addClass('activeNeighborNode');
            edges.addClass('acitveNeighborEdge');
            elseNodes.addClass('activeNeighborNodeElse');
            nodes.once('click', function(e) {
                cy.elements().removeClass('activeNeighborNodeElse activeNeighborNode acitveNeighborEdge');
                let nodes = this.neighborhood().filter(ele => {
                    return ele.isNode();
                });
                let edges = this.neighborhood().filter(ele => { 
                    return ele.isEdge();
                });
                let elseNodes = cy.elements().filter(ele => {
                    return !(nodes.anySame(ele) || this.same(ele)) && ele.isNode();
                });
                this.addClass('activeNeighborNode');
                nodes.addClass('activeNeighborNode');
                edges.addClass('acitveNeighborEdge');
                elseNodes.addClass('activeNeighborNodeElse');
            })
            elseNodes.once('click',function(e){cy.elements().removeClass('activeNeighborNodeElse activeNeighborNode acitveNeighborEdge')})
        })
        // mousedown与click时的状态改变一样，不同的是mouseup时恢复到之前的状态
        cy.$('node').on('mousedown',function(e){
            if(!this.hasClass('activeNeighborNode') && !this.hasClass('activeNeighborNodeElse')) {
                let nodes = this.neighborhood().filter(ele => {
                    return ele.isNode();
                });
                let edges = this.neighborhood().filter(ele => {
                    return ele.isEdge();
                });
                let elseNodes = cy.elements().filter(ele => {
                    return !(nodes.anySame(ele) || this.same(ele)) && ele.isNode();
                });
                this.addClass('activeNeighborNode');
                nodes.addClass('activeNeighborNode');
                edges.addClass('acitveNeighborEdge');
                elseNodes.addClass('activeNeighborNodeElse');
                this.once('mouseup',function(e){
                    cy.elements().removeClass('activeNeighborNodeElse activeNeighborNode acitveNeighborEdge');
                })
            } 
        })
        // 点击elements之外的画布，图谱变回初始化的状态
        cy.on('click', function(event){
            let evtTarget = event.target;
            if( evtTarget === cy ){
                cy.elements().removeClass('activeNeighborNodeElse activeNeighborNode acitveNeighborEdge');
            }
        });
        // 鼠标hover上某条edge时，加上active，out时还原到之前的状态
        cy.$('edge').on('mouseover', function(e){
            let node = this.target();
            if(!node.hasClass('activeNeighborNode') && !node.hasClass('activeNeighborNodeElse')) {
                this.addClass('acitveNeighborEdge');
                this.once('mouseout', function(e){
                    this.removeClass('acitveNeighborEdge');
                })
            }
        })
        // 当没有node处于active状态时，鼠标hover上某个node时，给与这个node相连接的edge加上active，out时还原到之前的状态
        cy.$('node').on('mouseover',function(e){
            if(!this.hasClass('activeNeighborNode') && !this.hasClass('activeNeighborNodeElse')) {
                let edges = this.neighborhood().filter(ele => {
                    return ele.isEdge();
                });
                edges.addClass('acitveNeighborEdge');
                this.once('mouseout', function(e) {
                    this.hasClass('activeNeighborNode') ? '' : this.neighborhood().filter(ele => {
                        return ele.isEdge();
                    }).removeClass('acitveNeighborEdge');
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
        cy.ready(function () {
            cy.zoom({
                level: 0.8, // the zoom level
            });
    
            // 加载完成后，加载该类，修复线有锯齿的问题
            setTimeout(function () {
                cy.collection("edge").addClass("lineFixed");
            },400);
        });
        return cy;
    }
    function brelation(dom,data,companyId,css) {
        var nodes=[],edges=[],temp=[],layoutEdges=[];
        for(var j =0;j< data.entityResult.length;j++){
            var name='';
            if(data.entityResult[j].name!=null){

                name=data.entityResult[j].name.slice(0,18).replace(/(.{10}(?!$))/g, "$1\n");
                if(temp.indexOf(name)==-1){
                    temp.push(name);
                    var node= {group: 'nodes',position:null,data:{
                        id:data.entityResult[j].id,name:name,color:'#CFDEFB',companyId:data.entityResult[j].companyId}};
                    if(node.data.id.slice(0,1)==='p'){
                        node.classes+=' person';
                        node.data.color = '#A7CFDA';
                    }else{
                        if(data.entityResult[j].companyId == companyId){
                            node.classes += " companyCenter"; 
                        }
                        if(data.entityResult[j].app_info_num){
                            if(name.length<9){
                                node.data.name = data.entityResult[j].app_info_num+'           '+name.replace('(','（').replace(')','）');
                            }else{
                                node.data.name = data.entityResult[j].app_info_num+'      '+name.replace('(','（').replace(')','）');
                            }
                            node.classes += " company";
                        }
                    }
                    nodes.push(node);
                }
            } else {
                name='';
            }  
        }
        for(var j =0;j< data.relationResult.length;j++){
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

        var strength = -600,distanceMax,theta = 0,distance = 200,colideRadius = 35,distanceMin = 400;
        // 根据节点数量调节
        if(nodes.length < 50 ){
            strength = -800;distanceMax = 500;
        } else if( nodes.length > 50 && nodes.length < 100 ){
            strength = -800;distanceMax = 450;distance = 200;colideRadius = 35;
        } else if(nodes.length > 100 && nodes.length < 150){
            strength = -900;distanceMax = 550;
        } else if (nodes.length > 150 && nodes.length < 200) {
            strength = -1000; distanceMax = 600;
        } else if (nodes.length > 200) {
            strength = -1600; distanceMax = 500;theta = 0.6,distance = 100,colideRadius = 35;
        }
        d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(strength).distanceMax(distanceMax).theta(theta))
            .force('link', d3.forceLink(layoutEdges).distance(distance));
        
        setTimeout(() => {
            return drawCytoscape(nodes, edges, dom, css, companyId);
        }, 500);
        
    }
    window.Relation=Relation;
})(window);
