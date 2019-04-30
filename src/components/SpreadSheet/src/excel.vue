<template>
<div>
    <div :class="s.wraper" ref="table" :style="viewStyle" v-loading.fullscreen.lock="loading" v-clickoutside="handleclickoutside">
        <div :class="s.fixed_left_table" :style="fixedLeftSty">
            <div :class="s.header">
                <div :class="s.header_inner">
                    <Excel-table-header></Excel-table-header>
                </div>
            </div>
            <div :class="s.body">
                <div :class="s.body_inner" ref="fixedBodyWrap" :style="fixedBodySty">
                    <Excel-table-body></Excel-table-body>
                </div>
            </div>
        </div>
        <div :class="s.scroll_table">
            <div :class="s.header">
                <div :class="s.header_inner" ref="scrollHeader" :style="scrollHeaderSty">
                    <Excel-table-header></Excel-table-header>
                </div>
            </div>
            <div :class="s.body">
                <div :class="s.body_inner" ref="scrollBodyWrap" :style="scrollBodySty">
                    <Excel-table-body>
                        <Excel-editor></Excel-editor>
                    </Excel-table-body>
                </div>
            </div>
        </div>
        <Excel-dropdown></Excel-dropdown>
        <div :class="s.loading" v-if="!loading && !value.length" :style="lackDataSty">
            <No-data></No-data>
        </div>
    </div>
</div>
</template>
<script>
import ExcelTableHeader from './components/ExcelTableHeader.vue'
import ExcelTableBody from './components/ExcelTableBody.vue'
import ExcelEditor from './components/ExcelEditor.vue'
import ExcelDropdown from './components/ExcelDropdown.vue'
import NoData from './components/no-data.vue'
import sheetStore from './store/sheet.js'
import scrollBarWidth from './utils/scrollbar-width.js'
import Clickoutside from './utils/clickoutside.js'
export default {
    name: 'DExcel',
    components: {
        ExcelTableHeader,
        ExcelTableBody,
        ExcelEditor,
        ExcelDropdown,
        NoData
    },
    provide() {
        return {
            store: this.store
        }
    },
    directives: {
        Clickoutside
    },
    props: {
        loading: {
            type: Boolean,
            default: false
        },
        /**
         * 表格数据源
         * [{
         *      value_key1: { value: '' },
         *      value_key2: { value: '' }
         * }]
         */
        value: {
            type: Array,
            default: () => {
                return []
            }
        },
        excelOptions: {
            type: Object,
            default: () => {
                return {}
            }
        },
        view: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data() {
        let store = sheetStore(this)
        return {
            store,
            firstEnter: true,
            scrollX: false,
            scrollY: false,
            tableWidth: '',
            tableHeight: '',
            wrapLeft: '',
            wrapTop: '',
            tableScrollLeft: 0,
            tableScrollTop: 0,
            windowHeight: 0,
            scrollBarWidth: scrollBarWidth(),
            sheetConfig: {
                fixedColumnsLeft: 0, // 左侧固定列数
                fixedColumnsRight: 0, // 右侧固定列数
                headerHeight: 28, // 表头高
                colHeights: 'small', // body单元格高度
                colWidths: 130, // 单元格宽度
                manualColumnWidth: false, // 手动调整列宽
                /**
                 * 表格表头
                 * [{
                 *  key: value_key1,
                 *  name: value_name
                 * }]
                 */
                colHeaders: [],
                className: '' // 全局单元格类名
            }
        }
    },
    watch: {
        value: {
            handler(val) {
                if (this.firstEnter) { // 每次修改数据后不再重新加载数据
                    this.store.loadData(val)
                    this.firstEnter = false
                }
            },
            deep: true
        },
        'excelOptions.colHeaders'(data) {
            this.sheetConfig.colHeaders = data
        }
    },
    computed: {
        height() {
            const h = this.view.height ? this.view.height : this.windowHeight
            const tableH = h - this.sheetConfig.headerHeight - 1
            let rs = {
                'min-height': `${tableH}px`,
                'max-height': `${tableH}px`
            }
            if (this.value.length && this.value.length * this.sheetConfig.colHeights <= tableH) {
                rs['min-height'] = `${this.value.length * this.sheetConfig.colHeights}px`
            }
            return rs
        },
        lackDataSty() {
            return { top: `${this.sheetConfig.headerHeight + 1}px` }
        },
        viewStyle() {
            return {
                width: this.view.width ? `${this.view.width}px` : '100%'
            }
        },
        fixedLeftSty() {
            let rs = {'width': `${this.store.fixedColumnW}px`}
            if (!this.scrollX) {
                rs['box-shadow'] = 'none'
            }
            return rs
        },
        fixedBodySty() {
            let h = this.view.height ? this.view.height : this.windowHeight
            let rs = {
                ...this.height,
                'overflow-y': this.scrollY ? 'scroll' : 'auto',
                'margin-right': `${-20 - this.scrollBarWidth}px`
            }
            if (this.scrollX) {
                rs['max-height'] = `${h - this.sheetConfig.headerHeight - this.scrollBarWidth - 1}px`
            }
            return rs
        },
        scrollHeaderSty() {
            return {
                'overflow-x': 'scroll',
                'overflow-y': this.scrollY ? 'scroll' : 'hidden',
                'margin-bottom': `${-20 - this.scrollBarWidth}px`,
                'padding-bottom': '20px'
            }
        },
        scrollBodySty() {
            return {
                ...this.height,
                'overflow-x': this.scrollX ? 'scroll' : 'hidden'
            }
        }
    },
    methods: {
        getData() {
            console.log('sourceData>>>>>>>', this.store.sourceData)
            console.log('viewData>>>>>>>', this.store.viewData)
        },
        getWindowHeight() {
            if (this.$el) {
                let pos = this.$el.getBoundingClientRect()
                let viewH = document.documentElement.clientHeight || document.body.clientHeight
                this.windowHeight = (viewH - pos.top - 15) // 底部不要顶到底，留15的距离
                this.wrapLeft = pos.left
                this.wrapTop = pos.top
            }
        },
        syncScroll(arr, type, value) {
            const refs = this.$refs
            arr.forEach(key => {
                if (refs[key]) {
                    refs[key][type] = value
                }
            })
            this.tableScrollLeft = refs.scrollBodyWrap.scrollLeft
            this.tableScrollTop = refs.scrollBodyWrap.scrollTop
        },
        initEvent() {
            const refs = this.$refs
            const self = this
            const addEvent = (obj) => {
                for (let key in obj) {
                    if (refs[key]) {
                        refs[key].onscroll = obj[key]
                    }
                }
            }
            const fixedBodyEvent = function() {
                self.syncScroll(['scrollBodyWrap'], 'scrollTop', this.scrollTop)
            }
            const scrollHeaderEvent = function() {
                self.syncScroll(['scrollBodyWrap'], 'scrollLeft', this.scrollLeft)
            }
            const scrollBodyEvent = function() {
                self.syncScroll(['fixedBodyWrap'], 'scrollTop', this.scrollTop)
                self.syncScroll(['scrollHeader'], 'scrollLeft', this.scrollLeft)
            }
            addEvent({
                'fixedBodyWrap': fixedBodyEvent,
                'scrollHeader': scrollHeaderEvent,
                'scrollBodyWrap': scrollBodyEvent
            })
        },
        // 判断是否有滚动条
        hasScroll() {
            let bodyWrapper = this.$refs.scrollBodyWrap
            if (bodyWrapper) {
                const table = bodyWrapper.querySelector('table')
                this.tableWidth = bodyWrapper.offsetWidth
                this.tableHeight = bodyWrapper.offsetHeight
                this.scrollX = table.offsetWidth > bodyWrapper.offsetWidth
                this.scrollY = table.offsetHeight > bodyWrapper.offsetHeight
            }
        },
        windowResizeListener() {
            this.getWindowHeight()
            this.$nextTick(() => {
                this.hasScroll()
            })
        },
        handleclickoutside() {
            this.store.handClickoutside()
        }
    },
    created() {
        const config = {
            large: 40,
            default: 32,
            small: 28
        }
        this.sheetConfig = Object.assign({}, this.sheetConfig, this.excelOptions)
        this.sheetConfig.colHeights = this.sheetConfig.colHeights ? config[this.sheetConfig.colHeights] : 32
    },
    mounted() {
        window.addEventListener('resize', this.windowResizeListener)
        this.tableWidth = this.$refs.table.offsetWidth - this.scrollBarWidth - 1
        this.getWindowHeight()
        this.store.initData()
        this.$nextTick(() => {
            this.initEvent()
            this.hasScroll()
        })
    },
    destroyed() {
        this.store.$destroy()
    }
}
</script>
<style module="s" lang="scss" src="./excel.scss">
</style>