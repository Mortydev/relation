window.onload=function(){

  var cy = cytoscape({

      container: document.getElementById('chart'),
    
      elements: [
        { // node n1
          group: 'nodes', // 'nodes' for a node, 'edges' for an edge
          // NB the group field can be automatically inferred for you but specifying it
          // gives you nice debug messages if you mis-init elements
    
          autolock: true,
          data: { // element data (put json serialisable dev data here)
            id: 'n1', // mandatory (string or number) id for each element, assigned automatically on undefined
            parent: 'nparent', // indicates the compound node parent id; not defined => no parent
          },
    
          // scratchpad data (usually temp or nonserialisable data)
          scratch: {
            _foo: 'bar' // app fields prefixed by underscore; extension fields unprefixed
          },
    
          position: { // the model position of the node (optional on init, mandatory after)
            x: 100,
            y: 100
          },
    
          selected: false, // whether the element is selected (default false)
    
          selectable: true, // whether the selection state is mutable (default true)
    
          locked: false, // when locked a node's position is immutable (default false)
    
          grabbable: true, // whether the node can be grabbed and moved by the user
    
          classes: 'foo bar' // a space separated list of class names that the element has
        },
    
        { // node n2
          data: { id: 'n2' },
          renderedPosition: { x: 200, y: 200 } // can alternatively specify position in rendered on-screen pixels
        },
    
        { // node n3
          data: { id: 'n3', parent: 'nparent' },
          position: { x: 123, y: 234 }
        },
    
        { // node nparent
          data: { id: 'nparent', position: { x: 200, y: 100 } }
        },
    
        { // edge e1
          data: {
            id: 'e1',
            // inferred as an edge because `source` and `target` are specified:
            source: 'n1', // the source node id (edge comes from this node)
            target: 'n2'  // the target node id (edge goes to this node)
          }
        }
      ],
    
      layout: {
        name: 'preset'
      },
    
      // so we can see the ids
      style: [
        {
          selector: 'node',
          style: {
            'content': 'data(id)'
          }
        }
      ],

      minZoom: 2
    
  });
  
  cy.add([{ // node n4
    data: { id: 'n4', parent: 'nparent', weight: 300000 },
    position: { x: 50, y: 134 }
  },{ // edge e2
    data: {
      id: 'e2',
      // inferred as an edge because `source` and `target` are specified:
      source: 'n4', // the source node id (edge comes from this node)
      target: 'n3'  // the target node id (edge goes to this node)
    }
  }])
  
  var n4 = cy.$("#n4");
  // console.log(n4.neighborhood());
  
  setTimeout(() => {
    console.log(1);
    cy.batch(function(){
      cy.$('#n1')
        .position({ x: 50, y: 100 })
      ;
    });
    // cy.destroy();
  }, 1000)
  // cy.on('tap', 'node', function(evt){
  //   var node = evt.target;
  //   console.log( 'tapped ' + node.id() );
  // });
  // cy.on('tap', function(event){
  //   // target holds a reference to the originator
  //   // of the event (core or element)
  //   var evtTarget = event.target;
  
  //   if( evtTarget === cy ){
  //       console.log('tap on background');
  //   } else {
  //     console.log('tap on some element');
  //   }
  // });
  cy.pon('tap').then(function( event ){
    console.log('tap promise fulfilled');
  });
  cy
    .animate({
      fit: { eles: '#n1' }
    })

    .delay(1000)

    .animate({ 
      fit: { eles: '#n2' }
    })
  ;
  console.log(cy.delayAnimation());
};