Vue.component('model', {
    template: [
        '<div>',
        '   <div id="diagram"></div>',
        '</div>'
    ].join('\n'),
    props: ['package'],
    mounted: function() {
        var diagramDiv = this.$el.querySelector('#diagram')
        var classDiagram = new ClassDiagram();

        var packages = model.packages;
        for(var pI = 0; pI < packages.length; pI++) {
            var package = packages[pI];
            classDiagram.addPackage(package);
        }

        this.graph = classDiagram.render(diagramDiv);
    },
    destroyed: function() {
        this.graph.destroy();
    }
});

new Vue({
    el: '.model-app',
    data: function() { 
        return {
            hashPath: window.location.hash,
            package: model
        }
    },
    mounted: function() {
        this.$nextTick(function() {
            window.addEventListener('hashchange', this.changeHashPath);
        })
    },
    beforeDestroy: function() {
    },
    methods: {
        changeHashPath: _.debounce(function(event) {
          this.hashPath = window.location.hash;
          console.log(this.hashPath);
        }, 300)
      }
})