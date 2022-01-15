module.exports = {
    // Time conversion
    "hr-min": (arg)=>arg.value * 60,
    "min-hr": (arg)=>arg.value / 60,
    "min-sec": (arg)=>arg.value / 60,
    "sec-min": (arg)=>arg.value * 60,
    "hr-sec": (arg)=>arg.value * 60**2,

    // Length conversions
    "km-mi": (arg)=>arg.value * 0.621371,
    "mi-km": (arg)=>arg.value * 1.60934,
    "km-m": (arg)=>arg.value * 1000,
    "m-km": (arg)=>arg.value / 1000,

    "mi-m": (arg)=>arg.value * 1.60934 * 1000,
    "m-mi": (arg)=>arg.value * 0.621371 / 1000,

    // Temperature
    "c-f": (arg)=>(arg.value * (9/5)) + 32,
    "f-c": (arg)=>(arg.value - 32) * 5/9
}