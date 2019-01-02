var mClassPathToHref = function(mClassPath) {
  var lastSegmentIdx = mClassPath.lastIndexOf('.');
  var packagePath = mClassPath.substring(0, lastSegmentIdx);
  var className = mClassPath.substring(lastSegmentIdx +1, mClassPath.length);
  return '#' + packagePath + '?class=' + className;
}

var mClassPaths = [];
var mPackagePaths = [];
var mClassIdxCollection = [];
var mPropertyIdxCollection = [];

var initIdxCollectionsFromMPackages = function(mPackages) {
  mPackages.forEach(function(mPackage) {
    mPackagePaths.push(mPackage.path);
    initIdxCollectionsFromMPackages(_.defaultTo(mPackage.mPackages, []));
    _.defaultTo(mPackage.mClasses, []).forEach(function(mClass) {
      mClassPaths.push(mClass.path);
      mClassIdxCollection.push({
        'id' : mClass.path,
        'name' : mClass.name,
      });
      _.defaultTo(mClass.mAttributes, []).forEach(function(mProperty) {

      });
    });
  });
};
initIdxCollectionsFromMPackages(_.defaultTo(model.mPackages, []));


var mClassIdx = lunr(function() {
  this.ref('id');
  this.field('name');
  var idxBuilder = this;
  mClassIdxCollection.forEach(function(idxEntry) {
    idxBuilder.add(idxEntry);
  });
});

/**
 * https://www.metachris.com/2017/02/vuejs-syntax-highlighting-with-highlightjs/
 */
Vue.directive('highlightjs', {
  deep: true,
  bind: function (el, binding) {
    // on first bind, highlight all targets
    var targets = el.querySelectorAll('code')
    _.forEach(targets, function(target) {
      // if a value is directly assigned to the directive, use this
      // instead of the element content.
      if (binding.value) {
        target.textContent = binding.value
      }
      hljs.highlightBlock(target);
    })
  },
  componentUpdated: function (el, binding) {
    // after an update, re-fill the content and then highlight
    var targets = el.querySelectorAll('code')
    _.forEach(targets, function(target) {
      if (binding.value) {
        target.textContent = binding.value
        hljs.highlightBlock(target)
      }
    })
  }
});

Vue.component('modelSearch', {
  template: [
    '<div id="modelSearch">',
    ' <input type="text" v-model="search"/>',
    '</div>'
  ].join('\n'),
  data: function() {
    return {
      search: '',
      results: []
    }
  }
});

Vue.component('packageHeader', {
  template: [
    '<div>',
    ' <div style="display:none">{{packageHeaderSelectionInfo(mSelectedClass, hashChangeDate)}}</div>',
    ' <div id="header">',
    '   <div class="title"><h1>{{mPackage.name}}</h1></div>',
    '   <div class="search"><modelSearch/></div>',
    ' </div>',
    ' <hr/>',
    ' <div id="packageHeader"/>',
    ' <span v-for="(breadcrumb, bI) in breadcrumbs">',
    '  <span v-if="bI < breadcrumbs.length - 1"><a :href="\'#\'+ breadcrumb.path">{{breadcrumb.name}}</a>&ensp;&raquo;</span>',
    '  <span v-if="bI == breadcrumbs.length -1">{{breadcrumb.name}}</span>',
    ' </span>',
    '</div>'
  ].join('\n'),
  props: ['mPackage','breadcrumbs','mSelectedClass', 'hashChangeDate'],
  updated: function() {
    this.applySelection();
  }, 
  methods: {
    applySelection: function() {
      if(this.isPackageHeaderSelected(this.mSelectedClass)) {
        var el = this.$el.querySelector('#packageHeader');
        el.scrollIntoView();
      }
    },
    packageHeaderSelectionInfo: function(mSelectedClass, hashChangeDate) {
      if(this.isPackageHeaderSelected(mSelectedClass)) {
        return '' + hashChangeDate;
      }
      return 'selected ' + hashChangeDate;
    },
    isPackageHeaderSelected: function(mSelectedClass) {
      return _.isNil(this.mSelectedClass);
    }
  }
});

Vue.component('subPackageDiagram', {
  template: [
    '<div v-show="_.size(mPackage.mPackages)>0">',
    '   <hr/>',
    '   <h2>Subpackage - Diagram</h2>',
    '   <div id="diagram"></div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage'],
  mounted: function () {
    this.renderDiagram();
  },
  beforeUpdate: function () {
    this.renderDiagram();
  },
  destroyed: function () {
    this.destroyDiagram();
  },
  methods: {
    renderDiagram: function () {
      this.destroyDiagram();

      var diagramDiv = this.$el.querySelector('#diagram')
      var packageDiagram = new PackageDiagram();

      var mPackages = this.mPackage.mPackages;
      for (var pI = 0; pI < _.size(mPackages); pI++) {
        var mPackage = mPackages[pI];
        packageDiagram.addPackage(mPackage);
      }

      this.graph = packageDiagram.render(diagramDiv);
    },
    destroyDiagram: function () {
      if (!_.isNil(this.graph)) {
        this.graph.destroy();
        this.graph = null;
      }
      var diagramDiv = this.$el.querySelector('#diagram')
      diagramDiv.innerHTML = '';
    }
  }
});

Vue.component('classDiagram', {
  template: [
    '<div v-show="_.size(mPackage.mClasses)>0">',
    '   <hr/>',
    '   <h2>Class - Diagram</h2>',
    '   <div id="diagram"></div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage'],
  mounted: function () {
    this.renderDiagram();
  },
  beforeUpdate: function () {
    this.renderDiagram();
  },
  destroyed: function () {
    this.destroyDiagram();
  },
  methods: {
    renderDiagram: function () {
      this.destroyDiagram();

      var diagramDiv = this.$el.querySelector('#diagram')
      var classDiagram = new ClassDiagram();

      var mClasses = this.mPackage.mClasses;
      for (var pI = 0; pI < _.size(mClasses); pI++) {
        var mClassObj = mClasses[pI];
        classDiagram.addClass(mClassObj);
      }

      var mReferences = this.mPackage.mReferences;
      for (var rI = 0; rI < _.size(mReferences); rI++) {
        var mReferenceObj = mReferences[rI];
        classDiagram.addReference(mReferenceObj);
      }
      var mGeneralizations = this.mPackage.mGeneralizations;
      for(var gI = 0; gI < _.size(mGeneralizations); gI++) {
        var mGeneralizationObj = mGeneralizations[gI];
        classDiagram.addGeneralization(mGeneralizationObj);
      }

      this.graph = classDiagram.render(diagramDiv);
    },
    destroyDiagram: function () {
      if (!_.isNil(this.graph)) {
        this.graph.destroy();
        this.graph = null;
      }
      var diagramDiv = this.$el.querySelector('#diagram')
      diagramDiv.innerHTML = '';
    }
  }
});

Vue.component('classDetails', {
  template: [
    '<div>',
    ' <div style="display:none">{{selectionInfo(mSelectedClass, hashChangeDate)}}</div>',
    ' <hr/>',
    ' <div id="classHeader"/>',
    ' <h3>{{mClass.name}}</h3>',
    ' <div v-if="_.size(mClass.mAttributes)>0">',
    '   <h4>Attributes</h4>',
    '   <ul>',
    '     <li v-for="mAttribute in mClass.mAttributes">{{mAttribute.name}} : {{mAttribute.typeName}}</li>',
    '   </ul>',
    ' </div>',
    ' <div v-if="_.size(mClass.mReferences)>0">',
    '   <h4>References</h4>',
    '   <ul>',
    '     <li v-for="mReference in mClass.mReferences">'+
    '       {{mReference.name}} : <a :href="classHref(mReference)"><i class="fa fa-square-o" aria-hidden="true"></i></a> ',
    '       {{mReference.typeName}}',
    '     </li>',
    '   </ul>',
    ' </div>',
    ' <div v-if="!_.isNil(mClass.sql) && _.trim(mClass.sql) !== \'\'">',
    '   <h4>SQL</h4>',
    '   <pre v-highlightjs="mClass.sql"><code class="sql"></code></pre>',
    ' </div>',
    ' <a :href="packageHref(mPackage)"><i class="fa fa-toggle-up" aria-hidden="true"></i></a>',
    '</div>'
  ].join('\n'),
  props: ['mPackage','mClass', 'mSelectedClass', 'hashChangeDate'],
  updated: function() {
    this.applySelection();
  }, 
  methods: {
    classHref: function(mReference) {
      var packagePath = mReference.typePath.substring(0, mReference.typePath.length - ('.' + mReference.typeName).length);
      return '#' + packagePath + '?class=' + mReference.typeName;
    },
    packageHref: function(mPackage) {
      return '#' + mPackage.path;
    },
    applySelection: function() {
      if(this.isSelected(this.mSelectedClass)) {
        var el = this.$el.querySelector('#classHeader');
        el.scrollIntoView();
      }
    },
    selectionInfo: function(mSelectedClass, hashChangeDate) {
      if(this.isSelected(mSelectedClass)) {
        return 'selected ' + hashChangeDate;
      }
      return '' + hashChangeDate;
    },
    isSelected: function(mSelectedClass) {
      return !_.isNil(this.mSelectedClass) && this.mClass.path === mSelectedClass.path;
    }
  }
})

Vue.component('model', {
  template: [
    '<div>',
    ' <packageHeader :mPackage="mPackage" :breadcrumbs="breadcrumbs" :mSelectedClass="mSelectedClass" :hashChangeDate="hashChangeDate"/>',
    ' <subPackageDiagram :mPackage="mPackage"/>',
    ' <classDiagram :mPackage="mPackage"/>',
    ' <classDetails v-for="mClass in filterPackageClasses(mPackage)" :key="mClass.path" :mClass="mClass" :mPackage="mPackage" :mSelectedClass="mSelectedClass" :hashChangeDate="hashChangeDate"/>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'breadcrumbs', 'mSelectedClass', 'hashChangeDate'],
  methods: {
    filterPackageClasses: function(mPackage) {
      return _.filter(mPackage.mClasses, function(mClass) {
        return (mPackage.path + '.' + mClass.name) === mClass.path;
      });
    }
  }
});

new Vue({
  el: '.model-app',
  data: function () {
    var modelPath = this.toModelPath(this.loadHashPath());
    var mPackageAndClassData = this.findMPackageAndClassDataByModelPath(modelPath);
    return {
      packagePath: modelPath.packagePath,
      classPath: modelPath.classPath,
      mPackage: mPackageAndClassData.mPackage,
      mSelectedClass: mPackageAndClassData.mClass,
      breadcrumbs: mPackageAndClassData.breadcrumbs,
      hashChangeDate: new Date()
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      window.addEventListener('hashchange', this.changeHashPath);
    })
  },
  beforeDestroy: function () {
  },
  methods: {
    loadHashPath: function () {
      return window.location.hash;
    },
    toModelPath: function(hashPath) {
      var modelPath = {
        packagePath : hashPath,
        classPath : null
      }
      if (_.startsWith(modelPath.packagePath, '#_')) {
        modelPath.packagePath = modelPath.packagePath.substring(2);
      }
      if (_.startsWith(modelPath.packagePath,'#')) {
        modelPath.packagePath = modelPath.packagePath.substring(1);
      }
      if(_.includes(modelPath.packagePath, '?')) {
        var pathWithQuery = modelPath.packagePath;
        modelPath.packagePath = pathWithQuery.substring(0, pathWithQuery.indexOf('?'));
        var queryPath = pathWithQuery.substring(pathWithQuery.indexOf('?'), pathWithQuery.length);
        if(_.startsWith(queryPath,'?class=')) {
          modelPath.classPath = queryPath.substring('?class='.length);
        }
      }
      return modelPath;
    },
    changeHashPath: _.debounce(function (event) {

      var hashPath = this.loadHashPath();
      var modelPath = this.toModelPath(hashPath);

      var packageHasChanged = this.packagePath !== modelPath.packagePath;
      var classPathHashChanged = this.classPath !== modelPath.classPath;
      
      var mPackageAndClassData = this.findMPackageAndClassDataByModelPath(modelPath);
      if(packageHasChanged) {
        this.packagePath = modelPath.packagePath;
        this.mPackage = mPackageAndClassData.mPackage;
        this.breadcrumbs = mPackageAndClassData.breadcrumbs;
      }
      
      this.classPath = modelPath.classPath;
      this.mSelectedClass = mPackageAndClassData.mClass;
      if(_.startsWith(hashPath,'#') && !_.startsWith(hashPath,'#_')) {
        hashPath = '#_' + hashPath.substring(1);
      }
      this.hashChangeDate = new Date();

      var pathname = document.location.pathname;
      if(_.startsWith(pathname,'/')) {
        pathname = pathname.substring(1);
      }
      history.replaceState(null, null, pathname + hashPath);
    }, 300),
    findMPackageAndClassDataByModelPath: function (modelPath) {
      var mPackageData = this.findMPackageDataByPath(model, modelPath.packagePath)
      if (_.isNil(mPackageData)) {
        mPackageData = {
          mPackage : model,
          breadcrumbs : [],
          mClass : null
        }
        mPackageData.breadcrumbs.unshift({
          name: model.name,
          path: model.path
        });
      }

      var mClass = _.find(mPackageData.mPackage.mClasses,function(mClass){ return mClass.name === modelPath.classPath});
      mPackageData.mClass = mClass;

      return mPackageData;
    },
    findMPackageDataByPath: function(mPackage, packagePath) {
      if (packagePath === mPackage.path) {
        return {
          mPackage : mPackage,
          breadcrumbs : [
            {
              name: mPackage.name,
              path: mPackage.path
            }
          ]
        };
      }
      if (_.startsWith(packagePath, mPackage.path)) {
        for (var i = 0; i < _.size(mPackage.mPackages); i++) {
          var mSubPackage = mPackage.mPackages[i];
          var result = this.findMPackageDataByPath(mSubPackage, packagePath);
          if (result !== null) {
            result.breadcrumbs.unshift({
              name: mPackage.name,
              path: mPackage.path
            })
            return result;
          }
        }
      }
      return null;
    }
  }
})