Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    field:'ScheduleState',
    tagOid: '43002192124', //cu in nmds
    //project: '43001867747', //lb
    allowedValues:[],
    defects:[], //all cv tagged defects
    launch: function() {
        Rally.data.ModelFactory.getModel({
            type:'Defect',
            success: this.getAllowedValues,
            scope: this
        });
    },
    getAllowedValues:function(model){
        model.getField(this.field).getAllowedValueStore().load({
            callback: function(records, operation, success) {
                var count = records.length;
                _.each(records, function(record) {
                    this.allowedValues.push(record.get('StringValue'));
                    count--;
                    if (count === 0) {
                        console.log(this.allowedValues);
                        this.getDefects();
                    }
                },this);
            },
            scope:this
        });
    },
    getDefects:function(){
        var tagFilter = Ext.create('Rally.data.wsapi.Filter', {
             property : 'Tags.ObjectID',
             operator: 'contains',
             value: this.tagOid
        });
        Ext.create('Rally.data.wsapi.Store',{
            model: 'Defect',
            fetch: ['FormattedID','Name','ScheduleState','State','Blocked','Resolution','CreationDate',
                    'InProgressDate','AcceptedDate','ClosedDate','Owner','Project','Priority'],
            limit: Infinity,
            filters: tagFilter,
            autoLoad:true,
            listeners:{
                load: this.onDefectsLoaded,
                scope:this
            }
        });
    },
    onDefectsLoaded:function(store,records){
        _.each(records,function(record){
            this.defects.push(record);
        },this);
        _.each(this.defects,function(defect){
            console.log('defect:',defect.get('FormattedID'), defect.get('Project')._refObjectName);
        });
    }
    
});
