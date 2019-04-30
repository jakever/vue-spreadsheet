const getColWidth = (width, len, idx) => {
    let rs
    let residue = width % len
    let diff = len - residue
    if(residue === 0){
        rs = width / len
    } else {
        width = width + diff
        let avg = width / len
        if(len - idx > diff){
            rs = avg
        } else {
            rs = --avg
        }
    }
    return rs < 110 ? 110 : rs
}
module.exports = {
    getColWidth
}