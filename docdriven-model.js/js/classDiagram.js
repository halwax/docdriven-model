function ClassDiagram() {
  this.mClasses = [];
  this.mReferences = [];
  this.mGeneralizations = [];
  this.modelDiagram = new ModelDiagram();
}

ClassDiagram.prototype.addClass = function (mClassObj) {
  this.mClasses.push(mClassObj);
}

ClassDiagram.prototype.addReference = function (mReferenceObj) {
  this.mReferences.push(mReferenceObj);
}

ClassDiagram.prototype.addGeneralization = function (mGeneralization) {
  this.mGeneralizations.push(mGeneralization);
}

ClassDiagram.prototype.insertClassInGraph = function (graph, parent, mClassObj, position, dimension) {

  var classVertex = graph.insertVertex(parent, null,
    '',
    position.x, position.y,
    0, 0,
    'swimlane;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=1;horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=0;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;fillColor=#FFFFFF;perimeterSpacing=0;swimlaneFillColor=#ffffff;fontStyle=0;swimlaneLine=0;html=1;'
  );
  if(classVertex.geometry.width < 100) {
    graph.resizeCell(classVertex, new mxRectangle(classVertex.geometry.x, classVertex.geometry.y, 100, classVertex.geometry.height));
  }

  // Creates a stack depending on the orientation of the swimlane
  var layout = new mxStackLayout(classVertex, false);
  // Makes sure all children fit into the parent swimlane
  layout.resizeParent = true;        
  // Applies the size to children if parent size changes
  layout.fill = true;

  this.fillClassContainer(graph, classVertex, mClassObj)

  graph.resizeCell(classVertex, new mxRectangle(classVertex.geometry.x, classVertex.geometry.y, classVertex.geometry.width, classVertex.geometry.height + 3));
  
  return classVertex;
}

ClassDiagram.prototype.fillClassContainer = function (graph, classVertex, mClassObj) {

  let offset = classVertex.geometry.height + 2;

  let stereotypeVertex = undefined;
  if (_.size(mClassObj.stereotypes) > 0) {
    stereotypeVertex = graph.insertVertex(classVertex, null, '<<Entity>>',
      0, offset, 0, 0,
      'text;fontSize=10;align=center;fontColor=#454545;verticalAlign=top;overflow=hidden;strokeColor=none;spacingBottom=-2;');
    graph.updateCellSize(stereotypeVertex);
    offset += stereotypeVertex.geometry.height;
  }

  var href = mClassPathToHref(mClassObj.path);

  var classValueNode = document.createElement('ClassNode')
  classValueNode.setAttribute('label', mClassObj.name);
  classValueNode.setAttribute('link', href);

  let classNameVertex = graph.insertVertex(classVertex, null, classValueNode,
    0, offset, 0, 0,
    'text;align=center;verticalAlign=top;spacingTop=-2;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontStyle=0;strokeColor=none;');
  graph.updateCellSize(classNameVertex);
  offset += classNameVertex.geometry.height;

  if (_.size(mClassObj.mAttributes) > 0) {
    // add divider line
    let dividerLine = graph.insertVertex(classVertex, null, '', 0, offset, 100, 3, 'fillColor=#000000;strokeWidth=1;align=left;verticalAlign=middle;spacingTop=2;spacingBottom=2;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;strokeColor=none;');
    offset += dividerLine.geometry.height;

    for (let mAttribute of mClassObj.mAttributes) {
      let attributeVertex = graph.insertVertex(classVertex, null, mAttribute.name + ' : ' + mAttribute.typeName,
        0, offset, 0, 0,
        'text;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontStyle=0;strokeColor=none;');
      graph.updateCellSize(attributeVertex);
      offset += attributeVertex.geometry.height;
    }
    // let divider line width match class container width
    graph.resizeCell(dividerLine, new mxRectangle(dividerLine.geometry.x, dividerLine.geometry.y, classVertex.geometry.width, 1));
  }

  // let stereotype line width match class container width
  graph.resizeCell(classNameVertex, new mxRectangle(classNameVertex.geometry.x, classNameVertex.geometry.y, classVertex.geometry.width, classNameVertex.geometry.height));

  if(!_.isNil(stereotypeVertex)) {
    graph.resizeCell(stereotypeVertex, new mxRectangle(stereotypeVertex.geometry.x, stereotypeVertex.geometry.y, classVertex.geometry.width, stereotypeVertex.geometry.height));
  }
}

ClassDiagram.prototype.calculateClassWidth = function () {
  var classWidth = 120;
  for (var pI = 0; pI < this.mClasses.length; pI++) {
    var mClass = this.mClasses[pI];
    classWidth = Math.ceil(Math.max(classWidth, mClass.name.length * 6.5));
  }
  return classWidth;
}

ClassDiagram.prototype.insertGeneralization = function (graph, subClass, superClass, eEdge) {
  var edgeStyle = 'rounded=1;arcSize=2;strokeWidth=1.5;endArrow=block;endFill=0;endSize=10;edgeStyle=orthogonalEdgeStyle;fontStyle=0;'
  var edge = graph.insertEdge(graph.getDefaultParent(), null, '', subClass, superClass, edgeStyle);
  var points = [];
  for (var iS = 0; iS < eEdge.sections.length; iS++) {
    var section = eEdge.sections[iS];
    points.push({
      x: section.startPoint.x,
      y: section.startPoint.y
    })
    for(var bI = 0; bI < _.size(section.bendPoints); bI++) {
      var bendPoint = section.bendPoints[bI];
      points.push({
        x: bendPoint.x,
        y: bendPoint.y
      })
    }
    points.push({
      x: section.endPoint.x,
      y: section.endPoint.y
    });
  }
  edge.getGeometry().points = points;

  for (var eI = 0; eI < _.size(eEdge.labels); eI++) {
    var edgeLabel = eEdge.labels[eI];
    graph.insertVertex(edge, null, edgeLabel.text, edgeLabel.x, edgeLabel.y, 0, 0, 'align=left;vericalAlign=top;');
  }

  return edge;
}

ClassDiagram.prototype.insertReferenceInGraph = function (graph, class1, class2, eEdge) {
  //var edgeStyle = 'rounded=1;endArrow=block;endFill=0;endSize=10;';
  var edgeStyle = 'rounded=1;arcSize=2;endArrow=open;edgeStyle=orthogonalEdgeStyle;';

  var edge = graph.insertEdge(graph.getDefaultParent(), null, null, class1, class2, edgeStyle);
  var points = [];
  for (var iS = 0; iS < eEdge.sections.length; iS++) {
    var section = eEdge.sections[iS];
    points.push({
      x: section.startPoint.x,
      y: section.startPoint.y
    })
    for(var bI = 0; bI < _.size(section.bendPoints); bI++) {
      var bendPoint = section.bendPoints[bI];
      points.push({
        x: bendPoint.x,
        y: bendPoint.y
      })
    }
    points.push({
      x: section.endPoint.x,
      y: section.endPoint.y
    });
  }
  edge.getGeometry().points = points;

  for (var eI = 0; eI < _.size(eEdge.labels); eI++) {
    var edgeLabel = eEdge.labels[eI];
    graph.insertVertex(edge, null, edgeLabel.text, edgeLabel.x, edgeLabel.y, 0, 0, 'align=left;vericalAlign=top;html=1;');
  }

  return edge;
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

  graph.getCursorForCell = function (cell) {
    if (!_.isNil(cell) && !(typeof cell.value === 'undefined') && mxUtils.isNode(cell.value)) {
      return 'pointer';
    }
  };

  graph.addListener(mxEvent.CLICK, function (sender, evt) {
    var cell = evt.getProperty('cell');
    if (!_.isNil(cell) && !(typeof cell.value === 'undefined') && mxUtils.isNode(cell.value)) {
      location.href = cell.value.getAttribute('link');
    }
  });

  graph.isCellFoldable = function(cell) {
    return false;
  };

  graph.convertValueToString = function (cell) {
    if (mxUtils.isNode(cell.value)) {
      return cell.getAttribute('label', '')
    }
    return cell.value;
  };

  var cellLabelChanged = graph.cellLabelChanged;
  graph.cellLabelChanged = function (cell, newValue, autoSize) {
    if (mxUtils.isNode(cell.value)) {
      // Clones the value for correct undo/redo
      var elt = cell.value.cloneNode(true);
      elt.setAttribute('label', newValue);
      newValue = elt;
    }
    cellLabelChanged.apply(this, arguments);
  };

  new mxSwimlaneManager(graph);

  var parent = graph.getDefaultParent();

  graph.getModel().beginUpdate();
  try {

    var classPosition = {
      x: classSpace,
      y: classSpace
    }

    var classDiagramObj = {};
    classDiagramObj.classNodes = {};
    classDiagramObj.mReferences = this.mReferences;
    classDiagramObj.mGeneralizations = this.mGeneralizations;

    for (var cI = 0; cI < this.mClasses.length; cI++) {

      if (classPosition.x > (pageWidth - (classSpace + classWidth))) {
        classPosition.x = classSpace;
        classPosition.y += classSpace + classHeight;
      }

      var classObj = this.mClasses[cI];
      var classNode = this.insertClassInGraph(graph,
        graph.getDefaultParent(),
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

  } finally {
    graph.getModel().endUpdate();
  }

  this.elkLayout(graph, classDiagramObj);

  return graph;
}

ClassDiagram.prototype.elkLayout = function (graph, classDiagramObj) {

  var elkObj = {};
  elkObj.id = "root";
  elkObj.children = [];
  elkObj.edges = [];
  elkObj.layoutOptions = {
    'elk.algorithm': 'layered'
  };

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
    var edgeId = 'r' + rI;

    var sourceLabelBox = this.modelDiagram.getDefaultTextBox(mReferenceObj.sourceLabel);
    var targetLabelBox = this.modelDiagram.getDefaultTextBox(mReferenceObj.targetLabel);

    elkObj.edges.push({
      id: edgeId,
      sources: [classDiagramObj.classNodes[mReferenceObj.source].id],
      targets: [classDiagramObj.classNodes[mReferenceObj.target].id],
      layoutOptions: {
        'org.eclipse.elk.edge.type': 'ASSOCIATION'
      },
      labels: [
        {
          text: sourceLabelBox.text,
          width: sourceLabelBox.width,
          height: sourceLabelBox.height,
          layoutOptions: {
            'org.eclipse.elk.edgeLabels.placement': 'TAIL'
          }
        },
        {
          text: targetLabelBox.text,
          width: targetLabelBox.width,
          height: targetLabelBox.height,
          layoutOptions: {
            'org.eclipse.elk.edgeLabels.placement': 'HEAD'
          }
        }
      ]
    });

    mReferenceObjects[edgeId] = mReferenceObj;
  }

  var mGeneralizationObjects = {};
  for (var gI = 0; gI < _.size(classDiagramObj.mGeneralizations); gI++) {
    var mGeneralizationObject = classDiagramObj.mGeneralizations[gI];
    var edgeId = 'g' + gI;

    elkObj.edges.push({
      id: edgeId,
      sources: [classDiagramObj.classNodes[mGeneralizationObject.source].id],
      targets: [classDiagramObj.classNodes[mGeneralizationObject.target].id],
      layoutOptions: {
        'org.eclipse.elk.edge.type': 'GENERALIZATION'
      }
    })

    mGeneralizationObjects[edgeId] = mGeneralizationObject;
  }

  var classDiagram = this;

  var elk = new ELK();
  elk.layout(elkObj).then(function (g) {

    var gModel = graph.getModel();
    gModel.beginUpdate();
    try {

      for (var nI = 0; nI < g.children.length; nI++) {
        var eNode = g.children[nI];
        var classCell = gModel.getCell(eNode.id);
        var geometry = classCell.getGeometry();
        graph.translateCell(classCell, eNode.x - geometry.x, eNode.y - geometry.y);
      }

      for (var eI = 0; eI < g.edges.length; eI++) {

        var eEdge = g.edges[eI];

        var mReferenceObj = mReferenceObjects[eEdge.id];
        var sourceClassCell = gModel.getCell(eEdge.sources[0]);
        var targetClassCell = gModel.getCell(eEdge.targets[0]);

        if (_.startsWith(eEdge.id, 'r')) {
          classDiagram.insertReferenceInGraph(graph, sourceClassCell, targetClassCell, eEdge);
        } else if (_.startsWith(eEdge.id, 'g')) {
          classDiagram.insertGeneralization(graph, sourceClassCell, targetClassCell, eEdge);
        }

      }
    } finally {
      gModel.endUpdate();
    }
  });
}

ClassDiagram.prototype.toSvg = function () {
  return this.modelDiagram.toSvg();
}
