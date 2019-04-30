const verify_date = (val) => {
    if (val && typeof val !== 'string') {
        return false
    }
    const result = val.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
    if (result == null) {
        return false;
    }
    const d = new Date(result[1], result[3] - 1, result[4]);
    if (d.getFullYear() === Number(result[1]) && d.getMonth() + 1 === Number(result[3]) && d.getDate() === Number(result[4])) {
        return true;
    }
    return false;
}
const verify_month = (val) => {
    if (val && typeof val !== 'string') {
        return false
    }
    const result = val.match(/^(\d{1,4})(-|\/)(\d{1,2})$/);
    if (result == null) {
        return false;
    }
    const d = new Date(result[1], result[3] - 1);
    if (d.getFullYear() === Number(result[1]) && d.getMonth() + 1 === Number(result[3])) {
        return true;
    }
    return false;
}
const verify_select = (val, options) => {
    const arr = options.map(item => item.value);
    if (arr.includes(val)) {
        return true;
    }
    return false;
}
const verify_number = (val) => {
    return !isNaN(val)
}
module.exports = {
    verify_date,
    verify_month,
    verify_select,
    verify_number
}