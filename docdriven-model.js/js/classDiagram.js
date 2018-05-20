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

ClassDiagram.prototype.calculateClassWidth = function () {
  var classWidth = 120;
  for (var pI = 0; pI < this.mClasses.length; pI++) {
    var mClass = this.mClasses[pI];
    classWidth = Math.ceil(Math.max(classWidth, mClass.name.length * 6.5));
  }
  return classWidth;
}

ClassDiagram.prototype.insertGeneralisation = function (graph, subClass, superClass, eEdge) {
  var edgeStyle = 'rounded=1;endArrow=block;endFill=0;'
  var edge = graph.insertEdge(graph.getDefaultParent(), null, '&ensp;', subClass, superClass, edgeStyle);
  var points = [];
  for (var iS = 0; iS < eEdge.sections.length; iS++) {
    var section = eEdge.sections[iS];
    var startPoint = {
      x: section.startPoint.x,
      y: section.startPoint.y
    }
    var endPoint = {
      x: section.endPoint.x,
      y: section.endPoint.y
    }
    points.push(startPoint);
    points.push(endPoint);
  }
  edge.getGeometry().points = points;

  for (var eI = 0; eI < _.size(eEdge.labels); eI++) {
    var edgeLabel = eEdge.labels[eI];
    graph.insertVertex(edge, null, edgeLabel.text, edgeLabel.x, edgeLabel.y, 0, 0);
  }

  return edge;
}

ClassDiagram.prototype.insertReferenceInGraph = function (graph, class1, class2, eEdge) {
  //var edgeStyle = 'rounded=1;endArrow=block;endFill=0;endSize=10;';
  var edgeStyle = 'rounded=1;endArrow=open;';

  var edge = graph.insertEdge(graph.getDefaultParent(), null, null, class1, class2, edgeStyle);
  var points = [];
  for (var iS = 0; iS < eEdge.sections.length; iS++) {
    var section = eEdge.sections[iS];
    var startPoint = {
      x: section.startPoint.x,
      y: section.startPoint.y
    }
    var endPoint = {
      x: section.endPoint.x,
      y: section.endPoint.y
    }
    points.push(startPoint);
    points.push(endPoint);
  }
  edge.getGeometry().points = points;

  for (var eI = 0; eI < _.size(eEdge.labels); eI++) {
    var edgeLabel = eEdge.labels[eI];
    graph.insertVertex(edge, null, edgeLabel.text, edgeLabel.x, edgeLabel.y, 0, 0);
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
  var parent = graph.getDefaultParent();

  graph.setHtmlLabels(true);

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
          classDiagram.insertGeneralisation(graph, sourceClassCell, targetClassCell, eEdge);
        }

      }
    } finally {
      gModel.endUpdate();
    }
  });

}