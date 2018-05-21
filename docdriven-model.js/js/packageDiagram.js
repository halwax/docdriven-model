function PackageDiagram() {
  this.mPackages = [];
  this.modelDiagram = new ModelDiagram();
}

PackageDiagram.prototype.addPackage = function (mPackageObj) {
  this.mPackages.push(mPackageObj);
}

PackageDiagram.prototype.connectBoxes = function (graph, box1, box2, label) {
  var edgeStyle = 'strokeWidth=1.3;rounded=1;';
  this.innerGraph.insertEdge(this.getDefaultParent(), null, label, box1, box2, edgeStyle);
}

PackageDiagram.prototype.insertPackageInGraph = function (graph, parent, mPackageObj, packagePosition, packageDimension) {
  var packageCell =  graph.insertVertex(parent, null, [
    '&ensp;<a href="#' + mPackageObj.path + '"><i class="fa fa-folder-o" aria-hidden="true"></i></a>',
    '&ensp;<b>' + mPackageObj.name + '</b>&ensp;'
  ].join(''),
    packagePosition.x, packagePosition.y,
    packageDimension.width, packageDimension.height,
    'strokeWidth=1;rounded=1;absoluteArcSize=1;arcSize=5;editable=0;spacing=4;'
  );
  graph.updateCellSize(packageCell);
  return packageCell;
}

PackageDiagram.prototype.render = function (graphDiv) {

  var pageWidth = 1350;

  var packageWidth = 120;
  var packageHeight = 50;

  var packageDimension = {
    width: packageWidth,
    height: packageHeight
  }

  var packageSpace = 20;

  var graph = new mxGraph(graphDiv);
  this.modelDiagram.initGraphStyle(graph);
  var parent = graph.getDefaultParent();

  graph.setHtmlLabels(true);

  graph.getModel().beginUpdate();
  try {

    var packagePosition = {
      x: packageSpace,
      y: packageSpace
    }

    for (var pI = 0; pI < this.mPackages.length; pI++) {

      if (packagePosition.x > (pageWidth - (packageSpace + packageWidth))) {
        packagePosition.x = packageSpace;
        packagePosition.y += packageSpace + packageHeight;
      }

      var packageObj = this.mPackages[pI];
      var packageNode = this.insertPackageInGraph(graph,
        graph.getDefaultParent(),
        packageObj,
        packagePosition,
        packageDimension);

      packagePosition.x += packageSpace + packageNode.geometry.width;
    }

  } finally {
    graph.getModel().endUpdate();
  }
}

PackageDiagram.prototype.renderToSvg = function () {

  var graphDiv = document.createElement('div');
  var graph = this.render(graphDiv);
  var svg = this.modelDiagram.toSvg(graph);
  graph.destroy();

  return svg;
}

PackageDiagram.prototype.toElkObj = function () {

  var elkObj = {};
  elkObj.id = "root",
    elkObj.properties = { 'algorithm': 'box' };
  elkObj.children = [];

  for (var i = 0; i < this.mPackages.length; i++) {
    var mPackageObj = this.mPackages[i];
    elkObj.children.push({
      id: mPackageObj.path,
      width: 30,
      height: 30
    })
  }

  return elkObj;
}