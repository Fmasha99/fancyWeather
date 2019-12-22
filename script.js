window.addEventListener('load', () => {

    let map;
    let placesService;
    let latitudeView = document.querySelector('.latitude');
    let longitudeView = document.querySelector('.longitude');
    let temperatureDegree = document.querySelector('.degree');
    let description = document.querySelector('.description');
    let wind = document.querySelector('.wind');
    let humidityView = document.querySelector('.humidity');
    let location = document.querySelector('.location');
    let fahrenheit = document.querySelector('.fahrenheit');
    let celsium = document.querySelector('.celsium');
    let dateView = document.querySelector('.date');
    let timeView = document.querySelector('.time');
    let secondDayView = document.querySelector('.second-day');
    let secondIconView = document.querySelector('.second-icon-canvas');
    let secondTemperatureView = document.querySelector('.second-day-temperature');
    let thirdDayView = document.querySelector('.third-day');
    let thirdIconView = document.querySelector('.third-icon-canvas');
    let thirdTemperatureView = document.querySelector('.third-day-temperature');
    let fourthDayView = document.querySelector('.fourth-day');
    let fourthIconView = document.querySelector('.fourth-icon-canvas');
    let fourthTemperatureView = document.querySelector('.fourth-day-temperature');
    let input = document.getElementById("myInput");
    let enButton = document.querySelector('.english-language');
    let ruButton = document.querySelector('.russian-language');
    let beButton = document.querySelector('.belarussian-language');
    let googleApiKey = 'AIzaSyBaAf4GftjdxWEccQfr3M2sjJW9EJFcyaA';
    const proxy = 'https://cors-anywhere.herokuapp.com/';
    const googlePlacesAutocompleteUrl = `${proxy}https://maps.googleapis.com/maps/api/place/autocomplete/json`;
    let dropdownItem = document.querySelector('.dropdown-item');
    const googleGetInformationById = `${proxy}https://maps.googleapis.com/maps/api/place/details/json`;
    let geocoder = new google.maps.Geocoder();
    let language = 'en';
    let latitude;
    let longitude;
    let selectedCityId;

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            findAddress();            
        });
    }

    function setIcons(icon, iconId) {
        const skycons = new Skycons( {color: "black" });
        const currentIcon = icon.replace(/-/g, "_").toUpperCase();
        skycons.play();
        return skycons.set(iconId, Skycons[currentIcon]);
    }

    function setForecastForDay(temperatureView, iconView, dayForecast) {
        temperatureView.textContent = ((dayForecast.temperatureHigh + dayForecast.temperatureLow)/2).toFixed(2) + " °";
        setIcons(dayForecast.icon, iconView);
    }
    
    let inputListener = function onTextChanged(event) {
        let query = event.target.value;
        requestSuggestions(query);
    }
    input.addEventListener('input', inputListener);
    setFocusListenerForInput();

    enButton.classList.add('active-button');

    enButton.addEventListener('click', () => {
        language = "en";
        refreshLanguage();
        enButton.classList.add('active-button');
        ruButton.classList.remove('active-button');
        beButton.classList.remove('active-button');
    });

    ruButton.addEventListener('click', () => {
        language = "ru";
        refreshLanguage();
        ruButton.classList.add('active-button');
        enButton.classList.remove('active-button');
        beButton.classList.remove('active-button');
    });

    beButton.addEventListener('click', () => {
        language = "be";
        refreshLanguage();
        beButton.classList.add('active-button');
        ruButton.classList.remove('active-button');
        enButton.classList.remove('active-button');
    });

    function refreshLanguage() {
        if (selectedCityId != undefined) {
            findCityCoordinates();
        } else {
            findAddress();
        }
    }

    function setFocusListenerForInput() {
        input.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-item').forEach(e => e.style.display = '');
            document.removeEventListener('focus');
            document.querySelectorAll('.dropdown-item').forEach(e => hideOnClickOutside(e));
        });
    }

    function requestSuggestions(query) {
        let url = new URL(googlePlacesAutocompleteUrl);
        let params = [['key', googleApiKey], ['types', '(cities)'],['input', query]];
        url.search = new URLSearchParams(params).toString();

        document.querySelectorAll('.dropdown-item').forEach(e => e.remove());

        fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.predictions.length > 0) {
                let cities = data.predictions.map((currentValue, index, array) => {
                    let city = {name: currentValue.description, id: currentValue.place_id} 
                    return city;
                });
            updateSuggestionList(cities);
            }
        });
   }

    function updateSuggestionList(cities) {
        div = document.getElementById("myDropdown");
        document.querySelectorAll('.dropdown-item').forEach(e => e.remove());
        for (i = 0; i < cities.length; i++) {
            let cityText = document.createElement('a');
            cityText.setAttribute('class', 'dropdown-item');
            let id = cities[i].id;
            let city = cities[i].name;
            cityText.addEventListener('click', () => {
                selectedCityId = id;
                findCityCoordinates();
                input.value = city;
                document.querySelectorAll('.dropdown-item').forEach(e => e.style.display = 'none');
            })
            cityText.appendChild(document.createTextNode(city));
            hideOnClickOutside(cityText);
            div.appendChild(cityText);
        }
    } 
    
    function hideOnClickOutside(element) {
        const outsideClickListener = event => {
            if (!element.contains(event.target) && isVisible(element)) {
              element.style.display = 'none';
              removeClickListener();
              setFocusListenerForInput();
            }
        }
    
        const removeClickListener = () => {
            document.removeEventListener('click', outsideClickListener)
        }
    
        document.addEventListener('click', outsideClickListener)
    }
    
    const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );

    function findCityCoordinates() {
        let url = new URL(googleGetInformationById);
        let params = [['key', googleApiKey], ['placeid', selectedCityId], ['language', language]];
        url.search = new URLSearchParams(params).toString();
        fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            const {lat, lng} = data.result.geometry.location;
            const address = data.result.formatted_address;
            latitude = lat;
            longitude = lng;
            showCityWeather(address);
        });
    }

    function showCityWeather(address) {
        const api = `${proxy}https://api.darksky.net`;
        const apiKey = '6f30bcb415b8381ae3532266723b9e3a'
        const currentForecastUrl = `${api}/forecast/${apiKey}/${latitude},${longitude}?lang=${language}`

        fetch(currentForecastUrl)
        .then(response => {
            return response.json();
        })
        .then(data => {
            const {temperature, summary, windSpeed, humidity, icon} = data.currently;
            const timezoneCity = data.timezone;

            //set DOM elements from the API
            temperatureDegree.textContent = temperature + " °";
            description.textContent = summary;
            wind.textContent = getWindSpeed(windSpeed);
            humidityView.textContent = getHumidity(humidity);
            location.textContent = address;
            latitudeView.textContent = getLatitude();
            longitudeView.textContent = getLongitude();
        
            setForecastForDay(secondTemperatureView, secondIconView, data.daily.data[1]);
            setForecastForDay(thirdTemperatureView, thirdIconView, data.daily.data[2]);
            setForecastForDay(fourthTemperatureView, fourthIconView, data.daily.data[3]);

            //set Icon
            setIcons(icon, document.querySelector(".icon-canvas"));

            //formula for next day temperature
            let secondDayTemperature = ((data.daily.data[1].temperatureHigh + data.daily.data[1].temperatureLow)/2).toFixed(2);
            let thirdDayTemperature = ((data.daily.data[2].temperatureHigh + data.daily.data[2].temperatureLow)/2).toFixed(2);
            let fourthDayTemperature = ((data.daily.data[3].temperatureHigh + data.daily.data[3].temperatureLow)/2).toFixed(2);

            // formula for temperature degree
            let celsius = (temperature - 32) * (5 / 9);
            let secondDayCelsius = (secondDayTemperature - 32) * (5 / 9);
            let thirdDayCelsius = (thirdDayTemperature - 32) * (5 / 9);
            let fourthDayCelsius = (fourthDayTemperature - 32) * (5 / 9);

            // change temperature value
            fahrenheit.classList.add('active-button');
            celsium.classList.remove('active-button');
            
            celsium.addEventListener('click', () => {
                temperatureDegree.textContent = Math.floor(celsius) + " °";
                secondTemperatureView.textContent = Math.floor(secondDayCelsius) + " °";
                thirdTemperatureView.textContent = Math.floor(thirdDayCelsius) + " °";
                fourthTemperatureView.textContent = Math.floor(fourthDayCelsius) + " °";
                fahrenheit.classList.remove('active-button');
                celsium.classList.add('active-button');
            });
            fahrenheit.addEventListener('click', () => {
                temperatureDegree.textContent = temperature + " °";
                secondTemperatureView.textContent = secondDayTemperature + " °";
                thirdTemperatureView.textContent = thirdDayTemperature + " °";
                fourthTemperatureView.textContent = fourthDayTemperature + " °";
                celsium.classList.remove('active-button');
                fahrenheit.classList.add('active-button');
            });

            setTime(timezoneCity);

            function getWindSpeed(speed) {
                var wind;
                if (language == 'en') {
                    wind = `Wind: ${speed} m/s`;
                } else if (language == 'ru') {
                    wind = `Скорость ветра: ${speed} м/с`;
                } else if (language == 'be') {
                    wind = `Хуткасть паветра ${speed} м/с`;
                }
                return wind;
            }

            function getHumidity(humidity) {
                var humidity;
                if (language == 'en') {
                    humidity = `Humidity: ${(humidity * 100).toFixed(1)}  %`;
                } else if (language == 'ru') {
                    humidity = `Влажность: ${(humidity * 100).toFixed(1)}  %`;
                } else if (language == 'be') {
                    humidity = `Вільготнасць: ${(humidity * 100).toFixed(1)}  %`;
                }
                return humidity;
            }

            function getLatitude() {
                var lat;
                if (language == 'en') {
                    lat = `Latitude: ${latitude.toFixed(2)}`;
                } else if (language == 'ru') {
                    lat = `Широта: ${latitude.toFixed(2)}`;
                } else if (language == 'be') {
                    lat = `Шырата: ${latitude.toFixed(2)}`;
                }
                return lat;
            }

            function getLongitude() {
                var lng;
                if (language == 'en') {
                    lng = `Longitude: ${longitude.toFixed(2)}`;
                } else if (language == 'ru') {
                    lng = `Долгота: ${longitude.toFixed(2)}`;
                } else if (language == 'be') {
                    lng = `Даўжыня: ${longitude.toFixed(2)}`;
                }
                return lng;
            }

            function setTime(timezoneCity) {
                let today = new Date();
                let nextDayOption = { weekday: 'long' };
                secondDayView.textContent = timeByLocale(addDays(today, 1), nextDayOption);
                thirdDayView.textContent = timeByLocale(addDays(today, 2), nextDayOption);
                fourthDayView.textContent = timeByLocale(addDays(today, 3), nextDayOption);
                setCurrentDay(today);
    
                setHours(today, timezoneCity);
                setInterval(setHours, 1000 * 60);
            }

            function setCurrentDay(date) {
                if (language != "be") {
                    let optionsForDate = {
                        timeZone: timezoneCity,
                        weekday: 'short', month: 'long', day: 'numeric',
                    };
                    let formatterDate = new Intl.DateTimeFormat(language, optionsForDate);
                    dateView.textContent = formatterDate.format(date);
                } else {
                    let optionsForDate = {
                        timeZone: timezoneCity,
                        weekday: 'short', day: 'numeric',
                    };
                    let formatterDate = new Intl.DateTimeFormat(language, optionsForDate);
                    dateView.textContent = `${formatterDate.format(date)} ${getBelarusianMonth(date.getMonth())}`;
                }
            }

            function timeByLocale(date, options) {
                if (language == 'en') {
                    return date.toLocaleDateString('en-GB', options);
                } else if (language == 'ru') {
                    return date.toLocaleDateString('ru-RU', options);
                } else if (language == 'be') {
                    return getBelarusianDay(date.getDay());
                }
            }

            function getBelarusianDay(day) {
                let weekday = new Array(7);
                weekday[0] = "Нядзеля";
                weekday[1] = "Панядзелак";
                weekday[2] = "Аўторак";
                weekday[3] = "Серада";
                weekday[4] = "Чацвер";
                weekday[5] = "Пятніца";
                weekday[6] = "Субота";
                return weekday[day]
            }

            function getBelarusianMonth(index) {
                var month = new Array();
                month[0] = "Студзеня";  
                month[1] = "Лютага";
                month[2] = "Сакавiк";
                month[3] = "Красавiка";
                month[4] = "Мая";
                month[5] = "Червеня";
                month[6] = "Лiпеня";
                month[7] = "Жнiўня";
                month[8] = "Верасня";
                month[9] = "Кастрычнiка";
                month[10] = "Лiстапада";
                month[11] = "Снежня";
                return month[index];
            }

            // Actual Time
            function setHours(date, timezoneCity) {
                let optionsForTime = {
                    timeZone: timezoneCity,
                    hour: 'numeric', minute: 'numeric',
                };
                let formatterTime = new Intl.DateTimeFormat([], optionsForTime);
                timeView.textContent = formatterTime.format(date);
            }

            function addDays(date, days) {
                var result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            }
            
            function showMap() {
                map = new google.maps.Map(document.getElementById('map'), {
                  center: {lat: latitude, lng: longitude},
                  zoom: 13,
                  mapTypeId: 'roadmap'
                });
            }

            showMap();
        });
      
    }

    function findAddress() {
        let latlng = new google.maps.LatLng(latitude, longitude);
        let city, country;
        geocoder.geocode({'latLng': latlng, 'region': language}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
             //formatted address
            //find country name
                 for (var i=0; i < results[0].address_components.length; i++) {
                for (var b=0; b < results[0].address_components[i].types.length; b++) {
    
                    if (results[0].address_components[i].types[b] == "locality") {
                        city = results[0].address_components[i];
                        break;
                    }

                    if (results[0].address_components[i].types[b] == "country") {
                        country = results[0].address_components[i];
                        break;
                    }
                }
            }
            selectedCityId = results[0].place_id;
            showCityWeather(city.long_name + ', ' + country.long_name);
            } 
          }
        });
      }

});