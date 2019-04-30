<template>
<div :class="s.excelBody">
    <table :class="s.table" cellspacing="0" cellpadding="0" border="0">
        <colgroup>
            <col 
                v-for="(item, idx) in store.columnsWidth" 
                :style="{width: item+'px'}" 
                :key="idx">
        </colgroup>
        <tbody>
            <tr v-for="(row, yIdx) in store.viewData" :key="yIdx">
                <td 
                    :style="colHeightSty" 
                    :class="{
                        [s.error]: !dataVerify(column, row[column.key], yIdx),
                        [s.readonly]: column.readonly
                    }"
                    v-for="(column, xIdx) in store.columns" 
                    :key="xIdx"
                    @mouseenter="multiSelect(xIdx, yIdx)" 
                    @mousedown="selectCell($event, xIdx, yIdx)">
                    <div v-if="column.handler" :class="s.cell_td">{{column.handler(row[column.key])}}</div>
                    <div v-else :class="s.cell_td">{{row[column.key]}}</div>
                </td>
            </tr>
        </tbody>
    </table>
    <slot></slot>
</div>
</template>
<script>
import validator from '../utils/validator'
export default {
    name: 'ExcelBody',
    inject: ['store'],
    data() {
        return {
        }
    },
    computed: {
        s() {
            return this.$parent.s
        },
        sheetConfig() {
            return this.store.sheetConfig
        },
        colHeightSty() {
            return {
                height: `${this.sheetConfig.colHeights}px`
            }
        }
    },
    methods: {
        selectCell(e, x, y) {
            this.store.selectCell(e, x, y)
        },
        multiSelect(x, y) {
            this.store.multiSelect(x, y)
        },
        // 数据校验
        dataVerify(column, value, rowIndex) {
            if (!value && value !== 0) { // 0需要校验
                if (column.required) {
                    return false
                }
                return true
            }
            let correct = true
            if (typeof column.validator === 'function') {
                correct = column.validator(value)
            } else if (column.validator instanceof RegExp) {
                const mt = new RegExp(column.validator)
                correct = mt.test(value)
            } else if (['date', 'month', 'select', 'number'].includes(column.type)) {
                correct = validator[`verify_${column.type}`](value, column.source)
            }
            return correct
        }
    }
}
</script>