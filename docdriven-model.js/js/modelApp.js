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

        var subpackages = this.package.packages;
        for(var pI = 0; pI < subpackages.length; pI++) {
            var subpackage = subpackages[pI];
            classDiagram.addPackage(subpackage);
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