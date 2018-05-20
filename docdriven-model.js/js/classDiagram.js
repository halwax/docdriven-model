function ClassDiagram() {
  this.mClasses = [];
  this.mReferences = [];
  this.modelDiagram = new ModelDiagram();
}

ClassDiagram.prototype.addClass = function (mClassObj) {
  this.mClasses.push(mClassObj);
}

ClassDiagram.prototype.addReference = function (mReferenceObj) {
  this.mReferences.push(mReferenceObj);
}

ClassDiagram.prototype.insertClassInGraph = function (graph, parent, mClassObj, position, dimension) {
  var classVertex = graph.insertVertex(parent, null, [
    '&ensp;<b>' + mClassObj.name + '</b>&ensp;',
    '<hr style="width: 100%;"/>',
    this.htmlClassAttributes(mClassObj)
  ].join(''),
    position.x, position.y,
    dimension.width, dimension.height,
    'strokeWidth=1;rounded=1;absoluteArcSize=1;arcSize=5;editable=0;spacing=5;'
  );
  graph.updateCellSize(classVertex);
  return classVertex;
}

ClassDiagram.prototype.htmlClassAttributes = function (mClassObj) {
  var result = '';
  if (_.size(mClassObj.mAttributes) === 0) {
    return result;
  }
  result = _.join(_.map(mClassObj.mAttributes, function (attr) {
    return '&ensp;' + attr.name + ' : ' + attr.typeName + '&ensp;';
  }), '<br/>');
  return result;
}

ClassDiagram.prototype.addGroup = function (graph, width, height) {
  return graph.insertVertex(graph.getDefaultParent(), null, '',
    0, 0,
    width, height);
}

ClassDiagram.prototype.calculateClassWidth = function () {
  var classWidth = 120;
  for (var pI = 0; pI < this.mClasses.length; pI++) {
    var mClass = this.mClasses[pI];
    classWidth = Math.ceil(Math.max(classWidth, mClass.name.length * 6.5));
  }
  return classWidth;
}

ClassDiagram.prototype.insertReferenceInGraph = function (graph, class1, class2, eEdge) {
  //var edgeStyle = 'rounded=1;endArrow=block;endFill=0;endSize=10;';
  var edgeStyle = 'rounded=1;endArrow=open;';
  var edge = graph.insertEdge(graph.getDefaultParent(), null, null, class1, class2, edgeStyle);
  for(var eI = 0; eI < _.size(eEdge.labels); eI++) {
    var edgeLabel = eEdge.labels[eI];
    graph.insertVertex(edge, null, edgeLabel.text, edgeLabel.x, edgeLabel.y, 0, 0);
  }
}

ClassDiagram.prototype.render = function (graphDiv) {

  var pageWidth = 1350;

  var classWidth = this.calculateClassWidth();
  var classHeight = 45;

  var classDimension = {
    width: classWidth,
    height: classHeight
  }

  var classSpace = 20;

  var graph = new mxGraph(graphDiv);
  this.modelDiagram.initGraphStyle(graph);
  var parent = graph.getDefaultParent();

  graph.setHtmlLabels(true);

  graph.getModel().beginUpdate();
  try {

    var classGroup = this.addGroup(graph, pageWidth, classHeight + classSpace);

    var classPosition = {
      x: classSpace,
      y: classSpace
    }

    var classDiagramObj = {};
    classDiagramObj.classNodes = {};
    classDiagramObj.mReferences = this.mReferences;

    for (var cI = 0; cI < this.mClasses.length; cI++) {

      if (classPosition.x > (pageWidth - (classSpace + classWidth))) {
        classPosition.x = classSpace;
        classPosition.y += classSpace + classHeight;
      }

      var classObj = this.mClasses[cI];
      var classNode = this.insertClassInGraph(graph,
        classGroup,
        classObj,
        classPosition,
        classDimension);
      if (_.isNil(classNode.data)) {
        classNode.data = {};
      }
      classNode.data.path = classObj.path;

      classDiagramObj.classNodes[classObj.path] = {
        id: classNode.id,
        width: classNode.geometry.width,
        height: classNode.geometry.height
      }

      classPosition.x += classSpace + classWidth;
    }

    classGroup.geometry.height += classSpace;
    classGroup.geometry.width += classSpace;

  } finally {
    graph.getModel().endUpdate();
  }

  this.elkLayout(graph, classDiagramObj);
}

ClassDiagram.prototype.elkLayout = function (graph, classDiagramObj) {

  var elkObj = {};
  elkObj.id = "root";
  elkObj.properties = { 'algorithm': 'layered' };
  elkObj.children = [];
  elkObj.edges = [];

  for (var classNode in classDiagramObj.classNodes) {
    var classNode = classDiagramObj.classNodes[classNode];
    elkObj.children.push({
      id: classNode.id,
      width: classNode.width,
      height: classNode.height
    })
  }

  var mReferenceObjects = {};
  for (var rI = 0; rI < _.size(classDiagramObj.mReferences); rI++) {
    var mReferenceObj = classDiagramObj.mReferences[rI];
    var edgeId = 'e' + rI;
    
    var sourceLabelBox = this.modelDiagram.getDefaultTextBox(mReferenceObj.sourceLabel);
    var targetLabelBox = this.modelDiagram.getDefaultTextBox(mReferenceObj.targetLabel);

    elkObj.edges.push({
      id: edgeId,
      sources: [classDiagramObj.classNodes[mReferenceObj.source].id],
      targets: [classDiagramObj.classNodes[mReferenceObj.target].id],
      labels: [
        {
          text: sourceLabelBox.text,
          width: sourceLabelBox.width,
          height: sourceLabelBox.height,
          layoutOptions: {
            'org.eclipse.elk.edgeLabels.placement' : 'TAIL'
          }
        },
        {
          text: targetLabelBox.text,
          width: targetLabelBox.width,
          height: targetLabelBox.height,
          layoutOptions: {
            'org.eclipse.elk.edgeLabels.placement' : 'HEAD'
          }
        }
      ]
    });
    mReferenceObjects[edgeId] = mReferenceObj;
  }

  var classDiagram = this;

  var elk = new ELK();
  elk.layout(elkObj).then(function (g) {

    var gModel = graph.getModel();
    gModel.beginUpdate();
    try {
      
      for(var nI = 0; nI < g.children.length; nI++) {
        var eNode = g.children[nI];
        var classCell = gModel.getCell(eNode.id);
        var geometry = classCell.getGeometry();
        graph.moveCells([classCell], eNode.x - geometry.x, eNode.y - geometry.y);
      }

      for(var eI = 0; eI < g.edges.length; eI++) {
        
        var eEdge = g.edges[eI];
        
        var mReferenceObj = mReferenceObjects[eEdge.id];
        var sourceClassCell = gModel.getCell(eEdge.sources[0]);
        var targetClassCell = gModel.getCell(eEdge.targets[0]);

        classDiagram.insertReferenceInGraph(graph, sourceClassCell, targetClassCell, eEdge);

      }
    } finally {
      gModel.endUpdate();
    }
  });

}