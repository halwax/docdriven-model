function ClassDiagram() {
    this.classes = [];
    this.packages = [];
}

ClassDiagram.prototype.addClass = function(classObj) {
    this.classes.push(classObj);
}

ClassDiagram.prototype.addPackage = function(packageObj) {
    this.packages.push(packageObj);
}

ClassDiagram.prototype.initGraphStyle = function(graph) {

    let vertexStyle = [];

    vertexStyle[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    vertexStyle[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    vertexStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    vertexStyle[mxConstants.STYLE_ROUNDED] = false;
    vertexStyle[mxConstants.STYLE_FILLCOLOR] = 'white';
    vertexStyle[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
    vertexStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    vertexStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    vertexStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    vertexStyle[mxConstants.STYLE_FONTSIZE] = '12';
    vertexStyle[mxConstants.STYLE_FONTSTYLE] = 0;
    
    // Creates the default style for edges
    let edgeStyle = [];
    edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
    edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_BLOCK;
    edgeStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    edgeStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    edgeStyle[mxConstants.STYLE_FONTSIZE] = '12';
    edgeStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    edgeStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    
    graph.getStylesheet().putDefaultVertexStyle(vertexStyle);
    graph.getStylesheet().putDefaultEdgeStyle(edgeStyle);
    
    graph.setHtmlLabels(true);

    graph.setCellsMovable(false);
    graph.cellsSelectable = false;
}


ClassDiagram.prototype.connectBoxes = function(graph, box1, box2, label) {
    var edgeStyle = 'strokeWidth=1.3;rounded=1;';
    this.innerGraph.insertEdge(this.getDefaultParent(), null, label, box1, box2, edgeStyle);
  }

ClassDiagram.prototype.insertPackageInGraph = function(graph, parent, packageObj, packagePosition, packageDimension) {
    return graph.insertVertex(parent, null, [
        '&ensp;<a href="#'+ packageObj.id + '"><i class="fa fa-folder-o" aria-hidden="true"></i></a>',
        '<hr/>',
        '&ensp;<b>'+packageObj.name+'</b>'
    ].join(''), 
    packagePosition.x, packagePosition.y, 
    packageDimension.width, packageDimension.height, 
    'overflow=fill;whiteSpace=wrap;strokeWidth=1;spacing=20;rounded=1;absoluteArcSize=1;arcSize=5;'
    );
}

ClassDiagram.prototype.insertClassInGraph = function(graph, parent, classObj) {
    return graph.insertVertex(parent, null, [
        '<b>'+classObj.name+'</b><hr/>',
        ''
    ].join(''), 
    0, 0, 
    100, 30, 
    'verticalAlign=middle;align=center;overflow=fill;whiteSpace=wrap;strokeWidth=1;rounded=1;');
}

ClassDiagram.prototype.addGroup = function(graph) {
    return graph.insertVertex(graph.getDefaultParent(), null, '', 
    0, 0, 
    100, 30);
}

ClassDiagram.prototype.calculatePackageWith = function () {
    var packageWidth = 120;
    for(var pI = 0; pI < this.packages.length; pI++) {
        var package = this.packages[pI];
        packageWidth = Math.ceil(Math.max(packageWidth, package.name.length * 6.5));
    }
    return packageWidth;
}

ClassDiagram.prototype.render = function(graphDiv) {
    
    var pageWidth = 1400;
    
    var packageWidth = this.calculatePackageWith();
    var packageHeight = 45;

    var packageDimension = {
        width: packageWidth,
        height: packageHeight
    }

    var packageSpace = 20;

    var graph = new mxGraph(graphDiv);
    this.initGraphStyle(graph);
    var parent = graph.getDefaultParent();

    graph.setHtmlLabels(true);

    graph.getModel().beginUpdate();
    try {

        var packageGroup = this.addGroup(graph);

        var packagePosition = {
            x: packageSpace,
            y: packageSpace
        }

        for(var pI = 0; pI < this.packages.length; pI++) {
            
            if(packagePosition.x > (pageWidth - (packageSpace + packageWidth))) {
                packagePosition.x = packageSpace;
                packagePosition.y += packageSpace + packageHeight;
            }

            var packageObj = this.packages[pI];
            var packageNode = this.insertPackageInGraph(graph, 
                packageGroup, 
                packageObj, 
                packagePosition,
                packageDimension);

            packagePosition.x += packageSpace + packageWidth;
        }

        for(var cI = 0; cI < this.classes.length; cI++) {
            var classObj = this.classes[cI];
        }

        packageGroup.geometry.height += packageSpace;
        packageGroup.geometry.width += packageSpace;

    } finally {
        graph.getModel().endUpdate();
    }
}

ClassDiagram.prototype.renderToSvg = function() {    
    var graphDiv = document.createElement('div');
    var graph = this.render(graphDiv);
    var svg = this.toSvg(graph);
    graph.destroy();
    return svg;    
}

ClassDiagram.prototype.toSvg = function(graph) {
    
    var background = '#ffffff';
    var scale = 1;
    var border = 1;
    
    var imgExport = new mxImageExport();
    var bounds = graph.getGraphBounds();
    var vs = graph.view.scale;

    // Prepares SVG document that holds the output
    var svgDoc = mxUtils.createXmlDocument();
    var root = (svgDoc.createElementNS != null) ?
          svgDoc.createElementNS(mxConstants.NS_SVG, 'svg') : svgDoc.createElement('svg');
      
    if (background != null) {
      if (root.style != null) {
        root.style.backgroundColor = background;
      } else {
        root.setAttribute('style', 'background-color:' + background);
      }
    }
      
    if (svgDoc.createElementNS == null) {
        root.setAttribute('xmlns', mxConstants.NS_SVG);
        root.setAttribute('xmlns:xlink', mxConstants.NS_XLINK);
    } else {
      // KNOWN: Ignored in IE9-11, adds namespace for each image element instead. No workaround.
      root.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', mxConstants.NS_XLINK);
    }
    
    root.setAttribute('width', (Math.ceil(bounds.width * scale / vs) + 2 * border) + 'px');
    root.setAttribute('height', (Math.ceil(bounds.height * scale / vs) + 2 * border) + 'px');
    root.setAttribute('version', '1.1');
    
      // Adds group for anti-aliasing via transform
    var group = (svgDoc.createElementNS != null) ?
        svgDoc.createElementNS(mxConstants.NS_SVG, 'g') : svgDoc.createElement('g');
    group.setAttribute('transform', 'translate(0.5,0.5)');
    root.appendChild(group);
    svgDoc.appendChild(root);

      // Renders graph. Offset will be multiplied with state's scale when painting state.
    var svgCanvas = new mxSvgCanvas2D(group);
    svgCanvas.translate(Math.floor((border / scale - bounds.x) / vs), Math.floor((border / scale - bounds.y) / vs));
    svgCanvas.scale(scale / vs);

    // Displayed if a viewer does not support foreignObjects (which is needed to HTML output)
    svgCanvas.foAltText = '[Not supported by viewer]';
    imgExport.drawState(graph.getView().getState(graph.model.root), svgCanvas);

    return mxUtils.getXml(root);   
}