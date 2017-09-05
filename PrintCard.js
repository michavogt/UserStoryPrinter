(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.printcards.PrintCard', {
        extend: 'Ext.Component',
        alias: 'widget.printcard',
        tpl: Ext.create('Ext.XTemplate', '<tpl><div class="artifact">' +
            '<span class="featureFormattedid">{Feature.FormattedID}</span>' +
            '<span class="planestimate">{[this.getEstimate(values)]}</span></br>' +
            '<span class="featureName">{Feature.Name}</span>' +
            '<div class="content">' +
            '<div class="storyName">{Name}</div>' +
            '</div>' +
            '<span class="usandproject">{[this.getUsAndProject(values)]}</span>' +
            '</div></tpl>', {
                // Tasks have Estimate(s), Stories have PlanEstimate(s)
                getEstimate: function(values) {
                    return values.Estimate || values.PlanEstimate || 'None';
                },
                getUsAndProject: function(values) {
                    var str = values.FormattedID + "</br>" + values.Project.Name;
                    return str;
                }
            }
        )
    });
})();
