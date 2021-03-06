function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

let app = null;

function main() {

    Vue.use(VueLocalStorage);

    app = new Vue({
        el: '#app',
        data: {
            location: "",
            get timeZone() {
                return Vue.localStorage.get('timeZone');
            },
            set timeZone(value) {

                if (value == undefined || value == null) {
                    Vue.localStorage.remove("timeZone")
                } else {
                    Vue.localStorage.set('timeZone', value);
                }
            },
            get storedLocation() {
                return Vue.localStorage.get('location');                
            },
            set storedLocation(value) {
                if (value == undefined || value == null) {
                    Vue.localStorage.remove("location");
                } else {
                    Vue.localStorage.set('location', value);
                }
            },
            awesome: false
        },
        created: function() {
            let storedLocation = this.storedLocation;

            console.log(`Stored location is \"${storedLocation}\"`)
            if (storedLocation !== null ) {
                this.location = storedLocation;
            }
        },
        localStorage: {
        },
        methods: {
            canCallBool() {
                if (!this.timeZone)
                    return null;

                let timeZonedMoment = moment().tz(this.timeZone);

                let hour = timeZonedMoment.format("HH");

                return hour > 8 && hour < 22
            },
            afterLeave() {
                console.log("Setting timezone to null");
                this.timeZone = null;
            }
        },
        computed: {
            isLocationSet: function() {
                return this.location && this.timeZone && this.timeZone !== "undefined"
            },
            cleanTime: function () {
                if (!this.timeZone || this.timeZone === "undefined")
                    return "";

                return moment().tz(this.timeZone).format("hh:mm A");
            },
            cleanTimeZone: function () {
                if (!this.timeZone || this.timeZone === "undefined")
                    return "";

                return this.timeZone.replace(/_/g, " ").replace(/^(.*)\//g, "");
            },
            isRed: function() {
                return this.isLocationSet && !this.canCallBool()
            },
            isGreen: function() {
                return this.isLocationSet && this.canCallBool()
            },
            canCall: function () {

                if (!this.timeZone || this.timeZone === "undefined")
                    return "";

                let pre = this.awesome ? "Love you, and " : "";

                let timeZonedMoment = moment().tz(this.timeZone);

                let hour = timeZonedMoment.format("HH");

                console.log(`Current hour: ${hour}`)

                return pre + (hour > 8 && hour < 22 ? "Yes" : "No");
            }
        },
        watch: {
            location: debounce(async function (val) {

                console.log(val);

                if (val === "" || val === null) {
                    this.location = null;
                    this.storedLocation = null;
                    return;
                }

                if (val.toLowerCase().includes("tish")) {
                    this.awesome = true;
                    this.timeZone = "America/Los_Angeles"
                    return;
                }
                if (val.toLowerCase().includes("tom")) {
                    this.awesome = true;
                    this.timeZone = "Europe/London"
                    return;
                }

                async function getLocation(location) {
                    let api = "AIzaSyCTUPfOuS9K9QzN_zYpek-ElQAsqL8DphU";

                    console.log(`Searching for ${val}`);

                    let target = `https://maps.googleapis.com/maps/api/geocode/json?address=${val}&key=${api}`;

                    try {
                        let res = await fetch(target);

                        let body = await res.json();

                        let latLong = body.results[0].geometry.location;

                        return latLong;
                    } catch (ex) {
                        return null;
                    }
                }

                async function getTimeZone(lat, long) {

                    let api = "AIzaSyBERYGXmLyHhAeAcmBwTRsgnezCwQ30JpA";

                    let timestamp = new Date().getTime() / 1000;

                    let target = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${long}&timestamp=${timestamp}&key=${api}`

                    let res = await fetch(target);

                    let body = await res.json();

                    return body.timeZoneId;
                }

                let latLong = await getLocation(val);

                if (latLong === null)
                    return;

                let timeZone = await getTimeZone(latLong.lat, latLong.lng);

                this.timeZone = timeZone;
                this.storedLocation = val;

                console.log(`Timezone set to ${timeZone}`);

                let timeZonedMoment = moment().tz(timeZone);

                console.log(`Current hour: ${timeZonedMoment.format("HH")}`)
            }, 500)
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            console.log("Registering service worker");
            navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log("Registered");
                reg.update();
                reg.onupdatefound = () => {
                    console.log("Update found");
                    const installingWorker = reg.installing;

                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case "installed":
                                if (navigator.serviceWorker.controller) {
                                    console.log("Update found, refreshing");
                                    location.reload(true);
                                }
                        }
                    }
                }
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
}

window.onfocus = () => {
    if (app) {
        app.timeZone = app.timeZone;
    }
};

if (typeof document.addEventListener === "undefined" || typeof document.hidden === "undefined") {
} else
{
    document.addEventListener("visibilitychange", ()=>{
        if (app) {
            app.timeZone = app.timeZone;
        }
    }, false);
}     
   

document.addEventListener("DOMContentLoaded", (event) => {
    main();
});