function distance(x1,y1,x2,y2){ // between 2 points
  return Math.sqrt((x1-x2)**2+(y1-y2)**2);
}

function equal(arr1, arr2){
  if (arr1 == null || arr2 == null){
    return false;
  }
  if (arr1.length != arr2.length){
    return false;
  }
  for (let i = 0;i<arr1.length;i++){
    if (arr1[i] != arr2[i]){
      return false;
    }
  }
  return true;
}

function lineDistance(x,y,x1,y1,x2,y2){ // between line and point
  const nomin = Math.abs((y2-y1)*x-(x2-x1)*y+x2*y1-y2*x1);
  const denom = Math.sqrt((y2-y1)**2 + (x2-x1)**2);
  return nomin/denom;
}

class Canvas extends React.Component{
  
  constructor(props){
    super(props);
    this.state = {
      nodes: [], // x, y
      edges: [], // 
      mode: 'select', // 'select'/'node'/'weight'
      current: null, // current node selected in 'weight mode'
      interval: 1000,
    }
  }
  
  componentDidMount(){
    const canvas = this.refs.canvas;
    canvas.addEventListener('mousedown',(e)=>this.handleClick(canvas,e));
    
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "30px Arial";
    ctx.lineWidth = 3;
    
    this.drawNodes();
    this.drawLines();
    this.drawHintText();
  }
  
  componentDidUpdate(){
    
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height); // clear everything and redraw..
    
    this.drawLines();
    this.drawNodes(); 
    this.drawHintText();
  }
  
  debug(){
    alert(this.state.nodes);
    alert(this.state.edges);
    alert(this.state.current);
  }
  
  // When Canvas is Clicked
  handleClick(canvas,event){
    
    // Get Coordinates
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (this.state.mode === 'select'){
      // find out selected node if node is selected
      const nodes = this.state.nodes;
      let l = nodes.length;
      
      for (let i = 0;i<l;i++){
        const node = nodes[i];
        if (distance(node[0],node[1],x,y)<=30){
          this.setState({current: node});
          return;
        }
      }
      this.setState({current: null});
      
      // if node is not selected, find out selected line if exists
      const edges = this.state.edges;
      l = edges.length;
      let closestE = null; // closest edge
      let dist = 15; // current dist between point and closestE
      
      for (let i = 0;i<l;i++){
        const edge = edges[i];
        // closet distance that's <= 15
        if (lineDistance(x,y,...edge) <= dist){
          
          // ensure clicked point is within two ends of visible line
          const minX = Math.min(edge[0],edge[2]);
          const maxX = Math.max(edge[0],edge[2]);
          const minY = Math.min(edge[1],edge[3]);
          const maxY = Math.max(edge[1],edge[3]);
          
          if (x < minX || x > maxX || y < minY || y > maxY){
            // point clicked is not within two ends of visible line
            continue;
          }
          
          dist = lineDistance(x,y,...edge);
          closestE = edge;
        }
        this.setState({current: closestE});
      }
    }
    
    else if (this.state.mode === 'node'){
      // loop over existing nodes
      // if overlap, don't draw new
      const nodes = this.state.nodes;
      const l = nodes.length;
      
      for (let i = 0;i<l;i++){
        const node = nodes[i];
        if (distance(node[0],node[1],x,y) <= 60){
          return;
        }
      }

      const newNodes = this.state.nodes.slice();
      newNodes.push([x,y]);
      this.setState({nodes: newNodes});
    }
 
    else if (this.state.mode == 'edge'){
      const nodes = this.state.nodes.slice();
      const l = nodes.length;
      
      for (let i = 0;i<l;i++){
        const node = nodes[i];
        if (distance(node[0],node[1],x,y) <= 30){
          
          if (this.state.current === null){
            this.setState({current: node});
            return;
          }
          
          else if (this.state.current != null){
            const edges = this.state.edges.slice();
            const current = this.state.current;
            
            // todo: prevent duplicate edges
            
            if (equal(node, current)){ // edge to oneself
              break;
            }
            
            // check if edge already exists
            const e = edges.length;
            let exist = false;
            for (let j = 0;j<e;j++){
              const edge = edges[j];
              
              if (equal(edge.slice(0,2),node) && equal(edge.slice(2,4),current)){
                exist = true;
                break;
              }
              
              if (equal(node, edge.slice(2,4)) && equal(current, edge.slice(0,2))){
                exist = true;
                break;
              }
            }
            
            if (exist){
              break;
            }
            
            edges.push([...current, ...node, 1]);
            this.setState({current: null, edges: edges});
            return;
          }
        }
      }
      this.setState({current:null});
    }
    else if (this.state.mode == 'delete'){
      
      
      // check if node is selected
      let nodes = this.state.nodes.slice();
      let l = nodes.length;
      let i;
      let node;
      
      for (i = 0;i<l;i++){
        node = nodes[i];
        if (distance(...node,x,y)<=30){
          break;
        }
      }
      
      if (i != l){ // node is selected
        nodes.splice(i,1); // remove selected node from nodes
        let edges = this.state.edges.slice();
        l = edges.length;

        for (i = l-1;i>=0;i--){
          let edge = edges[i];
          if (equal(node, edge.slice(0,2)) || equal(node, edge.slice(2,4))){
            edges.splice(i,1);
          }
        }
        
        this.setState({edges: edges, nodes: nodes});
        return;
      }
      
      // node is not selected
      
      let edges = this.state.edges.slice();
      l = edges.length;
      
      for (let i = 0;i<l;i++){
        // change to closet distance that's <= 15
        if (lineDistance(x,y,...edges[i]) <= 15){
          edges.splice(i,1);
          this.setState({edges: edges});
          return;
        }
      }
    }
  }
  
  // Clear Canvas
  clearCanvas(){
    
    // set states
    this.setState({
      nodes: [], // x, y
      edges: [], // 
      mode: 'select', // 'select'/'node'/'weight'
      current: null, // current node selected in 'weight mode'
    });
  }
  
  // When Bar is Clicked
  changeMode(mode){
    this.setState({mode: mode, current: null});
  }
  
  // When Weight of Edge is Changed
  changeWeight(index, weight){
    
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height); // clear everything and redraw..
    
    let newEdges = this.state.edges.slice();
    newEdges[index][4] = weight;
    this.setState({edges: newEdges});
  }
  
  // Hint Text
  drawHintText(){
    const x = 50;
    const y = 70;
    const mode = this.state.mode;
    
    const ctx = this.refs.canvas.getContext('2d');
    ctx.fillText(mode.charAt(0).toUpperCase() + mode.slice(1),x,y);
  }
  
  // Draw Edges of the Graph
  drawLines(){
    const edges = this.state.edges;
    const l = edges.length;
    for (let i = 0;i<l;i++){
      this.drawLine(...edges[i], 0);
    }
    
    const current = this.state.current;
    if (current != null){
      if (current.length == 5){
        this.drawLine(...current,1);
      }
    }
  }
  
  drawLine(x1,y1,x2,y2,weight, selected){
    const ctx = this.refs.canvas.getContext("2d");
    ctx.beginPath();
    if (selected){
      ctx.strokeStyle = "#0000FF";
    }
    else {
      ctx.strokeStyle = "#000000";
    }
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.fillText(weight, (x1+x2)/2, (y1+y2)/2);
  }
  
  // Draw Nodes of the Graph
  drawNodes(){
    const nodes = this.state.nodes;
    const l = nodes.length;
    for (let i = 0;i<l;i++){
      if (equal(this.state.current, nodes[i])){
        this.drawNode(...nodes[i],1,i+1);
      }
      else {
        this.drawNode(...nodes[i],0,i+1);
      }
    }
  }
  
  drawNode(x,y,selected,name){
    const ctx = this.refs.canvas.getContext('2d');
    ctx.beginPath();
    if (selected){
      ctx.strokeStyle = "#0000FF";
    }
    else {
      ctx.strokeStyle = "#000000";
    }
    ctx.fillStyle="#FFFFFF";
    ctx.arc(x,y,30,0,2*Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle="#000000";
    ctx.fillText(name,x,y);
  }
  
  // Kruskal's Algorithm
  kruskal(){
    
    if (this.state.nodes.length == 0 || this.state.edges.length == 0){
      return;
    }
    
    // Get Context
    const ctx = this.refs.canvas.getContext("2d");
    
    // Sort Edges
    let edges = this.state.edges.slice();
    edges.sort((a,b) => {return a[4]-b[4];});
    const l = edges.length;
    
    const nodes = this.state.nodes;
    const n = nodes.length;
    let union = Array(n);
    for (let i = 0;i<n;i++){
      union[i] = i;
    }
    

    for (let i = 0; i<l; i++){
      
      const edge = edges[i];
      
      // Draw current edge considered blue
      setTimeout(
        () => {
          ctx.beginPath();
          ctx.strokeStyle = "#0000FF";
          ctx.moveTo(edge[0],edge[1]);
          ctx.lineTo(edge[2],edge[3]);
          ctx.stroke();
          
          this.drawNodes();
        },
        this.state.interval * i
      );
      
      // Draw edge either green or grey to indicate accept or discard
      setTimeout(
        ()=>{
          
          let e1 = -1;
          let e2 = -1;
          
          // check if edge causes a cycle
          for (let j = 0;j<n;j++){
            if (equal(nodes[j], edge.slice(0,2))){
              e1 = j;
            }
            else if (equal(nodes[j], edge.slice(2,4))){
              e2 = j;
            }
            if (e1 > -1 && e2 > -1){
              break;
            }
          }
          
          ctx.beginPath();
          if (union[e1] == union[e2]){
            // cycle exists, discard edge
            ctx.strokeStyle = "lightgrey";
          }
          else{
            // update union
            const u = union[e2];
            const v = union[e1];
            for (let j = 0;j<n;j++){
              if (union[j] == u){
                union[j] = v;
              }
            }
            
            ctx.strokeStyle = "#00FF00";
          }
          
          ctx.moveTo(edge[0],edge[1]);
          ctx.lineTo(edge[2],edge[3]);
          ctx.stroke();
          this.drawNodes();
        },
        this.state.interval * (i+0.5)
      );
      
    }
    
  }
 
  // Render
  render(){
    let i;
    if (this.state.current != null){
      const arr = this.state.current.length == 2? this.state.nodes: this.state.edges;
      const l = arr.length;
      for (i = 0;i<l;i++){
        if (equal(arr[i],this.state.current)){
          break;
        }
      }
      if (i == l){
        i = null;
      }
      else {
        i++;
      }
    }
    
    
    return [<Bar onClick={(mode)=>this.changeMode(mode)} clear={()=>this.clearCanvas()} kruskal={()=>this.kruskal()} />,<canvas ref="canvas" height={window.innerHeight} width={window.innerWidth*0.8}></canvas>,<Panel display={this.state.current} index={i} onClick={(i,w)=>this.changeWeight(i,w)}/>];
  }
}

// Top Bar
class Bar extends React.Component{
  render(){
    return (
      <nav id="bar">
        <ul>
          <li>MST Visual</li>
          <button onClick={()=>this.props.kruskal()}>Start</button>
          <button onClick={()=>this.props.onClick('select')}>Select</button>
          <button onClick={()=>this.props.onClick('node')}>Node</button>
          <button onClick={()=>this.props.onClick('edge')}>Edge</button>
          <button onClick={()=>this.props.onClick('delete')}>Delete</button>
          <button onClick={()=>this.props.clear()}>Clear</button>
        </ul>
        
      </nav>
    );
  }
}

// Display Panel
class Panel extends React.Component{
  
  type(){
    let data = this.props.display;
    let type = null;
    if (data != null){
      type = data.length == 2? 'Node':'Edge';
    }
    return type;
  }
  
  handleWeightChange(){
    const weight = document.getElementById('inputW').value;
    this.props.onClick(this.props.index-1,weight);
  }
  
  weight(){
    if (this.props.display != null && this.props.display.length > 2){
      return (
        [<p id="pW">Weight:&emsp;</p>,
         <input id="inputW" type="text" value={this.props.display[4]} onChange={()=>this.handleWeightChange()}/>]
      );
    }
    return null;
  }
  
  render(){
    return (
      <div id="panel">
        <div id='placeholder'></div>
        <p>{this.type()}&emsp;{this.props.display != null && this.props.display.length == 2 && this.props.index}</p>
        {this.weight()}
      </div>
    );
  }
}


//---------------
ReactDOM.render(
  <Canvas />,
  document.getElementById('root')
);
