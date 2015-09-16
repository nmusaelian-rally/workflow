Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    field:'ScheduleState',
    tagOid: '43002192124', //cu in nmds
    numberOfMonths: 6,
    intervals:[],
    projectOid: 43001867747, //lb
    allowedValues:[],
    defects:[], //all cv tagged defects
    launch: function() {
        this.getDates();
        this.getDefectModel();
    },
    getDates:function(){
        var now = new Date();
        var firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        console.log('firstDayOfThisMonth',firstDayOfThisMonth); 
        Date.prototype.calcFullMonths = function(monthOffset) {
            var dt = new Date(firstDayOfThisMonth); 
            dt.setMonth(dt.getMonth() - monthOffset);
            return dt;
        };
        var howFarBack = (new Date()).calcFullMonths(this.numberOfMonths);
        
        
        for(var m=1; m <= this.numberOfMonths; m++){
            var lastDayOfThisMonth = new Date(howFarBack.getFullYear(), howFarBack.getMonth() + 1, 0);
            var lastDayOfThisMonthEndOfDay = new Date(howFarBack.getFullYear(), howFarBack.getMonth() + 1, 0, 23,59,59);
            var firstDayOfNextMonth = new Date(howFarBack.getFullYear(), howFarBack.getMonth() + 1, 1);
            this.intervals.push({
                'from'  :   howFarBack.toISOString(),
                'to'    :   lastDayOfThisMonthEndOfDay.toISOString()
            });
            howFarBack = firstDayOfNextMonth;
        }
        console.log('intervals', this.intervals);
    },
    getDefectModel:function(){
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
                        this.getThroughput();
                        
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
    },
    getThroughput:function(){
        Ext.create('Rally.data.lookback.SnapshotStore', {
            fetch    : ['ObjectID','_ValidFrom','_ValidTo','FormattedID','Project','ScheduleState','_PreviousValues.ScheduleState'],
            find: {'_PreviousValues.ScheduleState':{$exists:true}},
            //find: {'_PreviousValues.ScheduleState':{$ne:null}},
            filters  : [
            {
                property : '_TypeHierarchy',
                value    : 'Defect'
            },
            {
                property : '_ProjectHierarchy',
                value: this.projectOid
            },
            {
            property : 'ScheduleState', 
            value : 'In-Progress'
            },
            {
            property : '_PreviousValues.ScheduleState', 
            operator : '<',
            value : 'In-Progress'
            }
            ],
            hydrate: ['ScheduleState','_PreviousValues.ScheduleState','Project'],
            listeners: {
                load: this.onSnapshotsLoaded, 
                scope: this
            }
            }).load({
                params : {
                    compress : true,
                    removeUnauthorizedSnapshots : true
                }
            });
        
    },
    onSnapshotsLoaded:function(store, records){
        console.log('onSnapshotsLoaded', records.length);
        _.each(records, function(record) {
            console.log(record.data);
        });
    }
    
});
