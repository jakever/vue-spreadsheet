<template>
<div>
    <div :class="s.wraper">
        <el-button size="small" @click="getData">getData</el-button>
        <SpreadSheet ref="excel" :excelOptions="excelOptions" v-model="sourceData" :view="view" :loading="loading"></SpreadSheet>
    </div>
</div>
</template>
<script>
import SpreadSheet from '@/components/SpreadSheet/index'
// import SpreadSheet from '../../dist/static/js/excel.js'
import axios from 'axios'
export default {
    components: {
        SpreadSheet
    },
    data() {
        return {
            loading: false,
            view: {
            },
            excelOptions: {
                fixedColumnsLeft: 3, //左侧固定列数
                // fixedColumnsRight: 0, //右侧固定列数
                headerHeight: 32, //表头高
                colHeights: 'small', //body单元格高度 large/small/default
                colWidths: [130, 130, 130, 130, 140, 150, 160, 140, 165, 165, 160], //单元格宽度
                colHeaders: [],
            },
            sourceData: []
        }
    },
    methods: {
        getData() {
            this.$refs.excel.getData()
        },
        async fetchData(limit) {
            this.loading = true
            const data = await axios.get(`https://api-dev.2haohr.com/v1/employee/list_for_pc/?type=2&_order_by=hire_date&dep_id=&p=1&limit=${limit}`, {
                headers: {'accesstoken': 'rui3rf2c26xluquk9g5hq3qdb8sh3xnz'}
            })
            this.loading = false
            const result = data.data.data.objects
            this.sourceData = result
        },
        mockData(){
            this.excelOptions.colHeaders = [{
                key: 'id',
                name: 'ID',
                type: 'text',
                readonly: true
            }, {
                key: 'emp_name',
                name: '员工姓名',
                type: 'text',
                filter: true, //是否开启数据过滤
                readonly: true
            }, {
                key: 'sex',
                name: '性别',
                type: 'select',
                source: [{ //下拉数据源
                    label: '男', value: 2
                }, {
                    label: '女', value: 1
                }],
                handler: function(val) { //下拉数据源映射处理函数
                    switch(val) {
                        case 1: return '女';
                        case 2: return '男';
                    }
                }
            }, {
                key: 'emp_no',
                name: '工号',
                type: 'text'
            }, {
                key: 'dep_name',
                name: '部门',
                type: 'text',
                filter: true,
                validator: /^测试部门/ //数据校验为正则表达式
            }, {
                key: 'job_title_name',
                name: '岗位',
                type: 'text',
                filter: true,
                readonly: true // 只读
            }, {
                key: 'work_type',
                name: '工作性质',
                type: 'select',
                filter: true,
                source: [{
                    label: '全职', value: 0
                }, {
                    label: '兼职', value: 1
                }, {
                    label: '实习', value: 2
                }, {
                    label: '退休返聘', value: 3
                }, {
                    label: '劳务派遣', value: 4
                }, {
                    label: '劳务外包', value: 5
                }],
                handler: function(val) {
                    switch(val) {
                        case 0: return '全职';
                        case 1: return '兼职';
                        case 2: return '实习';
                        case 3: return '退休返聘';
                        case 4: return '劳务派遣';
                        case 5: return '劳务外包';
                    }
                }
            }, {
                key: 'work_status',
                name: '工作状态',
                type: 'select',
                filter: true,
                source: [{
                    label: '待入职', value: -1
                }, {
                    label: '试用', value: 1
                }, {
                    label: '正式', value: 2
                }, {
                    label: '待离职', value: 3
                }, {
                    label: '已离职', value: 4
                }],
                handler: function(val) {
                    switch(val) {
                        case -1: return '待入职';
                        case 1: return '试用';
                        case 2: return '正式';
                        case 3: return '待离职';
                        case 4: return '已离职';
                    }
                }
            }, {
                key: 'hire_date',
                name: '入职日期',
                type: 'date'
            }, {
                key: 'leave_date',
                name: '离职日期',
                type: 'date',
                required: true //必填
            }, {
                key: 'mobile',
                name: '手机号',
                type: 'text',
                validator: function(val) {  //数据校验为正则表达式
                    return /^1[34578]\d{9}$/.test(val)
                }
            }, {
                key: 'email',
                name: '个人邮箱',
                type: 'text'
            }, {
                key: 'qq',
                name: 'QQ号',
                type: 'text'
            }, {
                key: 'credentials_no',
                name: '证件号码',
                type: 'text'
            }, {
                key: 'birthday',
                name: '生日',
                type: 'month'
            }, {
                key: 'age',
                name: '年龄',
                type: 'number'
            }, {
                key: 'work_age',
                name: '司龄',
                type: 'text'
            }, {
                key: 'nation',
                name: '民族',
                type: 'text'
            }, {
                key: 'account_address',
                name: '户籍地址',
                type: 'text'
            }, {
                key: 'native_city_name',
                name: '户籍城市',
                type: 'text'
            }]
        }
    },
    created() {
        
    },
    mounted() {
        this.mockData()
        this.fetchData(100)
    }
}
</script>
<style module="s" lang="scss">
.wraper{
    position: relative;
    padding: 15px;
}
</style>