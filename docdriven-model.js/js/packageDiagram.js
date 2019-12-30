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
  
  let href = '#' + mPackageObj.path;

  var packageValueNode = document.createElement('ClassNode')
  packageValueNode.setAttribute('label', mPackageObj.name);
  packageValueNode.setAttribute('link', href);

  var packageCell =  graph.insertVertex(parent, null,
    packageValueNode,
    packagePosition.x, packagePosition.y,
    packageDimension.width, packageDimension.height,
    'strokeWidth=1;rounded=0;absoluteArcSize=0;arcSize=0;spacing=4;html=1;align=left;'
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

  return graph;
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