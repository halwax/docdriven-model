Vue.component('packageHeader', {
  template: [
    '<div>',
    ' <h1>{{mPackage.name}}</h1>',
    '</div>'
  ].join('\n'),
  props: ['mPackage']
})

Vue.component('subPackageDiagram', {
  template: [
    '<div v-show="_.size(mPackage.mPackages)>0">',
    '   <hr/>',
    '   <h2>Subpackages</h2>',
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
    '   <h2>Classes</h2>',
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

Vue.component('model', {
  template: [
    '<div>',
    ' <packageHeader :mPackage="mPackage"/>',
    ' <subPackageDiagram :mPackage="mPackage"/>',
    ' <classDiagram :mPackage="mPackage"/>',
    '</div>'
  ].join('\n'),
  props: ['mPackage']
});

new Vue({
  el: '.model-app',
  data: function () {
    var mPackage = this.findPackageByHash(this.getHashPath());
    return {
      mPackage: mPackage
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
    getHashPath: function () {
      return window.location.hash;
    },
    changeHashPath: _.debounce(function (event) {
      var mPackage = this.findPackageByHash(this.getHashPath());
      this.mPackage = mPackage;
    }, 300),
    findPackageByHash: function (hashPath) {
      var path = hashPath;
      if (hashPath.startsWith('#')) {
        path = hashPath.substring(1);
      }
      var mPackage = this.findPackageByPath(model, path)
      if (_.isNil(mPackage)) {
        mPackage = model;
      }
      return mPackage;
    },
    findPackageByPath(mPackage, path) {
      if (path === mPackage.path) {
        return mPackage;
      }
      if (path.startsWith(mPackage.path)) {
        for (var i = 0; i < mPackage.mPackages.length; i++) {
          var mSubPackage = mPackage.mPackages[i];
          var result = this.findPackageByPath(mSubPackage, path);
          if (result !== null) {
            return result;
          }
        }
      }
      return null;
    }
  }
})