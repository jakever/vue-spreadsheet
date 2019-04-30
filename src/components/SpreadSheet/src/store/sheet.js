import Vue from 'vue'
import { getColWidth } from '../utils/util.js'
import validator from '../utils/validator'
export default (instance) => {
    let store = new Vue({
        data() {
            return {
                dropdownIndex: null,
                dropdownKey: null, // 当前过滤弹层所在index
                dropdownConfig: {}, // 当前过滤弹层配置信息
                filterConditions: {}, // 当前过滤条件
                columnsFilterData: {},
                // 选择区域
                selector: {
                    show: false, // 是否显示
                    isSelected: false, // 单击鼠标按下代表即将要开始范围选择
                    selectedXIndex: 0, // 光标所在单元格的实时x,y轴坐标
                    selectedYIndex: 0,
                    selectedXArr: [], // 选中区域
                    selectedYArr: []
                },
                // 编辑器
                editor: {
                    show: false, // 是否编辑模式
                    type: 'text', // 数据类型
                    value: null, // 当前编辑器所在单元格的值
                    oldValue: null,
                    isFixed: false, // 当前选中单元格是否属于冻结列
                    selectOptions: [], // 下拉数据源
                    range: {}, // 编辑器边界范围
                    editorXIndex: 0, // 编辑器所在x,y轴坐标
                    editorYIndex: 0
                },
                // 自动填充
                autofill: {
                    enable: false, // 为true代表要开始下拉数据填充
                    autofillXIndex: 0, // 数据填充触点的坐标
                    autofillYIndex: 0,
                    autofillXArr: [], // 数据填充的范围
                    autofillYArr: []
                },
                sourceData: [], // 原始数据
                viewData: [], // 筛选数据
                changeData: [], // 仅变化的数据
                columnsWidth: [],
                sheetConfig: { // 表格配置
                    defaultColWidths: 110 // 单元格默认宽度
                }
            }
        },
        computed: {
            /** **********表头***********/
            columns() {
                let arr = []
                let colHeaders = instance.sheetConfig.colHeaders
                if (colHeaders.length) {
                    let tableWidth = instance.tableWidth
                    let columnsLength = colHeaders.length
                    let _widths = instance.sheetConfig.colWidths
                    if (+_widths) { // 统一定义宽度
                        let columnsWidth = columnsLength * +_widths
                        arr = colHeaders.map((item, idx) => {
                            if (columnsWidth < tableWidth) {
                                item.width = getColWidth(tableWidth, columnsLength, idx)
                            } else {
                                item.width = _widths
                            }
                            return item
                        })
                    } else if (_widths instanceof Array && _widths.length) { // 数组定义每列的宽度
                        let diff = colHeaders.length - _widths.length
                        let columnsWidth = _widths.reduce((a, b) => parseInt(a) + parseInt(b), 0)
                        if (columnsWidth < tableWidth) { // 不够则需要填补上，避免宽度不够出现裂缝
                            let realIndex = 0
                            arr = colHeaders.map((item, idx) => {
                                if (diff > 0) {
                                    if (_widths[idx]) {
                                        item.width = _widths[idx]
                                    } else {
                                        item.width = getColWidth(tableWidth - columnsWidth, diff, realIndex)
                                        realIndex++
                                    }
                                } else {
                                    item.width = getColWidth(tableWidth, columnsLength, idx)
                                }
                                return item
                            })
                        } else {
                            arr = colHeaders.map((item, idx) => {
                                if (diff > 0) {
                                    if (_widths[idx]) {
                                        item.width = _widths[idx]
                                    } else {
                                        item.width = getColWidth(tableWidth, columnsLength, idx)
                                    }
                                } else {
                                    item.width = getColWidth(tableWidth, columnsLength, idx)
                                }
                                return item
                            })
                        }
                    } else { // 没有定义列宽的话，根据表格宽度平均分配
                        arr = colHeaders.map((item, idx) => {
                            item.width = getColWidth(tableWidth, columnsLength, idx)
                            return item
                        })
                    }
                }
                this.columnsWidth = arr.map(item => item.width)
                return arr
            },
            // 计算左侧固定列的总宽度
            fixedColumnW() {
                return this.columnsWidth.filter((it, index) => index < instance.sheetConfig.fixedColumnsLeft).reduce((sum, item) => {
                    return sum + item
                }, 0)
            },
            // 对每列宽度计算，每一项等于前面所有项之和
            everyColumnsTotal() {
                // 此算法性能有问题，后面优化
                return this.columnsWidth.map((it, index) => this.columnsWidth.reduce((sum, item, idx) => {
                    if (idx <= index) {
                        return sum + item
                    } else {
                        return sum
                    }
                }, 0))
            }
        },
        watch: {
        },
        methods: {
            /** ********** 加载数据源 ***********/
            initData() {
                this.sheetConfig = Object.assign({}, this.sheetConfig, instance.sheetConfig)
                this.loadData(instance.value)
            },
            /** ********** 更新数据源 ***********/
            loadData(data = []) {
                this.sourceData = data
                this.viewData = data
                this.setRange()
            },
            // 设置编辑框可移动范围
            setRange() {
                this.editor.range = {
                    minX: 0,
                    maxX: this.columns.length - 1,
                    minY: 0,
                    maxY: this.viewData.length - 1
                }
            },
            /** ********** 键盘事件 ***********/
            keyEvent(e) {
                // 撤销
                if ((e.ctrlKey && e.keyCode === 90) || e.metaKey && !e.shiftKey && e.keyCode === 90) {
                    return console.log('undo')
                }
                // 恢复
                if ((e.ctrlKey && e.keyCode === 89) || (e.metaKey && e.shiftKey && e.keyCode === 90)) {
                    return console.log('recovery')
                }
                // 编辑模式下按Enter／ESC
                if (this.editor.show && (e.keyCode === 13 || e.keyCode === 27)) {
                    return this.resetEditor()
                }
                // 未选中或编辑模式下可以撤销、恢复和enter/ESC退出编辑模式，除此之外阻止键盘事件
                if (!this.selector.show || this.editor.show) {
                    return
                }
                // CTRL+C／Command+C
                if ((e.ctrlKey && e.keyCode === 67) || (e.metaKey && e.keyCode === 67)) {
                    return this.copy()
                }
                // CTRL+V／Command+V
                if ((e.ctrlKey && e.keyCode === 86) || (e.metaKey && e.keyCode === 86)) {
                    return this.$emit('focus', 'clipboard')
                }
                // CTRL+A／Command+A
                if ((e.ctrlKey && e.keyCode) === 65 || (e.metaKey && e.keyCode === 65)) {
                    return this.selectAll(e)
                }
                if (e.metaKey || e.ctrlKey) { // 阻止CTRL+类型的事件
                    return
                }
                e.preventDefault()
                const keyHandler = (k) => {
                    if ((k >= 65 && k <= 90) || (k >= 48 && k <= 57) || (k >= 96 && k <= 107) || (k >= 109 && k <= 111) || k === 32 || (k >= 186 && k <= 222)) {
                        return true
                    } else {
                        return false
                    }
                }
                if (keyHandler(e.keyCode)) {
                    return this.doEdit(e.key)
                }
                switch (e.keyCode) {
                    // 左
                    case 37:
                        if (this.editor.editorXIndex > this.editor.range.minX) {
                            this.editor.editorXIndex--
                        }
                        this.adjustPosition()
                        break
                    // 上
                    case 38:
                        if (this.editor.editorYIndex > this.editor.range.minY) {
                            this.editor.editorYIndex--
                        }
                        this.adjustPosition()
                        break
                    // 右 或 Tab
                    case 9:
                    case 39:
                        if (this.editor.editorXIndex < this.editor.range.maxX) {
                            this.editor.editorXIndex++
                        }
                        this.adjustPosition()
                        break
                    // 下
                    case 40:
                        if (this.editor.editorYIndex < this.editor.range.maxY) {
                            this.editor.editorYIndex++
                        }
                        this.adjustPosition()
                        break
                    // BackSpace／delede
                    case 8:
                        this.clearSelected()
                        break
                    // Enter
                    case 13:
                        this.doEdit()
                        break
                    default:
                        console.log(e, 'event')
                }
            },
            // 清除所选单元格内容
            clearSelected() {
                for (let i = 0; i <= this.selector.selectedYArr[1] - this.selector.selectedYArr[0]; i++) {
                    for (let j = 0; j <= this.selector.selectedXArr[1] - this.selector.selectedXArr[0]; j++) {
                        this.viewData[i + this.selector.selectedYArr[0]][this.columns[j + this.selector.selectedXArr[0]].key] = ''
                    }
                }
            },
            // 点击编辑器
            selectEditor(e) {
                if (e.button !== 0 || !this.selector.show || this.editor.show) return
                this.editor.show = false
                // 多选后点击编辑器重置多选区
                this.selector.isSelected = true
                this.selector.selectedXArr = [this.editor.editorXIndex, this.editor.editorXIndex]
                this.selector.selectedYArr = [this.editor.editorYIndex, this.editor.editorYIndex]

                // autofill之后点击编辑器重置autofill区
                this.autofill.autofillXIndex = this.editor.editorXIndex
                this.autofill.autofillYIndex = this.editor.editorYIndex
                this.autofill.autofillXArr = []
                this.autofill.autofillYArr = []
            },
            selectUp() {
                setTimeout(() => {
                    this.selector.isSelected = false
                // window.removeEventListener('mouseup', this.selectUp)
                }, 0)
            },
            /** ********** 选中单个单元格 ***********/
            selectCell(e, x, y) {
                if (e.button !== 0) return
                window.addEventListener('mouseup', this.selectUp)
                // this.editor.type = 'text'
                this.editor.show = false
                this.editor.isFixed = instance.sheetConfig.fixedColumnsLeft > x

                this.selector.show = true
                // this.selector.selectedXIndex = x
                // this.selector.selectedYIndex = y
                this.selector.selectedXArr = [x, x]
                this.selector.selectedYArr = [y, y]
                this.selector.isSelected = true

                this.autofill.autofillXIndex = x
                this.autofill.autofillYIndex = y

                window.addEventListener('keydown', this.keyEvent)
                this.$nextTick(() => {
                    // 因为编辑完回填数据需要当前的editorXIndex和editorYIndex，所以需要在单元格的值回填成功视图响应完再去更改当前editorindex的值
                    this.editor.editorXIndex = x
                    this.editor.editorYIndex = y
                    this.$nextTick(() => {
                        this.adjustPosition()
                        this.$emit('focus', 'clipboard')
                    })
                })
            },
            /** ********** 拖拽批量选中多个单元格 ***********/
            multiSelect(x, y) {
                setTimeout(() => {
                    if (this.selector.isSelected) {
                        const minX = x > this.editor.editorXIndex ? this.editor.editorXIndex : x
                        const minY = y > this.editor.editorYIndex ? this.editor.editorYIndex : y
                        this.autofill.autofillXIndex = x > this.editor.editorXIndex ? x : this.editor.editorXIndex
                        this.autofill.autofillYIndex = y > this.editor.editorYIndex ? y : this.editor.editorYIndex
                        this.selector.selectedXArr = [minX, this.autofill.autofillXIndex]
                        this.selector.selectedYArr = [minY, this.autofill.autofillYIndex]
                        // this.selector.selectedXIndex = x
                        // this.selector.selectedYIndex = y
                    }
                }, 0)

                // 设置autofill填充区域
                if (this.autofill.enable) {
                    if (y > this.selector.selectedYArr[1]) {
                        this.autofill.autofillYArr = [this.selector.selectedYArr[1] + 1, y]
                    } else if (y < this.selector.selectedYArr[0]) {
                        this.autofill.autofillYArr = [y, this.selector.selectedYArr[0] - 1]
                    }
                }
            },
            // 全选
            selectAll(e) {
                e.preventDefault()
                this.selector.selectedXArr = [this.editor.range.minX, this.editor.range.maxX]
                this.selector.selectedYArr = [this.editor.range.minY, this.editor.range.maxY]
            },
            /** ********** 双击或Enter键进入编辑模式 ***********/
            doEdit(value) {
                if (this.columns[this.editor.editorXIndex].readonly) return
                const cellValue = this.viewData[this.editor.editorYIndex][this.columns[this.editor.editorXIndex].key] || ''
                this.editor.type = this.columns[this.editor.editorXIndex].type
                this.editor.key = this.columns[this.editor.editorXIndex].key
                this.editor.show = true
                this.editor.oldValue = cellValue
                // 直接按下键盘某键进入编辑模式
                if (value && (this.editor.type === 'text' || this.editor.type === 'number')) {
                    this.editor.value = value
                } else {
                    this.editor.value = cellValue
                    if (this.editor.type === 'date' || this.editor.type === 'month') { // 如果是日期格式且默认值不符合日期格式，则把默认值置空
                        if (cellValue && !validator[`verify_${this.editor.type}`](cellValue)) {
                            this.editor.value = ''
                        }
                    }
                }
                if (this.editor.type === 'select') {
                    this.editor.selectOptions = this.columns[this.editor.editorXIndex].source || []
                }
                this.$nextTick(() => {
                    this.$emit('focus')
                })
            },
            autofillHandle() {
                this.autofill.enable = true
                window.addEventListener('mouseup', this.autofillDone)
            },
            /** ********** 下拉自动填充 ***********/
            autofillDone() {
                // 向下／向上autofill
                if (this.autofill.autofillYArr[1] > this.selector.selectedYArr[1]) {
                    if (!this.columns[this.editor.editorXIndex].readonly) {
                        for (let i = 0; i <= this.autofill.autofillYArr[1] - this.autofill.autofillYArr[0]; i++) {
                            for (let j = 0; j <= this.selector.selectedXArr[1] - this.selector.selectedXArr[0]; j++) {
                                this.viewData[i + this.autofill.autofillYArr[0]][this.columns[j + this.selector.selectedXArr[0]].key] =
                                this.viewData[this.selector.selectedYArr[1]][this.columns[j + this.selector.selectedXArr[0]].key]
                            }
                        }
                    }
                    this.editor.editorXIndex = this.selector.selectedXArr[0]
                    this.editor.editorYIndex = this.selector.selectedYArr[0]
                    this.selector.selectedYArr.splice(1, 1, this.autofill.autofillYArr[1])
                    this.autofill.autofillYIndex = this.autofill.autofillYArr[1]
                } else if (this.autofill.autofillYArr[0] < this.selector.selectedYArr[0]) {
                    if (!this.columns[this.editor.editorXIndex].readonly) {
                        for (let i = 0; i <= this.autofill.autofillYArr[1] - this.autofill.autofillYArr[0]; i++) {
                            for (let j = 0; j <= this.selector.selectedXArr[1] - this.selector.selectedXArr[0]; j++) {
                                this.viewData[i + this.autofill.autofillYArr[0]][this.columns[j + this.selector.selectedXArr[0]].key] =
                                this.viewData[this.selector.selectedYArr[0]][this.columns[j + this.selector.selectedXArr[0]].key]
                            }
                        }
                    }
                    this.editor.editorXIndex = this.selector.selectedXArr[0]
                    this.editor.editorYIndex = this.autofill.autofillYArr[0]
                    this.selector.selectedYArr.splice(0, 1, this.autofill.autofillYArr[0])
                }
                // setTimeout(() => { // 这里推入事件队列，保证在Clickoutside事件之后再执行
                this.autofill.autofillYArr = []
                this.autofill.enable = false
                window.removeEventListener('mouseup', this.autofillDone)
                // }, 0)
            },
            // 粘贴
            paste(e) {
                // this.$nextTick(() => {
                // const isMac = /macintosh|mac os x/i.test(navigator.userAgent)
                // let text = e.target.value
                // let arr = isMac ? text.split('\n').map(item => item.split('\t')) : text.split('\n').map(item => item.split('\t')).slice(0, -1) // windows系统截取掉最后一个空白字符
                let textArr
                let rawText = e.clipboardData.getData('text/plain')
                // let arr = isMac ? rawText.split('\r').map(item => item.split('\t')) : rawText.split('\r').map(item => item.split('\t')).slice(0, -1) // windows系统截取掉最后一个空白字符
                let arr = rawText.split('\r')
                if (arr.length === 1) {
                    let _arr = arr[0].split('\n')
                    textArr = _arr.map(item => item.split('\t'))
                } else {
                    textArr = arr.map(item => item.split('\t'))
                }
                console.log(textArr)
                if (textArr.length) {
                    for (let i = 0; i <= textArr.length - 1; i++) {
                        for (let j = 0; j <= textArr[i].length - 1; j++) {
                            if (this.viewData[i + this.selector.selectedYArr[0]] && this.columns[j + this.selector.selectedXArr[0]]) {
                                if (!this.columns[j + this.selector.selectedXArr[0]].readonly) {
                                    this.viewData[i + this.selector.selectedYArr[0]][this.columns[j + this.selector.selectedXArr[0]].key] = textArr[i][j] === ' ' ? '' : textArr[i][j] // 将copy操作里处理为' '的值转换一下
                                }
                            }
                        }
                    }
                    // 复制完把被填充的区域选中，并把激活单元格定位到填充区域的第一个
                    this.selector.selectedXArr.splice(1, 1, this.selector.selectedXArr[0] + textArr[0].length - 1)
                    this.selector.selectedYArr.splice(1, 1, this.selector.selectedYArr[0] + textArr.length - 1)
                    this.editor.editorXIndex = this.autofill.autofillXIndex = this.selector.selectedXArr[0]
                    this.editor.editorYIndex = this.autofill.autofillYIndex = this.selector.selectedYArr[0]
                }
                // })
            },
            // 复制
            copy() {
                let text = ''
                for (let i = 0; i <= this.selector.selectedYArr[1] - this.selector.selectedYArr[0]; i++) {
                    let arr = []
                    for (let j = 0; j <= this.selector.selectedXArr[1] - this.selector.selectedXArr[0]; j++) {
                        arr.push(this.viewData[i + this.selector.selectedYArr[0]][this.columns[j + this.selector.selectedXArr[0]].key] || '')
                    }
                    text += arr.join('\t') + '\n'
                }
                text = text.replace(/\n$/, ' ') // 去掉最后一个\n，否则会导致复制到excel里多一行空白；替换为' '，是为了防止复制空的内容导致document.execCommand命令无效
                let textArea = document.createElement('textarea')
                textArea.value = text
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy', false) // copy到剪切板
                document.body.removeChild(textArea)
            },
            /** ********** 编辑完回写数据 ***********/
            fillData(val) {
                this.viewData[this.editor.editorYIndex][this.columns[this.editor.editorXIndex].key] = val
                this.editor.value = ''
            },
            resetEditor() {
                this.editor.show = false
            },
            // 键盘事件上、下、左、右或TAB键快速切换单元格位置及调整表格视图位置
            adjustPosition() {
                if (this.editor.isFixed) return
                this.autofill.autofillXIndex = this.editor.editorXIndex
                this.autofill.autofillYIndex = this.editor.editorYIndex
                this.selector.selectedXArr = [this.editor.editorXIndex, this.editor.editorXIndex]
                this.selector.selectedYArr = [this.editor.editorYIndex, this.editor.editorYIndex]

                const cellTotalWith = this.everyColumnsTotal[this.editor.editorXIndex] // 当前cell及之前所有单元格的width总和
                const cellBeforeTotalWidth = this.everyColumnsTotal[this.editor.editorXIndex - 1] || 0 // 当前cell前所有单元格的width总和（不包括当前cell）
                const cellTotalViewWidth = cellTotalWith - instance.tableScrollLeft // 减去向左滚动后还在视窗里的宽度
                const cellBeforeTotalViewWidth = cellBeforeTotalWidth - this.fixedColumnW // 减去左侧固定列的宽度后可见的宽度
                const cellTotalHeight = this.sheetConfig.colHeights * (this.editor.editorYIndex + 1)
                const cellBeforeTotalHeight = this.sheetConfig.colHeights * this.editor.editorYIndex
                const cellTotalViewHeight = cellTotalHeight - instance.tableScrollTop
                // 左右调整
                if (instance.scrollX) {
                    const diffRight = cellTotalViewWidth - instance.tableWidth
                    const diffLeft = cellBeforeTotalViewWidth <= 0 ? instance.tableScrollLeft : instance.tableScrollLeft - cellBeforeTotalViewWidth
                    if (diffRight > 0) {
                        instance.syncScroll(['scrollBodyWrap', 'scrollHeader'], 'scrollLeft', diffRight + instance.tableScrollLeft + 1)
                    }
                    if (diffLeft > 0) {
                        instance.syncScroll(['scrollBodyWrap', 'scrollHeader'], 'scrollLeft', instance.tableScrollLeft - diffLeft)
                    }
                }
                // 上下调整
                if (instance.scrollY) {
                    const diffBottom = cellTotalViewHeight - instance.tableHeight
                    const diffTop = instance.tableScrollTop - cellBeforeTotalHeight
                    if (diffBottom > 0) {
                        instance.syncScroll(['scrollBodyWrap', 'fixedBodyWrap'], 'scrollTop', diffBottom + instance.tableScrollTop + 1)
                    }
                    if (diffTop > 0) {
                        instance.syncScroll(['scrollBodyWrap', 'fixedBodyWrap'], 'scrollTop', instance.tableScrollTop - diffTop)
                    }
                }
            },
            /** ********** 展开/收起过滤组件 ***********/
            handleDropdown(index, cell = {}) {
                const key = cell.key
                if (key) {
                    if (this.dropdownKey === key) {
                        this.dropdownKey = null
                        this.dropdownIndex = null
                    } else {
                        this.dropdownKey = key
                        this.dropdownIndex = index
                        if (!this.columnsFilterData[key]) {
                            this.columnsFilterData[key] = {
                                key,
                                sort: '', // 排序状态
                                data: {}, // 过滤条件的数据
                                handler: cell.handler
                            }
                        }
                        let obj = this.columnsFilterData[key]
                        this.sourceData.forEach(item => {
                            if (!obj['data'][item[key]]) {
                                const id = typeof obj.handler === 'function' ? obj.handler(item[key]) : item[key]
                                obj['data'][id] = { value: item[key] }
                            }
                        })
                        this.dropdownConfig = JSON.parse(JSON.stringify(this.columnsFilterData[key]))
                    }
                } else {
                    this.dropdownKey = null
                    this.dropdownIndex = null
                }
            },
            // 得到过滤条件
            handFilter() {
                let arr = []
                for (const key in this.dropdownConfig.data) {
                    if (this.dropdownConfig.data[key].checked) {
                        arr.push(this.dropdownConfig.data[key].value)
                    }
                }
                this.columnsFilterData[this.dropdownKey] = JSON.parse(JSON.stringify(this.dropdownConfig))
                this.filterConditions[this.dropdownKey] = arr
                this.filterData()
            },
            // 重置过滤条件
            resetFilter() {
                delete this.filterConditions[this.dropdownConfig.key]
                for (const key in this.dropdownConfig.data) {
                    this.dropdownConfig.data[key].checked = false
                }
                this.columnsFilterData[this.dropdownKey] = JSON.parse(JSON.stringify(this.dropdownConfig))
                this.filterData()
            },
            // 数据过滤
            filterData() {
                this.viewData = this.sourceData
                for (const key in this.filterConditions) {
                    this.viewData = this.viewData.filter(item => this.filterConditions[key].includes(item[key]))
                }
                this.dropdownKey = null
                this.dropdownIndex = null
            },
            /** ********** 数据排序 ***********/
            sort(type) {
                for (const key in this.columnsFilterData) {
                    this.columnsFilterData[key].sort = ''
                }
                this.columnsFilterData[this.dropdownKey].sort = type
                if (type === 'asce') {
                    this.viewData.sort((x, y) => {
                        return x[this.dropdownConfig.key] > y[this.dropdownConfig.key] ? 1 : -1
                    })
                } else {
                    this.viewData.sort((x, y) => {
                        return x[this.dropdownConfig.key] > y[this.dropdownConfig.key] ? -1 : 1
                    })
                }
                this.dropdownKey = null
                this.dropdownIndex = null
            },
            // 调整列宽
            adjustColumnWidth(index, val) {
                Vue.set(this.columnsWidth, index, val)
            },
            handClickoutside() {
                console.log(111)
                if (this.selector.isSelected || this.autofill.enable) return
                this.selector.show = false
                this.editor.show = false
                this.selector.selectedXArr = []
                this.selector.selectedYArr = []
                window.removeEventListener('keydown', this.keyEvent)
            }
        },
        destroyed() {
            // window.removeEventListener('mouseup')
        }
    })
    return store
}