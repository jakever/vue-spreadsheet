<template>
<div v-show="store.selector.show">
    <div 
        :class="s.cell_editor"
        :style="cellEditorSty"
        :title="value"
        @mousedown="doSelect($event)"
        @dblclick="doEdit">
        <textarea 
            ref="clipboard"
            :class="s.clipboard" 
            :style="{height: colHeights + 'px'}" 
            @paste="clipboardToContent">
        </textarea>
        <!-- 编辑器 -->
        <div :class="s.editor" v-show="store.editor.show">
            <textarea 
                    :style="{lineHeight: colHeights + 'px'}" 
                    v-model="value" 
                    v-if="store.editor.type === 'text'"
                    ref="text">
            </textarea>
            <textarea 
                    :style="{lineHeight: colHeights + 'px'}" 
                    v-model="value" 
                    v-else-if="store.editor.type === 'number'"
                    ref="number"
                    @input="acceptNumber(value)">
            </textarea>
            <el-select 
                :class="s.cell_dropdown"
                v-else-if="store.editor.type === 'select'" 
                v-model="value" 
                :size="selectSize"
                :automatic-dropdown="true" 
                :style="{width: currColWidths + 'px'}"
                ref="select">
                <el-option v-for="item in store.editor.selectOptions" :value="item.value" :label="item.label" :key="item.value"></el-option>
            </el-select>
            <el-date-picker 
                :class="s.cell_dropdown"
                v-model="value" 
                :size="pickerSize" 
                value-format="yyyy-MM-dd" 
                type="date" 
                :style="{width: currColWidths + 'px'}"
                v-else-if="store.editor.type === 'date'" 
                ref="date"
                @blur="resetEditor">
            </el-date-picker>
            <el-date-picker 
                :class="s.cell_dropdown"
                v-model="value" 
                :size="pickerSize" 
                value-format="yyyy-MM" 
                type="month" 
                :style="{width: currColWidths + 'px'}"
                v-else-if="store.editor.type === 'month'" 
                ref="month"
                @blur="resetEditor">
            </el-date-picker>
        </div>
    </div>
    <!-- 选择框 -->
    <div :class="s.cell_selector" :style="cellEditorSty">
        <div :class="s.selector_border" :style="selectorTopSty"></div>
        <div :class="s.selector_border" :style="selectorLeftSty"></div>
        <div :class="s.selector_border" :style="selectorBottomSty"></div>
        <div :class="s.selector_border" :style="selectorRightSty"></div>
    </div>
    <div 
        :class="s.select_area" 
        v-show="!store.editor.show" 
        :style="selectedSty">
    </div>
    <div 
        :class="[s.select_area, s.fixed]" 
        v-show="!store.editor.show" 
        :style="fixedSelectedSty">
    </div>
    <!-- Auto fill handle-->
    <div 
        v-show="!store.editor.show" 
        :class="[s.selector_border, s.autofill_handle]" 
        :style="autofillSty"
        @mousedown="autofill"></div>
    <!-- Auto fill area-->
    <div :class="s.autofill_area" :style="autofillAreaSty"></div>
    <div :class="[s.autofill_area, s.fixed]" :style="fixedAutofillSty"></div>
</div>
</template>
<script>
export default {
    name: 'ExcelEditor',
    inject: ['store'],
    data() {
        return {
            value: ''
        }
    },
    computed: {
        selectSize() {
            const config = {
                40: 'medium',
                32: 'small',
                28: 'mini'
            }
            return config[this.colHeights]
        },
        pickerSize() {
            const config = {
                40: 'large',
                32: 'small',
                28: 'mini'
            }
            return config[this.colHeights]
        },
        colWidths() {
            return this.store.columnsWidth
        },
        currColWidths() {
            return this.colWidths[this.store.editor.editorXIndex]
        },
        colHeights() {
            return this.store.sheetConfig.colHeights
        },
        left() {
            return this.store.selector.selectedXArr[0] ? this.store.everyColumnsTotal[this.store.selector.selectedXArr[0] - 1] : 0
        },
        selectedH() {
            return this.colHeights * (this.store.selector.selectedYArr[1] - this.store.selector.selectedYArr[0] + 1)
        },
        selectedW() {
            return this.store.everyColumnsTotal[this.store.selector.selectedXArr[1]] - this.left
        },
        cellEditorSty() {
            const left = this.store.editor.editorXIndex ? this.store.everyColumnsTotal[this.store.editor.editorXIndex - 1] : 0
            const top = this.colHeights * this.store.editor.editorYIndex
            let sty = {
                'top': `${top}px`,
                'left': `${left}px`,
                'width': `${this.currColWidths}px`,
                'height': `${this.colHeights - 1}px`
            }
            if (this.store.editor.isFixed) {
                sty['left'] = `${left + this.$parent.$parent.tableScrollLeft}px`
                sty['z-index'] = 10
            }
            return sty
        },
        selectorTopSty() {
            return {
                width: this.currColWidths + 'px',
                height: '2px'
            }
        },
        selectorLeftSty() {
            return {
                width: '2px',
                height: `${this.colHeights - 1}px`
            }
        },
        selectorBottomSty() {
            return {
                width: `${this.currColWidths}px`,
                height: '2px',
                top: `${this.colHeights - 1}px`
            }
        },
        selectorRightSty() {
            return {
                width: '2px',
                height: `${this.colHeights + 1}px`,
                left: `${this.currColWidths - 1}px`
            }
        },
        // 选中区域背景色范围覆盖样式
        selectedSty() {
            const left = this.store.selector.selectedXArr[0] ? `${this.left}px` : 0
            return {
                width: this.selectedW + 'px',
                height: this.selectedH + 'px',
                top: `${this.colHeights * this.store.selector.selectedYArr[0]}px`,
                left
            }
        },
        // 选中区域固定列区域
        fixedSelectedSty() {
            let width = 0
            const left = this.store.selector.selectedXArr[0] ? this.left : 0
            if (this.store.sheetConfig.fixedColumnsLeft >= this.store.selector.selectedXArr[0] + 1) {
                width = this.colWidths.filter((item, index) => index >= this.store.selector.selectedXArr[0] && index <= this.store.selector.selectedXArr[1] && index < this.store.sheetConfig.fixedColumnsLeft).reduce((sum, val) => sum + val, 0)
            }
            let sty = {
                width: width + 'px',
                height: this.selectedH + 'px',
                left: `${left + this.$parent.$parent.tableScrollLeft}px`,
                top: `${this.colHeights * this.store.selector.selectedYArr[0]}px`
            }
            return sty
        },
        // autofill
        autofillSty() {
            let sty = {}
            let left = this.store.everyColumnsTotal[this.store.autofill.autofillXIndex] - 4
            let top = this.colHeights * this.store.autofill.autofillYIndex + this.colHeights - 4
            // 如果是选中得最后一列的单元格或者最后一行的单元格，为避免超出视图范围，autoFill坐标需要向左、向上偏移2px
            if (this.store.autofill.autofillXIndex === this.store.editor.range.maxX) {
                left -= 2
                sty['border-right'] = 'none'
            }
            if (this.store.autofill.autofillYIndex === this.store.editor.range.maxY) {
                top -= 2
                sty['border-bottom'] = 'none'
            }
            if (this.store.sheetConfig.fixedColumnsLeft > this.store.autofill.autofillXIndex) {
                sty['z-index'] = 10
                left = left + this.$parent.$parent.tableScrollLeft
            }
            sty.top = top + 'px'
            sty.left = left + 'px'
            return sty
        },
        autofillAreaSty() {
            const height = this.store.autofill.autofillYArr.length
                ? (this.store.autofill.autofillYArr[1] - this.store.autofill.autofillYArr[0] + 1) * this.colHeights : 0
            return {
                width: this.selectedW + 'px',
                height: height + 'px',
                top: `${this.colHeights * this.store.autofill.autofillYArr[0]}px`,
                left: `${this.left}px`
            }
        },
        fixedAutofillSty() {
            let width = 0
            if (this.store.sheetConfig.fixedColumnsLeft >= this.store.selector.selectedXArr[0] + 1) {
                width = this.colWidths.filter((item, index) => index >= this.store.selector.selectedXArr[0] && index < this.store.sheetConfig.fixedColumnsLeft).reduce((sum, val) => sum + val, 0)
            }
            const height = this.store.autofill.autofillYArr.length
                ? (this.store.autofill.autofillYArr[1] - this.store.autofill.autofillYArr[0] + 1) * this.colHeights : 0
            return {
                width: width + 'px',
                height: height + 'px',
                top: `${this.colHeights * this.store.autofill.autofillYArr[0]}px`,
                left: `${this.left + this.$parent.$parent.tableScrollLeft}px`
            }
        }
    },
    watch: {
        'store.editor.value'(val) {
            this.value = val
        },
        'store.editor.show'(val) {
            if (!val) {
                if (!val && this.value !== this.store.editor.oldValue) { // 编辑完回写
                    if (this.store.editor.type === 'number') {
                        if (!isNaN(Number(this.value))) {
                            this.value = +this.value
                        }
                    }
                    this.store.fillData(this.value)
                    this.value = ''
                }
            }
        }
    },
    methods: {
        focus(type) {
            const _type = type || this.store.editor.type
            if (typeof this.$refs[_type].focus === 'function') {
                this.$refs[_type].focus()
            }
        },
        doEdit() {
            this.store.doEdit()
        },
        doSelect(e) {
            this.store.selectEditor(e)
        },
        // 限制只能输入数字
        acceptNumber(val) {
            let nVal
            try {
                nVal = val.replace(/[^\d\.]/g, '')
            } catch (err) {
                return
            }
            if (/^0\d+/.test(nVal)) {
                nVal = nVal.replace(/0/, '')
            }
            this.value = nVal
        },
        resetEditor() {
            this.store.resetEditor()
        },
        autofill(e) {
            e.stopPropagation()
            this.store.autofillHandle()
        },
        clipboardToContent(e) {
            console.log('paste')
            this.store.paste(e)
            this.$refs.clipboard.value = ''
        }
    },
    created() {
        this.store.$on('focus', (type) => {
            this.focus(type)
        })
    }
}
</script>
<style module="s" lang="scss">
.cell_editor {
    position: absolute;
    z-index: 8;
    display: flex;

    textarea {
        outline: 0;
        width: 100%;
        height: 50px;
        resize: none;
        padding: 0 6px;
        white-space: pre;
        border: none;
        overflow-y: hidden;
    }
}

.editor {
    display: flex;
    overflow: hidden;
}

.clipboard {
    width: 0 !important;
    flex: 0 0 !important;
    padding: 0 !important;
}

.cell_selector,
.select_area,
.autofill_area {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 8;
    pointer-events: none;

    &.fixed {
        z-index: 10;
    }
}

.selector_border {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 0;
    background-color: rgb(82, 146, 247);
}

.select_area {
    background: linear-gradient(to bottom, rgba(181, 209, 255, 0.34) 0, rgba(181, 209, 255, 0.34) 100%);

    &.fixed {
        z-index: 10;
    }
}

.autofill_area {
    background-color: rgba(214, 223, 228, 0.3);
    // border: 1px solid rgba(82,146,247, 0.2);
}

.autofill_handle {
    cursor: crosshair;
    z-index: 8;
    height: 5px;
    width: 5px;
    border: 2px solid rgb(255, 255, 255);
    box-sizing: content-box;
}

.cell_dropdown {
    :global {
        input[type="text"] {
            border: none;
        }
    }
}

.dm_excel_input {
    box-shadow: 0 0 0 2px #5292f7 inset;
}
</style>
