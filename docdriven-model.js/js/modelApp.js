
var isIe = /*@cc_on!@*/false || !!document.documentMode;
var ieDelay = 1000;

function copyToClipboard(text) {

  if (window.clipboardData) {
    window.clipboardData.setData('Text', text);
    return;
  }

  // standard way of copying
  var textArea = document.createElement('textarea');
  textArea.setAttribute
    ('style', 'width:1px;border:0;opacity:0;');
  document.body.appendChild(textArea);
  textArea.value = text;
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

var mClassPathToHref = function (mClassPath) {
  var lastSegmentIdx = mClassPath.lastIndexOf('.');
  var packagePath = mClassPath.substring(0, lastSegmentIdx);
  var className = mClassPath.substring(lastSegmentIdx + 1, mClassPath.length);
  return '#' + packagePath + '!class=' + className;
}

var mClassIdxCollection = [];
var mClassPathToDisplayName = {};

var initIdxCollectionsFromMPackages = function (namePrefix, mPackages) {

  mPackages.forEach(function (mPackage) {

    initIdxCollectionsFromMPackages(namePrefix + mPackage.name + '.', _.defaultTo(mPackage.mPackages, []));

    _.defaultTo(mPackage.mClasses, []).forEach(function (mClass) {

      if (!mClass.path.startsWith(mPackage.path)) {
        // mClass referenced from other packages
        return;
      }

      mClassPathToDisplayName[mClass.path] = namePrefix + mPackage.name + '.' + mClass.name;
      mClassIdxCollection.push({
        'id': mClass.path,
        'name': mClass.name,
      });
    });
    _.defaultTo(mPackage.mEnums, []).forEach(function (mEnum) {

      mClassPathToDisplayName[mEnum.path] = namePrefix + mPackage.name + '.' + mEnum.name;
      mClassIdxCollection.push({
        'id': mEnum.path,
        'name': mEnum.name,
      });
    });
  });
};
initIdxCollectionsFromMPackages('', _.defaultTo(model.mPackages, []));


var mClassIdx = lunr(function () {
  this.ref('id');
  this.field('name');
  var idxBuilder = this;
  mClassIdxCollection.forEach(function (idxEntry) {
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
    _.forEach(targets, function (target) {
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
    _.forEach(targets, function (target) {
      if (binding.value) {
        target.textContent = binding.value
        hljs.highlightBlock(target)
      }
    })
  }
});

// https://alligator.io/vuejs/vue-autocomplete-component/
Vue.component('modelSearch', {
  template: [
    '<form class="modelSearch">',
    ' <div class="autocomplete">',
    '   <div>',
    '     <input type="text" v-model="search" placeholder="Search or jump to ..."',
    '       @input="onChange" @keydown.down="selectDown" @keydown.up="selectUp" @keydown.enter="confirmSelect"/>',
    '     <button @click="applyElFocus"><i class="fa fa-search"></i></button>',
    '   </div>',
    '   <div class="autocomplete-items">',
    '     <div v-for="(result, rI) in results" @click="openSelection(rI)"',
    '         :class="{ \'autocomplete-item-selected\' : rI === selectIdx,  \'autocomplete-item\' : rI !== selectIdx}">',
    '       {{pathToDisplayName(result)}}',
    '     </div>',
    '   </div>',
    ' </div>',
    '</form>'
  ].join('\n'),
  props: ['elFocusFlag'],
  data: function () {
    return {
      search: '',
      results: [],
      matchNumber: 0,
      selectIdx: -1
    }
  },
  methods: {
    onChange: _.debounce(function () {
      this.searchInIdx();
    }, 500),
    searchInIdx: function () {
      this.results = [];
      if (!_.isNil(this.search) && this.search.trim().length > 2) {
        var result = mClassIdx.search(this.search);
        var presentedResultLength = Math.min(result.length, 7);
        for (var i = 0; i < presentedResultLength; i++) {
          var resultItem = result[i];
          this.results.push(resultItem.ref);
        }
      }
    },
    pathToHref: function (result) {
      return mClassPathToHref(result);
    },
    pathToDisplayName: function (result) {
      var displayName = mClassPathToDisplayName[result];
      return displayName;
    },
    selectDown: function () {
      if (this.selectIdx < (this.results.length - 1)) {
        this.selectIdx++;
      }
    },
    selectUp: function () {
      if (this.selectIdx > 0) {
        this.selectIdx--;
      }
    },
    confirmSelect: function () {
      if (this.selectIdx !== -1) {
        this.openSelection(this.selectIdx);
      }
      this.selectIdx = -1;
      this.results = [];
    },
    openSelection: function (selectIdx) {
      var href = window.location.href;
      var hashIdx = href.indexOf('#');
      hashIdx = hashIdx === -1 ? href.length : hashIdx;
      var hashPath = this.pathToHref(this.results[selectIdx]);
      var newHref = href.substring(0, hashIdx) + hashPath;
      if (href === newHref) {
        newHref = href.substring(0, hashIdx) + '#_' + hashPath.substring(1, hashPath.length);
      }
      window.location.href = newHref;
      this.selectIdx = -1;
      this.results = [];
    },
    handleClickOutside: function (evt) {
      if (!this.$el.contains(evt.target)) {
        this.results = [];
        this.selectIdx = -1;
      }
    },
    applyElFocus: function () {
      this.$nextTick(function () {
        var el = this.$el.querySelector('input');
        el.scrollIntoView();
        window.scrollBy(0, -30);
        el.value = '';
        el.focus();
        this.$emit('elFocus');
      });
    }
  },
  mounted: function () {
    document.addEventListener('click', this.handleClickOutside);
    if (this.elFocusFlag) {
      this.applyElFocus();
    }
  },
  updated: function () {
    if (this.elFocusFlag) {
      this.applyElFocus();
    }
  },
  destroyed: function () {
    document.removeEventListener('click', this.handleClickOutside)
  }
});

Vue.component('packageHeader', {
  template: [
    '<div>',
    ' <div style="display:none">{{packageHeaderSelectionInfo(mSelectedClass, hashChangeDate)}}</div>',
    ' <div id="packageHeader"/>',
    ' <div id="header">',
    '   <span class="model-logo fa-stack fa-lg">',
    '     <i class="fa fa-circle fa-stack-2x fa-inverse"></i>',
    '     <i class="fa fa-tags fa-stack-1x"></i>',
    '   </span>',
    '   <div class="search"><modelSearch @elFocus="onElFocus" :elFocusFlag="elFocusFlag"/></div>',
    ' </div>',
    ' <div class="content"><h1 class="package-title">{{mPackage.name}}</h1></div>',
    ' <hr class="separator"/>',
    ' <div class="content"><span v-for="(breadcrumb, bI) in breadcrumbs">',
    '  <span v-if="bI < breadcrumbs.length - 1"><a :href="\'#\'+ breadcrumb.path">{{breadcrumb.name}}</a>&ensp;&raquo;</span>',
    '  <span v-if="bI == breadcrumbs.length -1">{{breadcrumb.name}}</span>',
    ' </span></div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'breadcrumbs', 'mSelectedClass', 'hashChangeDate', 'elFocusFlag'],
  updated: function () {
    this.applySelection();
  },
  methods: {
    applySelection: function () {
      if (this.isPackageHeaderSelected(this.mSelectedClass)) {
        var el = this.$el.querySelector('#packageHeader');
        el.scrollIntoView();
      }
    },
    packageHeaderSelectionInfo: function (mSelectedClass, hashChangeDate) {
      if (this.isPackageHeaderSelected(mSelectedClass)) {
        return '' + hashChangeDate;
      }
      return 'selected ' + hashChangeDate;
    },
    isPackageHeaderSelected: function (mSelectedClass) {
      return _.isNil(this.mSelectedClass);
    },
    onElFocus: function () {
      this.$emit('elFocus');
    }
  }
});

Vue.component('subPackageDiagram', {
  template: [
    '<div v-show="_.size(mPackage.mPackages)>0">',
    '   <div style="display:none">{{elFocusFlag}}</div>',
    '   <hr class="separator"/>',
    '   <div class="content">',
    '     <div class="diagram-title">',
    '       <h3>Subpackage - Diagram</h3>',
    '       <div class="diagram-toolbar"><i class="fa fa-clipboard" aria-hidden="true" @click="copyToClipboard"></i></div>',
    '     </div>',
    '     <div class="diagram" id="package-diagram"></div>',
    '   </div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'elFocusFlag'],
  mounted: function () {
    this.renderDiagram();
    if (this.elFocusFlag) {
      this.applyElFocus();
    }
  },
  updated: function () {
    if (this.elFocusFlag) {
      this.applyElFocus();
    }
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

      var diagramDiv = this.$el.querySelector('#package-diagram')
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
      var diagramDiv = this.$el.querySelector('#package-diagram')
      diagramDiv.innerHTML = '';
    },
    applyElFocus: function () {
      this.$nextTick(function () {
        var el = this.$el.querySelector('.content');
        el.scrollIntoView();
        el.value = '';
        el.focus();
        this.$emit('elFocus');
      });
    },
    copyToClipboard: function () {
      copyToClipboard(new ModelDiagram().getXml(this.graph));
    }
  }
});

Vue.component('classDiagram', {
  template: [
    '<div v-show="_.size(mPackage.mClasses)>0">',
    '   <div style="display:none">{{elFocusFlag}}</div>',
    '   <hr class="separator"/>',
    '   <div class="content">',
    '     <div class="diagram-title">',
    '       <h3>Class - Diagram</h3>',
    '       <div class="diagram-toolbar"><i class="fa fa-clipboard" aria-hidden="true" @click="copyToClipboard"></i></div>',
    '     </div>',
    '     <div class="diagram" id="class-diagram"></div>',
    '   </div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'elFocusFlag'],
  mounted: function () {
    this.renderDiagram();
    if (this.elFocusFlag) {
      this.applyElFocus();
    }
  },
  updated: function () {
    if (this.elFocusFlag) {
      this.applyElFocus();
    }
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

      var diagramDiv = this.$el.querySelector('#class-diagram')
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
      for (var gI = 0; gI < _.size(mGeneralizations); gI++) {
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
      var diagramDiv = this.$el.querySelector('#class-diagram')
      diagramDiv.innerHTML = '';
    },
    applyElFocus: function () {
      this.$nextTick(function () {
        var el = this.$el.querySelector('.content');
        el.scrollIntoView();
        el.value = '';
        el.focus();
        this.$emit('elFocus');
      });
    },
    copyToClipboard: function () {
      copyToClipboard(new ModelDiagram().getXml(this.graph));
    }
  }
});

Vue.component('classDetails', {
  template: [
    '<div>',
    ' <div style="display:none">{{selectionInfo(mSelectedClass, hashChangeDate)}}</div>',
    ' <hr class="separator"/>',
    ' <div class="content">',
    '   <div id="classHeader"/>',
    '   <h3>{{mClass.name}}</h3>',
    '   <div v-if="_.size(mClass.mAttributes)>0">',
    '     <h4>Attributes</h4>',
    '     <ul>',
    '       <li v-for="mAttribute in mClass.mAttributes">{{mAttribute.name}} : ',
    '         <a v-if="!_.isNil(mAttribute.typePath)" :href="classHref(mAttribute)"><i class="fa fa-square-o" aria-hidden="true"></i></a>',
    '         {{mAttribute.typeName}}',
    '       </li>',
    '     </ul>',
    '   </div>',
    '   <div v-if="_.size(mClass.mReferences)>0">',
    '     <h4>References</h4>',
    '     <ul>',
    '       <li v-for="mReference in mClass.mReferences">' +
    '         {{mReference.name}} [{{mReference.boundaries}}] : <a :href="classHref(mReference)"><i class="fa fa-square-o" aria-hidden="true"></i></a> ',
    '         {{mReference.typeName}}',
    '       </li>',
    '     </ul>',
    '   </div>',
    '   <div v-if="!_.isNil(mClass.sql) && _.trim(mClass.sql) !== \'\'">',
    '     <h4>SQL</h4>',
    '     <pre v-highlightjs="mClass.sql"><code class="sql"></code></pre>',
    '   </div>',
    ' </div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'mClass', 'mSelectedClass', 'hashChangeDate'],
  updated: function () {
    this.$nextTick(function () {
      this.applySelection();
    });
  },
  mounted: function () {
    this.$nextTick(function () {
      var delay = 0;
      if(isIe) {
        delay = ieDelay;
      }
      _.delay(function() {
        this.applySelection();
      }.bind(this), delay);  
    });
  },
  methods: {
    classHref: function (mProperty) {
      var packagePath = mProperty.typePath.substring(0, mProperty.typePath.length - ('.' + mProperty.typeName).length);
      return '#' + packagePath + '!class=' + mProperty.typeName;
    },
    applySelection: function () {
      if (this.isSelected(this.mSelectedClass)) {
        var el = this.$el.querySelector('#classHeader');
        el.scrollIntoView();
        window.scrollBy(0, -20);
      }
    },
    selectionInfo: function (mSelectedClass, hashChangeDate) {
      if (this.isSelected(mSelectedClass)) {
        return 'selected ' + hashChangeDate;
      }
      return '' + hashChangeDate;
    },
    isSelected: function (mSelectedClass) {
      return !_.isNil(this.mSelectedClass) && this.mClass.path === mSelectedClass.path;
    }
  }
});

Vue.component('enumDetails', {
  template: [
    '<div>',
    ' <div style="display:none">{{selectionInfo(mSelectedClass, hashChangeDate)}}</div>',
    ' <hr class="separator"/>',
    ' <div class="content">',
    '   <div id="enumHeader"/>',
    '   <h3>{{mEnum.name}}</h3>',
    '   <div v-if="_.size(mEnum.mLiterals)>0">',
    '     <h4>Literals</h4>',
    '     <ul>',
    '       <li v-for="mLiteral in mEnum.mLiterals">{{mLiteral}}</li>',
    '     </ul>',
    '   </div>',
    ' </div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'mEnum', 'mSelectedClass', 'hashChangeDate'],
  updated: function () {
    this.$nextTick(function () {
      this.applySelection();
    });
  },
  mounted: function () {
    this.$nextTick(function () {
      var delay = 0;
      if(isIe) {
        delay = ieDelay;
      }
      _.delay(function() {
        this.applySelection();
      }.bind(this), delay); 
    });
  },
  methods: {
    applySelection: function () {
      if (this.isSelected(this.mSelectedClass)) {
        var el = this.$el.querySelector('#enumHeader');
        el.scrollIntoView();
        window.scrollBy(0, -30);
      }
    },
    selectionInfo: function (mSelectedClass, hashChangeDate) {
      if (this.isSelected(mSelectedClass)) {
        return 'selected ' + hashChangeDate;
      }
      return '' + hashChangeDate;
    },
    isSelected: function (mSelectedClass) {
      return !_.isNil(this.mSelectedClass) && this.mEnum.path === mSelectedClass.path;
    }
  }
});

Vue.component('model', {
  template: [
    '<div>',
    ' <packageHeader :mPackage="mPackage" :breadcrumbs="breadcrumbs"',
    '   :elFocusFlag="searchFocus" :mSelectedClass="mSelectedClass" :hashChangeDate="hashChangeDate"',
    '   @elFocus="onSearchFocus"',
    ' />',
    ' <subPackageDiagram :mPackage="mPackage" :elFocusFlag="packageDiagramFocus" @elFocus="onPackageDiagramFocus"/>',
    ' <classDiagram :mPackage="mPackage" :elFocusFlag="classDiagramFocus" @elFocus="onClassDiagramFocus"/>',
    ' <classDetails v-for="mClass in filterPackageClasses(mPackage)" :key="mClass.path" :mClass="mClass" :mPackage="mPackage" :mSelectedClass="mSelectedClass" :hashChangeDate="hashChangeDate"/>',
    ' <enumDetails v-for="mEnum in filterPackageEnums(mPackage)" :key="mEnum.path" :mEnum="mEnum" :mPackage="mPackage" :mSelectedClass="mSelectedClass" :hashChangeDate="hashChangeDate"/>',
    ' <div class="footer-placeholder"></div>',
    ' <div class="footer">',
    '   <ul class="footer-nav">',
    '     <li><a @click="focusSearch"><i class="fa fa-search"></i></a></li>',
    '     <li v-show="_.size(mPackage.mPackages)>0"><a @click="focusPackageDiagram">Package Diagram</a></li>',
    '     <li v-show="_.size(mPackage.mClasses)>0"><a @click="focusClassDiagram">Class Diagram</a></li>',
    '   </ul>',
    ' </div>',
    '</div>'
  ].join('\n'),
  props: ['mPackage', 'breadcrumbs', 'mSelectedClass', 'hashChangeDate'],
  data: function () {
    return {
      searchFocus: false,
      packageDiagramFocus: false,
      classDiagramFocus: false
    };
  },
  methods: {
    filterPackageClasses: function (mPackage) {
      return _.filter(mPackage.mClasses, function (mClass) {
        return (mPackage.path + '.' + mClass.name) === mClass.path;
      });
    },
    filterPackageEnums: function (mPackage) {
      return _.filter(mPackage.mEnums, function (mEnum) {
        return (mPackage.path + '.' + mEnum.name) === mEnum.path;
      });
    },
    packageHref: function (mPackage) {
      return '#' + mPackage.path;
    },
    focusSearch: function () {
      this.searchFocus = true;
    },
    focusPackageDiagram: function () {
      this.packageDiagramFocus = true;
    },
    focusClassDiagram: function () {
      this.classDiagramFocus = true;
    },
    onPackageDiagramFocus: function () {
      this.packageDiagramFocus = false;
    },
    onClassDiagramFocus: function () {
      this.classDiagramFocus = false;
    },
    onSearchFocus: function () {
      this.searchFocus = false;
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
    toModelPath: function (hashPath) {
      var modelPath = {
        packagePath: hashPath,
        classPath: null
      }
      if (_.startsWith(modelPath.packagePath, '#_')) {
        modelPath.packagePath = modelPath.packagePath.substring(2);
      }
      if (_.startsWith(modelPath.packagePath, '#')) {
        modelPath.packagePath = modelPath.packagePath.substring(1);
      }
      if (_.includes(modelPath.packagePath, '!')) {
        var pathWithQuery = modelPath.packagePath;
        modelPath.packagePath = pathWithQuery.substring(0, pathWithQuery.indexOf('!'));
        var queryPath = pathWithQuery.substring(pathWithQuery.indexOf('!'), pathWithQuery.length);
        if (_.startsWith(queryPath, '!class=')) {
          modelPath.classPath = queryPath.substring('!class='.length);
        }
      }
      return modelPath;
    },
    changeHashPath: _.debounce(function (event) {

      var hashPath = this.loadHashPath();
      var modelPath = this.toModelPath(hashPath);

      var packageHasChanged = this.packagePath !== modelPath.packagePath;

      var mPackageAndClassData = this.findMPackageAndClassDataByModelPath(modelPath);
      if (packageHasChanged) {
        this.packagePath = modelPath.packagePath;
        this.mPackage = mPackageAndClassData.mPackage;
        this.breadcrumbs = mPackageAndClassData.breadcrumbs;
      }

      this.classPath = modelPath.classPath;
      this.mSelectedClass = mPackageAndClassData.mClass;
      if (_.startsWith(hashPath, '#') && !_.startsWith(hashPath, '#_')) {
        hashPath = '#_' + hashPath.substring(1);
      }
      this.hashChangeDate = new Date();

      var pathname = document.location.pathname;
      if (_.startsWith(pathname, '/') && isIe) {
        pathname = pathname.substring(1);
      }
      history.replaceState(null, null, pathname + hashPath);
    }, 300),
    findMPackageAndClassDataByModelPath: function (modelPath) {
      var mPackageData = this.findMPackageDataByPath(model, modelPath.packagePath)
      if (_.isNil(mPackageData)) {
        mPackageData = {
          mPackage: model,
          breadcrumbs: [],
          mClass: null
        }
        mPackageData.breadcrumbs.unshift({
          name: model.name,
          path: model.path
        });
      }

      var mClass = _.find(mPackageData.mPackage.mClasses, function (mClass) { return mClass.name === modelPath.classPath });
      if (_.isNil(mClass)) {
        mClass = _.find(mPackageData.mPackage.mEnums, function (mEnum) { return mEnum.name === modelPath.classPath });
      }

      mPackageData.mClass = mClass;

      return mPackageData;
    },
    findMPackageDataByPath: function (mPackage, packagePath) {
      if (packagePath === mPackage.path) {
        return {
          mPackage: mPackage,
          breadcrumbs: [
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