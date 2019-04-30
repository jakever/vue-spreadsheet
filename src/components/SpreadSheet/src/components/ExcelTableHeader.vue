<template>
    <table :class="s.table" cellspacing="0" cellpadding="0" border="0">
        <colgroup>
            <col v-for="(item, idx) in store.columnsWidth" :style="{width: item+'px'}" :key="idx">
        </colgroup>
        <thead>
            <tr>
                <th :style="headerHeightSty" v-for="(cell, idx) in store.columns" :key="idx">
                    <div :class="{[s.cell_td]:true, [s.active]: isActive(cell.key)}">{{cell.name}}</div>
                    <div :class="{[m.filter]: true, [m.active]: store.dropdownKey===cell.key}" @click.stop="doFilter(idx, cell)" v-if="cell.filter">
                        <i class="el-icon-arrow-down"></i>
                    </div>
                    <div :class="m.rewidth" v-if="sheetConfig.manualColumnWidth" :style="headerHeightSty" @mousedown="handleStart(idx)"></div>
                </th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>
</template>
<script>
export default {
    name: 'ExcelHeader',
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
        headerHeightSty() {
            return {
                height: `${this.sheetConfig.headerHeight}px`
            }
        }
    },
    methods: {
        isActive(key) {
            const item = this.store.columnsFilterData[key]
            if (!item) {
                return false
            }
            if (this.store.filterConditions.hasOwnProperty(item.key)) {
                return true
            }
            if (item.sort) {
                return true
            }
            return false
        },
        doFilter(index, cell) {
            this.store.handleDropdown(index, cell)
        },
        handleStart(index) {
            this.adjust = true
            this.adjustIndex = index
            window.addEventListener('mousemove', this.handleMove)
            window.addEventListener('mouseup', this.handleUp)
        },
        handleMove(e) {
            if (this.adjust) {
                const width = e.clientX + this.$parent.tableScrollLeft - this.$parent.wrapLeft - this.store.everyColumnsTotal[this.adjustIndex - 1]
                if (width >= 110) { // 暂定列最小宽度
                    this.store.adjustColumnWidth(this.adjustIndex, width)
                }
            }
        },
        handleUp() {
            this.adjust = false
            window.removeEventListener('mousemove', this.handleMove)
            window.removeEventListener('mouseup', this.handleUp)
        }
    }
}
</script>
<style module="m" lang="scss">
.rewidth {
    position: absolute;
    z-index: 1;
    top: 0;
    right: -8px;
    width: 16px;
    cursor: ew-resize;
    text-align: center;

    &:hover {
        &::after {
            background-color: #b7d5ec;
        }
    }

    &::after {
        content: "";
        display: inline-block;
        width: 4px;
        height: 30px;
        transition: all 0.3s;
    }
}

.filter {
    position: absolute;
    top: 50%;
    right: 6px;
    margin-top: -8px;
    z-index: 1;
    display: flex;

    &.active i[class*="icon"] {
        transform: rotateZ(180deg);
    }

    i[class*="icon"] {
        transition: all 0.3s;
        font-size: 16px;
        color: #bbbec4;
        cursor: pointer;
    }
}
</style>